import sys
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import ScanRequest, scan


BASE_RESULTS = {
    "dns": {"domainexists": True, "dns": {"A": ["192.0.2.1"]}},
    "whois": {"registrar": "Example Registrar"},
    "ssl": {"days_until_expiry": 100},
    "ip": {"ips": []},
    "website": {"status_code": 200},
    "technology": {"frontend": {"frameworks": []}},
    "cdn": {"detected": False},
    "email_security": {"spf": {"enabled": False}},
}


def result_for(key):
    return BASE_RESULTS[key]


class MainContractTests(unittest.TestCase):
    def _patch_collectors(self, subdomains):
        return patch.multiple(
            "main",
            dns_lookup=lambda domain: result_for("dns"),
            whois_lookup=lambda domain: result_for("whois"),
            ssl_lookup=lambda domain, context=None: result_for("ssl"),
            ip_lookup=lambda domain, context=None: result_for("ip"),
            website_lookup=lambda domain, context=None: result_for("website"),
            technology_lookup=lambda domain, context=None: result_for("technology"),
            cdn_lookup=lambda domain, context=None: result_for("cdn"),
            email_security_lookup=lambda domain: result_for("email_security"),
            subdomain_lookup=lambda domain: subdomains,
        )

    def test_adds_subdomains_and_analysis_without_renaming_existing_fields(self):
        subdomains = {"status": "complete", "names": [], "returned_count": 0}
        with self._patch_collectors(subdomains), patch(
            "main.build_analysis", return_value={"version": "1", "observations": [], "unavailable": []}
        ):
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["domain"], "example.com")
        self.assertTrue(response["domainexists"])
        for key in BASE_RESULTS:
            self.assertIn(key, response)
        self.assertEqual(response["subdomains"], subdomains)
        self.assertEqual(response["analysis"]["version"], "1")
        self.assertNotIn("errors", response)

    def test_mirrors_subdomain_error_without_dropping_other_results(self):
        subdomains = {
            "status": "partial",
            "names": [{"hostname": "api.example.com"}],
            "returned_count": 1,
            "error": "provider timeout",
        }
        with self._patch_collectors(subdomains), patch(
            "main.build_analysis", return_value={"version": "1", "observations": [], "unavailable": []}
        ):
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["subdomains"], subdomains)
        self.assertEqual(response["errors"]["subdomains"], "provider timeout")
        self.assertIn("whois", response)
        self.assertIn("website", response)

    def test_analysis_failure_preserves_scan_modules(self):
        subdomains = {"status": "complete", "names": [], "returned_count": 0}
        with self._patch_collectors(subdomains), patch(
            "main.build_analysis", side_effect=RuntimeError("unexpected")
        ):
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["subdomains"], subdomains)
        self.assertIn("dns", response)
        self.assertIn("website", response)
        self.assertEqual(response["analysis"]["observations"], [])
        self.assertEqual(response["errors"]["analysis"], "Analysis layer unavailable")


if __name__ == "__main__":
    unittest.main()
