import socket
import ssl
from datetime import datetime, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, ed448
def ssl_lookup(domain):

    context = ssl.create_default_context()
    result = {} 

    try:
        with socket.create_connection((domain, 443)) as sock:

            with context.wrap_socket(sock, server_hostname=domain) as ssl_sock:

                certificate = ssl_sock.getpeercert()

                if certificate is None:
                    result["error"] = "No certificate received"
                    return result

                binary_certificate = ssl_sock.getpeercert(binary_form=True)

                if binary_certificate is None:
                    result["error"] = "No binary certificate received"
                    return result
                
                x509_certificate = x509.load_der_x509_certificate(binary_certificate)

                public_key = x509_certificate.public_key()
                signature_algorithm = x509_certificate.signature_algorithm_oid._name or "Unknown"
                fingerprint_sha256 = x509_certificate.fingerprint(hashes.SHA256()).hex()
                fingerprint_sha1 = x509_certificate.fingerprint(hashes.SHA1()).hex()

                result["subject"] = normalize_certificate_info(certificate["subject"])
                result["issuer"] = normalize_certificate_info(certificate["issuer"])
                result["valid_from"] = certificate["notBefore"]

                # calculate days rem
                valid_until = str(certificate["notAfter"])
                result["valid_until"] = valid_until
                valid_until_date = datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                days_remaining = (
                    valid_until_date.replace(tzinfo=timezone.utc)-
                    datetime.now(timezone.utc)
                    ).days

                result["days_until_expiry"] = days_remaining
                result["is_expired"] = days_remaining < 0

                if isinstance(public_key,rsa.RSAPublicKey):
                    result["public_key_algorithm"] = "RSA"
                    result["key_size"] = public_key.key_size
                    result["curve"] = None

                elif isinstance(public_key,ec.EllipticCurvePublicKey):
                    result["public_key_algorithm"] = "EC"
                    result["key_size"] = public_key.key_size
                    result["curve"] = public_key.curve.name

                elif isinstance(public_key, ed25519.Ed25519PublicKey):
                    result["public_key_algorithm"] = "Ed25519"
                    result["key_size"] = 256
                    result["curve"] = None

                elif isinstance(public_key,ed448.Ed448PublicKey):
                    result["public_key_algorithm"] = "Ed448"
                    result["key_size"] = 448
                    result["curve"] = None

                else:

                    result["public_key_algorithm"] = type(public_key).__name__ 
                    result["key_size"] = getattr(public_key, "key_size" ,None)
                    result["curve"] = None

                result["signature_algorithm"] = signature_algorithm
                result["fingerprint_sha256"] = fingerprint_sha256
                result["fingerprint_sha1"] = fingerprint_sha1

    except ssl.SSLCertVerificationError:
        result["error"] = "Certificate verification failed"
    except socket.timeout:
        result["error"] = "Connection timed out"
    except ConnectionAbortedError:
        result["error"] = "Connection aborted"
    except ConnectionRefusedError:
        result["error"] = "Connection refused"
    except Exception as e:
        result["error"] = str(e)

    return result


def normalize_certificate_info(certificate_info):

    result = {}

    for rdn in certificate_info:
        for attribute_pair in rdn:

            key, value = attribute_pair

            if key == "commonName":
                key = "common_name"

            elif key == "organizationName":
                key = "organization_name"

            elif key == "countryName":
                key = "country_name"

            result[key] = value

    return result

# inputdom=input("Enter a domain: ")
# currprint=ssl_lookup(inputdom)
# print(currprint)
