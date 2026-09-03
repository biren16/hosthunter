# HostHunter

HostHunter is an open-source passive reconnaissance tool for turning a
domain’s publicly observable footprint into one inspectable investigation.
It gathers evidence across independent intelligence modules and presents the
returned record with partial results and uncertainty kept explicit.

**Live application:** https://hosthunter-recon.vercel.app  
**Hosted API:** https://hosthunter.onrender.com

## What HostHunter reads

Each investigation requests eight independent sources of public domain
intelligence:

1. **DNS** — A, AAAA, MX, NS, and TXT records, delegation, and mail topology.
2. **WHOIS** — Registrar, lifecycle dates, nameservers, DNSSEC state, and
   available registration metadata.
3. **SSL / TLS** — Certificate identity, issuer, validity, public-key details,
   signatures, and fingerprints.
4. **IP intelligence** — Resolved addresses, ASN, organization, geolocation,
   IP version, and reverse DNS.
5. **Website** — HTTP status, redirects, metadata, final URL, and returned
   security headers.
6. **Technology** — Observable server, framework, CMS, frontend, and platform
   signals inferred from headers and markup.
7. **CDN** — Resolved-address and provider signals for known CDN infrastructure.
8. **Email security** — Published SPF and DMARC records, plus DKIM discovery
   through supported common selectors.

HostHunter does not exploit, intrude on, or actively probe a target. A failed
lookup does not erase successful module results; unavailable, unknown, and
not-detected states remain distinct from confirmed absence.

## How it works

The application follows a simple flow:

1. Enter a domain in the landing-page investigation control.
2. The backend validates and normalizes the domain.
3. The eight modules collect their available public evidence independently.
4. The frontend presents the normalized response, module details, provenance,
   and any module-level errors.

The frontend never changes the backend response schema to fit presentation
examples. Technical values remain available alongside plain-language context.

## Repository layout

```text
HostHunter/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── data/                  # CDN/IP range data
│   ├── modules/               # Eight passive intelligence modules
│   └── utils/                 # Shared network helpers
├── frontend/                  # Current React application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   ├── scanning/
│   │   │   ├── results/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/            # Theme state and persistence
│   │   └── lib/                # API, validation, navigation, and semantics
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── frontend-legacy/            # Earlier frontend, retained for reference
├── DESIGN_SYSTEM.md
├── PRODUCT.md
├── UI_PATTERNS.md
└── README.md
```

## Local development

### 1. Start the API

```bash
git clone https://github.com/biren16/hosthunter.git
cd hosthunter/backend

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optional: enables IP metadata enrichment where configured
printf 'IPINFO_TOKEN=your_token_here\n' > .env

uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000` and exposes interactive documentation
at `http://127.0.0.1:8000/docs`.

### 2. Start the current frontend

In a second terminal:

```bash
cd hosthunter/frontend
npm install
npm run dev
```

The Vite development server runs on port `5175`. By default, the frontend
calls `http://127.0.0.1:8000`; set `VITE_API_URL` in `frontend/.env.local` to
use another API endpoint:

```bash
VITE_API_URL=http://127.0.0.1:8000
```

## API

### `POST /scan`

Request:

```json
{
  "domain": "google.com"
}
```

The response contains the normalized domain, `domainexists`, and results for
`dns`, `whois`, `ssl`, `ip`, `website`, `technology`, `cdn`, and
`email_security`. When one or more modules fail, an `errors` object identifies
those module-level failures while successful results remain in the response.

Example shape:

```json
{
  "domain": "google.com",
  "domainexists": true,
  "dns": {},
  "whois": {},
  "ssl": {},
  "ip": {},
  "website": {},
  "technology": {},
  "cdn": {},
  "email_security": {},
  "errors": {}
}
```

Individual module fields vary with the evidence returned by the source. The
backend is the source of truth for the response contract.

## Development checks

Run these from `frontend/` before opening a change:

```bash
npm run lint
npm run build
```

Backend changes should preserve the API contract, partial-result behavior,
and explicit uncertainty semantics. Frontend changes should follow
`DESIGN_SYSTEM.md` and keep animation independent from the data lifecycle.

## Design principles

HostHunter uses an editorial, evidence-first interface rather than a
terminal-style or cyberpunk visual language:

- serif typography for major narrative moments;
- sans-serif typography for interface hierarchy and explanation;
- monospace typography for returned technical evidence;
- restrained warm ivory, black, copper, and brass accents;
- clear distinctions between returned, unavailable, unknown, and not-detected
  states;
- responsive layouts and reduced-motion support.

The product is designed to help users inspect public infrastructure without
turning incomplete evidence into unsupported conclusions.

## License

See the repository for the current license and project terms.
