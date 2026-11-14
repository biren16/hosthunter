import time

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
# Whole-collector budget: 9 sequential lookups at 5 s each could otherwise
# take 45 s, well past the scan deadline.
EMAIL_BUDGET_SECONDS = 12

# These mean the question was not answered, not that the record is absent.
UNANSWERED = (
    dns.resolver.NoNameservers,
    dns.resolver.LifetimeTimeout,
)


def email_security_lookup(domain):
    deadline = time.monotonic() + EMAIL_BUDGET_SECONDS

    records, spf_state = get_txt_records(domain, deadline)
    if spf_state == "nxdomain":
        return {
            "status": "unavailable",
            "error": "The domain does not exist in DNS",
            "spf": unknown_policy("spf", "The domain does not exist in DNS."),
            "dmarc": unknown_policy("dmarc", "The domain does not exist in DNS."),
            "dkim": detect_dkim([]),
        }

    dmarc_records, dmarc_state = get_txt_records(f"_dmarc.{domain}", deadline)
    dkim_records, unchecked_selectors = get_dkim_records(domain, deadline)

    unanswered_reason = "The DNS lookup did not complete, so presence is unknown."
    result = {
        "spf": (
            detect_spf(records) if spf_state == "answered"
            else unknown_policy("spf", unanswered_reason)
        ),
        "dmarc": (
            detect_dmarc(dmarc_records) if dmarc_state != "unknown"
            else unknown_policy("dmarc", unanswered_reason)
        ),
        "dkim": detect_dkim(dkim_records),
    }

    if unchecked_selectors and result["dkim"]["supported"] == "Unknown":
        result["dkim"]["unchecked_selectors"] = unchecked_selectors

    unknown = [state for state in (spf_state, dmarc_state) if state == "unknown"]
    if len(unknown) == 2 and not dkim_records:
        result["status"] = "unavailable"
        result["error"] = "Email-security DNS lookups did not complete"
    elif unknown or unchecked_selectors:
        result["status"] = "partial"
    else:
        result["status"] = "complete"

    return result


def unknown_policy(kind, reason):
    policy = {"enabled": None, "record": None, "reason": reason}
    if kind == "dmarc":
        policy["policy"] = None
    return policy


def _remaining(deadline):
    return min(DNS_LIFETIME, deadline - time.monotonic())


def get_txt_records(domain, deadline):
    """Return (records, state); state is answered, nxdomain or unknown."""
    records = []
    lifetime = _remaining(deadline)

    if lifetime <= 0:
        return records, "unknown"

    try:
        answers = dns.resolver.resolve(
            domain,
            "TXT",
            lifetime=lifetime,
        )

        for answer in answers:
            records.append(
                answer.to_text().strip('"')
            )

    except dns.resolver.NoAnswer:
        pass
    except dns.resolver.NXDOMAIN:
        return records, "nxdomain"
    except UNANSWERED:
        return records, "unknown"

    return records, "answered"


def get_dkim_records(domain, deadline):
    records = []
    unchecked = []

    for selector in COMMON_DKIM_SELECTORS:
        dkim_domain = f"{selector}._domainkey.{domain}"
        lifetime = _remaining(deadline)

        if lifetime <= 0:
            unchecked.append(selector)
            continue

        try:
            answers = dns.resolver.resolve(
                dkim_domain,
                "TXT",
                lifetime=lifetime,
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
        ):
            continue
        except UNANSWERED:
            unchecked.append(selector)

    return records, unchecked


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