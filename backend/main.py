from fastapi import FastAPI
from pydantic import BaseModel, field_validator

from modules.dns_module import dns_lookup
from modules.whois_module import whois_lookup
from modules.ssl_module import ssl_lookup

app = FastAPI()
# uvicorn main:app --reload

class ScanRequest(BaseModel):
    domain:str

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v):
        v = v.strip().lower()
        if not v:
            raise ValueError("Domain cannot be empty")
        if "://" in v:
            raise ValueError("Enter domain only, not full URL")
        return v


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

    errors = {
        # usin get coz we get only if error exists 
        "dns": dns_result.get("error"),
        "whois": whois_result.get("error"),
        "ssl": ssl_result.get("error"),
    }

    result = {
        "domain" : domain,
        "domainexists" : dns_result["domainexists"],
        "dns" : dns_result["dns"],
        "whois" : whois_result,
        "ssl" : ssl_result,
    }

    #if theres smth in errors show em
    if any(errors.values()):
        result["errors"] = errors

    return result
