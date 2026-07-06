from fastapi import FastAPI
from pydantic import BaseModel,field_validator
from urllib.parse import urlparse

from modules.dns_module import dns_lookup
from modules.whois_module import whois_lookup
from modules.ssl_module import ssl_lookup
from modules.ip_module import ip_lookup
import ipaddress

app = FastAPI()
# uvicorn main:app --reload

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

@app.post("/scan")
def scan(request : ScanRequest):

    domain = request.domain

    dns_result = dns_lookup(domain)
    whois_result = whois_lookup(domain)
    ssl_result = ssl_lookup(domain)
    ip_result = ip_lookup(domain)

    errors = {
        # usin get coz we get only if error exists 
        "dns": dns_result.get("error"),
        "whois": whois_result.get("error"),
        "ssl": ssl_result.get("error"),
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
        "ip" : ip_result
    }

    #if theres smth in errors show em
    if errors:
        result["errors"] = errors

    return result
