import ipaddress
import socket
from pathlib import Path
from utils.network import resolve_addresses

DATA_DIR = Path(__file__).parent.parent/ "data"

IPV4_FILE = DATA_DIR/ "ips-v4.txt"
IPV6_FILE = DATA_DIR/ "ips-v6.txt"

def cdn_lookup(domain):
    try:
        resolved_ips = resolve_addresses(domain)
    except socket.gaierror as e:
        return{
            "error": f"Unable to resolve '{domain}': {e}"
        }

    try:
        cloudflare_ranges = load_cloudflare_ranges()
    except OSError as e:
        return {
        "error": f"Unable to load Cloudflare IP ranges: {e}"
    }

    for ip_string in resolved_ips:
        try:
            ip = ipaddress.ip_address(ip_string)
        except ValueError:
            continue

        #check for all networks in cloudflare range
        for network in cloudflare_ranges:
            if ip in  network:
                return {
                    "detected" : True,
                    "provider" : "Cloudflare",
                    "matched_ip": ip_string,
                    "resolved_ips": sorted(resolved_ips),
                }

    return {
            "detected" : False,
            "provider" : None,
            "matched_ip": None,
            "resolved_ips": sorted(resolved_ips),
        }


def load_cloudflare_ranges():
    ranges = []

    for file in (IPV4_FILE,IPV6_FILE):
        with open(file, "r", encoding= "utf-8") as f:
            for line in f:
                line = line.strip()

                if not line:
                    continue

                try:
                    network = ipaddress.ip_network(line)
                    ranges.append(network)
                except ValueError:
                    continue

    return ranges



