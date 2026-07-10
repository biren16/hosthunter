import { useState } from 'react'
import MonoValue from './MonoValue.jsx'

export default function CopyableValue({ value, children, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="relative group inline-flex items-center gap-2">
      <MonoValue className={className}>{children || value}</MonoValue>
      
      <button
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className={`opacity-0 group-hover:opacity-100 transition-all duration-200 focus:outline-none focus:opacity-100 -mt-0.5 ${
          copied ? 'text-signal' : 'text-muted hover:text-ink'
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {copied ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
