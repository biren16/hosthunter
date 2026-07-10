import { useState, useMemo } from 'react'
import VerdictBanner from './components/VerdictBanner.jsx'
import DnsSection    from './components/sections/DnsSection.jsx'
import WhoisSection  from './components/sections/WhoisSection.jsx'
import SslSection    from './components/sections/SslSection.jsx'
import IpSection     from './components/sections/IpSection.jsx'
import LandingPage   from './components/LandingPage.jsx'

/* ─── Status Dot ─────────────────────────────────────────────────────────── */
function StatusDot({ status }) {
  const base = 'w-1.5 h-1.5 rounded-full flex-shrink-0'
  if (status === 'loading')  return <span className={`${base} bg-muted dot-pulse`} aria-hidden="true" />
  if (status === 'resolved') return <span className={`${base} bg-signal`}           aria-hidden="true" />
  if (status === 'warning')  return <span className={`${base} bg-alert`}            aria-hidden="true" />
  if (status === 'error')    return <span className={`${base} bg-alert`}            aria-hidden="true" />
  return                            <span className={`${base} bg-muted/20`}         aria-hidden="true" />
}

/* ─── Scan sweep line ────────────────────────────────────────────────────── */
function ScanSweep({ visible }) {
  if (!visible) return null
  return (
    <div
      className="fixed inset-x-0 z-[200] pointer-events-none scan-sweep"
      aria-hidden="true"
      style={{
        top: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(62,214,196,0.45) 35%, rgba(62,214,196,0.65) 50%, rgba(62,214,196,0.45) 65%, transparent 100%)',
      }}
    />
  )
}

/* ─── Search input — shared between hero and navbar ──────────────────────── */
function SearchInput({ value, onChange, onSubmit, disabled, autoFocus, compact = false }) {
  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <div
        className={`search-wrap relative flex items-center bg-surface border border-white/[0.08] rounded-xl ${
          compact ? 'px-3.5 py-2' : 'px-5 py-3.5'
        }`}
      >
        {/* Search icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={compact ? 13 : 16}
          height={compact ? 13 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted/50 flex-shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="example.com"
          className={`flex-1 bg-transparent border-none outline-none font-mono text-ink placeholder:text-muted/25 disabled:opacity-40 ${
            compact ? 'text-sm mx-3' : 'text-base mx-4'
          }`}
          disabled={disabled}
          spellCheck="false"
          autoComplete="off"
          autoFocus={autoFocus}
          aria-label="Domain to scan"
        />

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={`flex-shrink-0 font-mono font-semibold text-bg bg-signal hover:bg-signal/85 active:bg-signal/75 disabled:opacity-25 disabled:cursor-not-allowed rounded-lg transition-all duration-150 ${
            compact ? 'px-3 py-1.5 text-[11px] tracking-wide' : 'px-5 py-2 text-sm tracking-wide'
          }`}
        >
          {disabled ? 'Scanning' : 'Scan'}
        </button>
      </div>
    </form>
  )
}

/* ─── Pending state (shown when tab is still loading) ────────────────────── */
function PendingState() {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-muted/40 dot-pulse" aria-hidden="true" />
      <span className="font-mono text-sm text-muted/50">Awaiting response...</span>
    </div>
  )
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [domain,    setDomain]    = useState('')
  const [phase,     setPhase]     = useState('idle') // idle | scanning | done | error
  const [result,    setResult]    = useState(null)
  const [errorMsg,  setErrorMsg]  = useState(null)
  const [activeTab, setActiveTab] = useState('dns')

  const isScanning  = phase === 'scanning'
  const isDone      = phase === 'done' && !!result
  const showResults = isScanning || isDone

  /* ── Scan handler ── */
  const handleScan = async (e) => {
    e.preventDefault()
    const target = domain.trim()
    if (!target) return

    setPhase('scanning')
    setErrorMsg(null)
    setResult(null)
    setActiveTab('dns')

    try {
      const res  = await fetch('/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ domain: target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Scan failed')
      setResult(data)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err.message)
      setPhase('error')
    }
  }

  /* ── Reset → idle ── */
  const handleReset = () => {
    setPhase('idle')
    setDomain('')
    setResult(null)
    setErrorMsg(null)
  }

  /* ── Per-section statuses ── */
  const status = (hasData, key) => {
    if (isScanning)               return 'loading'
    if (!result)                  return 'idle'
    if (result?.errors?.[key])    return 'error'
    if (hasData)                  return 'resolved'
    return 'idle'
  }

  const dnsStatus   = status(!!result?.dns,   'dns')
  const whoisStatus = status(!!result?.whois, 'whois')
  const ipStatus    = status(!!result?.ip,    'ip')
  let   sslStatus   = status(!!result?.ssl,   'ssl')
  if (isDone && result?.ssl && !result.ssl.error) {
    if (result.ssl.is_expired || result.ssl.days_until_expiry < 14) sslStatus = 'warning'
  }

  const errors = result?.errors ?? {}

  /* ── Sidebar subtexts ── */
  const dnsSubtext = useMemo(() => {
    if (!result?.dns) return null
    const n = Object.values(result.dns).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0)
    return `${n} records`
  }, [result?.dns])

  const whoisSubtext = useMemo(() => {
    if (!result?.whois) return null
    const { registrar, organization } = result.whois
    const hay = [organization, registrar].filter(Boolean).join(' ').toLowerCase()
    const priv = ['redacted','privacy','protected','withheld','private','gdpr'].some(k => hay.includes(k))
    if (priv) return 'Privacy-shielded'
    const r = registrar?.split(',')[0]?.split(' ').slice(0, 3).join(' ')
    return r || 'Registered'
  }, [result?.whois])

  const sslSubtext = useMemo(() => {
    if (!result?.ssl || result.ssl.error) return null
    if (result.ssl.is_expired) return 'Expired'
    const d = result.ssl.days_until_expiry
    return typeof d === 'number' ? `${d}d to expiry` : 'Valid'
  }, [result?.ssl])

  const ipSubtext = useMemo(() => {
    if (!result?.ip?.ips) return null
    const n = result.ip.ips.length
    return `${n} address${n !== 1 ? 'es' : ''}`
  }, [result?.ip])

  const tabs = [
    { id: 'dns',   label: 'DNS Resolution',  status: dnsStatus,   subtext: dnsSubtext },
    { id: 'whois', label: 'WHOIS Registry',  status: whoisStatus, subtext: whoisSubtext },
    { id: 'ssl',   label: 'SSL / TLS',       status: sslStatus,   subtext: sslSubtext },
    { id: 'ip',    label: 'IP Intelligence', status: ipStatus,    subtext: ipSubtext },
  ]

  return (
    <div className="app-bg noise relative min-h-dvh bg-bg overflow-x-hidden">
      <ScanSweep visible={isScanning} />

      {/* ── Persistent navbar ─────────────────────────────────────────────── */}
      <header
        className="nav-glass fixed top-0 inset-x-0 z-50 flex items-center gap-4 px-6 sm:px-8 h-14 border-b border-white/[0.05]"
        role="banner"
      >
        {/* Wordmark — always clickable, always resets to idle */}
        <button
          onClick={handleReset}
          className="wordmark-nav font-display font-bold text-ink hover:text-signal transition-colors duration-150 shrink-0"
          aria-label="Return to homepage"
        >
          HOSTHUNTER
        </button>

        {/* Compact search — only visible in results view */}
        {showResults && (
          <div className="flex-1 max-w-sm fade-up">
            <SearchInput
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onSubmit={handleScan}
              disabled={isScanning}
              compact
            />
          </div>
        )}
      </header>

      {/* ── Hero (idle + error state) ──────────────────────────────────────── */}
      {!showResults && (
        <main
          className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-6 pt-14"
          aria-label="Domain search"
        >
          <div className="w-full max-w-lg flex flex-col items-center gap-9 text-center">

            {/* Wordmark */}
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={handleReset}
                className="wordmark-hero font-display font-bold text-ink hover:text-signal transition-colors duration-150"
              >
                HOSTHUNTER
              </button>
              <p className="font-body text-muted text-base" style={{ letterSpacing: '0.015em' }}>
                Domain intelligence. One query.
              </p>
            </div>

            {/* Hero search input */}
            <div className="w-full">
              <SearchInput
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onSubmit={handleScan}
                disabled={isScanning}
                autoFocus
              />
              {phase === 'error' && (
                <p
                  className="mt-3 font-mono text-sm text-alert flex items-center gap-2 justify-center"
                  role="alert"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0" aria-hidden="true" />
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Capability pills */}
            <div className="flex items-center gap-2 flex-wrap justify-center" aria-hidden="true">
              {['DNS', 'WHOIS', 'SSL', 'IP Intelligence'].map(tag => (
                <span
                  key={tag}
                  className="font-mono text-[10px] text-muted/40 tracking-widest uppercase px-3 py-1 rounded-full border border-white/[0.05]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Below-fold capability section */}
          <div className="w-full max-w-4xl mt-28 text-left">
            <LandingPage />
          </div>
        </main>
      )}

      {/* ── Results view ──────────────────────────────────────────────────── */}
      {showResults && (
        <div className="relative z-10 flex h-dvh pt-14" role="main">

          {/* Sidebar */}
          <aside
            className="w-[200px] shrink-0 border-r border-white/[0.05] bg-surface flex flex-col overflow-y-auto"
            aria-label="Scan modules"
          >
            <span className="font-body text-[9px] font-semibold tracking-[0.22em] text-muted/35 uppercase px-5 pt-5 pb-2">
              Modules
            </span>

            <nav className="flex flex-col">
              {tabs.map((tab) => {
                const isActive  = activeTab === tab.id
                const isLoading = tab.status === 'loading'
                const isExpiring = tab.id === 'ssl' && result?.ssl?.days_until_expiry < 14

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isLoading && setActiveTab(tab.id)}
                    disabled={isLoading}
                    className={`
                      relative w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100
                      ${isActive   ? 'bg-white/[0.035]' : 'hover:bg-white/[0.018]'}
                      ${isLoading  ? 'cursor-default'   : 'cursor-pointer'}
                    `}
                    aria-selected={isActive}
                    role="tab"
                  >
                    {/* Active left-edge indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-0.5 bg-signal rounded-r"
                        aria-hidden="true"
                      />
                    )}

                    <StatusDot status={tab.status} />

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-body text-[13px] font-medium leading-tight ${
                          isActive ? 'text-ink' : 'text-muted/70'
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isLoading ? (
                        <span className="font-mono text-[10px] text-signal/60 tracking-wide mt-0.5">
                          Checking...
                        </span>
                      ) : tab.subtext ? (
                        <span
                          className={`font-mono text-[10px] truncate mt-0.5 ${
                            isExpiring ? 'text-alert/70' : 'text-muted/40'
                          }`}
                        >
                          {tab.subtext}
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content pane */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Verdict strip — at the top of the content pane */}
            {isDone && (
              <div className="fade-up border-b border-white/[0.04] shrink-0">
                <VerdictBanner result={result} />
              </div>
            )}

            {/* Active section */}
            <div key={activeTab} className="flex-1 px-8 sm:px-10 py-8 sm:py-10 fade-up">
              {activeTab === 'dns' && (
                dnsStatus === 'loading'
                  ? <PendingState />
                  : <DnsSection dns={result?.dns} error={errors.dns} />
              )}
              {activeTab === 'whois' && (
                whoisStatus === 'loading'
                  ? <PendingState />
                  : <WhoisSection whois={result?.whois} error={errors.whois} />
              )}
              {activeTab === 'ssl' && (
                sslStatus === 'loading'
                  ? <PendingState />
                  : <SslSection ssl={result?.ssl} error={errors.ssl} />
              )}
              {activeTab === 'ip' && (
                ipStatus === 'loading'
                  ? <PendingState />
                  : <IpSection ip={result?.ip} error={errors.ip} />
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
