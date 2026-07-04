import whois

def whois_lookup(domain):

    result = {}

    try:

        whois_data = whois.whois(domain)
        domain_name = whois_data["domain_name"]
        result["domain_name"] = domain_name[0] if isinstance(domain_name, list) else domain_name
        result["registrar"] = whois_data["registrar"]
        result["organization"] = whois_data["org"]
        result["country"] = whois_data["country"]

        result["creation_date"] = normalize_date(whois_data["creation_date"])
        result["updated_date"] = normalize_date(whois_data["updated_date"])
        result["expiration_date"] = normalize_date(whois_data["expiration_date"])

        result["name_servers"] = normalize_status(whois_data["name_servers"])
        result["status"] = normalize_status(whois_data["status"])
        result["dnssec"] = whois_data["dnssec"]

    except whois.parser.PywhoisError:
        result["error"] = "WHOIS lookup failed"
    except Exception as e:
        print(type(e))
        print(e)
        result["error"] = str(e)

    return result


def normalize_date(date_obj):

    if isinstance(date_obj, list):
        date_obj = date_obj[0]

    if date_obj is None:
        return None

    return (date_obj.date().isoformat())  # jus one val not a list maybe or maybe if list then list[0]

def normalize_status(status_list):
    result=[]

    if status_list is None:
        return result
    
    if isinstance (status_list,str):
        status_list=[status_list]

    for status in status_list:
        clean_status=status.split()[0]

        if clean_status not in result:
            result.append(clean_status)
    
    return result
