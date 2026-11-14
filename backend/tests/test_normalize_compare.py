import copy
import json
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from analysis.compare import compare, make_snapshot
from analysis.normalize import normalize


MODULES = ["dns", "whois", "ssl", "ip", "website", "technology", "cdn", "email_security", "subdomains"]

SCAN = {
    "domain": "example.com",
    "domainexists": True,
    "dns": {
        "A": ["192.0.2.10", "192.0.2.11"],
        "AAAA": [],
        "MX": ["10 mx1.example.com.", "20 mx2.example.com."],
        "NS": ["ns1.example.net.", "ns2.example.net."],
        "TXT": ['"v=spf1 -all"'],
    },
    "whois": {
        "registrar": "Example Registrar",
        "expiration_date": "2027-01-01",
        "name_servers": ["NS1.EXAMPLE.NET", "ns2.example.net"],
        "status": ["clientTransferProhibited"],
    },
    "ssl": {
        "subject": {"common_name": "example.com"},
        "issuer": {"organization_name": "Let's Encrypt"},
        "valid_until": "Jan  2 00:00:00 2027 GMT",
        "fingerprint_sha256": "f1",
    },
    "ip": {"ips": [
        {"address": "192.0.2.10", "asn": "AS64500", "organization": "Example Hosting"},
        {"address": "192.0.2.11", "asn": "AS64500", "organization": "Example Hosting"},
    ]},
    "website": {
        "final_url": "https://www.example.com/",
        "status_code": 200,
        "security_headers": {"strict_transport_security": "max-age=31536000", "content_security_policy": None},
    },
    "technology": {
        "web_server": {"name": "nginx"},
        "cms": {"name": None},
        "frontend": {"frameworks": ["React"]},
        "javascript_libraries": ["jQuery"],
    },
    "cdn": {"detected": False, "provider": None},
    "email_security": {
        "status": "complete",
        "spf": {"enabled": True, "record": "v=spf1 -all"},
        "dmarc": {"enabled": True, "policy": "reject", "record": "v=DMARC1; p=reject"},
        "dkim": {"supported": "Unknown", "selector": None},
    },
    "subdomains": {
        "status": "complete",
        "truncated": False,
        "names": [{"hostname": "api.example.com"}, {"hostname": "www.example.com"}],
    },
    "scan_meta": {"schema_version": "2", "started_at": "2026-11-14T10:00:00Z", "duration_seconds": 3.2},
    "module_meta": {module: {"status": "complete", "duration_seconds": 1.0} for module in MODULES},
    "analysis": {"version": "1", "observations": [], "unavailable": []},
}


def later(changes=None, at="2026-11-14T11:00:00Z"):
    scan = copy.deepcopy(SCAN)
    scan["scan_meta"]["started_at"] = at
    scan["scan_meta"]["duration_seconds"] = 7.9
    if changes:
        changes(scan)
    return scan


def field(result, category, name):
    return result["categories"][category]["fields"][name]


class NormalizeTests(unittest.TestCase):
    def test_fields_are_canonical_and_source_linked(self):
        normalized = normalize(SCAN)["categories"]

        self.assertEqual(normalized["email_infrastructure"]["mail_exchangers"]["value"],
                         ["mx1.example.com", "mx2.example.com"])
        self.assertEqual(normalized["domain_control"]["registered_nameservers"]["value"],
                         ["ns1.example.net", "ns2.example.net"])
        self.assertEqual(normalized["web_delivery"]["asns"]["value"], ["AS64500"])
        self.assertEqual(normalized["web_delivery"]["security_headers_present"]["value"],
                         ["strict_transport_security"])
        self.assertEqual(normalized["domain_control"]["nameservers"]["source"], "dns.NS")

    def test_unavailable_source_does_not_create_values(self):
        def website_down(scan):
            scan["website"] = {"error": "Unable to connect"}
            scan["module_meta"]["website"] = {"status": "unavailable"}

        normalized = normalize(later(website_down))["categories"]["web_delivery"]

        self.assertIsNone(normalized["final_url"]["value"])
        self.assertEqual(normalized["final_url"]["status"], "unavailable")
        self.assertIsNone(normalized["security_headers_present"]["value"])

    def test_responses_without_module_meta_use_the_error_map(self):
        scan = later()
        del scan["module_meta"]
        scan["errors"] = {"ssl": "Connection refused"}

        normalized = normalize(scan)["categories"]

        self.assertEqual(normalized["tls_identity"]["certificate_fingerprint_sha256"]["status"], "unavailable")
        self.assertEqual(normalized["web_delivery"]["ipv4_addresses"]["status"], "complete")


class SnapshotTests(unittest.TestCase):
    def test_snapshot_records_versions_and_round_trips(self):
        snapshot = make_snapshot(SCAN)
        reloaded = json.loads(json.dumps(snapshot))

        for key in ("snapshot_version", "schema_version", "normalizer_version", "analysis_version", "content_hash"):
            self.assertIn(key, snapshot)
        self.assertEqual(reloaded, snapshot)
        self.assertTrue(compare(reloaded, make_snapshot(later()))["identical_evidence"])

    def test_capture_metadata_does_not_change_the_hash(self):
        self.assertEqual(make_snapshot(SCAN)["content_hash"], make_snapshot(later())["content_hash"])

    def test_reordered_arrays_do_not_change_the_hash(self):
        def reorder(scan):
            scan["dns"]["A"].reverse()
            scan["dns"]["MX"].reverse()
            scan["subdomains"]["names"].reverse()
            scan["ip"]["ips"].reverse()

        self.assertEqual(make_snapshot(SCAN)["content_hash"], make_snapshot(later(reorder))["content_hash"])


class CompareTests(unittest.TestCase):
    def _compare(self, changes):
        return compare(make_snapshot(SCAN), make_snapshot(later(changes)))

    def test_identical_captures_are_unchanged(self):
        result = self._compare(None)

        self.assertTrue(result["identical_evidence"])
        for category in result["categories"].values():
            self.assertEqual(category["state"], "unchanged")

    def test_changed_address_is_one_atomic_change(self):
        def move(scan):
            scan["dns"]["A"] = ["192.0.2.10", "198.51.100.24"]

        result = self._compare(move)
        addresses = field(result, "web_delivery", "ipv4_addresses")

        self.assertEqual(addresses["state"], "changed")
        self.assertEqual(addresses["added"], ["198.51.100.24"])
        self.assertEqual(addresses["removed"], ["192.0.2.11"])
        self.assertEqual(result["categories"]["tls_identity"]["state"], "unchanged")

    def test_certificate_renewal_is_a_value_change(self):
        result = self._compare(lambda scan: scan["ssl"].update(fingerprint_sha256="f2"))
        fingerprint = field(result, "tls_identity", "certificate_fingerprint_sha256")

        self.assertEqual(fingerprint["state"], "changed")
        self.assertEqual((fingerprint["old"], fingerprint["new"]), ("f1", "f2"))

    def test_unanswered_dns_type_is_not_a_removal(self):
        def mx_timeout(scan):
            scan["dns"]["MX"] = []
            scan["dns"]["NS"] = []
            scan["module_meta"]["dns"] = {"status": "partial", "unresolved_record_types": ["MX", "NS", "TXT"]}

        result = self._compare(mx_timeout)

        self.assertEqual(field(result, "email_infrastructure", "mail_exchangers")["state"], "unavailable")
        self.assertEqual(field(result, "domain_control", "nameservers")["state"], "unavailable")
        self.assertEqual(field(result, "web_delivery", "ipv4_addresses")["state"], "unchanged")

    def test_collector_timeout_is_unavailable_not_removed(self):
        def ip_timeout(scan):
            scan["ip"] = {"error": "Collector did not finish before the scan deadline"}
            scan["module_meta"]["ip"] = {"status": "timeout"}

        result = self._compare(ip_timeout)

        self.assertEqual(field(result, "web_delivery", "asns")["state"], "unavailable")
        self.assertEqual(result["categories"]["web_delivery"]["state"], "partially_comparable")

    def test_email_lookup_timeout_is_not_a_removed_policy(self):
        def spf_unknown(scan):
            scan["email_security"]["spf"] = {"enabled": None, "record": None, "reason": "lookup did not complete"}
            scan["email_security"]["status"] = "partial"
            scan["module_meta"]["email_security"] = {"status": "partial"}

        result = self._compare(spf_unknown)

        self.assertEqual(field(result, "email_infrastructure", "spf_enabled")["state"], "unavailable")
        self.assertEqual(field(result, "email_infrastructure", "dmarc_policy")["state"], "unchanged")

    def test_truncated_ct_result_claims_additions_but_not_removals(self):
        def truncated(scan):
            scan["subdomains"]["truncated"] = True
            scan["subdomains"]["status"] = "partial"
            scan["subdomains"]["names"] = [{"hostname": "www.example.com"}, {"hostname": "dev.example.com"}]
            scan["module_meta"]["subdomains"] = {"status": "partial"}

        result = self._compare(truncated)
        names = field(result, "observed_hostnames", "certificate_observed_names")

        self.assertEqual(names["state"], "changed")
        self.assertEqual(names["added"], ["dev.example.com"])
        self.assertEqual(names["removed"], [])
        self.assertEqual(names["inconclusive"], ["api.example.com"])

    def test_complete_removal_is_reported(self):
        result = self._compare(lambda scan: scan["subdomains"].update(names=[{"hostname": "www.example.com"}]))
        names = field(result, "observed_hostnames", "certificate_observed_names")

        self.assertEqual(names["removed"], ["api.example.com"])

    def test_value_missing_from_incomplete_capture_is_partially_comparable(self):
        def partial_whois(scan):
            scan["whois"]["registrar"] = None
            scan["module_meta"]["whois"] = {"status": "partial"}

        result = self._compare(partial_whois)

        self.assertEqual(field(result, "domain_control", "registrar")["state"], "partially_comparable")

    def test_argument_order_does_not_matter(self):
        earlier, newer = make_snapshot(SCAN), make_snapshot(later(lambda s: s["ssl"].update(fingerprint_sha256="f2")))
        reversed_result = compare(newer, earlier)

        self.assertEqual(field(reversed_result, "tls_identity", "certificate_fingerprint_sha256")["new"], "f2")

    def test_different_domains_are_not_compared(self):
        other = later(lambda scan: scan.update(domain="example.org"))

        self.assertFalse(compare(make_snapshot(SCAN), make_snapshot(other))["comparable"])

    def test_unsupported_normalizer_version_is_refused(self):
        future = make_snapshot(later())
        future["normalizer_version"] = "2"

        result = compare(make_snapshot(SCAN), future)

        self.assertFalse(result["comparable"])
        self.assertEqual(result["versions"], ["1", "2"])


if __name__ == "__main__":
    unittest.main()
