export default function StatusDot({ status = 'idle' }) {
  const base = 'inline-block w-[7px] h-[7px] rounded-full flex-shrink-0'

  if (status === 'loading') return <span className={`${base} bg-muted dot-pulse`} aria-hidden="true" />
  if (status === 'resolved') return <span className={`${base} bg-signal`} aria-hidden="true" />
  if (status === 'error' || status === 'warning') return <span className={`${base} bg-alert`} aria-hidden="true" />
  return <span className={`${base} bg-muted/40`} aria-hidden="true" />
}
