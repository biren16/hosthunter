# HostHunter

A domain reconnaissance and infrastructure analysis platform for cybersecurity professionals, investigators, and researchers.

**Live app:** https://hosthunter-recon.vercel.app
**API:** https://hosthunter.onrender.com

---

## What it does

HostHunter performs passive reconnaissance on any domain — pulling DNS records, WHOIS registration data, SSL certificate details, and IP/network intelligence into a single unified API response. No active exploitation, no intrusion — just intelligence gathering from public sources.

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

**IP Intelligence**
- Resolves every A/AAAA record for a domain
- Geolocation (country, city, region, timezone) per IP
- ASN and organization/ISP identification
- Reverse DNS lookups
- CDN-fronting detection (flags when a domain's IPs all belong to one CDN provider, e.g. Cloudflare, rather than a direct origin)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, FastAPI |
| DNS | dnspython |
| WHOIS | python-whois |
| SSL | `ssl`, `cryptography` |
| IP Intelligence | `ipwhois`, ip-api.com |
| Frontend | React, Tailwind CSS, Vite |
| Backend hosting | Render |
| Frontend hosting | Vercel |
| Database | MongoDB (planned) |

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
│       ├── ssl_module.py
│       └── ip_module.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ScanInput.jsx
│   │   │   ├── VerdictBanner.jsx
│   │   │   ├── SweepLine.jsx
│   │   │   ├── sections/       # DNS, WHOIS, SSL, IP result panels
│   │   │   └── ui/              # shared components (CopyableValue, StatusDot, etc.)
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

---

## Getting Started (local development)

### Backend

```bash
git clone https://github.com/biren16/hosthunter
cd hosthunter/backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Add your ip-api / ipinfo token if required
echo "IPINFO_TOKEN=your_token_here" > .env

# Start the API server
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd hosthunter/frontend
npm install

# Point the frontend at your local backend
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

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
    "AAAA": ["2404:6800:..."],
    "MX": ["10 smtp.google.com."],
    "NS": ["ns1.google.com.", "..."],
    "TXT": ["..."]
  },
  "whois": {
    "registrar": "MarkMonitor Inc.",
    "creation_date": "1997-09-15",
    "status": ["clientDeleteProhibited", "..."],
    "dnssec": "unsigned"
  },
  "ssl": {
    "issuer": { "organization_name": "Google Trust Services" },
    "days_until_expiry": 73,
    "is_expired": false,
    "public_key_algorithm": "EC",
    "signature_algorithm": "ecdsa-with-SHA256",
    "fingerprint_sha256": "..."
  },
  "ip": {
    "ips": [
      {
        "address": "142.250.x.x",
        "organization": "Google LLC",
        "asn": "AS15169",
        "country": "US",
        "city": "Mountain View",
        "reverse_dns": null
      }
    ]
  }
}
```

If any individual module fails (e.g. a WHOIS lookup times out), the response still returns whatever data succeeded, with an `errors` object indicating which module(s) failed and why — a single failed lookup never blocks the rest of the scan.

---

## Design

The frontend follows a "signal intelligence" visual direction rather than the typical dark-terminal/hacker aesthetic — no green-on-black, no decorative glitch effects. Verdict-first result presentation (a one-line synthesized summary before the raw data), monospace typography reserved specifically for data values, and a restrained two-accent-color system (teal for verified/healthy states, coral for warnings) are deliberate choices aimed at making the tool read as a serious engineering product rather than a cybersecurity-tool pastiche.

---

## Roadmap

- [x] Phase 0 — Core reconnaissance modules (DNS, WHOIS, SSL)
- [x] Phase 1 — FastAPI backend with request validation
- [x] Phase 2 — IP intelligence and CDN-fronting detection
- [x] Phase 3 — React frontend, deployed
- [ ] Phase 4 — MongoDB persistence and scan history
- [ ] Phase 5 — Port scanning
- [ ] Phase 6 — Proxy/VPN/hosting detection, threat intelligence APIs and risk scoring
- [ ] Phase 7 — Scan comparison and report export

---

## Author

**Biren Kumar**
Final Year B.E. Computer Science and Design
Sri Krishna College of Engineering and Technology
