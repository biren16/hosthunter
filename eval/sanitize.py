"""Write shareable copies of the scan records and aggregate results.

Removed before publishing:
  - IP enrichment from IPinfo (ASN, organization, geolocation): provider terms
    may not allow redistribution. Addresses and reverse DNS are kept.
  - WHOIS payloads: registry terms often restrict bulk redistribution and
    long-tail records can contain personal data. Errors are kept.
  - CT hostname lists from Cert Spotter: only counts, status and errors kept.
  - Derived copies of the above (analysis observations, normalized evidence)
    and crash tracebacks (they contain local file paths).

Usage: python sanitize.py OUTDIR
"""
import gzip
import json
import os
import sys

IP_KEEP = {"address", "version", "is_private", "is_global", "reverse_dns", "enrichment_error"}
CT_KEEP = {"status", "source", "coverage", "queried_at", "limitation", "apex_observed",
           "returned_count", "wildcard_count", "truncated", "error"}


def sanitize_result(result):
    result = dict(result)
    if isinstance(result.get("ip"), dict):
        ip = dict(result["ip"])
        if "ips" in ip:
            ip["ips"] = [{k: v for k, v in entry.items() if k in IP_KEEP} for entry in ip["ips"]]
        result["ip"] = ip
    if isinstance(result.get("whois"), dict):
        result["whois"] = {k: v for k, v in result["whois"].items() if k == "error"}
    if isinstance(result.get("subdomains"), dict):
        result["subdomains"] = {k: v for k, v in result["subdomains"].items() if k in CT_KEEP}
    if isinstance(result.get("analysis"), dict):
        result["analysis"] = {"version": result["analysis"].get("version")}
    result.pop("infrastructure", None)
    return result


def sanitize_record(record):
    record = dict(record)
    record.pop("traceback", None)
    if record.get("result"):
        record["result"] = sanitize_result(record["result"])
    return record


def main(outdir):
    os.makedirs(f"{outdir}/records", exist_ok=True)
    for name in ("baseline", "fixed-r1", "fixed-r2"):
        with open(f"results/{name}.jsonl", encoding="utf-8") as src, \
                gzip.open(f"{outdir}/records/{name}.jsonl.gz", "wt", encoding="utf-8") as dst:
            for line in src:
                if line.strip():
                    dst.write(json.dumps(sanitize_record(json.loads(line))) + "\n")

    with open("results/results.json", encoding="utf-8") as handle:
        results = json.load(handle)
    # Examples quote CT hostnames; the counts and per-field tallies stay.
    results["comparison"].pop("examples", None)
    with open(f"{outdir}/results.json", "w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)
    print("wrote", outdir)


if __name__ == "__main__":
    main(sys.argv[1])
