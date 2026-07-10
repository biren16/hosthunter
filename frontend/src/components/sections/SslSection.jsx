import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'

function fmt(val) {
  if (!val) return null
  if (typeof val === 'string') return val.split('T')[0]
  return String(val)
}

export default function SslSection({ ssl, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="SSL / TLS" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (ssl && !ssl.error) {
    let badgeText = null
    let badgeClass = 'text-signal border-signal/30 bg-signal/5'

    if (ssl.is_expired) {
      badgeText = 'EXPIRED'
      badgeClass = 'text-alert border-alert/30 bg-alert/5'
    } else if (typeof ssl.days_until_expiry === 'number') {
      const d = ssl.days_until_expiry
      badgeText = `${d}d remaining`
      if (d < 14) badgeClass = 'text-alert border-alert/30 bg-alert/5'
    }

    const keyDisplay = ssl?.public_key_algorithm
      ? `${ssl.public_key_algorithm}${ssl.key_size ? `-${ssl.key_size}` : ''}${ssl.curve ? ` (${ssl.curve})` : ''}`
      : null
    const subjectCN = ssl?.subject ? Object.values(ssl.subject)[0] ?? null : null
    const issuerCN = ssl?.issuer
      ? (ssl.issuer['commonName'] ?? ssl.issuer['organizationName'] ?? Object.values(ssl.issuer)[0] ?? null)
      : null

    const meta = badgeText ? (
      <span className={`font-mono text-[10px] tracking-widest border px-2 py-0.5 rounded-md ${badgeClass}`}>
        {badgeText}
      </span>
    ) : undefined

    return (
      <>
        <SectionHeader title="SSL / TLS" meta={meta} />
        <div>
          <KeyValueRow label="Subject"       value={subjectCN} />
          <KeyValueRow label="Issuer"        value={issuerCN} />
          <KeyValueRow label="Valid From"    value={fmt(ssl.valid_from)} />
          <KeyValueRow label="Valid Until"   value={fmt(ssl.valid_until)} />
          <KeyValueRow label="Key Algorithm" value={keyDisplay} />
          <KeyValueRow label="Sig Algorithm" value={ssl.signature_algorithm} />
          <KeyValueRow label="SHA-256"       value={
            ssl.fingerprint_sha256
              ? <CopyableValue value={ssl.fingerprint_sha256} className="break-all text-sm text-ink/85">{ssl.fingerprint_sha256}</CopyableValue>
              : null
          } />
          <KeyValueRow label="SHA-1"         value={
            ssl.fingerprint_sha1
              ? <CopyableValue value={ssl.fingerprint_sha1} className="break-all text-sm text-ink/85">{ssl.fingerprint_sha1}</CopyableValue>
              : null
          } />
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader title="SSL / TLS" />
      <p className="font-mono text-sm text-muted/50">No SSL data available.</p>
    </>
  )
}
