"""Versioned snapshots and conservative same-domain comparison.

A comparison only claims what both captures can support:
- an addition needs the earlier capture's source to have been complete,
- a removal needs the later capture's source to have been complete,
- anything else that differs is reported as inconclusive, never as a change,
- a field whose source was unavailable in either capture makes no claim.
Comparison is local and network-free; it reads two stored snapshots.
"""
import hashlib
import json
from datetime import datetime, timezone

from analysis.normalize import COMPLETE, NORMALIZER_VERSION, UNAVAILABLE, normalize

SNAPSHOT_VERSION = "1"
COMPARATOR_VERSION = "1"

UNCHANGED = "unchanged"
CHANGED = "changed"
ADDED = "added"
REMOVED = "removed"
PARTIALLY_COMPARABLE = "partially_comparable"
NOT_COMPARABLE = "unavailable"


def _major(version):
    return str(version).split(".")[0]


def content_hash(normalized):
    # Only evidence values and their statuses; capture time, durations and
    # request metadata are not infrastructure state.
    evidence = {
        category: {name: [field["value"], field["status"]] for name, field in fields.items()}
        for category, fields in normalized["categories"].items()
    }
    canonical = json.dumps(evidence, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def make_snapshot(scan, captured_at=None):
    normalized = normalize(scan)
    scan_meta = scan.get("scan_meta") or {}
    return {
        "snapshot_version": SNAPSHOT_VERSION,
        "domain": scan.get("domain"),
        "captured_at": captured_at
        or scan_meta.get("started_at")
        or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "schema_version": scan_meta.get("schema_version", "1"),
        "normalizer_version": normalized["normalizer_version"],
        "analysis_version": (scan.get("analysis") or {}).get("version"),
        "content_hash": content_hash(normalized),
        "normalized": normalized,
        "raw": scan,
    }


def _compare_value(old, new):
    if old["value"] == new["value"]:
        return {"state": UNCHANGED}
    if old["value"] is not None and new["value"] is not None:
        return {"state": CHANGED}
    if old["status"] == COMPLETE and new["status"] == COMPLETE:
        return {"state": ADDED if old["value"] is None else REMOVED}
    return {"state": PARTIALLY_COMPARABLE, "reason": "A value is missing from a capture whose source was incomplete."}


def _compare_set(old, new):
    old_values = set(old["value"] or [])
    new_values = set(new["value"] or [])
    added = sorted(new_values - old_values)
    removed = sorted(old_values - new_values)

    if not added and not removed:
        return {"state": UNCHANGED}

    # A value missing from an incomplete capture may simply not have been observed.
    supported_added = added if old["status"] == COMPLETE else []
    supported_removed = removed if new["status"] == COMPLETE else []
    inconclusive = sorted(set(added) - set(supported_added) | set(removed) - set(supported_removed))

    result = {"added": supported_added, "removed": supported_removed}
    if inconclusive:
        result["inconclusive"] = inconclusive
        result["reason"] = "Differences involving an incomplete capture are not claimed as additions or removals."
    result["state"] = CHANGED if supported_added or supported_removed else PARTIALLY_COMPARABLE
    return result


def _compare_field(old, new):
    if old["status"] == UNAVAILABLE or new["status"] == UNAVAILABLE:
        side = "earlier" if old["status"] == UNAVAILABLE else "later"
        return {"state": NOT_COMPARABLE, "reason": f"The source was unavailable in the {side} capture."}
    if old["kind"] == "set":
        return _compare_set(old, new)
    return _compare_value(old, new)


def _category_state(states):
    if all(state == NOT_COMPARABLE for state in states):
        return NOT_COMPARABLE
    if any(state in (CHANGED, ADDED, REMOVED) for state in states):
        return CHANGED
    if any(state in (PARTIALLY_COMPARABLE, NOT_COMPARABLE) for state in states):
        return PARTIALLY_COMPARABLE
    return UNCHANGED


def compare(first, second):
    """Compare two snapshots of the same domain, ordered by capture time."""
    old, new = sorted((first, second), key=lambda snapshot: snapshot["captured_at"])

    if old["domain"] != new["domain"]:
        return {"comparable": False, "reason": "Snapshots are for different domains."}
    if _major(old["normalizer_version"]) != _major(new["normalizer_version"]) or \
            _major(new["normalizer_version"]) != _major(NORMALIZER_VERSION):
        return {
            "comparable": False,
            "reason": "Snapshots use normalizer versions this comparator does not support.",
            "versions": [old["normalizer_version"], new["normalizer_version"]],
        }

    categories = {}
    for category, fields in new["normalized"]["categories"].items():
        results = {}
        for name, new_field in fields.items():
            old_field = old["normalized"]["categories"].get(category, {}).get(name)
            if old_field is None:
                results[name] = {"state": NOT_COMPARABLE, "reason": "Field is not present in the earlier capture."}
                continue
            result = _compare_field(old_field, new_field)
            result.update({
                "old": old_field["value"],
                "new": new_field["value"],
                "old_status": old_field["status"],
                "new_status": new_field["status"],
                "source": new_field["source"],
            })
            results[name] = result
        categories[category] = {
            "state": _category_state([result["state"] for result in results.values()]),
            "fields": results,
        }

    return {
        "comparable": True,
        "comparator_version": COMPARATOR_VERSION,
        "domain": new["domain"],
        "earlier": {"captured_at": old["captured_at"], "content_hash": old["content_hash"]},
        "later": {"captured_at": new["captured_at"], "content_hash": new["content_hash"]},
        "identical_evidence": old["content_hash"] == new["content_hash"],
        "categories": categories,
    }
