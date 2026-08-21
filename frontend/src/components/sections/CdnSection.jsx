import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'

export default function CdnSection({ cdn, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="CDN Detection" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (cdn && !cdn.error) {
    const badge = cdn.detected ? (
      <span className="font-mono text-[10px] tracking-widest border px-2 py-0.5 rounded-md text-signal border-signal/30 bg-signal/5">
        DETECTED
      </span>
    ) : (
      <span className="font-mono text-[10px] tracking-widest border px-2 py-0.5 rounded-md text-muted/50 border-invert/[0.08] bg-invert/[0.02]">
        NOT DETECTED
      </span>
    )

    return (
      <>
        <SectionHeader title="CDN Detection" meta={badge} />
        <div>
          <KeyValueRow label="Provider" value={cdn.provider || '—'} />
          <KeyValueRow label="Matched IP" value={
            cdn.matched_ip ? (
              <CopyableValue value={cdn.matched_ip} className="text-sm text-signal font-medium">
                {cdn.matched_ip}
              </CopyableValue>
            ) : '—'
          } />
        </div>

        {cdn.resolved_ips?.length > 0 && (
          <div className="mt-6">
            <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase block mb-3">
              Resolved Addresses
            </span>
            <div className="flex flex-col gap-1.5">
              {cdn.resolved_ips.map((ip, i) => (
                <CopyableValue key={i} value={ip} className="text-sm text-ink/85">
                  {ip}
                  {cdn.matched_ip && ip === cdn.matched_ip && (
                    <span className="ml-2 font-mono text-[10px] text-signal/60">← match</span>
                  )}
                </CopyableValue>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <SectionHeader title="CDN Detection" />
      <p className="font-mono text-sm text-muted/50">No CDN data available.</p>
    </>
  )
}
