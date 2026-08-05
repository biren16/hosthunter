import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

REQUEST_TIMEOUT = 5
REQUEST_HEADERS = {
    "User-Agent": "HostHunter/1.0 (+https://github.com/biren16/hosthunter)"
}


def website_lookup(domain):
    """
    Fetches a website and extracts metadata and security headers.
    """
    result = {}

    try:
        response = fetch_website(domain)

    except requests.RequestException as e:
        result["error"] = str(e)
        return result

    result["url"] = response.url
    result["status_code"] = response.status_code
    result["scheme"] = urlparse(response.url).scheme
    
    result["metadata"] = extract_metadata(response)
    result["security_headers"] = extract_security_headers(response.headers)

    return result

def fetch_website(domain):

    for scheme in ("https","http"):

        try:
            response = requests.get(
                f"{scheme}://{domain}",
                headers=REQUEST_HEADERS,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=True,
            )

            response.raise_for_status()
            return response

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

def extract_metadata(response):
    soup = BeautifulSoup(response.text,"html.parser")

    title=soup.title.text.strip() if soup.title else None

    html_tag= soup.find("html")

    language = (
        html_tag.get("lang").strip()
        if html_tag and html_tag.get("lang")
        else None
    )

    charset_meta = soup.find(
        "meta",
        attrs={"charset": True},
    )

    charset = (
        charset_meta.get("charset").strip()
        if charset_meta and charset_meta.get("charset")
        else None
    )

    description = get_meta_content(soup, "description")
    robots = get_meta_content(soup,"robots")
    generator = get_meta_content(soup,"generator")

    favicon = get_link_href(soup,"icon")
    canonical = get_link_href(soup,"canonical")


    return {
        "title" : title,
        "description" : description,
        "language" : language,
        "charset" : charset,
        "canonical" : canonical,
        "robots" : robots,
        "generator" : generator,
        "favicon" : favicon,
    }

def extract_security_headers(response_headers):

    hsts = get_header(response_headers, "Strict-Transport-Security")
    csp = get_header(response_headers, "Content-Security-Policy")
    x_frame_options= get_header(response_headers, "X-Frame-Options")
    x_content_type_options = get_header(response_headers, "X-Content-Type-Options")
    referrer_policy = get_header(response_headers, "Referrer-Policy")
    permissions_policy = get_header(response_headers, "Permissions-Policy")
    
    return {
        "strict_transport_security" : analyze_header(hsts),
        "content_security_policy" : analyze_header(csp),
        "x_frame_options" : analyze_header(x_frame_options),
        "x_content_type_options" : analyze_header(x_content_type_options),
        "referrer_policy" :analyze_header(referrer_policy),
        "permissions_policy" :analyze_header (permissions_policy),
    }

def get_meta_content(soup,meta_name):
    meta = soup.find(
        "meta",
        attrs={"name" : meta_name },
    )
    return (
        meta.get("content").strip()
        if meta and meta.get("content")
        else None
    )

def get_link_href(soup,rel_value):

    link = soup.find(
        "link",
        attrs={"rel" : lambda rel: rel and rel_value in rel},
    )

    return (
        link.get("href").strip()
        if link and link.get("href")
        else None
    )

def get_header(response_headers,header_name):
    return (
        response_headers.get(header_name)
        if response_headers and response_headers.get(header_name)
        else None
    )
    
def analyze_header(header):
    return {
        "enabled" : header is not None,
        "value" : header,
    }
