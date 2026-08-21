import { useState } from 'react'
import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'

function RecordGroup({ title, records, defaultCollapsed = false, copyable = true }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (!records || records.length === 0) return null

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase">
          {title} ({records.length})
        </span>
        {defaultCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="font-mono text-[10px] text-signal/70 hover:text-signal transition-colors"
          >
            {collapsed ? `Show all ${records.length}` : 'Collapse'}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-1.5 pl-0">
          {records.map((record, i) =>
            copyable ? (
              <CopyableValue key={i} value={record} className="text-sm text-ink/85 break-all">
                {record}
              </CopyableValue>
            ) : (
              <MonoValue key={i} className="text-sm text-ink/85 break-all">{record}</MonoValue>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function DnsSection({ dns, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="DNS Resolution" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (dns) {
    const count = Object.values(dns).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    const addresses = [...(dns.A || []), ...(dns.AAAA || [])]
    const mx = dns.MX || []
    const ns = dns.NS || []
    const txt = dns.TXT || []
    const knownKeys = ['A', 'AAAA', 'MX', 'NS', 'TXT']
    const others = Object.entries(dns)
      .filter(([k]) => !knownKeys.includes(k))
      .flatMap(([k, v]) => Array.isArray(v) ? v.map(val => `[${k}] ${val}`) : [])

    return (
      <>
        <SectionHeader title="DNS Resolution" meta={`${count} records`} />
        <RecordGroup title="Addresses (A / AAAA)" records={addresses} copyable />
        <RecordGroup title="Mail Routing (MX)" records={mx} copyable />
        <RecordGroup title="Name Servers (NS)" records={ns} copyable />
        <RecordGroup title="Verification & Policy (TXT)" records={txt} defaultCollapsed={txt.length > 6} copyable />
        <RecordGroup title="Other" records={others} copyable />
      </>
    )
  }

  return (
    <>
      <SectionHeader title="DNS Resolution" />
      <p className="font-mono text-sm text-muted/50">No DNS data available.</p>
    </>
  )
}
