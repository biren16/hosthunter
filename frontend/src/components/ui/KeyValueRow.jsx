import MonoValue from './MonoValue.jsx'

export default function KeyValueRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  const isReactElement = typeof value === 'object' && value !== null && '$$typeof' in value
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-2.5">
      <span className="font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-muted/60 uppercase w-24 flex-shrink-0 sm:pt-px">
        {label}
      </span>
      <div className="min-w-0">
        {isReactElement ? value : (
          <MonoValue className="text-sm text-ink/85 break-words">{String(value)}</MonoValue>
        )}
      </div>
    </div>
  )
}
