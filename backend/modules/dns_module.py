import dns.resolver

def dns_lookup(domain):
    resolver=dns.resolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 5

    record_types = ["A", "AAAA", "MX", "NS", "TXT"]

    # dictionary
    result = {
        "domainexists": None,
        "dns": {}
        }

    dns_records = {}  # dict to return records

    for record_type in record_types:
        dns_records[record_type] = [] # initialize to append so we have empty list[] for evry record

    for index, record_type in enumerate(record_types):
        try:
            records = resolver.resolve(domain, record_type)
            result["domainexists"] = True  # even if one recordtype is found its true
            for record in records:
                dns_records[record_type].append(str(record)) # Store each DNS record as a string

        except dns.resolver.NoAnswer:
            # This record type doesn't exist for the domain
            pass

        except dns.resolver.NXDOMAIN:
            result["domainexists"] = False
            break

        except dns.resolver.LifetimeTimeout:
            result["error"] = "DNS lookup timed out"
            break

        except dns.resolver.NoNameservers:
            result["error"] = "No working nameservers found"
            break

        except Exception:
            result["error"] = "Unable to perform DNS lookup"
            break

    result["dns"] = dns_records  # append the ips dict to result dict

    # Record types after a failed lookup were never answered. Their empty
    # lists mean "unknown", not "no records", so say which ones they are.
    if "error" in result:
        result["unresolved_record_types"] = record_types[index:]
        answered = any(dns_records[record_type] for record_type in record_types)
        result["status"] = "partial" if answered else "unavailable"
    else:
        result["status"] = "complete"

    return result
