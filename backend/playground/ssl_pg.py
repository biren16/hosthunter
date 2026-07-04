from cryptography import x509
from cryptography.hazmat.primitives import hashes
import socket
import ssl


def ssl_lookup(domain):

    context=ssl.create_default_context()

    with socket.create_connection((domain,443)) as sock :
        with context.wrap_socket(sock,server_hostname=domain) as ssl_sock:

            try:

                binary_certificate = ssl_sock.getpeercert(binary_form=True)
                # certificate = ssl_lock.getpeercert()

                x509_certificate = x509.load_der_x509_certificate(binary_certificate)
                # print(type(x509_certificate))
                # print(x509_certificate)

                public_key=x509_certificate.public_key()#returns obj
                # print(type(public_key))
                # print("\n")
                # print(dir(public_key))
                # print("\n")
                print("curve",public_key.curve)
                print("key size",public_key.key_size)

                signature_algo=x509_certificate.signature_algorithm_oid
                print(signature_algo)

                # Hash the entire certificate to create a unique identifier.
                # If the certificate data changes, the fingerprint also changes.
                fingerprint = x509_certificate.fingerprint(hashes.SHA256())
                print(fingerprint.hex())

            except Exception as e:
                print(type(e))
                print(e)


ssl_lookup("google.com")
