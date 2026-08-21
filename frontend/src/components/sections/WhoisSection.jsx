import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    return d.toISOString().replace('T', ' ').substring(0, 10)
  } catch (e) {
    return dateStr
  }
}

function calcAge(dateStr) {
  if (!dateStr) return null
  try {
    const years = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    return years >= 0 ? years : null
  } catch (e) {
    return null
  }
}

export default function WhoisSection({ whois, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="WHOIS Registry" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (whois) {
    const age = calcAge(whois.creation_date)
    const meta = age !== null ? `${age} year${age !== 1 ? 's' : ''} old` : undefined

    let dnssecBadge = null
    if (whois.dnssec !== undefined && whois.dnssec !== null) {
      const dnssecStr = String(whois.dnssec).toLowerCase()
      if (dnssecStr === 'true' || dnssecStr.includes('signed') || dnssecStr === 'active') {
        dnssecBadge = <StatusBadge status="SIGNED" variant="signal" />
      } else if (dnssecStr === 'false' || dnssecStr.includes('unsigned') || dnssecStr.includes('inactive')) {
        dnssecBadge = <StatusBadge status="UNSIGNED" variant="muted" />
      } else {
        dnssecBadge = <span className="font-mono text-xs text-ink/85">{String(whois.dnssec)}</span>
      }
    }

    return (
      <>
        <SectionHeader title="WHOIS Registry" meta={meta} />
        <div>
          <KeyValueRow label="Domain"     value={whois.domain_name} />
          <KeyValueRow label="Registrar"  value={whois.registrar} />
          <KeyValueRow label="Registrant" value={whois.organization} />
          <KeyValueRow label="Country"    value={whois.country} />
          <KeyValueRow label="Created"    value={formatDate(whois.creation_date)} />
          <KeyValueRow label="Expires"    value={formatDate(whois.expiration_date)} />
          <KeyValueRow label="Updated"    value={formatDate(whois.updated_date)} />
          <KeyValueRow label="DNSSEC"     value={dnssecBadge} />

          {/* Domain Statuses */}
          {whois.status?.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-2.5">
              <span className="font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-muted/60 uppercase w-24 flex-shrink-0 sm:pt-px">
                Status
              </span>
              <div className="flex flex-wrap gap-1.5 min-w-0">
                {whois.status.map((st, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] text-muted/70 px-2 py-0.5 rounded border border-invert/[0.06] bg-invert/[0.02]"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nameservers */}
          {whois.name_servers?.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-2.5">
              <span className="font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-muted/60 uppercase w-24 flex-shrink-0 sm:pt-px">
                Nameservers
              </span>
              <div className="flex flex-col gap-1.5">
                {whois.name_servers.map((ns, i) => (
                  <CopyableValue key={i} value={ns.toLowerCase()} className="text-sm text-ink/85">
                    {ns.toLowerCase()}
                  </CopyableValue>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader title="WHOIS Registry" />
      <p className="font-mono text-sm text-muted/50">No WHOIS data available.</p>
    </>
  )
}
