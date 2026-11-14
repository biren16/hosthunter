import sys
import time
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import dns.resolver
import requests


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main
from main import ScanRequest, scan
from modules import dns_module, email_security_module
from utils import http_client


def _stub(result):
    return lambda domain, context=None: result


def _txt_answer(*texts):
    answers = []
    for text in texts:
        answer = MagicMock()
        answer.to_text.return_value = f'"{text}"'
        answers.append(answer)
    return answers


class ScanOrchestrationTests(unittest.TestCase):
    def _collectors(self, **overrides):
        stubs = {
            "dns_lookup": _stub({"domainexists": True, "dns": {"A": ["192.0.2.1"]}, "status": "complete"}),
            "whois_lookup": _stub({"registrar": "Example Registrar"}),
            "ssl_lookup": _stub({"days_until_expiry": 100}),
            "ip_lookup": _stub({"ips": []}),
            "website_lookup": _stub({"status_code": 200}),
            "technology_lookup": _stub({"frontend": {"frameworks": []}}),
            "cdn_lookup": _stub({"detected": False}),
            "email_security_lookup": _stub({"spf": {"enabled": True}, "status": "complete"}),
            "subdomain_lookup": _stub({"status": "complete", "names": [], "returned_count": 0}),
        }
        stubs.update(overrides)
        return patch.multiple("main", **stubs)

    def test_slow_collector_times_out_without_losing_other_modules(self):
        def slow_whois(domain):
            time.sleep(1)
            return {"registrar": "late"}

        with self._collectors(whois_lookup=slow_whois), patch.object(main, "SCAN_DEADLINE_SECONDS", 0.2):
            started = time.monotonic()
            response = scan(ScanRequest(domain="example.com"))
            elapsed = time.monotonic() - started

        self.assertLess(elapsed, 0.9)
        self.assertEqual(response["module_meta"]["whois"]["status"], "timeout")
        self.assertIn("whois", response["errors"])
        self.assertEqual(response["website"], {"status_code": 200})
        self.assertEqual(response["module_meta"]["website"]["status"], "complete")

    def test_crashing_collector_is_isolated(self):
        def broken(domain, context=None):
            raise RuntimeError("internal detail that must not leak")

        with self._collectors(cdn_lookup=broken):
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["module_meta"]["cdn"]["status"], "error")
        self.assertEqual(response["errors"]["cdn"], "Collector failed unexpectedly")
        self.assertNotIn("internal detail", str(response))
        self.assertEqual(response["dns"], {"A": ["192.0.2.1"]})

    def test_scan_and_module_metadata_are_added(self):
        with self._collectors():
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["scan_meta"]["schema_version"], main.SCHEMA_VERSION)
        self.assertEqual(set(response["module_meta"]), {
            "dns", "whois", "ssl", "ip", "website", "technology", "cdn", "email_security", "subdomains",
        })
        self.assertNotIn("errors", response)

    def test_unresolved_dns_types_are_reported_in_module_meta(self):
        partial_dns = {
            "domainexists": True,
            "dns": {"A": ["192.0.2.1"], "AAAA": [], "MX": [], "NS": [], "TXT": []},
            "error": "DNS lookup timed out",
            "unresolved_record_types": ["MX", "NS", "TXT"],
            "status": "partial",
        }
        with self._collectors(dns_lookup=_stub(partial_dns)):
            response = scan(ScanRequest(domain="example.com"))

        self.assertEqual(response["module_meta"]["dns"]["status"], "partial")
        self.assertEqual(response["module_meta"]["dns"]["unresolved_record_types"], ["MX", "NS", "TXT"])


class DnsStatusTests(unittest.TestCase):
    def test_timeout_marks_remaining_record_types_unresolved(self):
        def resolve(self, domain, record_type):
            if record_type == "A":
                return ["192.0.2.1"]
            if record_type == "AAAA":
                raise dns.resolver.NoAnswer()
            raise dns.resolver.LifetimeTimeout(timeout=5, errors=[])

        with patch.object(dns.resolver.Resolver, "resolve", resolve):
            result = dns_module.dns_lookup("example.com")

        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["unresolved_record_types"], ["MX", "NS", "TXT"])
        self.assertEqual(result["dns"]["A"], ["192.0.2.1"])

    def test_complete_lookup_has_no_unresolved_types(self):
        with patch.object(dns.resolver.Resolver, "resolve", lambda self, d, t: ["x"]):
            result = dns_module.dns_lookup("example.com")

        self.assertEqual(result["status"], "complete")
        self.assertNotIn("unresolved_record_types", result)


class EmailUnknownVersusAbsentTests(unittest.TestCase):
    def _lookup(self, behaviour):
        def resolve(name, record_type, lifetime):
            outcome = behaviour(name)
            if isinstance(outcome, Exception):
                raise outcome
            return outcome

        with patch.object(email_security_module.dns.resolver, "resolve", side_effect=resolve):
            return email_security_module.email_security_lookup("example.com")

    def test_timeout_is_unknown_not_absent(self):
        result = self._lookup(lambda name: dns.resolver.LifetimeTimeout(timeout=5, errors=[]))

        self.assertIsNone(result["spf"]["enabled"])
        self.assertIsNone(result["dmarc"]["enabled"])
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(len(result["dkim"]["unchecked_selectors"]), len(email_security_module.COMMON_DKIM_SELECTORS))

    def test_answered_without_records_is_absent(self):
        result = self._lookup(lambda name: dns.resolver.NoAnswer() if not name.startswith("_dmarc") else dns.resolver.NXDOMAIN())

        self.assertIs(result["spf"]["enabled"], False)
        self.assertIs(result["dmarc"]["enabled"], False)
        self.assertEqual(result["status"], "complete")

    def test_nonexistent_domain_is_unavailable(self):
        result = self._lookup(lambda name: dns.resolver.NXDOMAIN())

        self.assertEqual(result["status"], "unavailable")
        self.assertIsNone(result["spf"]["enabled"])
        self.assertIsNone(result["dmarc"]["enabled"])

    def test_dmarc_timeout_is_partial(self):
        def behaviour(name):
            if name == "example.com":
                return _txt_answer("v=spf1 -all")
            if name.startswith("_dmarc"):
                return dns.resolver.LifetimeTimeout(timeout=5, errors=[])
            return dns.resolver.NXDOMAIN()

        result = self._lookup(behaviour)

        self.assertIs(result["spf"]["enabled"], True)
        self.assertIsNone(result["dmarc"]["enabled"])
        self.assertEqual(result["status"], "partial")


class RedirectCheckTests(unittest.TestCase):
    def _response(self, location=None):
        response = MagicMock()
        response.is_redirect = location is not None
        response.headers = {"location": location} if location else {}
        return response

    def test_redirect_to_private_address_is_refused(self):
        responses = [self._response("http://169.254.169.254/latest/meta-data/")]

        def public_only(host):
            if host == "169.254.169.254":
                raise ConnectionError("not public")
            return ["93.184.215.14"]

        with patch.object(http_client, "ensure_public_destination", side_effect=public_only), \
                patch.object(http_client.requests, "get", side_effect=responses):
            with self.assertRaises(ConnectionError):
                http_client.get_with_checked_redirects("https://example.com")

    def test_public_redirect_is_followed(self):
        final = self._response()
        responses = [self._response("/home"), final]

        with patch.object(http_client, "ensure_public_destination", return_value=["93.184.215.14"]), \
                patch.object(http_client.requests, "get", side_effect=responses) as get:
            response = http_client.get_with_checked_redirects("https://example.com")

        self.assertIs(response, final)
        self.assertEqual(get.call_args.args[0], "https://example.com/home")

    def test_redirect_loop_is_bounded(self):
        loop = [self._response("/again") for _ in range(http_client.MAX_REDIRECTS + 1)]

        with patch.object(http_client, "ensure_public_destination", return_value=["93.184.215.14"]), \
                patch.object(http_client.requests, "get", side_effect=loop):
            with self.assertRaises(requests.TooManyRedirects):
                http_client.get_with_checked_redirects("https://example.com")


class HttpFallbackTests(unittest.TestCase):
    def test_https_failure_falls_back_to_http(self):
        final = MagicMock(is_redirect=False)

        def get(url, **kwargs):
            if url.startswith("https://"):
                raise requests.exceptions.SSLError("handshake failed")
            return final

        with patch.object(http_client, "ensure_public_destination", return_value=["93.184.215.14"]), \
                patch.object(http_client.requests, "get", side_effect=get):
            result = http_client.fetch_http("example.com")

        self.assertEqual(result["requested_url"], "http://example.com")
        self.assertIs(result["response"], final)


class TlsDestinationTests(unittest.TestCase):
    def test_tls_refuses_domain_resolving_only_to_private_addresses(self):
        from modules import ssl_module
        from utils.scan_context import ScanContext

        context = ScanContext("internal.example")
        with patch("utils.scan_context.resolve_addresses", return_value={"127.0.0.1", "10.0.0.5"}), \
                patch.object(ssl_module.socket, "create_connection") as connect:
            result = ssl_module.ssl_lookup("internal.example", context=context)

        connect.assert_not_called()
        self.assertIn("public IP", result["error"])

    def test_tls_connects_to_validated_address_with_original_sni(self):
        from modules import ssl_module
        from utils.scan_context import ScanContext

        context = ScanContext("example.com")
        with patch("utils.scan_context.resolve_addresses", return_value={"2606:2800::1", "93.184.215.14"}), \
                patch.object(ssl_module.socket, "create_connection", side_effect=TimeoutError) as connect:
            ssl_module.ssl_lookup("example.com", context=context)

        self.assertEqual(connect.call_args.args[0], ("93.184.215.14", 443))


if __name__ == "__main__":
    unittest.main()
