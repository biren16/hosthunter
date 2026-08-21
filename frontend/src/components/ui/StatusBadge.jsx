/**
 * StatusBadge — Standardized semantic badge component for HostHunter.
 * Variants:
 *  - 'signal' / 'success': Green/Teal (DETECTED, PRESENT, ENABLED, CONFIGURED, VALID)
 *  - 'alert'  / 'error': Red (MISSING, NOT SET, EXPIRED)
 *  - 'warning': Amber (EXPIRING SOON, UNKNOWN, INVALID)
 *  - 'muted'  / 'neutral': Gray (NOT DETECTED, NOT CONFIGURED)
 */
export default function StatusBadge({ status, variant, className = '' }) {
  let colorStyle = 'text-muted/60 border-invert/[0.08] bg-invert/[0.02]'

  const v = variant || (
    ['DETECTED', 'PRESENT', 'ENABLED', 'CONFIGURED', 'VALID', 'SIGNED'].includes(status) ? 'signal' :
    ['MISSING', 'NOT SET', 'EXPIRED', 'NOT CONFIGURED'].includes(status) ? 'alert' :
    ['EXPIRING SOON', 'UNKNOWN', 'INVALID', 'WARNING'].includes(status) ? 'warning' :
    'muted'
  )

  if (v === 'signal' || v === 'success') {
    colorStyle = 'text-signal border-signal/30 bg-signal/5'
  } else if (v === 'alert' || v === 'error') {
    colorStyle = 'text-alert border-alert/30 bg-alert/5'
  } else if (v === 'warning') {
    colorStyle = 'text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/5'
  } else if (v === 'muted' || v === 'neutral') {
    colorStyle = 'text-muted/60 border-invert/[0.08] bg-invert/[0.02]'
  }

  return (
    <span className={`inline-block font-mono text-[10px] font-medium tracking-widest uppercase border px-2 py-0.5 rounded-md ${colorStyle} ${className}`}>
      {status}
    </span>
  )
}
