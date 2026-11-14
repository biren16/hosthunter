"""Run HostHunter scans in-process against a given backend checkout and record timings.

Each domain is scanned in a child process with a hard cap, so a hung collector
cannot stall the run. Per-collector durations are measured by wrapping the
collector functions that backend/main.py calls, and every DNS exception raised
inside a collector is logged so that "unknown reported as absent" can be
detected afterwards.

Usage:
  python run_scans.py --backend ../HostHunter/backend --domains domains.csv \
      --label baseline --out results/baseline.jsonl [--delay 5] [--limit N]
"""
import argparse
import csv
import json
import multiprocessing as mp
import os
import subprocess
import sys
import time
import traceback
from datetime import datetime, timezone

COLLECTORS = [
    "dns_lookup", "whois_lookup", "ssl_lookup", "ip_lookup", "website_lookup",
    "technology_lookup", "cdn_lookup", "email_security_lookup", "subdomain_lookup",
]
BROWSER_TIMEOUT_SECONDS = 30
HARD_CAP_SECONDS = 180


def _collector_from_stack():
    frame = sys._getframe(1)
    while frame is not None:
        path = frame.f_code.co_filename
        if os.sep + "modules" + os.sep in path:
            return os.path.basename(path).removesuffix(".py")
        frame = frame.f_back
    return None


def _instrument(main_module, collector_times, dns_events):
    import dns.resolver

    original_resolve = dns.resolver.Resolver.resolve

    def resolve(self, qname, rdtype="A", *args, **kwargs):
        try:
            return original_resolve(self, qname, rdtype, *args, **kwargs)
        except Exception as exc:
            dns_events.append({
                "collector": _collector_from_stack(),
                "qname": str(qname),
                "rdtype": str(rdtype),
                "exception": type(exc).__name__,
            })
            raise

    dns.resolver.Resolver.resolve = resolve

    for name in COLLECTORS:
        original = getattr(main_module, name, None)
        if original is None:
            continue

        def timed(*args, _original=original, _name=name, **kwargs):
            started = time.perf_counter()
            try:
                return _original(*args, **kwargs)
            finally:
                collector_times[_name] = round(time.perf_counter() - started, 4)

        setattr(main_module, name, timed)


def _scan_child(backend, domain, queue):
    os.chdir(backend)
    sys.path.insert(0, backend)
    collector_times, dns_events = {}, []
    record = {"collector_seconds": collector_times, "dns_events": dns_events}
    try:
        import main as main_module
        _instrument(main_module, collector_times, dns_events)
        request = main_module.ScanRequest(domain=domain)
        started = time.perf_counter()
        result = main_module.scan(request)
        record["total_seconds"] = round(time.perf_counter() - started, 4)
        record["result"] = json.loads(json.dumps(result, default=str))
    except Exception as exc:
        record["crash"] = f"{type(exc).__name__}: {exc}"
        record["traceback"] = traceback.format_exc(limit=5)
    queue.put(record)


def scan_one(backend, domain):
    queue = mp.Queue()
    process = mp.Process(target=_scan_child, args=(backend, domain, queue))
    started = time.perf_counter()
    process.start()
    process.join(HARD_CAP_SECONDS)
    if process.is_alive():
        process.kill()
        process.join()
        return {"hung": True, "total_seconds": round(time.perf_counter() - started, 4)}
    try:
        return queue.get(timeout=5)
    except Exception:
        return {"crash": f"child exited with code {process.exitcode} without a result"}


def git_commit(backend):
    try:
        return subprocess.check_output(
            ["git", "-C", backend, "describe", "--always", "--dirty", "--tags"], text=True
        ).strip()
    except Exception:
        return None


def read_domains(path):
    with open(path, encoding="utf-8") as handle:
        rows = [line for line in handle if not line.startswith("#")]
    return list(csv.DictReader(rows))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", required=True)
    parser.add_argument("--domains", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--delay", type=float, default=5.0,
                        help="seconds to wait between scans, to keep load on targets and providers low")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    backend = os.path.abspath(args.backend)
    version = git_commit(backend)
    domains = read_domains(args.domains)[: args.limit]

    done = set()
    if os.path.exists(args.out):
        with open(args.out, encoding="utf-8") as handle:
            done = {json.loads(line)["domain"] for line in handle if line.strip()}

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "a", encoding="utf-8") as out:
        for index, row in enumerate(domains, 1):
            if row["domain"] in done:
                continue
            record = {
                "domain": row["domain"],
                "category": row["category"],
                "label": args.label,
                "backend_version": version,
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }
            record.update(scan_one(backend, row["domain"]))
            record["exceeded_browser_timeout"] = (
                record.get("hung", False)
                or record.get("total_seconds", 0) > BROWSER_TIMEOUT_SECONDS
            )
            out.write(json.dumps(record) + "\n")
            out.flush()
            status = "HUNG" if record.get("hung") else "CRASH" if record.get("crash") else "ok"
            print(f"[{index}/{len(domains)}] {row['domain']:40s} "
                  f"{record.get('total_seconds', 0):7.2f}s {status}", flush=True)
            time.sleep(args.delay)


if __name__ == "__main__":
    main()
