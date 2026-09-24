import sys
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import whois

from modules.whois_module import whois_lookup


class WhoisModuleTests(unittest.TestCase):
    @patch("modules.whois_module.whois.whois")
    def test_missing_optional_organization_does_not_abort_lookup(self, lookup):
        lookup.return_value = {
            "domain_name": "gofile.io",
            "registrar": "Example Registrar",
            "country": "US",
            "creation_date": None,
            "updated_date": None,
            "expiration_date": None,
            "name_servers": [],
            "status": [],
            "dnssec": None,
        }

        result = whois_lookup("gofile.io")

        self.assertNotIn("error", result)
        self.assertEqual(result["domain_name"], "gofile.io")
        self.assertIsNone(result["organization"])

    @patch("modules.whois_module.whois.whois")
    def test_library_whois_error_becomes_safe_module_error(self, lookup):
        lookup.side_effect = whois.WhoisError("domain not found")

        result = whois_lookup("gofile.io")

        self.assertEqual(result, {"error": "WHOIS lookup failed"})


if __name__ == "__main__":
    unittest.main()
