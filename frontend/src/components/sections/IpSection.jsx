import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import CopyableValue from '../ui/CopyableValue.jsx'

export default function IpSection({ ip, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="IP Intelligence" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (ip?.ips?.length) {
    const count = ip.ips.length
    const isSingle = count > 1 && ip.ips.every(e => e.organization === ip.ips[0].organization)
    const meta = `${count} address${count !== 1 ? 'es' : ''}${isSingle ? ' · Single provider' : ''}`

    return (
      <>
        <SectionHeader title="IP Intelligence" meta={meta} />
        <div className="flex flex-col gap-8">
          {ip.ips.map((entry, i) => {
            const locationParts = [entry.city, entry.region, entry.country].filter(Boolean)
            const location = locationParts.length ? locationParts.join(', ') : entry.location ?? null
            return (
              <div key={i} className="pl-4 border-l border-white/[0.06]">
                <div className="mb-3">
                  <CopyableValue value={entry.address ?? entry.ip} className="text-base text-signal font-medium">
                    {entry.address ?? entry.ip}
                  </CopyableValue>
                </div>
                <KeyValueRow label="Org"         value={entry.organization} />
                <KeyValueRow label="ASN"         value={entry.asn
                  ? <CopyableValue value={entry.asn}>{entry.asn}</CopyableValue>
                  : null
                } />
                <KeyValueRow label="Location"    value={location} />
                <KeyValueRow label="Reverse DNS" value={entry.reverse_dns} />
                <KeyValueRow label="Timezone"    value={entry.timezone} />
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader title="IP Intelligence" />
      <p className="font-mono text-sm text-muted/50">No IP data available.</p>
    </>
  )
}
