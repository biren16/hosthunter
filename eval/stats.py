"""Compute every number reported in the paper into results/results.json.

Usage: python stats.py --backend ../HostHunter/backend
"""
import argparse
import copy
import csv
import gzip
import os
import json
import random
import sys
from collections import Counter, defaultdict

from analyze import MODULES, module_failed, pct, silent_empty_dns, unknown_reported_as_absent

RESULTS = "results"


def load(name):
    # Raw local runs are results/<name>.jsonl; published records are records/<name>.jsonl.gz.
    for path, opener in ((f"{RESULTS}/{name}.jsonl", open), (f"{RESULTS}/records/{name}.jsonl.gz", gzip.open)):
        if os.path.exists(path):
            with opener(path, "rt", encoding="utf-8") as handle:
                return {r["domain"]: r for r in (json.loads(line) for line in handle if line.strip())}
    raise FileNotFoundError(f"no records for {name} under {RESULTS}")


def lost(record):
    return bool(record.get("crash") or record.get("hung") or record.get("exceeded_browser_timeout"))


def dataset_info():
    with open("domains.csv", encoding="utf-8") as handle:
        header = handle.readline().strip().lstrip("# ")
        rows = list(csv.DictReader(handle))
    meta = dict(part.split("=", 1) for part in header.split())
    return {"tranco_list_id": meta["tranco_list_id"], "seed": meta["seed"],
            "domains": len(rows), "strata": Counter(r["category"] for r in rows)}


def run_info(runs):
    info = {}
    for name, records in runs.items():
        times = sorted(r["scanned_at"] for r in records.values())
        synth = sorted(r["scanned_at"] for r in records.values() if any(
            a.startswith("64:ff9b:") for a in ((((r.get("result") or {}).get("dns")) or {}).get("AAAA") or [])))
        info[name] = {"scans": len(records), "first": times[0], "last": times[-1],
                      "backend": next(iter(records.values()))["backend_version"],
                      "dns64_scans": len(synth), "dns64_window": [synth[0], synth[-1]] if synth else None}
    return info


def table_a(before, after):
    domains = sorted(before.keys() & after.keys())
    both = [d for d in domains if before[d].get("result") and after[d].get("result")]
    b_lat = [before[d]["total_seconds"] for d in both]
    a_lat = [after[d]["total_seconds"] for d in both]

    def side(records, latencies):
        return {
            "crashed": sum(1 for d in domains if records[d].get("crash")),
            "hung": sum(1 for d in domains if records[d].get("hung")),
            "over_30s": sum(1 for d in domains if records[d].get("exceeded_browser_timeout")),
            "lost": sum(1 for d in domains if lost(records[d])),
            "p50": pct(latencies, 50), "p95": pct(latencies, 95), "max": max(latencies),
            "mean": sum(latencies) / len(latencies),
            "failed_pct": {m: 100 * sum(1 for d in both if module_failed(records[d], m)) / len(both)
                           for m in MODULES},
        }

    by_stratum = {}
    for stratum in sorted({before[d]["category"] for d in both}):
        group = [d for d in both if before[d]["category"] == stratum]
        by_stratum[stratum] = {
            "n": len(group),
            "before_p50": pct([before[d]["total_seconds"] for d in group], 50),
            "before_p95": pct([before[d]["total_seconds"] for d in group], 95),
            "after_p50": pct([after[d]["total_seconds"] for d in group], 50),
            "after_p95": pct([after[d]["total_seconds"] for d in group], 95),
            "before_lost": sum(1 for d in domains if before[d]["category"] == stratum and lost(before[d])),
            "after_lost": sum(1 for d in domains if before[d]["category"] == stratum and lost(after[d])),
        }

    crash_reasons = Counter(before[d]["crash"].split(":")[0] for d in domains if before[d].get("crash"))
    deadline_hits = {m: sum(1 for d in domains
                            if ((after[d].get("result") or {}).get("module_meta") or {}).get(m, {}).get("status") == "timeout")
                     for m in MODULES}
    return {
        "domains": len(domains), "paired": len(both),
        "before": side(before, b_lat), "after": side(after, a_lat),
        "faster_after": sum(1 for d in both if after[d]["total_seconds"] < before[d]["total_seconds"]),
        "by_stratum": by_stratum, "crash_reasons": crash_reasons,
        "deadline_hits_after": deadline_hits,
        "scans_with_deadline_hit_after": sum(
            1 for d in domains
            if any(v.get("status") == "timeout"
                   for v in (((after[d].get("result") or {}).get("module_meta")) or {}).values())),
        "latencies": {"before": b_lat, "after": a_lat},
        "after_any_noncomplete": sum(
            1 for d in domains if after[d].get("result")
            and any(v.get("status") != "complete" for v in after[d]["result"]["module_meta"].values())),
        "after_any_noncomplete_excl_ct": sum(
            1 for d in domains if after[d].get("result")
            and any(v.get("status") != "complete" for k, v in after[d]["result"]["module_meta"].items()
                    if k != "subdomains")),
    }


def status_counts(records):
    counts = defaultdict(Counter)
    for record in records.values():
        for module, meta in ((record.get("result") or {}).get("module_meta") or {}).items():
            counts[module][meta["status"]] += 1
    return counts


def table_b(before, after):
    domains = sorted(before.keys() & after.keys())
    out = {}
    for name, records in (("before", before), ("after", after)):
        completed = [records[d] for d in domains if records[d].get("result")]
        reasons = Counter()
        scans = 0
        for record in completed:
            found = unknown_reported_as_absent(record)
            reasons.update(f"{policy}:{reason}" for policy, reason in found)
            scans += bool(found)
        empties = [silent_empty_dns(r) for r in completed]
        out[name] = {"completed": len(completed), "misreported_policies": sum(reasons.values()),
                     "scans_affected": scans, "reasons": reasons,
                     "dns_silent_empty_types": sum(empties),
                     "dns_silent_empty_scans": sum(1 for e in empties if e)}
    email_states = Counter()
    for d in domains:
        email = (after[d].get("result") or {}).get("email_security") or {}
        for policy in ("spf", "dmarc"):
            enabled = (email.get(policy) or {}).get("enabled")
            email_states[f"{policy}:{'unknown' if enabled is None else enabled}"] += 1
    out["after_email_states"] = email_states
    out["after_dns_unresolved_scans"] = sum(
        1 for d in domains
        if (((after[d].get("result") or {}).get("module_meta") or {}).get("dns") or {}).get("unresolved_record_types"))
    return out


def comparison(first, second, nm, cm, ce, seed):
    domains = sorted(d for d in first.keys() & second.keys() if first[d].get("result") and second[d].get("result"))
    repeat = {name: Counter() for name in ("raw", "unaware", "hosthunter")}
    pairs_unsupported = Counter()
    churn = Counter()
    withheld = Counter()
    states = Counter()
    pairs_with_claims = Counter()
    examples = []

    for d in domains:
        old, new = first[d]["result"], second[d]["result"]
        later = nm.normalize(new)["categories"]
        raw = ce.raw_diff(old, new)
        repeat["raw"].update(claims=raw["changes"] + raw["added"] + raw["removed"], removals=raw["removed"])
        pairs_with_claims["raw"] += bool(raw["changes"] + raw["added"] + raw["removed"])

        unaware = ce.unaware_diff(old, new, nm)
        unsupported = [c for c in unaware if c[2] == "removed" and later[c[0]][c[1]]["status"] != "complete"]
        repeat["unaware"].update(claims=len(unaware), removals=sum(c[2] == "removed" for c in unaware),
                                 unsupported_removals=len(unsupported))
        pairs_unsupported["unaware"] += bool(unsupported)
        pairs_with_claims["unaware"] += bool(unaware)

        claims, held = ce.hosthunter_diff(old, new, cm)
        h_unsupported = [c for c in claims if c[2] == "removed" and later[c[0]][c[1]]["status"] != "complete"]
        repeat["hosthunter"].update(claims=len(claims), removals=sum(c[2] == "removed" for c in claims),
                                    unsupported_removals=len(h_unsupported))
        pairs_unsupported["hosthunter"] += bool(h_unsupported)
        pairs_with_claims["hosthunter"] += bool(claims)
        withheld.update(held)
        churn.update(f"{c[0]}.{c[1]}" for c in claims)

        result = cm.compare(cm.make_snapshot(old, captured_at="1"), cm.make_snapshot(new, captured_at="2"))
        for category in result["categories"].values():
            states[category["state"]] += 1
        if unsupported and claims and len(examples) < 8:
            examples.append({"domain": d, "unaware_unsupported": unsupported[:4], "hosthunter_claims": claims[:4]})

    def synthesized(scan):
        return any(a.startswith("64:ff9b:") for a in ((scan.get("dns") or {}).get("AAAA") or []))

    dns64_pairs = [d for d in domains if synthesized(first[d]["result"]) or synthesized(second[d]["result"])]
    dns64_claims = Counter()
    for d in dns64_pairs:
        claims, _ = ce.hosthunter_diff(first[d]["result"], second[d]["result"], cm)
        dns64_claims["all"] += len(claims)
        dns64_claims["ipv6"] += sum(1 for c in claims if c[1] == "ipv6_addresses")

    rng = random.Random(seed)
    injected = {}
    for label, injection in ce.NO_CHANGE_INJECTIONS.items():
        n, false_claims, scans_with_false = 0, Counter(), Counter()
        for d, record in sorted(first.items()):
            scan = record.get("result")
            if not scan or not ce.eligible(scan, injection):
                continue
            n += 1
            variant = injection(copy.deepcopy(scan))
            raw = ce.raw_diff(scan, variant)
            counts = {"raw": raw["changes"] + raw["added"] + raw["removed"],
                      "unaware": len(ce.unaware_diff(scan, variant, nm)),
                      "hosthunter": len(ce.hosthunter_diff(scan, variant, cm)[0])}
            for name, count in counts.items():
                false_claims[name] += count
                scans_with_false[name] += bool(count)
        injected[label] = {"n": n, "false_claims": false_claims, "scans_with_false": scans_with_false}

    detection = {}
    for label, injection in ce.NO_CHANGE_INJECTIONS.items():
        if injection in (ce.reorder, ce.dns_partial):
            continue
        n, detected, other = 0, Counter(), Counter()
        for d, record in sorted(first.items()):
            scan = record.get("result")
            if not scan or not ce.eligible(scan, injection) or not scan["dns"].get("A"):
                continue
            n += 1
            variant, _ = ce.address_change_with_failure(injection, rng)(copy.deepcopy(scan))
            for name, claims in (("unaware", ce.unaware_diff(scan, variant, nm)),
                                 ("hosthunter", ce.hosthunter_diff(scan, variant, cm)[0])):
                true = [c for c in claims if (c[0], c[1]) == ce.TRUE_CHANGE]
                detected[name] += bool(true)
                other[name] += len(claims) - len(true)
        detection[label] = {"n": n, "detected": detected, "other_claims": other}

    return {"pairs": len(domains), "repeat": repeat, "pairs_with_unsupported_removal": pairs_unsupported,
            "pairs_with_claims": pairs_with_claims, "hosthunter_withheld": withheld,
            "hosthunter_category_states": states, "churn": churn.most_common(15),
            "examples": examples, "injected": injected, "detection": detection,
            "dns64_pairs": len(dns64_pairs), "dns64_claims": dns64_claims}


def ct_info(runs):
    out = {}
    for name, records in runs.items():
        errors = Counter((((r.get("result") or {}).get("errors")) or {}).get("subdomains") for r in records.values()
                         if r.get("result"))
        total = sum(errors.values())
        out[name] = {"scans": total, "rate_limited": errors.get("Certificate-transparency provider rate limit reached", 0),
                     "ok": errors.get(None, 0), "errors": errors}
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", required=True)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--results", default="results",
                        help="directory with <run>.jsonl or records/<run>.jsonl.gz")
    parser.add_argument("--out", help="output path (default: <results>/results.json)")
    args = parser.parse_args()
    global RESULTS
    RESULTS = args.results
    sys.path.insert(0, args.backend)
    from analysis import compare as cm
    from analysis import normalize as nm
    import compare_eval as ce

    before, r1, r2 = load("baseline"), load("fixed-r1"), load("fixed-r2")
    runs = {"baseline": before, "fixed-r1": r1, "fixed-r2": r2}
    results = {
        "dataset": dataset_info(),
        "runs": run_info(runs),
        "table_a": table_a(before, r1),
        "status_counts_after": status_counts(r1),
        "table_b": table_b(before, r1),
        "comparison": comparison(r1, r2, nm, cm, ce, args.seed),
        "ct": ct_info(runs),
    }
    with open(args.out or f"{RESULTS}/results.json", "w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2, default=lambda o: dict(o) if isinstance(o, Counter) else str(o))
    print(json.dumps({k: v for k, v in results.items() if k != "table_a"}, indent=1, default=str)[:6000])
    a = results["table_a"]
    print(json.dumps({k: v for k, v in a.items() if k != "latencies"}, indent=1, default=str))


if __name__ == "__main__":
    main()
