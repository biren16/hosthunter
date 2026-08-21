import { useState } from 'react'
import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

/* ─── Security header row with enabled/disabled indicator ─── */
function HeaderRow({ name, header }) {
  const [expanded, setExpanded] = useState(false)

  if (!header) return null

  const displayName = name
    .replace(/_/g, '-')
    .replace(/\b\w/g, c => c.toUpperCase())

  const isLong = header.value && header.value.length > 80

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-invert/[0.03] last:border-0">
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            header.enabled ? 'bg-signal' : 'bg-alert/60'
          }`}
          aria-hidden="true"
        />
        <span className="font-body text-[13px] font-medium text-ink/90 flex-1 min-w-0">
          {displayName}
        </span>
        <StatusBadge
          status={header.enabled ? 'PRESENT' : 'MISSING'}
          variant={header.enabled ? 'signal' : 'alert'}
        />
      </div>

      {header.enabled && header.value && (
        <div className="pl-[18px]">
          {isLong && !expanded ? (
            <div className="flex items-start gap-2">
              <MonoValue className="text-[11px] text-muted/60 break-all line-clamp-1">
                {header.value}
              </MonoValue>
              <button
                onClick={() => setExpanded(true)}
                className="font-mono text-[10px] text-signal/70 hover:text-signal transition-colors flex-shrink-0"
              >
                Expand
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <CopyableValue value={header.value} className="text-[11px] text-muted/60 break-all">
                {header.value}
              </CopyableValue>
              {isLong && (
                <button
                  onClick={() => setExpanded(false)}
                  className="font-mono text-[10px] text-signal/70 hover:text-signal transition-colors flex-shrink-0"
                >
                  Collapse
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {header.description && (
        <p className="pl-[18px] font-body text-[11px] text-muted/40 leading-relaxed">
          {header.description}
        </p>
      )}
    </div>
  )
}

export default function WebsiteSection({ website, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="Website" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (website && !website.error) {
    const meta = website.metadata || {}
    const headers = website.security_headers || {}
    const headerEntries = Object.entries(headers)
    const enabledCount = headerEntries.filter(([, h]) => h?.enabled).length
    const totalCount = headerEntries.length

    const metaText = totalCount > 0 ? `${enabledCount}/${totalCount} headers present` : null

    const redirected =
      website.requested_url &&
      website.final_url &&
      website.requested_url !== website.final_url

    const hasMetadata = Object.values(meta).some(Boolean)

    return (
      <>
        <SectionHeader title="Website" meta={metaText} />

        {/* URL + status info */}
        <div className="mb-6">
          <KeyValueRow label="Status" value={
            website.status_code ? (
              <span className="font-mono text-sm flex items-center gap-2">
                <StatusBadge
                  status={`${website.status_code}`}
                  variant={website.status_code < 400 ? 'signal' : 'alert'}
                />
                <span className="text-muted/50 text-xs">{website.scheme?.toUpperCase()}</span>
              </span>
            ) : null
          } />
          <KeyValueRow label="URL" value={
            website.final_url ? (
              <CopyableValue value={website.final_url} className="text-sm text-ink/85 break-all">
                {website.final_url}
              </CopyableValue>
            ) : null
          } />
          {redirected && (
            <KeyValueRow label="Redirected" value={
              <span className="font-mono text-[11px] text-muted/50">
                from {website.requested_url}
              </span>
            } />
          )}
        </div>

        {/* Metadata */}
        {hasMetadata && (
          <div className="mb-8">
            <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase block mb-3">
              Page Metadata
            </span>
            <KeyValueRow label="Title"       value={meta.title} />
            <KeyValueRow label="Description" value={meta.description} />
            <KeyValueRow label="Language"    value={meta.language} />
            <KeyValueRow label="Charset"     value={meta.charset} />
            <KeyValueRow label="Canonical"   value={meta.canonical ? (
              <CopyableValue value={meta.canonical} className="text-sm text-ink/85 break-all">
                {meta.canonical}
              </CopyableValue>
            ) : null} />
            <KeyValueRow label="Robots"      value={meta.robots} />
            <KeyValueRow label="Generator"   value={meta.generator} />
            <KeyValueRow label="Favicon"     value={meta.favicon ? (
              <CopyableValue value={meta.favicon} className="text-sm text-ink/85 break-all">
                {meta.favicon}
              </CopyableValue>
            ) : null} />
          </div>
        )}

        {/* Security Headers */}
        {totalCount > 0 && (
          <div>
            <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase block mb-3">
              Security Headers
            </span>
            <div className="flex flex-col">
              {headerEntries.map(([key, header]) => (
                <HeaderRow key={key} name={key} header={header} />
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <SectionHeader title="Website" />
      <p className="font-mono text-sm text-muted/50">No website data available.</p>
    </>
  )
}
