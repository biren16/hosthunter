from utils.http_client import fetch_http
from bs4 import BeautifulSoup
import requests

def technology_lookup(domain):
    result = {}

    try:
        website = fetch_http(domain)

    except (requests.RequestException, ConnectionError) as e:
        result["error"] = str(e)
        return result

    response = website["response"]
    headers = response.headers
    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    scripts = []

    for tag in soup.find_all("script"):
        src = tag.get("src")

        if src:
            scripts.append(src)

    links = []

    for tag in soup.find_all("link"):
        href = tag.get("href")

        if href:
            links.append(href)

    assets = scripts + links

    result["web_server"] = detect_web_server(headers)
    result["edge_platform"] = detect_edge_platform(headers)
    result["backend"] = detect_backend(headers)
    result["frontend"] = detect_frontend(html, assets)
    result["javascript_libraries"] = detect_javascript_libraries(
            html,
            assets,
        )
    result["cms"] = detect_cms(html, soup)

    return result

def detect_web_server(headers):
    server = headers.get("Server")

    if not server:
        return {
            "name": None,
            "version": None,
        }

    parts = server.split("/", 1)

    return {
        "name": parts[0].strip(),
        "version": parts[1].strip().split(" ")[0] if len(parts) > 1 else None,
    }

def detect_backend(headers):
    backend = headers.get("X-Powered-By")

    if not backend:
        return {
            "framework": None,
        }

    return {
        "framework": backend.strip(),
    }

def detect_frontend(html, assets):
    frameworks = []

    combined = html.lower() + " " + " ".join(assets).lower()

    if "_next/" in combined:
        frameworks.append("Next.js")

    if "react" in combined:
        frameworks.append("React")

    if "vue" in combined:
        frameworks.append("Vue")

    if "angular" in combined:
        frameworks.append("Angular")

    return {
        "frameworks": frameworks,
    }

def detect_cms(html, soup):
    tag = soup.find(
        "meta",
        attrs={"name": "generator"},
    )

    generator = (
        tag.get("content", "").strip()
        if tag
        else ""
    )

    html_lower = html.lower()

    if "wordpress" in generator.lower():
        return {
            "name": "WordPress",
        }

    if "/wp-content/" in html_lower:
        return {
            "name": "WordPress",
        }

    if "/sites/default/" in html_lower:
        return {
            "name": "Drupal",
        }

    if generator:
        return {
            "name": generator,
        }

    return {
        "name": None,
    }


def detect_javascript_libraries(html, assets):
    libraries = []

    combined = html.lower() + " " + " ".join(assets).lower()

    if "jquery" in combined:
        libraries.append("jQuery")

    if "bootstrap" in combined:
        libraries.append("Bootstrap")

    if "tailwind" in combined:
        libraries.append("Tailwind")

    if "alpine" in combined:
        libraries.append("Alpine.js")

    if "htmx" in combined:
        libraries.append("htmx")

    return libraries


def detect_edge_platform(headers):
    if headers.get("CF-RAY"):
        return {
            "detected": "Cloudflare",
            "source": "HTTP headers",
        }

    if headers.get("X-Served-By"):
        return {
            "detected": "Fastly",
            "source": "HTTP headers",
        }

    if headers.get("X-Amz-Cf-Id"):
        return {
            "detected": "CloudFront",
            "source": "HTTP headers",
        }

    return {
        "detected": None,
        "source": "HTTP headers",
    }


