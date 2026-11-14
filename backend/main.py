from fastapi import FastAPI
from pydantic import BaseModel,field_validator
from urllib.parse import urlparse

from modules.dns_module import dns_lookup
from modules.whois_module import whois_lookup
from modules.ssl_module import ssl_lookup
from modules.ip_module import ip_lookup
from modules.website_module import website_lookup

from modules.technology_module import technology_lookup
from modules.cdn_module import cdn_lookup
from modules.email_security_module import email_security_lookup
from modules.subdomain_module import subdomain_lookup
from analysis.engine import build_analysis
from analysis.normalize import normalize
from utils.scan_context import ScanContext


import ipaddress
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from datetime import datetime, timezone

from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

SCHEMA_VERSION = "2"
# Kept below the frontend's 30 s request timeout so a slow collector costs
# only its own result, not the whole scan.
SCAN_DEADLINE_SECONDS = float(os.getenv("HOSTHUNTER_SCAN_DEADLINE_SECONDS", "20"))
MAX_CONCURRENT_SCANS = int(os.getenv("HOSTHUNTER_MAX_CONCURRENT_SCANS", "4"))
SCAN_QUEUE_SECONDS = 10

SCAN_SLOTS = threading.BoundedSemaphore(MAX_CONCURRENT_SCANS)
# Nine collectors per scan, plus headroom for threads still finishing after
# a scan deadline.
COLLECTOR_POOL = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_SCANS * 9 * 2)

# Shapes the frontend already expects when a collector returns nothing.
TIMED_OUT_RESULTS = {
    "dns": {"domainexists": None, "dns": {}},
    "subdomains": {"status": "unavailable", "names": [], "returned_count": 0},
}


app = FastAPI()
# uvicorn main:app --reload

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://hosthunter-recon.vercel.app",
        "https://hosthunter-biren16s-projects.vercel.app",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    domain:str

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, value):

        value = value.strip()

        if value == "":
            raise ValueError("Domain cannot be empty")

        value = value.lower()

        if "://" not in value:
            value = "https://" + value

        parsed = urlparse(value)

        if parsed.hostname is None:
            raise ValueError("Invalid domain")

        # Prevent inputs like goo@gle.com from silently becoming gle.com
        if parsed.username is not None or parsed.password is not None:
            raise ValueError("User information is not allowed in domain input")

        value = parsed.hostname

        # Reject IP addresses
        try:
            ipaddress.ip_address(value)
        except ValueError:
            pass
        else:
            raise ValueError("Enter a domain, not an IP address")

        # Check empty labels BEFORE IDNA conversion
        # so it gets the correct validation error
        labels = value.split(".")

        for label in labels:
            if label == "":
                raise ValueError("Domain contains empty label")

        # Convert Unicode domains to DNS-compatible ASCII
        try:
            value = value.encode("idna").decode("ascii")
        except UnicodeError:
            raise ValueError("Invalid internationalized domain")

        # Re-split because IDNA may transform labels
        labels = value.split(".")

        if len(labels) < 2:
            raise ValueError(
                "Domain must include a TLD (e.g. example.com, not example)"
            )

        for label in labels:
            if len(label) > 63:
                raise ValueError("Domain label is too long")

            if label.startswith("-") or label.endswith("-"):
                raise ValueError(
                    "Domain label cannot start or end with a hyphen"
                )

            for char in label:
                if not (char.isalnum() or char == "-"):
                    raise ValueError("Domain contains invalid characters")

        return value


@app.get("/")
def home():
    return {
      "message":"Welcome to hosthunter API"
    }

def _run_collectors(domain):
    """Run every collector in parallel under one scan deadline.

    A collector that is still running at the deadline is reported as timed
    out and the scan returns everything else, instead of the whole request
    outliving the browser's timeout. Its worker thread finishes in the
    background, bounded by that collector's own network timeouts.
    """
    context = ScanContext(domain)
    collectors = {
        "dns": lambda: dns_lookup(domain),
        "whois": lambda: whois_lookup(domain),
        "ssl": lambda: ssl_lookup(domain, context=context),
        "ip": lambda: ip_lookup(domain, context=context),
        "website": lambda: website_lookup(domain, context=context),
        "technology": lambda: technology_lookup(domain, context=context),
        "cdn": lambda: cdn_lookup(domain, context=context),
        "email_security": lambda: email_security_lookup(domain),
        "subdomains": lambda: subdomain_lookup(domain),
    }

    def timed(collect):
        started = time.monotonic()
        result = collect()
        return result, round(time.monotonic() - started, 3)

    deadline = time.monotonic() + SCAN_DEADLINE_SECONDS
    futures = {key: COLLECTOR_POOL.submit(timed, collect) for key, collect in collectors.items()}

    results = {}
    module_meta = {}

    for key, future in futures.items():
        try:
            result, duration = future.result(timeout=max(0, deadline - time.monotonic()))
            meta = {"status": _module_status(result), "duration_seconds": duration}
        except FutureTimeout:
            result = dict(TIMED_OUT_RESULTS.get(key, {}), error="Collector did not finish before the scan deadline")
            meta = {"status": "timeout", "duration_seconds": SCAN_DEADLINE_SECONDS}
        except Exception:
            result = {"error": "Collector failed unexpectedly"}
            meta = {"status": "error"}

        if key == "dns" and result.get("unresolved_record_types"):
            meta["unresolved_record_types"] = result["unresolved_record_types"]

        results[key] = result
        module_meta[key] = meta

    return results, module_meta


def _module_status(result):
    if result.get("status") in ("complete", "partial", "unavailable"):
        return result["status"]
    if result.get("error"):
        return "unavailable"
    if any(ip.get("enrichment_error") for ip in result.get("ips") or []):
        return "partial"
    return "complete"


@app.post("/scan")
def scan(request : ScanRequest):

    domain = request.domain

    if not SCAN_SLOTS.acquire(timeout=SCAN_QUEUE_SECONDS):
        raise HTTPException(status_code=503, detail="Scanner is busy. Please try again shortly.")

    try:
        started_at = datetime.now(timezone.utc)
        results, module_meta = _run_collectors(domain)
    finally:
        SCAN_SLOTS.release()

    dns_result = results["dns"]
    whois_result = results["whois"]
    ssl_result = results["ssl"]
    ip_result = results["ip"]
    website_result = results["website"]

    technology_result = results["technology"]
    cdn_result = results["cdn"]
    email_security_result = results["email_security"]
    subdomains_result = results["subdomains"]

    errors = {
        # usin get coz we get only if error exists
        "dns": dns_result.get("error"),
        "whois": whois_result.get("error"),
        "ssl": ssl_result.get("error"),
        "ip": ip_result.get("error"),
        "website" : website_result.get("error"),

        "technology": technology_result.get("error"),
        "cdn": cdn_result.get("error"),
        "email_security": email_security_result.get("error"),
        "subdomains": subdomains_result.get("error"),

    }

    clean_errors = {}

    for key, value in errors.items():
        if value is not None:
            clean_errors[key] = value
    errors = clean_errors

    result = {
        "domain" : domain,
        "domainexists" : dns_result.get("domainexists"),
        "dns" : dns_result.get("dns"),
        "whois" : whois_result,
        "ssl" : ssl_result,
        "ip" : ip_result,
        "website" : website_result,

        "technology": technology_result,
        "cdn": cdn_result,
        "email_security": email_security_result,
        "subdomains": subdomains_result,
        "scan_meta": {
            "schema_version": SCHEMA_VERSION,
            "started_at": started_at.isoformat().replace("+00:00", "Z"),
            "duration_seconds": round((datetime.now(timezone.utc) - started_at).total_seconds(), 3),
            "deadline_seconds": SCAN_DEADLINE_SECONDS,
        },
        "module_meta": module_meta,
    }

    # if theres smth in errors show em
    if errors:
        result["errors"] = errors

    try:
        result["analysis"] = build_analysis(result)
    except Exception:
        result["analysis"] = {
            "version": "1",
            "observations": [],
            "unavailable": [],
        }
        result.setdefault("errors", {})["analysis"] = "Analysis layer unavailable"

    # Normalized evidence is additive; the raw module payloads above stay as-is.
    try:
        result["infrastructure"] = normalize(result)
    except Exception:
        result.setdefault("errors", {})["infrastructure"] = "Normalization unavailable"

    return result
