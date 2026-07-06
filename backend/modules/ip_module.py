import socket
import ipaddress

import os 
from dotenv import load_dotenv
import requests

load_dotenv()
IPINFO_TOKEN = os.getenv("IPINFO_TOKEN")

def ip_lookup(domain):

    result=  {
        "ips" : [],
    }

    try:
        addresses = socket.getaddrinfo(domain, None)
    except socket.gaierror:
        result["error"] = "Unable to resolve domain to IP addresses"
        return result

    unique_ips=set()

    for address in addresses:
        ip=address[4][0]
        unique_ips.add(ip)

    for ip in unique_ips:
        ip_obj=ipaddress.ip_address(ip)

        # reverse ip
        try:
            hostname = socket.gethostbyaddr(ip)[0]
        except (socket.herror, socket.gaierror):
            hostname = None

        data = {}
        org = None
        asn = None
        enrichment_error = None

        # API call
        if ip_obj.is_global:
            try:

                url = f"https://ipinfo.io/{ip}/json"

                response = requests.get(
                    url,
                    params={"token": IPINFO_TOKEN},
                    timeout=5
                )

                #makes my except block to handle by throwin exception for bad hhtp codes
                response.raise_for_status()

                data = response.json()

                org_data=data.get("org")

                if org_data:
                    parts=org_data.split(" ",1)
                    asn=parts[0]

                    if len(parts)>1:
                        org=parts[1]

            except (requests.RequestException,ValueError):
                enrichment_error = "Unable to retrieve IP enrichment data"

        ip_info = {
            "address" : ip,
            "version" : ip_obj.version,
            "is_private" : ip_obj.is_private,
            "is_global" : ip_obj.is_global,
            "reverse_dns" : hostname,
            "asn" : asn,
            "organization" : org,
            "country" : data.get("country"),
            "city" : data.get("city"),
            "region" : data.get("region"),
            "location" : data.get("loc"),
            "timezone" : data.get("timezone"),
        }
        if enrichment_error:
            ip_info["enrichment_error"] = enrichment_error

        result["ips"].append(ip_info)

    return result
