import dns.resolver


COMMON_DKIM_SELECTORS = [
    "default",
    "google",
    "selector1",
    "selector2",
    "s1",
    "s2",
    "k1",
]

DNS_LIFETIME = 5


def email_security_lookup(domain):
    records = get_txt_records(domain)
    dmarc_records = get_txt_records(f"_dmarc.{domain}")
    dkim_records = get_dkim_records(domain)

    return {
        "spf": detect_spf(records),
        "dmarc": detect_dmarc(dmarc_records),
        "dkim": detect_dkim(dkim_records),
    }


def get_txt_records(domain):
    records = []

    try:
        answers = dns.resolver.resolve(
            domain,
            "TXT",
            lifetime=DNS_LIFETIME,
        )

        for answer in answers:
            records.append(
                answer.to_text().strip('"')
            )

    except (
        dns.resolver.NoAnswer,
        dns.resolver.NXDOMAIN,
        dns.resolver.NoNameservers,
        dns.resolver.LifetimeTimeout,
    ):
        pass

    return records


def get_dkim_records(domain):
    records = []

    for selector in COMMON_DKIM_SELECTORS:
        dkim_domain = f"{selector}._domainkey.{domain}"

        try:
            answers = dns.resolver.resolve(
                dkim_domain,
                "TXT",
                lifetime=DNS_LIFETIME,
            )

            for answer in answers:
                record = answer.to_text().strip('"')

                records.append({
                    "selector": selector,
                    "record": record,
                })

        except (
            dns.resolver.NoAnswer,
            dns.resolver.NXDOMAIN,
            dns.resolver.NoNameservers,
            dns.resolver.LifetimeTimeout,
        ):
            continue

    return records


def detect_spf(records):
    for record in records:
        if record.lower().startswith("v=spf1"):
            return {
                "enabled": True,
                "record": record,
            }

    return {
        "enabled": False,
        "record": None,
    }


def detect_dmarc(records):
    for record in records:
        if record.lower().startswith("v=dmarc1"):
            policy = None

            for part in record.split(";"):
                part = part.strip()

                if part.lower().startswith("p="):
                    policy = part.split("=", 1)[1].strip()
                    break

            return {
                "enabled": True,
                "policy": policy,
                "record": record,
            }

    return {
        "enabled": False,
        "policy": None,
        "record": None,
    }


def detect_dkim(records):
    for item in records:
        record = item["record"]
        selector = item["selector"]

        if not record.lower().startswith("v=dkim1"):
            continue

        public_key = None

        for part in record.split(";"):
            part = part.strip()

            if part.lower().startswith("p="):
                public_key = part.split("=", 1)[1].strip()
                break

        if public_key:
            return {
                "supported": True,
                "selector": selector,
                "record": record,
            }

        return {
            "supported": False,
            "selector": selector,
            "record": record,
            "reason": "DKIM record exists but contains an empty public key.",
        }

    return {
        "supported": "Unknown",
        "selector": None,
        "record": None,
        "reason": (
            "No DKIM record found using common selectors; "
            "the domain may use a custom selector."
        ),
    }