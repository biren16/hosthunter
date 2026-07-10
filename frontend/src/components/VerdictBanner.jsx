const CDNS = ['cloudflare','akamai','fastly','amazon','aws','incapsula','sucuri','imperva','keycdn','jsdelivr','bunny','limelight','stackpath','edgecast','google']
const PRIVACY = ['redacted','privacy','protected','withheld','private','data protected','not disclosed','gdpr','contact privacy']

function detectCDN(ip) {
  if (!ip?.ips?.length) return null
  const orgs = ip.ips.map(i => i.organization?.toLowerCase() ?? '')
  const cdn = CDNS.find(c => orgs.some(o => o.includes(c)))
  return cdn ? ip.ips[0].organization : null
}

function detectPrivacy(whois) {
  if (!whois) return false
  const hay = [whois.organization, whois.registrar].filter(Boolean).join(' ').toLowerCase()
  return PRIVACY.some(k => hay.includes(k))
}

export default function VerdictBanner({ result }) {
  if (!result) return null
  const { ssl, ip, whois, domainexists } = result

  if (!domainexists) {
    return <Strip isAlert text={`${result.domain} — domain does not exist or could not be resolved`} />
  }

  const clauses = []
  let isAlert = false

  const cdn = detectCDN(ip)
  clauses.push(cdn ? `Fronted by ${cdn}` : ip?.ips?.length ? 'Direct routing' : null)

  if (ssl && !ssl.error) {
    if (ssl.is_expired) {
      clauses.push('SSL expired')
      isAlert = true
    } else if (typeof ssl.days_until_expiry === 'number') {
      const d = ssl.days_until_expiry
      if (d < 14) { clauses.push(`SSL expiring in ${d}d`); isAlert = true }
      else clauses.push(`SSL valid · ${d}d`)
    } else {
      clauses.push('SSL valid')
    }
  } else if (ssl?.error) {
    clauses.push('No SSL')
  }

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
