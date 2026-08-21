import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

function fmtDate(val) {
  if (!val) return null
  if (typeof val === 'string') return val.split('T')[0]
  return String(val)
}

function formatCertEntity(entity) {
  if (!entity || typeof entity !== 'object') return null

  const cn = entity.common_name
  const org = entity.organization_name
  const country = entity.country_name

  const parts = []
  if (cn && org && cn !== org) {
    parts.push(`${org} (${cn})`)
  } else if (org) {
    parts.push(org)
  } else if (cn) {
    parts.push(cn)
  }

  if (country) {
    parts.push(`[${country}]`)
  }

  if (parts.length > 0) {
    return parts.join(' ')
  }

  // Fallback to any available property if snake_case fields are missing
  return Object.values(entity).filter(Boolean).join(', ') || null
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
    let badgeText = 'VALID'
    let badgeVariant = 'signal'

    if (ssl.is_expired) {
      badgeText = 'EXPIRED'
      badgeVariant = 'alert'
    } else if (typeof ssl.days_until_expiry === 'number') {
      const d = ssl.days_until_expiry
      if (d < 14) {
        badgeText = `EXPIRING SOON (${d}d)`
        badgeVariant = 'warning'
      } else {
        badgeText = `VALID (${d}d remaining)`
        badgeVariant = 'signal'
      }
    }

    const keyDisplay = ssl?.public_key_algorithm
      ? `${ssl.public_key_algorithm}${ssl.key_size ? `-${ssl.key_size}` : ''}${ssl.curve ? ` (${ssl.curve})` : ''}`
      : null

    const subjectDisplay = formatCertEntity(ssl.subject)
    const issuerDisplay = formatCertEntity(ssl.issuer)

    const meta = <StatusBadge status={badgeText} variant={badgeVariant} />

    return (
      <>
        <SectionHeader title="SSL / TLS" meta={meta} />
        <div>
          <KeyValueRow label="Subject"       value={subjectDisplay} />
          <KeyValueRow label="Issuer"        value={issuerDisplay} />
          <KeyValueRow label="Valid From"    value={fmtDate(ssl.valid_from)} />
          <KeyValueRow label="Valid Until"   value={fmtDate(ssl.valid_until)} />
          <KeyValueRow label="Key Details"   value={keyDisplay} />
          <KeyValueRow label="Signature"     value={ssl.signature_algorithm} />
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
