import os
import time
from datetime import datetime, timezone

import requests


CERTSPOTTER_URL = "https://api.certspotter.com/v1/issuances"
COLLECTION_BUDGET_SECONDS = 5
MAX_NAMES = 200
LIMITATION = (
    "Certificate-transparency records may be historical and do not prove that "
    "a hostname currently resolves, is reachable, or remains controlled by "
    "the domain owner."
)


def _normalize_dns_name(value, allow_wildcard=False):
    if not isinstance(value, str):
        return None

    value = value.strip()
    wildcard = value.startswith("*.")
    if wildcard:
        if not allow_wildcard:
            return None
        value = value[2:]

    if not value or "*" in value or "://" in value or "/" in value:
        return None

    value = value.rstrip(".")
    labels = value.split(".")
    if any(not label for label in labels):
        return None

    try:
        ascii_labels = [label.encode("idna").decode("ascii") for label in labels]
    except UnicodeError:
        return None

    for label in ascii_labels:
        if len(label) > 63 or label.startswith("-") or label.endswith("-"):
            return None
        if any(not (char.isalnum() or char == "-") for char in label):
            return None

    normalized = ".".join(ascii_labels).lower()
    return normalized, wildcard


def normalize_ct_name(raw_name, domain):
    normalized_domain = _normalize_dns_name(domain)
    normalized_name = _normalize_dns_name(raw_name, allow_wildcard=True)
    if normalized_domain is None or normalized_name is None:
        return None

    domain_name = normalized_domain[0]
    name, wildcard = normalized_name
    base_name = name

    if base_name != domain_name and not base_name.endswith(f".{domain_name}"):
        return None

    hostname = f"*.{base_name}" if wildcard else base_name
    return {
        "hostname": hostname,
        "wildcard": wildcard,
    }


def _timestamp_value(value):
    if not isinstance(value, str) or not value.strip():
        return None

    candidate = value.strip()
    try:
        parsed = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return None
    return candidate, parsed.astimezone(timezone.utc)


def aggregate_issuances(issuances, domain, max_names=MAX_NAMES):
    normalized_domain = _normalize_dns_name(domain)
    domain_name = normalized_domain[0] if normalized_domain else domain
    aggregate = {}
    apex_observed = False

    for issuance in issuances or []:
        if not isinstance(issuance, dict):
            continue

        for raw_name in issuance.get("dns_names") or []:
            normalized = normalize_ct_name(raw_name, domain_name)
            if normalized is None:
                continue

            if normalized["hostname"] == domain_name:
                apex_observed = True
                continue

            hostname = normalized["hostname"]
            entry = aggregate.setdefault(
                hostname,
                {
                    "hostname": hostname,
                    "wildcard": normalized["wildcard"],
                    "issuance_count": 0,
                    "earliest_not_before": None,
                    "latest_not_after": None,
                    "_earliest": None,
                    "_latest": None,
                },
            )
            entry["issuance_count"] += 1

            not_before = _timestamp_value(issuance.get("not_before"))
            if not_before and (
                entry["_earliest"] is None or not_before[1] < entry["_earliest"]
            ):
                entry["_earliest"] = not_before[1]
                entry["earliest_not_before"] = not_before[0]

            not_after = _timestamp_value(issuance.get("not_after"))
            if not_after and (
                entry["_latest"] is None or not_after[1] > entry["_latest"]
            ):
                entry["_latest"] = not_after[1]
                entry["latest_not_after"] = not_after[0]

    names = sorted(aggregate.values(), key=lambda item: item["hostname"])
    truncated = max_names is not None and len(names) > max_names
    if max_names is not None:
        names = names[:max_names]

    for item in names:
        item.pop("_earliest", None)
        item.pop("_latest", None)

    return {
        "apex_observed": apex_observed,
        "returned_count": len(names),
        "wildcard_count": sum(1 for item in names if item["wildcard"]),
        "truncated": truncated,
        "names": names,
    }


def _provider_error(response):
    if response.status_code == 401 or response.status_code == 403:
        return "Certificate-transparency provider rejected the configured credentials"
    if response.status_code == 429:
        return "Certificate-transparency provider rate limit reached"
    if response.status_code >= 500:
        return "Certificate-transparency provider is unavailable"
    return "Certificate-transparency lookup failed"


def _fetch_page(domain, after, deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError

    params = {
        "domain": domain,
        "include_subdomains": "true",
        "expand": "dns_names",
    }
    if after is not None:
        params["after"] = after

    headers = {}
    api_key = os.getenv("CERTSPOTTER_API_KEY", "").strip()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.get(
        CERTSPOTTER_URL,
        params=params,
        headers=headers,
        timeout=remaining,
    )
    if not 200 <= response.status_code < 300:
        raise RuntimeError(_provider_error(response))

    payload = response.json()
    if not isinstance(payload, list):
        raise ValueError("Certificate-transparency provider returned an invalid response")
    return payload


def subdomain_lookup(domain):
    deadline = time.monotonic() + COLLECTION_BUDGET_SECONDS
    issuances = []
    after = None
    completed = False
    error = None

    while True:
        try:
            page = _fetch_page(domain, after, deadline)
        except TimeoutError:
            error = "Certificate-transparency lookup timed out"
            break
        except requests.Timeout:
            error = "Certificate-transparency lookup timed out"
            break
        except requests.RequestException:
            error = "Unable to reach certificate-transparency provider"
            break
        except (RuntimeError, ValueError) as exc:
            error = str(exc)
            break

        if not page:
            completed = True
            break

        issuances.extend(page)
        aggregate = aggregate_issuances(issuances, domain, max_names=MAX_NAMES)
        if aggregate["returned_count"] >= MAX_NAMES:
            error = f"Result capped at {MAX_NAMES} unique certificate-observed names"
            break

        last_id = page[-1].get("id") if isinstance(page[-1], dict) else None
        if not last_id:
            error = "Certificate-transparency provider returned an incomplete page"
            break
        after = last_id

    aggregate = aggregate_issuances(issuances, domain, max_names=MAX_NAMES)
    has_evidence = bool(aggregate["names"] or aggregate["apex_observed"])
    status = "complete" if completed else "partial" if has_evidence else "unavailable"
    truncated = aggregate["truncated"] or (not completed and bool(issuances))

    result = {
        "status": status,
        "source": {
            "provider": "Cert Spotter",
            "type": "certificate_transparency",
        },
        "coverage": "unexpired_publicly_trusted_certificate_issuances",
        "queried_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "limitation": LIMITATION,
        **aggregate,
        "truncated": truncated,
    }
    if error and status in {"partial", "unavailable"}:
        result["error"] = error
    return result
