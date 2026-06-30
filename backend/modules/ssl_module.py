import socket
import ssl
from datetime import datetime

def ssl_lookup(domain):

    context = ssl.create_default_context()
    result = {} 

    try:
        with socket.create_connection((domain, 443)) as sock:

            with context.wrap_socket(sock, server_hostname=domain) as ssl_sock:

                certificate = ssl_sock.getpeercert()

                certificate = ssl_sock.getpeercert()

                if certificate is None:
                    result["error"] = "No certificate received"
                    return result

                result["subject"] = normalize_certificate_info(certificate["subject"])
                result["issuer"] = normalize_certificate_info(certificate["issuer"])
                result["valid_from"] = certificate["notBefore"]
                # result["valid_until"] = certificate["notAfter"]

              # calculate days rem
                valid_until = str(certificate["notAfter"])
                result["valid_until"] = valid_until
              
                valid_until_date = datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                

                days_remaining = (valid_until_date - datetime.utcnow()).days

                result["days_until_expiry"] = days_remaining
                result["is_expired"] = days_remaining < 0

    except Exception as e:
        print(type(e))
        print(e)
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
