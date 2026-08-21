import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

/* ─── Protocol card ─── */
function ProtocolCard({ title, badgeStatus, badgeVariant, children }) {
  const isOk = badgeVariant === 'signal'
  return (
    <div className="pl-4 border-l border-invert/[0.06] mb-6 last:mb-0">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isOk ? 'bg-signal' : badgeVariant === 'warning' ? 'bg-amber-400' : 'bg-alert/60'
          }`}
          aria-hidden="true"
        />
        <span className="font-body text-[13px] font-semibold text-ink/90 tracking-wide">
          {title}
        </span>
        <StatusBadge status={badgeStatus} variant={badgeVariant} />
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

    // Calculate count out of 3 checks (SPF, DMARC, DKIM)
    const spfConfigured = !!spf.enabled
    const dmarcConfigured = !!dmarc.enabled
    const dkimConfigured = dkim.supported === true

    const configuredCount = [spfConfigured, dmarcConfigured, dkimConfigured].filter(Boolean).length
    const meta = `${configuredCount}/3 configured`

    // Determine DKIM state, badge & variant
    let dkimBadge = 'NOT CONFIGURED'
    let dkimVariant = 'alert'

    if (dkim.supported === true) {
      dkimBadge = 'CONFIGURED'
      dkimVariant = 'signal'
    } else if (dkim.supported === 'Unknown') {
      dkimBadge = 'UNKNOWN'
      dkimVariant = 'warning'
    } else if (dkim.supported === false && dkim.record) {
      dkimBadge = 'INVALID RECORD'
      dkimVariant = 'warning'
    }

    return (
      <>
        <SectionHeader title="Email Security" meta={meta} />

        <div className="flex flex-col gap-2">
          {/* SPF */}
          <ProtocolCard
            title="SPF"
            badgeStatus={spf.enabled ? 'ENABLED' : 'NOT SET'}
            badgeVariant={spf.enabled ? 'signal' : 'alert'}
          >
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
          <ProtocolCard
            title="DMARC"
            badgeStatus={dmarc.enabled ? 'ENABLED' : 'NOT SET'}
            badgeVariant={dmarc.enabled ? 'signal' : 'alert'}
          >
            {dmarc.error ? (
              <p className="font-mono text-sm text-alert">{dmarc.error}</p>
            ) : (
              <>
                {dmarc.policy && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-body text-[10px] font-semibold tracking-[0.18em] text-muted/60 uppercase">
                      Policy
                    </span>
                    <StatusBadge
                      status={dmarc.policy.toUpperCase()}
                      variant={dmarc.policy === 'reject' ? 'signal' : 'warning'}
                    />
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
          <ProtocolCard
            title="DKIM"
            badgeStatus={dkimBadge}
            badgeVariant={dkimVariant}
          >
            {dkim.selector && (
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-body text-[10px] font-semibold tracking-[0.18em] text-muted/60 uppercase">
                  Selector
                </span>
                <span className="font-mono text-xs text-ink/80">{dkim.selector}</span>
              </div>
            )}
            {dkim.record ? (
              <CopyableValue value={dkim.record} className="text-[11px] text-muted/60 break-all block mb-2">
                {dkim.record}
              </CopyableValue>
            ) : null}
            {dkim.reason && (
              <p className="font-mono text-[11px] text-muted/50 leading-relaxed">
                {dkim.reason}
              </p>
            )}
            {!dkim.record && !dkim.reason && dkim.supported === false && (
              <p className="font-mono text-[11px] text-muted/40">No DKIM record detected.</p>
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
