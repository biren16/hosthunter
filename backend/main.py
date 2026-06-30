import json

from modules.dns_module import dns_lookup
from modules.whois_module import whois_lookup
from modules.ssl_module import ssl_lookup

domain = input("Enter a domain: ")

dns_result = dns_lookup(domain)  
whois_result = whois_lookup(domain)
ssl_result = ssl_lookup(domain)

result = {
    "domain": domain,
    "domainexists": dns_result["domainexists"],
    "dns": dns_result["dns"],
    "whois": whois_result,
    "ssl": ssl_result,
}

print(json.dumps(result, indent=4, sort_keys=False))
