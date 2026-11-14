from urllib.parse import urljoin, urlparse

import requests
from utils.network import ensure_public_destination

REQUEST_TIMEOUT = 5
MAX_REDIRECTS = 5
REQUEST_HEADERS = {
    "User-Agent": "HostHunter/1.0 (+https://github.com/biren16/hosthunter)"
}


def get_with_checked_redirects(url):
    # Follow redirects manually so every hop is checked, not just the first.
    # A public site must not be able to redirect the scanner to a private,
    # loopback, link-local or cloud-metadata address.
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(url)

        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            raise ConnectionError("Redirect target uses an unsupported URL.")

        ensure_public_destination(parsed.hostname)

        response = requests.get(
            url,
            headers=REQUEST_HEADERS,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=False,
        )

        if not response.is_redirect:
            return response

        url = urljoin(url, response.headers["location"])
        response.close()

    raise requests.TooManyRedirects(f"Exceeded {MAX_REDIRECTS} redirects.")


def fetch_http(domain):
    ensure_public_destination(domain)

    for scheme in ("https","http"):

        try:
            response = get_with_checked_redirects(f"{scheme}://{domain}")

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
