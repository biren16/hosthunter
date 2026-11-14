"""Build the stratified evaluation domain list from a pinned Tranco list.

Usage: python build_domains.py --out domains.csv [--seed 2026]
"""
import argparse
import csv
import io
import random
import string
import urllib.request
import zipfile
from datetime import datetime, timezone

TRANCO_ID_URL = "https://tranco-list.eu/top-1m-id"
TRANCO_ZIP_URL = "https://tranco-list.eu/download_daily/{list_id}"

# (category, rank_from, rank_to, sample_size)
STRATA = [
    ("top", 1, 1_000, 60),
    ("mid", 10_000, 100_000, 60),
    ("tail", 100_000, 1_000_000, 60),
]
IDN_SAMPLE = 10
NONEXISTENT_SAMPLE = 10


def fetch_tranco():
    list_id = urllib.request.urlopen(TRANCO_ID_URL, timeout=30).read().decode().strip()
    data = urllib.request.urlopen(TRANCO_ZIP_URL.format(list_id=list_id), timeout=120).read()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        name = archive.namelist()[0]
        rows = archive.read(name).decode().splitlines()
    ranked = []
    for row in rows:
        rank, domain = row.split(",", 1)
        ranked.append((int(rank), domain.strip().lower()))
    return list_id, ranked


def build(seed):
    rng = random.Random(seed)
    list_id, ranked = fetch_tranco()
    chosen = []
    used = set()

    for category, low, high, size in STRATA:
        pool = [(r, d) for r, d in ranked if low <= r <= high and not d.startswith("xn--")]
        for rank, domain in rng.sample(pool, size):
            chosen.append({"domain": domain, "category": category, "tranco_rank": rank})
            used.add(domain)

    idn_pool = [(r, d) for r, d in ranked if "xn--" in d and d not in used]
    for rank, domain in rng.sample(idn_pool, min(IDN_SAMPLE, len(idn_pool))):
        chosen.append({"domain": domain, "category": "idn", "tranco_rank": rank})

    # Random labels under the reserved .invalid-like space would never reach DNS;
    # use .com so the resolver path is exercised and returns NXDOMAIN.
    for _ in range(NONEXISTENT_SAMPLE):
        label = "hh-eval-" + "".join(rng.choices(string.ascii_lowercase + string.digits, k=20))
        chosen.append({"domain": f"{label}.com", "category": "nonexistent", "tranco_rank": ""})

    return list_id, chosen


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="domains.csv")
    parser.add_argument("--seed", type=int, default=2026)
    args = parser.parse_args()

    list_id, chosen = build(args.seed)
    with open(args.out, "w", newline="", encoding="utf-8") as handle:
        handle.write(f"# tranco_list_id={list_id} seed={args.seed} "
                     f"built_at={datetime.now(timezone.utc).isoformat()}\n")
        writer = csv.DictWriter(handle, fieldnames=["domain", "category", "tranco_rank"])
        writer.writeheader()
        writer.writerows(chosen)
    print(f"Wrote {len(chosen)} domains from Tranco list {list_id} to {args.out}")


if __name__ == "__main__":
    main()
