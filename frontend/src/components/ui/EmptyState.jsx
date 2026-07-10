/**
 * EmptyState — renders context-appropriate empty / error copy.
 *
 * variant: 'idle' | 'error' | 'network' | 'validation'
 * domain: string (used in error messages)
 */
export default function EmptyState({ variant = 'idle', domain = '', message = '' }) {
  if (variant === 'idle') {
    return (
      <p className="font-body text-muted text-sm text-center mt-10 select-none">
        Enter a domain to begin.
      </p>
    )
  }

  if (variant === 'validation') {
    return (
      <div className="mt-10 text-center">
        <p className="font-body text-alert text-sm">
          {message || `"${domain}" is not a valid domain. Check the spelling and try again.`}
        </p>
      </div>
    )
  }

  if (variant === 'network') {
    return (
      <div className="mt-10 text-center">
        <p className="font-body text-alert text-sm">
          Network error — the backend may not be running.
        </p>
        <p className="font-body text-muted text-xs mt-1">
          Start the backend with: <span className="font-mono text-ink">uvicorn main:app --reload</span>
        </p>
      </div>
    )
  }

  // Generic error (non-200, unresolved domain)
  return (
    <div className="mt-10 text-center">
      <p className="font-body text-alert text-sm">
        {domain
          ? `Couldn't resolve ${domain}. Check the spelling and try again.`
          : 'Scan failed. Check the domain and try again.'}
      </p>
    </div>
  )
}
