import ipaddress
import socket

def resolve_addresses(domain):
    addresses = socket.getaddrinfo(
        domain,
        None,
        proto=socket.IPPROTO_TCP,
    )

    return {
        result[4][0]
        for result in addresses
    }

def is_public_ip(ip):
    address = ipaddress.ip_address(ip)

    if address.version == 6 and address.ipv4_mapped:
        address = address.ipv4_mapped

    return (
        not address.is_private
        and not address.is_loopback
        and not address.is_link_local
        and not address.is_multicast
        and not address.is_reserved
        and not address.is_unspecified
    )

def ensure_public_destination(domain):
    try:
        addresses = resolve_addresses(domain)
    except socket.gaierror as e:
        raise ConnectionError(
            f"Unable to resolve '{domain}'."
        ) from e

    public_addresses = [
        ip
        for ip in addresses
        if is_public_ip(ip)
    ]

    if not public_addresses:
        raise ConnectionError(
            f"'{domain}' does not resolve to a public IP address."
        )

    return public_addresses