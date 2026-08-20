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
        answers = dns.resolver.resolve(domain, "TXT")

        for answer in answers:
            records.append(
                answer.to_text().strip('"')
            )

    except dns.resolver.NoAnswer:
        pass

    except dns.resolver.NXDOMAIN:
        pass

    except dns.resolver.NoNameservers:
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

            parts = record.split(";")

            for part in parts:
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


                if record.lower().startswith("v=dkim1"):
                    return {
                        "supported": True,
                        "selector": selector,
                        "record": record,
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
