"""Before/after table on the same domains (Table A in the paper).

"User gets no result" counts scans that crashed, hung, or exceeded the
browser's 30 s timeout. Latency and per-collector failure rates are computed
only on domains that both versions completed, so the comparison is paired.

Usage: python paired.py results/baseline.jsonl results/fixed-r1.jsonl
"""
import json
import sys

from analyze import MODULES, module_failed, pct


def load(path):
    with open(path, encoding="utf-8") as handle:
        return {r["domain"]: r for r in (json.loads(line) for line in handle if line.strip())}


def lost(record):
    return bool(record.get("crash") or record.get("hung") or record.get("exceeded_browser_timeout"))


def main(before_path, after_path):
    before, after = load(before_path), load(after_path)
    domains = sorted(before.keys() & after.keys())
    both = [d for d in domains if before[d].get("result") and after[d].get("result")]

    print(f"domains scanned by both versions: {len(domains)}; completed by both: {len(both)}")
    print(f"{'metric':45s} {'before':>10s} {'after':>10s}")

    def row(label, b, a, fmt="{:>10}"):
        print(f"{label:45s} " + fmt.format(b) + " " + fmt.format(a))

    row("crashed scans", sum(1 for d in domains if before[d].get("crash")),
        sum(1 for d in domains if after[d].get("crash")))
    row("scans over 30 s browser timeout", sum(1 for d in domains if before[d].get("exceeded_browser_timeout")),
        sum(1 for d in domains if after[d].get("exceeded_browser_timeout")))
    b_lost = sum(1 for d in domains if lost(before[d]))
    a_lost = sum(1 for d in domains if lost(after[d]))
    row("user gets no result (crash/hang/timeout)", f"{b_lost} ({100*b_lost/len(domains):.1f}%)",
        f"{a_lost} ({100*a_lost/len(domains):.1f}%)")

    b_lat = [before[d]["total_seconds"] for d in both]
    a_lat = [after[d]["total_seconds"] for d in both]
    for q in (50, 95):
        row(f"latency p{q} (s, paired)", f"{pct(b_lat, q):.2f}", f"{pct(a_lat, q):.2f}")
    row("latency max (s, paired)", f"{max(b_lat):.2f}", f"{max(a_lat):.2f}")
    faster = sum(1 for d in both if after[d]["total_seconds"] < before[d]["total_seconds"])
    print(f"domains faster after: {faster}/{len(both)}")

    print("\ncollector failure % on paired domains (before -> after); regressions listed")
    for module in MODULES:
        b_fail = [d for d in both if module_failed(before[d], module)]
        a_fail = [d for d in both if module_failed(after[d], module)]
        regressions = sorted(set(a_fail) - set(b_fail))
        print(f"  {module:15s} {100*len(b_fail)/len(both):5.1f} -> {100*len(a_fail)/len(both):5.1f}"
              + (f"   newly failing: {regressions[:6]}" if regressions else ""))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
