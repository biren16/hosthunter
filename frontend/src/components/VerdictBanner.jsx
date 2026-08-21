const CDNS = ['cloudflare','akamai','fastly','amazon','aws','incapsula','sucuri','imperva','keycdn','jsdelivr','bunny','limelight','stackpath','edgecast','google']
const PRIVACY = ['redacted','privacy','protected','withheld','private','data protected','not disclosed','gdpr','contact privacy']

function detectCDN(result) {
  if (result.cdn?.detected && result.cdn?.provider) {
    return result.cdn.provider
  }
  if (!result.ip?.ips?.length) return null
  const orgs = result.ip.ips.map(i => i.organization?.toLowerCase() ?? '')
  const cdn = CDNS.find(c => orgs.some(o => o.includes(c)))
  return cdn ? result.ip.ips[0].organization : null
}

function detectPrivacy(whois) {
  if (!whois || whois.error) return false
  const hay = [whois.organization, whois.registrar].filter(Boolean).join(' ').toLowerCase()
  return PRIVACY.some(k => hay.includes(k))
}

export default function VerdictBanner({ result }) {
  if (!result) return null
  const { ssl, ip, whois, website, email_security, domainexists } = result

  if (domainexists === false) {
    return <Strip isAlert text={`${result.domain} — domain does not exist or could not be resolved`} />
  }

  const clauses = []
  let isAlert = false

  // 1. Routing / CDN
  const cdn = detectCDN(result)
  clauses.push(cdn ? `Fronted by ${cdn}` : ip?.ips?.length ? 'Direct routing' : null)

  // 2. SSL
  if (ssl && !ssl.error) {
    if (ssl.is_expired) {
      clauses.push('SSL expired')
      isAlert = true
    } else if (typeof ssl.days_until_expiry === 'number') {
      const d = ssl.days_until_expiry
      if (d < 14) {
        clauses.push(`SSL expiring in ${d}d`)
        isAlert = true
      } else {
        clauses.push(`SSL valid (${d}d)`)
      }
    } else {
      clauses.push('SSL valid')
    }
  } else if (ssl?.error) {
    clauses.push('No SSL')
  }

  // 3. Email Security
  if (email_security && !email_security.error) {
    const spf = !!email_security.spf?.enabled
    const dmarc = !!email_security.dmarc?.enabled
    const dkim = email_security.dkim?.supported === true
    const count = [spf, dmarc, dkim].filter(Boolean).length
    clauses.push(`Email sec: ${count}/3 configured`)
  }

  // 4. Security Headers
  if (website?.security_headers && !website.error) {
    const h = website.security_headers
    const total = Object.keys(h).length
    const present = Object.values(h).filter(v => v?.enabled).length
    clauses.push(`Headers: ${present}/${total} present`)
  }

  // 5. WHOIS Privacy
  if (whois && !whois.error) {
    clauses.push(detectPrivacy(whois) ? 'Privacy-shielded' : 'Registrant public')
  }

  const text = clauses.filter(Boolean).join('  ·  ') || 'Scan complete'
  return <Strip isAlert={isAlert} text={text} />
}

function Strip({ isAlert, text }) {
  return (
    <div
      className={`flex items-center gap-3.5 px-8 py-3.5 border-l-2 ${
        isAlert ? 'border-alert bg-alert/[0.03]' : 'border-signal bg-signal/[0.02]'
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAlert ? 'bg-alert' : 'bg-signal'}`}
        aria-hidden="true"
      />
      <p className="font-mono text-[13px] tracking-wide text-ink/90">
        {text}
      </p>
    </div>
  )
}
