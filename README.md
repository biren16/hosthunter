# HostHunter

A domain reconnaissance and infrastructure analysis platform for cybersecurity professionals, investigators, and researchers.

**Live app:** https://hosthunter-recon.vercel.app

**API:** https://hosthunter.onrender.com

---

## What it does

HostHunter performs passive reconnaissance on any domain — pulling DNS records, WHOIS registration data, SSL certificate details, IP/network intelligence, website metadata & security headers, technology stack fingerprints, CDN detection, and email security configurations (SPF, DMARC, DKIM) into a single unified API response. No active exploitation, no intrusion — just intelligence gathering from public sources.

---

## Features

**DNS Analysis**
- A, AAAA, MX, NS, and TXT record enumeration
- Domain existence verification
- Nameserver identification
- TXT record verification & policy extraction

**WHOIS Intelligence**
- Registrar and registrant organization details
- Registrant country
- Registration, update, and expiration dates
- Domain status flags and DNSSEC status (signed/unsigned)

**SSL Certificate Analysis**
- Certificate subject and issuer details (common name, organization, country)
- Validity period and days until expiry
- Public key algorithm, key size, and curve
- SHA256 and SHA1 fingerprints
- Signature algorithm

**IP Intelligence**
- Resolves every A/AAAA record for a domain (IPv4 and IPv6)
- Geolocation (country, city, region, coordinates, timezone) per IP
- ASN and organization/ISP identification
- Reverse DNS lookups (PTR records)
- Routing scope identification (global vs. private)

**Website Analysis**
- HTTP status codes, scheme, final URL, and redirect tracking
- Page metadata extraction (title, description, language, charset, canonical URL, robots, generator, favicon)
- Security header analysis (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, COEP, CORP) with presence indicators and threat explanations

**Technology Fingerprinting**
- Web server identification and version extraction (e.g. Nginx, Apache, ATS, Cloudflare)
- Backend framework detection (via HTTP headers)
- Content Management System (CMS) detection and version parsing (e.g. WordPress, Drupal)
- Edge / CDN platform identification
- Frontend framework detection (React, Vue, Next.js, Angular)
- JavaScript library detection (jQuery, Bootstrap, Tailwind, Alpine.js, htmx)

**CDN Detection**
- Active matching against CDN IP ranges (e.g. Cloudflare) and headers
- Matched IP identification across resolved addresses
- CDNs vs. direct origin routing identification

**Email Security Analysis**
- **SPF**: Evaluation of published SPF TXT records (`v=spf1`)
- **DMARC**: Evaluation of DMARC records (`_dmarc.<domain>`) and enforcement policy extraction (`reject`, `quarantine`, `none`)
- **DKIM**: Active scanning across common DKIM selectors (`default`, `google`, `selector1`, `selector2`, `s1`, `s2`, `k1`), selector identification, public key validation (handling empty keys `p=`), and explicit fallback status when custom selectors are used (`Unknown`)

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Backend | Python 3, FastAPI, Pydantic |
| DNS | `dnspython` |
| WHOIS | `python-whois` |
| SSL | `ssl`, `cryptography` |
| IP Intelligence | `requests`, `ipaddress`, `socket`, ipinfo.io API |
| Web & Tech Scraping | `BeautifulSoup4`, `requests` |
| Frontend | React 18, Tailwind CSS, Vite |
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
│   ├── data/
│   │   ├── ips-v4.txt
│   │   └── ips-v6.txt
│   └── modules/
│       ├── dns_module.py
│       ├── whois_module.py
│       ├── ssl_module.py
│       ├── ip_module.py
│       ├── website_module.py
│       ├── technology_module.py
│       ├── cdn_module.py
│       └── email_security_module.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ScanInput.jsx
│   │   │   ├── VerdictBanner.jsx
│   │   │   ├── SweepLine.jsx
│   │   │   ├── sections/       # DNS, WHOIS, SSL, IP, Website, CDN, Tech, Email Security panels
│   │   │   └── ui/              # Shared UI primitives (StatusBadge, CopyableValue, KeyValueRow, StatusDot, etc.)
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

# Add your ipinfo token if required (optional)
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
    "TXT": ["v=spf1 include:_spf.google.com ~all"]
  },
  "whois": {
    "domain_name": "google.com",
    "registrar": "MarkMonitor Inc.",
    "organization": "Google LLC",
    "country": "US",
    "creation_date": "1997-09-15",
    "status": ["clientDeleteProhibited", "..."],
    "dnssec": "unsigned"
  },
  "ssl": {
    "subject": { "common_name": "*.google.com" },
    "issuer": { "organization_name": "Google Trust Services", "common_name": "WR2", "country_name": "US" },
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
        "version": 4,
        "is_global": true,
        "organization": "Google LLC",
        "asn": "AS15169",
        "country": "US",
        "city": "Mountain View",
        "reverse_dns": null
      }
    ]
  },
  "website": {
    "status_code": 200,
    "scheme": "https",
    "final_url": "https://www.google.com/",
    "security_headers": {
      "strict_transport_security": { "enabled": true, "value": "max-age=31536000", "description": "..." }
    }
  },
  "cdn": {
    "detected": false,
    "provider": null,
    "matched_ip": null,
    "resolved_ips": ["142.250.x.x"]
  },
  "technology": {
    "web_server": { "name": "gws", "version": null },
    "backend": { "framework": null },
    "cms": { "name": null },
    "frontend": { "frameworks": [] }
  },
  "email_security": {
    "spf": { "enabled": true, "record": "v=spf1 include:_spf.google.com ~all" },
    "dmarc": { "enabled": true, "policy": "reject", "record": "v=DMARC1; p=reject; ..." },
    "dkim": { "supported": "Unknown", "selector": null, "record": null, "reason": "No DKIM record found using common selectors; the domain may use a custom selector." }
  }
}
```

If any individual module fails (e.g. a WHOIS lookup times out), the response still returns whatever data succeeded, with an `errors` object indicating which module(s) failed and why — a single failed lookup never blocks the rest of the scan.

---

## Design

The frontend follows a "signal intelligence" visual direction rather than the typical dark-terminal/hacker aesthetic — no green-on-black, no decorative glitch effects. Verdict-first result presentation (a one-line synthesized summary before the raw data), monospace typography reserved specifically for data values, a restrained two-accent-color system (teal for verified/healthy states, coral for warnings, amber for pending/unknowns), and responsive mobile/desktop navigation are deliberate choices aimed at making the tool read as a serious engineering product.

---

## Roadmap

- [x] Phase 0 — Core reconnaissance modules (DNS, WHOIS, SSL)
- [x] Phase 1 — FastAPI backend with request validation
- [x] Phase 2 — IP intelligence and CDN-fronting detection
- [x] Phase 3 — Website metadata and security header analysis
- [x] Phase 4 — Technology fingerprinting (web servers, frameworks, CMS, JS libraries)
- [x] Phase 5 — Email security evaluation (SPF, DMARC, DKIM)
- [x] Phase 6 — React frontend with responsive desktop & mobile UX, deployed
- [ ] Phase 7 — MongoDB persistence and scan history
- [ ] Phase 8 — Port scanning, threat intelligence APIs, and risk scoring
- [ ] Phase 9 — Scan comparison and report export

---

## Author

**Biren Kumar**

Final Year B.E. Computer Science and Design

Sri Krishna College of Engineering and Technology