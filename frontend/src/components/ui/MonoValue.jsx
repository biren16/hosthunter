/* ─── Shared section header used by all four detail panels ─── */
export function SectionHeader({ title, meta }) {
  return (
    <div className="flex items-baseline gap-3 mb-7 pb-5 border-b border-white/[0.05]">
      <h2 className="font-display font-bold text-xl text-ink">{title}</h2>
      {meta && (
        <span className="font-mono text-xs text-muted/50 tracking-wide">{meta}</span>
      )}
    </div>
  )
}

/* ─── MonoValue passthrough ────────────────────────────────── */
export default function MonoValue({ children, className = '' }) {
  return (
    <span className={`font-mono text-sm text-ink/85 ${className}`}>
      {children}
    </span>
  )
}
