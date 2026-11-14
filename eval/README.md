# HostHunter evaluation

Scripts and data behind the evaluation in the HostHunter paper (Section VII).

## What was run

- **Domains:** 200 domains from Tranco list `Y897G`, seed `2026`, in five strata:
  60 top (rank 1–1,000), 60 mid (10k–100k), 60 tail (100k–1M), 10 IDN and
  10 random non-existent `.com` names. The list is in `domains.csv`; rebuild it
  with `build_domains.py`.
- **Versions:** *before* is tag `v1-baseline`; *after* is commit `fa6a7f4`.
  Python 3.14.6, dnspython 2.8.0, requests 2.34.2, python-whois 0.9.6.
- **Runs (2026-11-14, one client host, one network):** `baseline` (before),
  `fixed-r1` and `fixed-r2` (after, run one after the other). Scans were sequential
  with a 5 s pause; IPinfo and Cert Spotter keys were configured.

## Files

| File | Purpose |
|---|---|
| `build_domains.py` | Builds the stratified domain list from Tranco |
| `run_scans.py` | Scans each domain in a child process against a given backend checkout; records timings, per-collector durations and DNS exceptions |
| `analyze.py`, `paired.py` | Per-run summaries and the paired before/after table |
| `compare_eval.py` | Repeat-scan comparison and controlled failure injection |
| `stats.py` | Computes every number in the paper into `results.json` |
| `sanitize.py` | Produces the published records |
| `data/records/*.jsonl.gz` | Sanitized per-scan records for the three runs |
| `data/results.json` | Aggregates computed from the full, unsanitized records |

## Reproducing

To recompute from the published records (written to `reproduced.json`, leaving
`data/results.json` untouched):

```bash
cd eval
python stats.py --backend ../backend --results data --out reproduced.json
```

This reproduces exactly the before/after tables (lost scans, latency, collector
failure rates), the unanswered-as-absent counts, the module state counts and the
Cert Spotter figures.

The repeat-scan comparison and failure-injection results **cannot** be reproduced
exactly from the published records, because they use fields that were removed
before publishing (see below). To regenerate them, re-run the scans with your
own provider keys:

```bash
python run_scans.py --backend ../backend --domains domains.csv \
    --label fixed-r1 --out results/fixed-r1.jsonl --delay 5
python stats.py --backend ../backend
```

Results from a new run will differ from the paper's because the domains'
infrastructure, provider quotas and your vantage point differ.

## What the published records leave out

- **IPinfo enrichment** (ASN, organization, location): IPinfo's terms may not
  allow redistribution. Addresses and reverse DNS are kept.
- **WHOIS payloads:** registry terms often restrict bulk redistribution, and
  long-tail records can contain personal data. Errors are kept.
- **Certificate-transparency hostnames** from Cert Spotter: only status, counts,
  truncation and errors are kept.
- Derived copies of the above (analysis observations, normalized evidence) and
  crash tracebacks, which contain local file paths.

## Scanning responsibly

`run_scans.py` sends ordinary DNS, TLS, HTTP, WHOIS and provider API requests.
Keep the pause between scans, respect provider quotas and terms, and only scan
domains you are permitted to observe.
