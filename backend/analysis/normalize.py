"""Map a raw scan response into normalized infrastructure evidence.

Normalization is additive and loss-aware: every field points back to the raw
response path it came from, carries the status of the collector that produced
it, and is left as None when the source did not establish a value. It never
fills in a default address, record, policy or hostname.
"""

NORMALIZER_VERSION = "1"

COMPLETE = "complete"
PARTIAL = "partial"
UNAVAILABLE = "unavailable"

# Statuses reported in module_meta that mean the collector gave no evidence.
NO_EVIDENCE = {"unavailable", "timeout", "error"}


def _hostname(value):
    return str(value).strip().strip('"').rstrip(".").lower() or None


def _mx_host(value):
    # "10 mx.example.com." -> "mx.example.com"; preference is not infrastructure identity.
    parts = str(value).split()
    return _hostname(parts[-1]) if parts else None


def _text(value):
    return str(value).strip().strip('"') or None


def _get(scan, path):
    value = scan
    for key in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def _ip_values(key):
    def extract(scan):
        values = [entry.get(key) for entry in _get(scan, "ip.ips") or []]
        return [value for value in values if value]
    return extract


def _subdomain_names(scan):
    return [item.get("hostname") for item in _get(scan, "subdomains.names") or [] if item.get("hostname")]


def _present_headers(scan):
    headers = _get(scan, "website.security_headers") or {}
    return [name for name, value in headers.items() if value not in (None, False, "", [])]


def _cdn_provider(scan):
    cdn = scan.get("cdn") or {}
    if cdn.get("detected") is True:
        return cdn.get("provider")
    if cdn.get("detected") is False:
        return "no supported provider match"
    return None


# (category, field, kind, source module, raw path or extractor, canonicalizer)
# kind "set" fields are compared as unordered collections; "value" fields as scalars.
FIELDS = (
    ("domain_control", "nameservers", "set", "dns", "dns.NS", _hostname),
    ("domain_control", "registrar", "value", "whois", "whois.registrar", _text),
    ("domain_control", "registered_nameservers", "set", "whois", "whois.name_servers", _hostname),
    ("domain_control", "expiration_date", "value", "whois", "whois.expiration_date", _text),
    ("domain_control", "registry_status", "set", "whois", "whois.status", _text),

    ("web_delivery", "ipv4_addresses", "set", "dns", "dns.A", _text),
    ("web_delivery", "ipv6_addresses", "set", "dns", "dns.AAAA", _text),
    ("web_delivery", "asns", "set", "ip", _ip_values("asn"), _text),
    ("web_delivery", "network_organizations", "set", "ip", _ip_values("organization"), _text),
    ("web_delivery", "cdn_provider", "value", "cdn", _cdn_provider, _text),
    ("web_delivery", "final_url", "value", "website", "website.final_url", _text),
    ("web_delivery", "http_status", "value", "website", "website.status_code", _text),
    ("web_delivery", "security_headers_present", "set", "website", _present_headers, _text),

    ("tls_identity", "certificate_fingerprint_sha256", "value", "ssl", "ssl.fingerprint_sha256", _text),
    ("tls_identity", "certificate_subject", "value", "ssl", "ssl.subject.common_name", _hostname),
    ("tls_identity", "certificate_issuer", "value", "ssl", "ssl.issuer.organization_name", _text),
    ("tls_identity", "certificate_valid_until", "value", "ssl", "ssl.valid_until", _text),

    ("application", "web_server", "value", "technology", "technology.web_server.name", _text),
    ("application", "cms", "value", "technology", "technology.cms.name", _text),
    ("application", "frontend_frameworks", "set", "technology", "technology.frontend.frameworks", _text),
    ("application", "javascript_libraries", "set", "technology", "technology.javascript_libraries", _text),

    ("email_infrastructure", "mail_exchangers", "set", "dns", "dns.MX", _mx_host),
    ("email_infrastructure", "spf_enabled", "value", "email_security", "email_security.spf.enabled", _text),
    ("email_infrastructure", "spf_record", "value", "email_security", "email_security.spf.record", _text),
    ("email_infrastructure", "dmarc_enabled", "value", "email_security", "email_security.dmarc.enabled", _text),
    ("email_infrastructure", "dmarc_policy", "value", "email_security", "email_security.dmarc.policy", _text),
    ("email_infrastructure", "dkim_selector", "value", "email_security", "email_security.dkim.selector", _text),

    ("observed_hostnames", "certificate_observed_names", "set", "subdomains", _subdomain_names, _hostname),
)

# DNS record types are answered independently; a type left unanswered after a
# resolver failure is unavailable even when the DNS module is partial.
DNS_RECORD_TYPE = {"dns.NS": "NS", "dns.A": "A", "dns.AAAA": "AAAA", "dns.MX": "MX"}


def module_status(scan, module):
    meta = (scan.get("module_meta") or {}).get(module)
    if meta:
        status = meta.get("status")
        if status in NO_EVIDENCE:
            return UNAVAILABLE
        return PARTIAL if status == PARTIAL else COMPLETE

    # Responses from before module_meta existed: fall back to the error map.
    if module in (scan.get("errors") or {}):
        return UNAVAILABLE
    payload = scan.get(module)
    if isinstance(payload, dict) and payload.get("error"):
        return UNAVAILABLE
    return COMPLETE


def _field_status(scan, module, source, raw_value):
    status = module_status(scan, module)

    if module == "dns" and isinstance(source, str):
        unresolved = ((scan.get("module_meta") or {}).get("dns") or {}).get("unresolved_record_types") or []
        if DNS_RECORD_TYPE.get(source) in unresolved:
            return UNAVAILABLE
        if status == PARTIAL:
            # This record type was answered before the resolver failed.
            return COMPLETE

    if module == "subdomains" and _get(scan, "subdomains.truncated"):
        return PARTIAL if status != UNAVAILABLE else UNAVAILABLE

    if module == "email_security" and status != UNAVAILABLE and raw_value is None:
        # enabled: None means the lookup did not complete; the policy is unknown.
        policy = source.split(".")[1] if isinstance(source, str) else None
        if policy in ("spf", "dmarc") and _get(scan, f"email_security.{policy}.enabled") is None:
            return UNAVAILABLE

    return status


def _canonical(kind, raw_value, canonicalize):
    if kind == "set":
        if raw_value is None:
            return None
        values = raw_value if isinstance(raw_value, (list, tuple, set)) else [raw_value]
        return sorted({canonicalize(value) for value in values if value is not None} - {None})
    if raw_value is None:
        return None
    return canonicalize(raw_value)


def normalize(scan):
    categories = {}

    for category, field, kind, module, source, canonicalize in FIELDS:
        raw_value = source(scan) if callable(source) else _get(scan, source)
        status = _field_status(scan, module, source, raw_value)
        value = None if status == UNAVAILABLE else _canonical(kind, raw_value, canonicalize)

        categories.setdefault(category, {})[field] = {
            "kind": kind,
            "value": value,
            "status": status,
            "module": module,
            "source": source if isinstance(source, str) else f"{module} (derived)",
        }

    return {
        "normalizer_version": NORMALIZER_VERSION,
        "domain": scan.get("domain"),
        "categories": categories,
    }
