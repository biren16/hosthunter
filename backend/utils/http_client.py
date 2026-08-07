import requests
from utils.network import ensure_public_destination

REQUEST_TIMEOUT = 5
REQUEST_HEADERS = {
    "User-Agent": "HostHunter/1.0 (+https://github.com/biren16/hosthunter)"
}


def fetch_http(domain):
    ensure_public_destination(domain)

    for scheme in ("https","http"):

        try:
            response = requests.get(
                f"{scheme}://{domain}",
                headers=REQUEST_HEADERS,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=True,
            )

            return {
                "response" : response,
                "requested_url" : f"{scheme}://{domain}",
            }

        # Only these errors indicate HTTPS could not be established.
        # In that case, try HTTP before giving up.
        except (
            requests.SSLError,
            requests.ConnectionError,
            requests.Timeout,
        ):
            continue

    raise requests.ConnectionError(
        f"Unable to connect to '{domain}' using HTTP or HTTPS."
    )
