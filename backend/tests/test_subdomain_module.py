import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from modules.subdomain_module import aggregate_issuances, normalize_ct_name, subdomain_lookup


class SubdomainNormalizationTests(unittest.TestCase):
    def test_normalizes_descendant_names_and_wildcards(self):
        self.assertEqual(
            normalize_ct_name("API.Example.com.", "example.com"),
            {"hostname": "api.example.com", "wildcard": False},
        )
        self.assertEqual(
            normalize_ct_name("*.Example.com", "example.com"),
            {"hostname": "*.example.com", "wildcard": True},
        )

    def test_keeps_apex_separate_from_descendants(self):
        self.assertEqual(
            normalize_ct_name("example.com", "example.com"),
            {"hostname": "example.com", "wildcard": False},
        )

    def test_rejects_lookalike_and_unrelated_names(self):
        self.assertIsNone(normalize_ct_name("badexample.com", "example.com"))
        self.assertIsNone(normalize_ct_name("example.net", "example.com"))

    def test_normalizes_idna_names(self):
        self.assertEqual(
            normalize_ct_name("BÜCHER.Example", "xn--bcher-kva.example"),
            {"hostname": "xn--bcher-kva.example", "wildcard": False},
        )

    def test_rejects_malformed_names(self):
        self.assertIsNone(normalize_ct_name("*.bad..example.com", "example.com"))
        self.assertIsNone(normalize_ct_name("https://api.example.com", "example.com"))


class SubdomainAggregationTests(unittest.TestCase):
    def test_aggregates_duplicates_and_excludes_apex(self):
        issuances = [
            {
                "dns_names": ["example.com", "api.example.com", "*.example.com"],
                "not_before": "2025-01-01T00:00:00Z",
                "not_after": "2025-06-01T00:00:00Z",
            },
            {
                "dns_names": ["api.example.com", "badexample.com"],
                "not_before": "2025-02-01T00:00:00Z",
                "not_after": "2025-07-01T00:00:00Z",
            },
        ]

        result = aggregate_issuances(issuances, "example.com")

        self.assertTrue(result["apex_observed"])
        self.assertEqual(result["returned_count"], 2)
        self.assertEqual(result["wildcard_count"], 1)
        self.assertEqual(
            [item["hostname"] for item in result["names"]],
            ["*.example.com", "api.example.com"],
        )
        api = result["names"][1]
        self.assertEqual(api["issuance_count"], 2)
        self.assertEqual(api["earliest_not_before"], "2025-01-01T00:00:00Z")
        self.assertEqual(api["latest_not_after"], "2025-07-01T00:00:00Z")

    def test_caps_names_and_marks_truncated(self):
        issuances = [
            {
                "dns_names": [f"host-{index}.example.com"],
                "not_before": None,
                "not_after": None,
            }
            for index in range(3)
        ]

        result = aggregate_issuances(issuances, "example.com", max_names=2)

        self.assertEqual(result["returned_count"], 2)
        self.assertTrue(result["truncated"])


class FakeResponse:
    def __init__(self, status_code=200, payload=None, json_error=None):
        self.status_code = status_code
        self.payload = payload
        self.json_error = json_error

    def json(self):
        if self.json_error:
            raise self.json_error
        return self.payload


class SubdomainProviderTests(unittest.TestCase):
    @patch.dict(os.environ, {}, clear=True)
    @patch("modules.subdomain_module.requests.get")
    def test_requests_paginated_certificate_names_without_authentication(self, get):
        get.side_effect = [
            FakeResponse(
                payload=[
                    {
                        "id": "first",
                        "dns_names": ["api.example.com"],
                        "not_before": "2025-01-01T00:00:00Z",
                        "not_after": "2025-06-01T00:00:00Z",
                    }
                ]
            ),
            FakeResponse(payload=[]),
        ]

        result = subdomain_lookup("example.com")

        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["names"][0]["hostname"], "api.example.com")
        self.assertEqual(get.call_count, 2)
        first_call = get.call_args_list[0]
        second_call = get.call_args_list[1]
        self.assertEqual(first_call.kwargs["params"]["include_subdomains"], "true")
        self.assertEqual(first_call.kwargs["params"]["expand"], "dns_names")
        self.assertEqual(first_call.kwargs["headers"], {})
        self.assertEqual(second_call.kwargs["params"]["after"], "first")

    @patch.dict(os.environ, {"CERTSPOTTER_API_KEY": "secret"}, clear=True)
    @patch("modules.subdomain_module.requests.get")
    def test_adds_bearer_token_when_configured(self, get):
        get.return_value = FakeResponse(payload=[])

        subdomain_lookup("example.com")

        self.assertEqual(
            get.call_args.kwargs["headers"],
            {"Authorization": "Bearer secret"},
        )

    @patch("modules.subdomain_module.requests.get")
    def test_preserves_names_when_later_page_times_out(self, get):
        get.side_effect = [
            FakeResponse(payload=[{"id": "first", "dns_names": ["api.example.com"]}]),
            __import__("requests").Timeout(),
        ]

        result = subdomain_lookup("example.com")

        self.assertEqual(result["status"], "partial")
        self.assertTrue(result["truncated"])
        self.assertEqual(result["returned_count"], 1)
        self.assertIn("timed out", result["error"])

    @patch("modules.subdomain_module.requests.get")
    def test_reports_rate_limit_as_unavailable(self, get):
        get.return_value = FakeResponse(status_code=429, payload={"error": "nope"})

        result = subdomain_lookup("example.com")

        self.assertEqual(result["status"], "unavailable")
        self.assertFalse(result["truncated"])
        self.assertIn("rate limit", result["error"])

    @patch("modules.subdomain_module.requests.get")
    def test_caps_a_large_page(self, get):
        get.return_value = FakeResponse(
            payload=[
                {
                    "id": "large",
                    "dns_names": [f"host-{index}.example.com"],
                }
                for index in range(201)
            ]
        )

        result = subdomain_lookup("example.com")

        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["returned_count"], 200)
        self.assertTrue(result["truncated"])
        self.assertEqual(get.call_count, 1)


if __name__ == "__main__":
    unittest.main()
