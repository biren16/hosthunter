import socket
import threading

from utils.http_client import fetch_http
from utils.network import is_public_ip, resolve_addresses


class ScanContext:
    """Per-scan state shared by collectors running in parallel.

    The domain is resolved once and the website is fetched once, so every
    collector sees the same addresses and Website/Technology read the same
    response instead of each repeating the work.
    """

    def __init__(self, domain):
        self.domain = domain
        self._lock = threading.Lock()
        self._resolution = None
        self._fetch = None

    def _memoized(self, attribute, producer):
        with self._lock:
            if getattr(self, attribute) is None:
                try:
                    setattr(self, attribute, ("ok", producer()))
                except Exception as exc:
                    setattr(self, attribute, ("error", exc))
            outcome, value = getattr(self, attribute)
        if outcome == "error":
            raise value
        return value

    def addresses(self):
        # Raises socket.gaierror when the domain does not resolve.
        return set(self._memoized("_resolution", lambda: resolve_addresses(self.domain)))

    def public_addresses(self):
        try:
            addresses = self.addresses()
        except socket.gaierror as e:
            raise ConnectionError(f"Unable to resolve '{self.domain}'.") from e

        # IPv4 first: many networks still lack working IPv6 routes.
        public = sorted(
            (ip for ip in addresses if is_public_ip(ip)),
            key=lambda ip: (":" in ip, ip),
        )
        if not public:
            raise ConnectionError(f"'{self.domain}' does not resolve to a public IP address.")
        return public

    def fetch(self):
        return self._memoized("_fetch", lambda: fetch_http(self.domain))
