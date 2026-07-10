import { useState, useRef, useEffect } from 'react'

export default function ScanInput({ onScan, isScanning }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isScanning) return
    onScan(trimmed)
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">

      {/* ── Wordmark ── */}
      <div className="mb-10 text-center">
        <h1 className="font-display font-bold text-ink tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', letterSpacing: '-0.01em' }}>
          HOST<span className="text-signal">HUNTER</span>
        </h1>
        <p className="font-body text-muted text-xs tracking-[0.2em] uppercase mt-1.5">
          Reconnaissance for any domain, in seconds
        </p>
      </div>

      {/* ── Input form ── */}
      <form onSubmit={handleSubmit}>
        <div
          className={`
            flex items-center gap-0 bg-surface rounded-md overflow-hidden
            border transition-all duration-200
            ${focused
              ? 'border-signal/50 input-glow'
              : 'border-border hover:border-border/80'}
          `}
        >
          {/* Prompt glyph */}
          <span
            className="font-mono text-signal text-xl select-none pl-5 pr-3 flex-shrink-0"
            aria-hidden="true"
          >
            ›
          </span>

          {/* Input */}
          <input
            ref={inputRef}
            id="domain-input"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            placeholder="example.com"
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isScanning}
            className="
              flex-1 min-w-0 bg-transparent font-mono text-ink text-base
              py-4 outline-none border-none
              placeholder:text-muted/40
              disabled:opacity-50
            "
            aria-label="Domain to scan"
          />

          {/* Blinking cursor when focused + empty */}
          {focused && value === '' && (
            <span className="cursor-blink flex-shrink-0" aria-hidden="true" />
          )}

          {/* Scan button — stays inside the input row */}
          <button
            type="submit"
            id="scan-button"
            disabled={!value.trim() || isScanning}
            className="
              flex-shrink-0 m-1.5 px-5 py-2.5 rounded
              font-body font-semibold text-sm text-bg bg-signal
              transition-all duration-150
              hover:brightness-110 active:scale-[0.97]
              disabled:opacity-25 disabled:cursor-not-allowed
              focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2
            "
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                Scanning
              </span>
            ) : (
              'Scan domain'
            )}
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-center mt-3 font-body text-[11px] text-muted/50 select-none">
          Press <span className="font-mono text-muted/70">↵ Enter</span> to scan
        </p>
      </form>
    </div>
  )
}
