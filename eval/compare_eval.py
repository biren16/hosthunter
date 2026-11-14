"""Evaluate HostHunter's comparison against two simpler diff strategies.

Comparators:
  raw       - diff of the raw module payloads (lists compared by position);
              metadata keys (timings, scan/module meta, analysis) excluded.
  unaware   - the same normalized fields HostHunter uses, but collector
              status ignored: anything missing later counts as removed.
  hosthunter- analysis.compare: additions need a complete earlier source,
              removals a complete later source.

Experiments:
  repeat    - real pairs: the same domain scanned twice a few minutes apart.
  injected  - controlled variants of real complete scans with a known truth:
              reordering and collector failures (truth: no change), and one
              real address change combined with a failure elsewhere (truth:
              exactly that change).

Usage:
  python compare_eval.py --backend ../HostHunter/backend \
      --first results/fixed-r1.jsonl --second results/fixed-r2.jsonl
"""
import argparse
import copy
import json
import random
import sys
from collections import Counter, defaultdict

VOLATILE_KEYS = {"scan_meta", "module_meta", "analysis", "infrastructure", "errors",
                 "queried_at", "days_until_expiry"}


def load(path):
    with open(path, encoding="utf-8") as handle:
        records = [json.loads(line) for line in handle if line.strip()]
    return {r["domain"]: r["result"] for r in records if r.get("result")}


# ---------------------------------------------------------------- comparators

def _flatten(value, path="", out=None):
    out = {} if out is None else out
    if isinstance(value, dict):
        for key, item in value.items():
            if key in VOLATILE_KEYS:
                continue
            _flatten(item, f"{path}.{key}" if path else key, out)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            _flatten(item, f"{path}[{index}]", out)
    else:
        out[path] = value
    return out


def raw_diff(old, new):
    a, b = _flatten(old), _flatten(new)
    return {
        "changes": sum(1 for k in a.keys() & b.keys() if a[k] != b[k]),
        "added": len(b.keys() - a.keys()),
        "removed": len(a.keys() - b.keys()),
    }


def unaware_diff(old, new, normalize_module):
    """Normalized fields with statuses ignored; missing means removed."""
    claims = []
    for category, name, kind, _module, source, canonical in normalize_module.FIELDS:
        def value(scan):
            raw = source(scan) if callable(source) else normalize_module._get(scan, source)
            if kind == "set":
                values = raw if isinstance(raw, (list, tuple, set)) else ([] if raw is None else [raw])
                return {canonical(v) for v in values if v is not None} - {None}
            return None if raw is None else canonical(raw)

        before, after = value(old), value(new)
        if kind == "set":
            claims += [(category, name, "added", v) for v in after - before]
            claims += [(category, name, "removed", v) for v in before - after]
        elif before != after:
            state = "removed" if after is None else "added" if before is None else "changed"
            claims.append((category, name, state, None))
    return claims


def hosthunter_diff(old, new, compare_module):
    snapshot_old = compare_module.make_snapshot(old, captured_at="1")
    snapshot_new = compare_module.make_snapshot(new, captured_at="2")
    result = compare_module.compare(snapshot_old, snapshot_new)
    claims, withheld = [], Counter()
    for category, details in result["categories"].items():
        for name, item in details["fields"].items():
            state = item["state"]
            if state in ("unavailable", "partially_comparable"):
                withheld[state] += 1
            if state in ("changed", "added", "removed"):
                if "added" in item or "removed" in item:
                    claims += [(category, name, "added", v) for v in item.get("added", [])]
                    claims += [(category, name, "removed", v) for v in item.get("removed", [])]
                else:
                    claims.append((category, name, state, None))
            withheld["inconclusive_values"] += len(item.get("inconclusive", []))
    return claims, withheld


# ---------------------------------------------------------------- injections

def _set_status(scan, module, status, **extra):
    scan.setdefault("module_meta", {})[module] = dict({"status": status}, **extra)


def reorder(scan):
    for key in ("A", "AAAA", "MX", "NS", "TXT"):
        (scan.get("dns") or {}).get(key, []).reverse()
    (scan.get("ip") or {}).get("ips", []).reverse()
    (scan.get("subdomains") or {}).get("names", []).reverse()
    return scan


def dns_partial(scan):
    for key in ("MX", "NS", "TXT"):
        scan["dns"][key] = []
    _set_status(scan, "dns", "partial", unresolved_record_types=["MX", "NS", "TXT"])
    return scan


def ip_timeout(scan):
    scan["ip"] = {"error": "Collector did not finish before the scan deadline"}
    _set_status(scan, "ip", "timeout")
    return scan


def website_unavailable(scan):
    for module in ("website", "technology"):
        scan[module] = {"error": "Unable to connect"}
        _set_status(scan, module, "unavailable")
    return scan


def email_unknown(scan):
    email = scan["email_security"]
    email["spf"] = {"enabled": None, "record": None, "reason": "lookup did not complete"}
    email["dmarc"] = {"enabled": None, "policy": None, "record": None, "reason": "lookup did not complete"}
    email["status"] = "unavailable"
    _set_status(scan, "email_security", "unavailable")
    return scan


def ct_truncated(scan):
    names = scan["subdomains"].get("names") or []
    scan["subdomains"]["names"] = names[: len(names) // 2]
    scan["subdomains"]["truncated"] = True
    scan["subdomains"]["status"] = "partial"
    _set_status(scan, "subdomains", "partial")
    return scan


NO_CHANGE_INJECTIONS = {
    "reordered lists": reorder,
    "DNS partial (MX/NS/TXT unanswered)": dns_partial,
    "IP collector timeout": ip_timeout,
    "website unreachable": website_unavailable,
    "email lookups unanswered": email_unknown,
    "CT result truncated": ct_truncated,
}

TRUE_CHANGE = ("web_delivery", "ipv4_addresses")


def address_change_with_failure(failure, rng):
    def inject(scan):
        failure(scan)
        old = scan["dns"]["A"][0]
        scan["dns"]["A"][0] = f"198.51.100.{rng.randint(1, 254)}"
        return scan, old
    return inject


def eligible(scan, injection):
    meta = scan.get("module_meta") or {}
    needs = {
        dns_partial: ["dns"], ip_timeout: ["ip"], website_unavailable: ["website", "technology"],
        email_unknown: ["email_security"], ct_truncated: ["subdomains"], reorder: [],
    }[injection]
    if any((meta.get(m) or {}).get("status") != "complete" for m in needs):
        return False
    if injection is ct_truncated and len(scan["subdomains"].get("names") or []) < 2:
        return False
    if injection is dns_partial and not (scan["dns"].get("MX") or scan["dns"].get("NS")):
        return False
    return True


# ---------------------------------------------------------------- reporting

def repeat_experiment(first, second, normalize_module, compare_module):
    domains = sorted(first.keys() & second.keys())
    totals = defaultdict(Counter)
    unsupported_pairs = Counter()
    by_category = Counter()

    for domain in domains:
        old, new = first[domain], second[domain]
        raw = raw_diff(old, new)
        totals["raw"].update({"claims": raw["changes"] + raw["added"] + raw["removed"], "removals": raw["removed"]})

        later_norm = normalize_module.normalize(new)["categories"]
        unaware = unaware_diff(old, new, normalize_module)
        unsupported = [c for c in unaware
                       if c[2] == "removed" and later_norm[c[0]][c[1]]["status"] != "complete"]
        totals["unaware"].update({"claims": len(unaware), "removals": sum(c[2] == "removed" for c in unaware),
                                  "unsupported_removals": len(unsupported)})
        if unsupported:
            unsupported_pairs["unaware"] += 1

        claims, withheld = hosthunter_diff(old, new, compare_module)
        h_unsupported = [c for c in claims
                         if c[2] == "removed" and later_norm[c[0]][c[1]]["status"] != "complete"]
        totals["hosthunter"].update({"claims": len(claims), "removals": sum(c[2] == "removed" for c in claims),
                                     "unsupported_removals": len(h_unsupported)})
        totals["hosthunter"].update(withheld)
        if h_unsupported:
            unsupported_pairs["hosthunter"] += 1
        for category, name, _state, _value in claims:
            by_category[f"{category}.{name}"] += 1

    print(f"\n=== Repeat scans: {len(domains)} domain pairs, same day ===")
    print("comparator   claims  removals  unsupported_removals  pairs_with_unsupported_removal")
    for name in ("raw", "unaware", "hosthunter"):
        t = totals[name]
        print(f"{name:11s} {t['claims']:7d} {t['removals']:9d} {t.get('unsupported_removals', 0):21d} "
              f"{unsupported_pairs.get(name, 0):30d}")
    t = totals["hosthunter"]
    print(f"hosthunter withheld: {t['unavailable']} unavailable fields, {t['partially_comparable']} partially "
          f"comparable fields, {t['inconclusive_values']} inconclusive values")
    print("hosthunter claims by field (real churn between captures):")
    for key, count in by_category.most_common(12):
        print(f"  {key}: {count}")


def injected_experiment(first, normalize_module, compare_module, seed):
    rng = random.Random(seed)
    print(f"\n=== Injected variants of real complete scans (truth known) ===")
    print("injection                              n   false claims: raw  unaware  hosthunter")
    for label, injection in NO_CHANGE_INJECTIONS.items():
        n = 0
        false_claims = Counter()
        for domain, scan in sorted(first.items()):
            if not eligible(scan, injection):
                continue
            n += 1
            variant = injection(copy.deepcopy(scan))
            raw = raw_diff(scan, variant)
            false_claims["raw"] += raw["changes"] + raw["added"] + raw["removed"]
            false_claims["unaware"] += len(unaware_diff(scan, variant, normalize_module))
            false_claims["hosthunter"] += len(hosthunter_diff(scan, variant, compare_module)[0])
        print(f"{label:38s} {n:3d} {false_claims['raw']:17d} {false_claims['unaware']:8d} "
              f"{false_claims['hosthunter']:11d}")

    print("\ntrue address change + failure elsewhere: detected / other false claims")
    print("failure                                n   unaware det/false   hosthunter det/false")
    for label, injection in NO_CHANGE_INJECTIONS.items():
        if injection in (reorder, dns_partial):
            continue
        n, detected, false_claims = 0, Counter(), Counter()
        for domain, scan in sorted(first.items()):
            if not eligible(scan, injection) or not scan["dns"].get("A"):
                continue
            n += 1
            variant, _old_address = address_change_with_failure(injection, rng)(copy.deepcopy(scan))
            for name, claims in (("unaware", unaware_diff(scan, variant, normalize_module)),
                                 ("hosthunter", hosthunter_diff(scan, variant, compare_module)[0])):
                true_claims = [c for c in claims if (c[0], c[1]) == TRUE_CHANGE]
                detected[name] += 1 if true_claims else 0
                false_claims[name] += len(claims) - len(true_claims)
        print(f"{label:38s} {n:3d} {detected['unaware']:8d}/{false_claims['unaware']:<10d} "
              f"{detected['hosthunter']:8d}/{false_claims['hosthunter']}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", required=True)
    parser.add_argument("--first", required=True)
    parser.add_argument("--second")
    parser.add_argument("--seed", type=int, default=2026)
    args = parser.parse_args()

    sys.path.insert(0, args.backend)
    from analysis import compare as compare_module
    from analysis import normalize as normalize_module

    first = load(args.first)
    if args.second:
        repeat_experiment(first, load(args.second), normalize_module, compare_module)
    injected_experiment(first, normalize_module, compare_module, args.seed)


if __name__ == "__main__":
    main()
