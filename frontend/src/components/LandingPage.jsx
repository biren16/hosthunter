/**
 * LandingPage.jsx — Single below-fold section shown in idle state.
 * Two-column layout: capabilities list + JSON preview.
 * No decorative elements beyond typography and spacing.
 */

const CAPABILITIES = [
  {
    id: 'dns',
    label: 'DNS Resolution',
    detail: 'A, AAAA, MX, NS, and TXT records. Maps routing, mail topology, and authoritative delegation.',
  },
  {
    id: 'whois',
    label: 'WHOIS Registry',
    detail: 'Registrar metadata, registrant details, and lifecycle dates. Flags privacy shields and expiration risk.',
  },
  {
    id: 'ssl',
    label: 'SSL / TLS Handshake',
    detail: 'Certificate chain, issuer, public key algorithm, and days-until-expiry. Surfaces vulnerable configurations.',
  },
  {
    id: 'ip',
    label: 'IP Intelligence',
    detail: 'ASN mapping, geolocation, and organization per IP. Identifies CDN fronting and direct routing.',
  },
]

const SAMPLE_JSON = `{
  "domain": "example.com",
  "domainexists": true,
  "dns": {
    "A": ["93.184.215.14"],
    "MX": ["0 ."]
  },
  "whois": {
    "registrar": "IANA",
    "creation_date": "1995-08-14T04:00:00Z",
    "days_until_expiry": 142
  },
  "ssl": {
    "issuer": { "CN": "DigiCert Global G2 TLS" },
    "days_until_expiry": 142,
    "is_expired": false
  },
  "ip": {
    "ips": [{
      "address": "93.184.215.14",
      "organization": "Edgecast",
      "asn": "AS15133"
    }]
  }
}`

export default function LandingPage() {
  return (
    <>
      {/* ── Single Capability Section ── */}
      <section className="pb-24 flex flex-col gap-16">
        {/* Row 1: Capabilities and Primary JSON */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left — capabilities */}
          <div className="flex flex-col gap-7 lg:w-1/2">
            <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-muted/50 uppercase">
              What it checks
            </span>
            {CAPABILITIES.map(({ id, label, detail }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <p className="font-body font-semibold text-[13px] text-ink/90 tracking-wide">{label}</p>
                <p className="font-body text-[13px] text-muted leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* Right — JSON preview 1 */}
          <div className="lg:w-1/2 w-full flex flex-col gap-3 pt-1">
            <span className="font-body text-[10px] font-semibold tracking-[0.15em] text-muted/40 uppercase pl-1">
              STANDARD SCAN
            </span>
            <div className="rounded-xl bg-surface border border-white/[0.05] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
                <span className="font-mono text-[10px] tracking-widest text-signal/60 uppercase bg-signal/8 px-2 py-0.5 rounded">
                  POST
                </span>
                <span className="font-mono text-[11px] text-muted/60">/scan</span>
                <span className="ml-auto font-mono text-[10px] text-muted/30">application/json</span>
              </div>
              <pre className="p-5 font-mono text-[11px] leading-relaxed text-muted/70 overflow-x-auto">
                {SAMPLE_JSON}
              </pre>
            </div>
          </div>
        </div>

        {/* Row 2: Architecture Statement */}
        <div className="w-full">
          <p className="font-display font-medium text-xl sm:text-2xl text-ink/85 max-w-3xl leading-snug">
            Four modules run concurrently against DNS, WHOIS, SSL, and IP-intelligence endpoints, normalized into a single structured response.
          </p>
        </div>

        {/* Row 3: Stack, Next, Philosophy, and Real Finding */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left — Stack & Next */}
          <div className="flex flex-col gap-12 lg:w-1/2">
            {/* Stack */}
            <div className="flex flex-col gap-6">
              <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-muted/50 uppercase">
                Stack
              </span>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {['FastAPI', 'Python', 'MongoDB', 'React', 'Tailwind'].map(tech => (
                  <span key={tech} className="font-body font-semibold text-[13px] text-ink/80 tracking-wide">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* What's Next */}
            <div className="flex flex-col gap-4">
              <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-muted/50 uppercase">
                What's Next
              </span>
              <ul className="flex flex-col gap-2">
                {[
                  'MongoDB persistence',
                  'Scan history',
                  'Proxy / VPN detection'
                ].map(item => (
                  <li key={item} className="font-body text-[13px] text-muted flex items-center gap-2">
                    <span className="text-signal/50 select-none" aria-hidden="true">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Prose Content */}
          <div className="lg:w-1/2 w-full flex flex-col gap-10">
            {/* Philosophy */}
            <div className="flex flex-col gap-4">
              <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-muted/50 uppercase">
                Philosophy
              </span>
              <p className="font-body text-[13px] text-muted leading-relaxed">
                Domain reconnaissance tools tend to either overwhelm with raw output or gate useful signal behind a paywall. HostHunter runs DNS, WHOIS, SSL, and IP intelligence checks concurrently and surfaces what matters—CDN fronting, certificate risk, ownership shielding—as one verdict, not four disconnected tabs.
              </p>
            </div>

            {/* Real finding */}
            <div className="flex flex-col gap-4">
              <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-muted/50 uppercase">
                In Practice
              </span>
              <p className="font-body text-[13px] text-muted leading-relaxed">
                A scan of <span className="font-mono text-[11.5px] text-ink/80 px-1 py-0.5 bg-white/[0.03] rounded border border-white/[0.05]">discord.com</span> reveals it is entirely fronted by a CDN. The response yields Cloudflare's infrastructure (ASN <span className="font-mono text-[11.5px] text-ink/80">AS13335</span>), with the true origin server remaining completely hidden from the public DNS and IP resolution layers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-display font-bold text-ink/80 tracking-[0.1em]" style={{ fontSize: '0.95rem' }}>
            HOSTHUNTER
          </span>
          <p className="font-body text-[12px] text-muted/50 max-w-xs">
            Open-source domain reconnaissance. Speed over noise.
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <span className="font-mono text-[11px] text-muted/30">
            © {new Date().getFullYear()}
          </span>
          <a
            href="https://github.com/biren16/hosthunter"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-muted/50 hover:text-ink transition-colors duration-150"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </>
  )
}
