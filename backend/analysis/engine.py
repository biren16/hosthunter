RULES = (
    "certificate-name-footprint",
    "web-tls-delivery",
    "mail-configuration",
    "delivery-infrastructure",
)


def _module_available(scan, key):
    value = scan.get(key)
    return (
        key not in scan.get("errors", {})
        and isinstance(value, dict)
        and not value.get("error")
        and bool(value)
    )


def _unavailable(rule_id, modules, reason):
    return {
        "id": rule_id,
        "related_modules": modules,
        "reason": reason,
    }


def _observation(rule_id, title, summary, modules, evidence_refs, limitations):
    return {
        "id": rule_id,
        "title": title,
        "summary": summary,
        "related_modules": modules,
        "evidence_refs": evidence_refs,
        "limitations": limitations,
    }


def _state(value):
    if value is True:
        return "Enabled"
    if value is False:
        return "Not detected"
    if isinstance(value, str) and value:
        return value
    return "Unknown"


def _certificate_name_footprint(scan):
    modules = ["subdomains"]
    subdomains = scan.get("subdomains")
    if not isinstance(subdomains, dict) or not subdomains:
        return None, _unavailable(
            RULES[0], modules, "Subdomain certificate-transparency evidence was unavailable."
        )

    if subdomains.get("status") == "unavailable":
        return None, _unavailable(
            RULES[0], modules, "Subdomain certificate-transparency evidence was unavailable."
        )

    count = subdomains.get("returned_count", len(subdomains.get("names") or []))
    wildcard_count = subdomains.get("wildcard_count", 0)
    summary = (
        f"Certificate-transparency records returned {count} descendant hostname"
        f"{'s' if count != 1 else ''}, including {wildcard_count} wildcard"
        f" observation{'s' if wildcard_count != 1 else ''}."
    )
    limitations = [
        "Certificate observations do not establish current DNS resolution or reachability."
    ]
    if subdomains.get("truncated") or subdomains.get("status") == "partial":
        limitations.append("The returned certificate-observation list is partial or truncated.")

    return _observation(
        RULES[0],
        "Certificate-observed hostname footprint",
        summary,
        modules,
        [
            "subdomains.returned_count",
            "subdomains.wildcard_count",
            "subdomains.truncated",
            "subdomains.apex_observed",
        ],
        limitations,
    ), None


def _web_tls_delivery(scan):
    modules = ["website", "ssl"]
    if not all(_module_available(scan, key) for key in modules):
        return None, _unavailable(
            RULES[1], modules, "Website and SSL/TLS evidence were not both available."
        )

    website = scan["website"]
    ssl = scan["ssl"]
    scheme = website.get("scheme") or "Unknown"
    final_url = website.get("final_url")
    certificate_detail = "TLS certificate details were returned"
    if isinstance(ssl.get("days_until_expiry"), (int, float)):
        certificate_detail = (
            f"the TLS certificate has {ssl['days_until_expiry']} days until expiry"
        )
    elif ssl.get("valid_until"):
        certificate_detail = "TLS certificate validity details were returned"

    hsts = (website.get("security_headers") or {}).get("strict_transport_security")
    hsts_state = _state(hsts.get("enabled") if isinstance(hsts, dict) else None)
    destination = f" and final URL {final_url}" if final_url else ""
    summary = (
        f"The website response used the {scheme.upper()} scheme{destination}; "
        f"{certificate_detail}. Strict-Transport-Security was {hsts_state}."
    )

    return _observation(
        RULES[1],
        "Web and TLS delivery signals",
        summary,
        modules,
        [
            "website.scheme",
            "website.final_url",
            "website.security_headers.strict_transport_security.enabled",
            "ssl.days_until_expiry",
            "ssl.is_expired",
        ],
        [
            "This describes returned website and certificate fields; it does not establish an overall security conclusion."
        ],
    ), None


def _mail_configuration(scan):
    modules = ["dns", "email_security"]
    if not all(_module_available(scan, key) for key in modules):
        return None, _unavailable(
            RULES[2], modules, "DNS and email-security evidence were not both available."
        )

    dns = scan["dns"]
    email = scan["email_security"]
    spf = email.get("spf") or {}
    dmarc = email.get("dmarc") or {}
    dkim = email.get("dkim") or {}
    mx_count = len(dns.get("MX") or [])
    dmarc_state = _state(dmarc.get("enabled"))
    if dmarc.get("policy"):
        dmarc_state = f"{dmarc_state} ({dmarc['policy']})"
    dkim_state = dkim.get("supported")
    if dkim_state is None:
        dkim_state = dkim.get("enabled")

    summary = (
        f"DNS returned {mx_count} MX record{'s' if mx_count != 1 else ''}. "
        f"SPF: {_state(spf.get('enabled'))}; "
        f"DMARC: {dmarc_state}; "
        f"DKIM: {_state(dkim_state)}."
    )

    return _observation(
        RULES[2],
        "Mail configuration signals",
        summary,
        modules,
        [
            "dns.MX",
            "email_security.spf.enabled",
            "email_security.dmarc.enabled",
            "email_security.dmarc.policy",
            "email_security.dkim.supported",
        ],
        [
            "DKIM Unknown means no supported selector was confirmed; it does not prove that DKIM is absent."
        ],
    ), None


def _delivery_infrastructure(scan):
    candidate_modules = ["dns", "ip", "cdn", "technology"]
    available = [key for key in candidate_modules if _module_available(scan, key)]
    if len(available) < 2:
        return None, _unavailable(
            RULES[3],
            candidate_modules,
            "At least two DNS, IP, CDN, or technology evidence sources were required.",
        )

    dns = scan.get("dns") or {}
    ip = scan.get("ip") or {}
    cdn = scan.get("cdn") or {}
    technology = scan.get("technology") or {}
    addresses = ip.get("ips") or []
    address_count = len(addresses) or len(dns.get("A") or []) + len(dns.get("AAAA") or [])
    organizations = sorted(
        {
            item.get("organization")
            for item in addresses
            if isinstance(item, dict) and item.get("organization")
        }
    )
    cdn_provider = cdn.get("provider") if cdn.get("detected") is True else None
    edge = technology.get("edge_platform") or technology.get("edge") or {}
    edge_provider = edge.get("detected") if isinstance(edge, dict) else None

    signals = [f"{address_count} resolved address{'es' if address_count != 1 else ''}"]
    if organizations:
        signals.append(f"IP organization {', '.join(organizations)}")
    if cdn_provider:
        signals.append(f"CDN range signal {cdn_provider}")
    elif _module_available(scan, "cdn") and cdn.get("detected") is False:
        signals.append("no supported CDN range match")
    if edge_provider:
        signals.append(f"edge-header signal {edge_provider}")

    if cdn_provider and edge_provider:
        if cdn_provider.casefold() == str(edge_provider).casefold():
            signals.append("the CDN and edge-header provider signals agree")
        else:
            signals.append("the CDN and edge-header provider signals differ")

    return _observation(
        RULES[3],
        "Delivery infrastructure signals",
        "Returned infrastructure evidence includes " + "; ".join(signals) + ".",
        available,
        [
            "dns.A",
            "dns.AAAA",
            "ip.ips",
            "cdn.detected",
            "cdn.provider",
            "technology.edge_platform.detected",
        ],
        [
            "A missing supported CDN match does not establish direct origin exposure."
        ],
    ), None


def build_analysis(scan):
    observations = []
    unavailable = []
    for rule in (
        _certificate_name_footprint,
        _web_tls_delivery,
        _mail_configuration,
        _delivery_infrastructure,
    ):
        observation, missing = rule(scan or {})
        if observation:
            observations.append(observation)
        if missing:
            unavailable.append(missing)

    return {
        "version": "1",
        "observations": observations,
        "unavailable": unavailable,
    }
