"""Summarise scan runs into the tables used in the paper.

Usage: python analyze.py results/baseline.jsonl [results/fixed.jsonl ...]
"""
import json
import statistics
import sys
from collections import Counter, defaultdict

MODULES = ["dns", "whois", "ssl", "ip", "website", "technology", "cdn", "email_security", "subdomains"]
COLLECTOR_FUNCTION = {
    "dns": "dns_lookup", "whois": "whois_lookup", "ssl": "ssl_lookup", "ip": "ip_lookup",
    "website": "website_lookup", "technology": "technology_lookup", "cdn": "cdn_lookup",
    "email_security": "email_security_lookup", "subdomains": "subdomain_lookup",
}
UNANSWERED = {"LifetimeTimeout", "NoNameservers", "Timeout"}
BROWSER_TIMEOUT = 30


def load(path):
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def pct(values, q):
    if not values:
        return float("nan")
    values = sorted(values)
    index = min(len(values) - 1, max(0, round(q / 100 * (len(values) - 1))))
    return values[index]


def module_failed(record, module):
    result = record.get("result") or {}
    meta = (result.get("module_meta") or {}).get(module)
    if meta:
        return meta["status"] in ("unavailable", "timeout", "error")
    return module in (result.get("errors") or {})


def unknown_reported_as_absent(record):
    """Policies shown as absent although the lookup that decides them was not answered.

    Returns the list of (policy, reason) misreports in one scan.
    """
    result = record.get("result") or {}
    domain = result.get("domain") or record["domain"]
    email = result.get("email_security") or {}
    events = [e for e in record.get("dns_events", []) if e["collector"] == "email_security_module"]
    misreports = []

    def failed(qname):
        return [e["exception"] for e in events if e["qname"].rstrip(".") == qname]

    apex = failed(domain)
    dmarc = failed(f"_dmarc.{domain}")
    if (email.get("spf") or {}).get("enabled") is False:
        if UNANSWERED & set(apex):
            misreports.append(("spf", "unanswered"))
        elif "NXDOMAIN" in apex:
            misreports.append(("spf", "domain-does-not-exist"))
    if (email.get("dmarc") or {}).get("enabled") is False:
        if UNANSWERED & set(dmarc):
            misreports.append(("dmarc", "unanswered"))
        elif "NXDOMAIN" in apex:
            misreports.append(("dmarc", "domain-does-not-exist"))
    return misreports


def silent_empty_dns(record):
    """DNS record types returned as [] although the lookup failed before answering them."""
    result = record.get("result") or {}
    if "dns" not in (result.get("errors") or {}):
        return 0
    meta = (result.get("module_meta") or {}).get("dns")
    if meta is not None:
        # Fixed versions list the unanswered types explicitly.
        return 0
    events = [e for e in record.get("dns_events", []) if e["collector"] == "dns_module"]
    failed_at = next((e["rdtype"] for e in events if e["exception"] in UNANSWERED), None)
    order = ["A", "AAAA", "MX", "NS", "TXT"]
    if failed_at is None:
        return 0
    return len(order) - order.index(failed_at.split(".")[-1])


def summarise(path):
    records = load(path)
    label = records[0]["label"] if records else path
    print(f"\n=== {label}  ({path}, backend {records[0].get('backend_version')}) ===")
    scanned = [r for r in records if "total_seconds" in r and not r.get("crash")]
    totals = [r["total_seconds"] for r in scanned]
    print(f"scans: {len(records)}  completed: {len(scanned)}  "
          f"crashed: {sum(1 for r in records if r.get('crash'))}  hung: {sum(1 for r in records if r.get('hung'))}")
    print(f"latency s: p50 {pct(totals, 50):.2f}  p95 {pct(totals, 95):.2f}  max {max(totals):.2f}  "
          f"mean {statistics.mean(totals):.2f}")
    over = sum(1 for r in records if r.get("exceeded_browser_timeout"))
    print(f"exceeded {BROWSER_TIMEOUT}s browser timeout (user sees no result): {over}/{len(records)} "
          f"({100 * over / len(records):.1f}%)")

    print("\nlatency by category (s): category n p50 p95 max over30")
    by_category = defaultdict(list)
    for record in scanned:
        by_category[record["category"]].append(record)
    for category, group in sorted(by_category.items()):
        values = [r["total_seconds"] for r in group]
        over = sum(1 for r in group if r["exceeded_browser_timeout"])
        print(f"  {category:12s} {len(group):3d} {pct(values, 50):6.2f} {pct(values, 95):6.2f} "
              f"{max(values):6.2f} {over:3d}")

    print("\nper collector: module p50_s p95_s failed% (failed = error/unavailable/timeout)")
    for module in MODULES:
        function = COLLECTOR_FUNCTION[module]
        durations = [r["collector_seconds"][function] for r in scanned if function in r.get("collector_seconds", {})]
        failed = sum(1 for r in scanned if module_failed(r, module))
        print(f"  {module:15s} {pct(durations, 50):6.2f} {pct(durations, 95):6.2f} "
              f"{100 * failed / len(scanned):6.1f}%")

    print("\nfailure rate by category and collector (%):")
    print("  " + " " * 12 + " ".join(f"{m[:6]:>7s}" for m in MODULES))
    for category, group in sorted(by_category.items()):
        cells = [100 * sum(1 for r in group if module_failed(r, m)) / len(group) for m in MODULES]
        print(f"  {category:12s}" + " ".join(f"{c:7.1f}" for c in cells))

    misreports = [m for r in scanned for m in unknown_reported_as_absent(r)]
    affected = sum(1 for r in scanned if unknown_reported_as_absent(r))
    print(f"\nunknown reported as absent (email): {len(misreports)} policy results in "
          f"{affected}/{len(scanned)} scans")
    reasons = defaultdict(int)
    for policy, reason in misreports:
        reasons[f"{policy}:{reason}"] += 1
    for key, count in sorted(reasons.items()):
        print(f"  {key}: {count}")
    empty = [silent_empty_dns(r) for r in scanned]
    print(f"DNS record types silently returned empty after a failed lookup: {sum(empty)} "
          f"in {sum(1 for e in empty if e)} scans")

    statuses = defaultdict(Counter)
    for record in scanned:
        for module, meta in ((record.get("result") or {}).get("module_meta") or {}).items():
            statuses[module][meta["status"]] += 1
    if statuses:
        print("\nmodule_meta status counts (fixed versions only):")
        for module in MODULES:
            counts = statuses[module]
            print(f"  {module:15s} " + "  ".join(f"{s}={counts[s]}" for s in
                  ("complete", "partial", "unavailable", "timeout", "error") if counts[s]))

    partial = sum(1 for r in scanned
                  if any(module_failed(r, m) for m in MODULES)
                  and not all(module_failed(r, m) for m in MODULES))
    print(f"scans with partial evidence (some collectors failed, others returned): {partial}/{len(scanned)}")


if __name__ == "__main__":
    for argument in sys.argv[1:]:
        summarise(argument)
