import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'

/* ─── Protocol status badge (SPF / DMARC) ─── */
function ProtocolBadge({ enabled }) {
  return (
    <span
      className={`font-mono text-[10px] tracking-widest uppercase border px-2 py-0.5 rounded-md ${
        enabled
          ? 'text-signal border-signal/30 bg-signal/5'
          : 'text-alert border-alert/30 bg-alert/5'
      }`}
    >
      {enabled ? 'ENABLED' : 'NOT SET'}
    </span>
  )
}

/* ─── Protocol card ─── */
function ProtocolCard({ title, enabled, children }) {
  return (
    <div className="pl-4 border-l border-invert/[0.06] mb-6 last:mb-0">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            enabled ? 'bg-signal' : 'bg-alert/60'
          }`}
          aria-hidden="true"
        />
        <span className="font-body text-[13px] font-semibold text-ink/90 tracking-wide">
          {title}
        </span>
        <ProtocolBadge enabled={enabled} />
      </div>
      <div className="pl-[18px]">{children}</div>
    </div>
  )
}

export default function EmailSecuritySection({ emailSecurity, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="Email Security" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (emailSecurity && !emailSecurity.error) {
    const spf = emailSecurity.spf || {}
    const dmarc = emailSecurity.dmarc || {}
    const dkim = emailSecurity.dkim || {}

    // Count enabled protocols for meta
    const protocols = [spf.enabled, dmarc.enabled].filter(Boolean).length
    const meta = `${protocols}/2 protocols enabled`

    return (
      <>
        <SectionHeader title="Email Security" meta={meta} />

        <div className="flex flex-col gap-2">
          {/* SPF */}
          <ProtocolCard title="SPF" enabled={!!spf.enabled}>
            {spf.error ? (
              <p className="font-mono text-sm text-alert">{spf.error}</p>
            ) : spf.record ? (
              <CopyableValue value={spf.record} className="text-[11px] text-muted/60 break-all">
                {spf.record}
              </CopyableValue>
            ) : (
              <p className="font-mono text-[11px] text-muted/40">No SPF record published.</p>
            )}
          </ProtocolCard>

          {/* DMARC */}
          <ProtocolCard title="DMARC" enabled={!!dmarc.enabled}>
            {dmarc.error ? (
              <p className="font-mono text-sm text-alert">{dmarc.error}</p>
            ) : (
              <>
                {dmarc.policy && (
                  <div className="mb-2">
                    <span className="font-body text-[10px] font-semibold tracking-[0.18em] text-muted/60 uppercase">
                      Policy
                    </span>
                    <span className="ml-3 font-mono text-sm text-ink/85">{dmarc.policy}</span>
                  </div>
                )}
                {dmarc.record ? (
                  <CopyableValue value={dmarc.record} className="text-[11px] text-muted/60 break-all">
                    {dmarc.record}
                  </CopyableValue>
                ) : (
                  <p className="font-mono text-[11px] text-muted/40">No DMARC record published.</p>
                )}
              </>
            )}
          </ProtocolCard>

          {/* DKIM */}
          <ProtocolCard title="DKIM" enabled={false}>
            <p className="font-mono text-[11px] text-muted/40 leading-relaxed">
              {dkim.reason || 'DKIM selectors cannot be determined automatically.'}
            </p>
            {dkim.supported && (
              <span className="font-mono text-[10px] text-muted/30 mt-1 block">
                Status: {dkim.supported}
              </span>
            )}
          </ProtocolCard>
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader title="Email Security" />
      <p className="font-mono text-sm text-muted/50">No email security data available.</p>
    </>
  )
}
