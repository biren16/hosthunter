"""Run theHarvester on a stratified subset of the evaluation domains.

Records, per domain: runtime, exit status, evidence counts by category, the keys
of the JSON output, and any error/timeout lines printed. HostHunter's side is
read from the fixed-r1 records for the same domains.

Usage: python tool_compare.py [--n-per-stratum ...]
"""
import argparse
import csv
import json
import os
import random
import re
import subprocess
import time
from datetime import datetime, timezone

SOURCES = "crtsh,certspotter,hackertarget,rapiddns,otx,subdomaincenter,thc,waybackarchive,robtex"
PER_STRATUM = {"top": 5, "mid": 5, "tail": 5, "idn": 3, "nonexistent": 2}
CAP_SECONDS = 300
ERROR_PATTERN = re.compile(r"error|exception|timed? ?out|traceback|rate.?limit|\b429\b|\b403\b|\b5\d\d\b|fail", re.I)


def sample(seed):
    with open("domains.csv", encoding="utf-8") as handle:
        rows = list(csv.DictReader(line for line in handle if not line.startswith("#")))
    rng = random.Random(seed)
    chosen = []
    for stratum, n in PER_STRATUM.items():
        pool = [r for r in rows if r["category"] == stratum]
        chosen += rng.sample(pool, n)
    return chosen


def harvester_version():
    out = subprocess.run(["brew", "list", "--versions", "theharvester"], capture_output=True, text=True).stdout
    return out.strip()


def run(domain, workdir):
    # theHarvester drops directories from -f and cuts the name at the first dot,
    # so run it inside workdir with a dot-free name.
    name = re.sub(r"[^a-z0-9-]", "_", domain)
    base = os.path.join(workdir, name)
    started = time.monotonic()
    try:
        proc = subprocess.run(["theHarvester", "-d", domain, "-b", SOURCES, "-f", name],
                              capture_output=True, text=True, timeout=CAP_SECONDS, cwd=workdir)
        output, code, capped = proc.stdout + proc.stderr, proc.returncode, False
    except subprocess.TimeoutExpired as exc:
        output, code, capped = (exc.stdout or b"").decode(errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or ""), None, True
    elapsed = time.monotonic() - started

    data = {}
    if os.path.exists(base + ".json"):
        with open(base + ".json", encoding="utf-8") as handle:
            data = json.load(handle)
    counts = {key: len(value) for key, value in data.items() if isinstance(value, list)}
    error_lines = [line.strip() for line in output.splitlines()
                   if ERROR_PATTERN.search(line) and "Searching" not in line]
    return {
        "domain": domain, "seconds": round(elapsed, 2), "exit_code": code, "capped": capped,
        "json_keys": sorted(data.keys()), "counts": counts,
        "error_lines": error_lines[:20], "summary_lines": [l.strip() for l in output.splitlines() if l.startswith("[*]")][-8:],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--out", default="results/tool_compare.jsonl")
    parser.add_argument("--workdir", default="results/theharvester")
    args = parser.parse_args()
    os.makedirs(args.workdir, exist_ok=True)

    version = harvester_version()
    done = set()
    if os.path.exists(args.out):
        with open(args.out, encoding="utf-8") as handle:
            done = {json.loads(line)["domain"] for line in handle if line.strip()}

    with open(args.out, "a", encoding="utf-8") as out:
        for row in sample(args.seed):
            if row["domain"] in done:
                continue
            record = run(row["domain"], args.workdir)
            record.update(category=row["category"], tool=version, sources=SOURCES,
                          ran_at=datetime.now(timezone.utc).isoformat())
            out.write(json.dumps(record) + "\n")
            out.flush()
            print(f"{row['domain']:40s} {record['seconds']:7.1f}s counts={record['counts']} "
                  f"errors={len(record['error_lines'])}", flush=True)


if __name__ == "__main__":
    main()
