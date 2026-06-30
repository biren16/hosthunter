from fastapi import FastAPI
from pydantic import BaseModel
from modules.dns_module import dns_lookup
from modules.whois_module import whois_lookup
from modules.ssl_module import ssl_lookup

app = FastAPI()
#uvicorn main:app --reload

class ScanRequest(BaseModel):
    domain:str

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

    result = {
        "domain" : domain,
        "domainexists" : dns_result["domainexists"],
        "dns" : dns_result["dns"],
        "whois" : whois_result,
        "ssl" : ssl_result,
    }

    return result
    