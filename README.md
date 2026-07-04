# HostHunter

A domain reconnaissance and infrastructure analysis platform for cybersecurity professionals, investigators, and researchers.

---

## What it does

HostHunter performs passive reconnaissance on any domain — pulling DNS records, WHOIS registration data, and SSL certificate details into a single unified API response. No active exploitation, no intrusion — just intelligence gathering from public sources.

---

## Features

**DNS Analysis**
- A, AAAA, MX, NS, and TXT record enumeration
- Domain existence verification
- Nameserver identification

**WHOIS Intelligence**
- Registrar and organization details
- Registration, update, and expiration dates
- Domain status flags and DNSSEC info

**SSL Certificate Analysis**
- Certificate subject and issuer chain
- Validity period and days until expiry
- Public key algorithm, key size, and curve
- SHA256 and SHA1 fingerprints
- Signature algorithm

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, FastAPI |
| DNS | dnspython |
| WHOIS | python-whois |
| SSL | ssl, cryptography |
| Database | MongoDB (planned) |
| Frontend | React + Tailwind CSS (planned) |

---

## Project Structure

```
HostHunter/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   └── modules/
│       ├── dns_module.py
│       ├── whois_module.py
│       └── ssl_module.py
│
├── README.md
└── .gitignore
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/birenkumar/hosthunter
cd hosthunter/backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## API Usage

**POST** `/scan`

```json
{
  "domain": "google.com"
}
```

**Response**

```json
{
  "domain": "google.com",
  "domainexists": true,
  "dns": {
    "A": ["142.250.x.x"],
    "MX": ["smtp.google.com"],
    ...
  },
  "whois": {
    "registrar": "MarkMonitor Inc.",
    "creation_date": "1997-09-15",
    ...
  },
  "ssl": {
    "issuer": { "organization_name": "Google Trust Services" },
    "days_until_expiry": 73,
    "is_expired": false,
    "public_key_algorithm": "EC",
    "signature_algorithm": "ecdsa-with-SHA256",
    ...
  }
}
```

---

## Roadmap

- [x] Phase 0 — Core reconnaissance modules (DNS, WHOIS, SSL)
- [x] Phase 1 — FastAPI backend with request validation
- [ ] Phase 2 — IP intelligence and website analysis
- [ ] Phase 3 — Port scanning
- [ ] Phase 4 — MongoDB persistence and scan history
- [ ] Phase 5 — Threat intelligence APIs and risk scoring
- [ ] Phase 6 — React dashboard and report export

---

## Author

**Biren Kumar**  
Final Year B.E. Computer Science and Design  
Sri Krishna College of Engineering and Technology
