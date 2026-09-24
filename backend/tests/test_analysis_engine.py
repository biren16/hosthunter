import json
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from analysis.engine import build_analysis


def complete_scan():
    return {
        "domain": "example.com",
        "dns": {
            "A": ["192.0.2.1"],
            "AAAA": [],
            "MX": ["10 mail.example.com."],
        },
        "ssl": {
            "valid_until": "Jan 01 00:00:00 2027 GMT",
            "days_until_expiry": 120,
            "is_expired": False,
        },
        "website": {
            "scheme": "https",
            "final_url": "https://example.com/",
            "security_headers": {
                "strict_transport_security": {"enabled": True}
            },
        },
        "ip": {
            "ips": [{"address": "192.0.2.1", "organization": "Example Networks"}]
        },
        "cdn": {"detected": True, "provider": "Cloudflare"},
        "technology": {
            "edge_platform": {"detected": "Cloudflare", "source": "HTTP headers"}
        },
        "email_security": {
            "spf": {"enabled": True},
            "dmarc": {"enabled": True, "policy": "reject"},
            "dkim": {"supported": "Unknown"},
        },
        "subdomains": {
            "status": "complete",
            "apex_observed": True,
            "returned_count": 2,
            "wildcard_count": 1,
            "truncated": False,
            "names": [],
        },
        "errors": {},
    }


class AnalysisEngineTests(unittest.TestCase):
    def test_builds_four_evidence_gated_observations(self):
        result = build_analysis(complete_scan())

        self.assertEqual(result["version"], "1")
        self.assertEqual(
            [item["id"] for item in result["observations"]],
            [
                "certificate-name-footprint",
                "web-tls-delivery",
                "mail-configuration",
                "delivery-infrastructure",
            ],
        )
        self.assertEqual(result["unavailable"], [])
        for observation in result["observations"]:
            self.assertTrue(observation["title"])
            self.assertTrue(observation["summary"])
            self.assertTrue(observation["related_modules"])
            self.assertTrue(observation["evidence_refs"])
            self.assertTrue(observation["limitations"])

    def test_reports_unavailable_rules_without_inventing_negative_findings(self):
        result = build_analysis(
            {
                "subdomains": {"status": "unavailable", "names": []},
                "errors": {"website": "timeout", "email_security": "timeout"},
            }
        )

        self.assertEqual(result["observations"], [])
        unavailable_ids = [item["id"] for item in result["unavailable"]]
        self.assertEqual(
            unavailable_ids,
            [
                "certificate-name-footprint",
                "web-tls-delivery",
                "mail-configuration",
                "delivery-infrastructure",
            ],
        )
        self.assertTrue(all(item["reason"] for item in result["unavailable"]))

    def test_preserves_unknown_dkim_state_in_mail_observation(self):
        result = build_analysis(complete_scan())
        mail = next(item for item in result["observations"] if item["id"] == "mail-configuration")

        self.assertIn("Unknown", mail["summary"])

    def test_analyzes_partial_subdomain_evidence(self):
        scan = complete_scan()
        scan["subdomains"] = {
            "status": "partial",
            "returned_count": 1,
            "wildcard_count": 1,
            "truncated": True,
            "apex_observed": True,
            "names": [{"hostname": "*.example.com", "wildcard": True}],
        }
        scan["errors"] = {"subdomains": "Certificate provider timed out"}

        result = build_analysis(scan)

        observation = next(
            item for item in result["observations"] if item["id"] == "certificate-name-footprint"
        )
        self.assertTrue(any("partial" in limitation.lower() for limitation in observation["limitations"]))

    def test_output_contains_no_forbidden_verdict_fields(self):
        serialized = json.dumps(build_analysis(complete_scan())).lower()

        for forbidden in ("\"score\"", "\"severity\"", "\"confidence\"", "\"verdict\""):
            self.assertNotIn(forbidden, serialized)


if __name__ == "__main__":
    unittest.main()
