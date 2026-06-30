import whois

domain=input("Enter a domain: ")

result=whois.whois(domain)

print(result)
