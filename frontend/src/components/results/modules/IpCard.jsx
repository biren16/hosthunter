import { Status } from "../../ui/Status";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";

function IpRow({ ip }) {
  const scopeLabel = ip.is_global === true ? "Detected" : ip.is_global === false ? "Not Detected" : "Unknown";
  const scopeText = ip.is_global === true ? "Global" : ip.is_global === false ? "Private" : "Unknown";
  return (
    <div className="results-ip-record">
      <div className="results-ip-record__header flex flex-wrap items-baseline gap-3 px-4 py-3 bg-stone-50/40 dark:bg-stone-800/10">
        <span className="font-mono text-[14px] tracking-[-0.02em]">{ip.address}</span>
        <span className="text-[11px] tracking-micro uppercase text-stone-500">v{ip.version ?? "?"}</span>
        <span className="ml-auto flex items-center gap-2">
          <Status label={scopeLabel} />
          <span className="text-[11px] text-stone-500">{scopeText}</span>
        </span>
        {ip.asn && <span className="font-mono text-[11px] text-stone-500">{ip.asn}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0 px-4">
        {[
          ["Organization", ip.organization || ip.org || ip.isp],
          ["ASN", ip.asn],
          ["Country", ip.country],
          ["City", ip.city],
          ["Region", ip.region],
          ["Timezone", ip.timezone],
          ["Coordinates", ip.latitude && ip.longitude ? `${ip.latitude}, ${ip.longitude}` : ip.loc || "—"],
          ["Reverse DNS", ip.reverse_dns || ip.ptr || "—"],
        ].map(([label, val]) => (
          <div key={label} className="results-field py-3">
            <div className="text-[10.5px] tracking-micro uppercase text-stone-500">{label}</div>
            <div className="font-mono text-[12px] mt-1 break-all">{val || "—"}</div>
          </div>
        ))}
      </div>
      {ip.enrichment_error && <div className="results-ip-record__note px-4 py-3 text-[12px] leading-relaxed text-stone-600 dark:text-stone-400"><span className="font-medium">Enrichment unavailable:</span> {ip.enrichment_error}</div>}
    </div>
  );
}

export function IpView({ data, error }) {
  if (error) return <ModuleShell kicker="IP intelligence" title="Addresses & geolocation" desc="Resolved address evidence, ASN, geolocation and reverse DNS."><ModuleErrorNote error={error} /></ModuleShell>;
  const ips = data?.ips || data?.addresses || [];
  if (!Array.isArray(ips) || ips.length === 0) {
    if (data?.address) return <ModuleShell kicker="IP intelligence" title="Network identity" desc="Per-IP geolocation, ASN and reverse DNS."><IpRow ip={data} /></ModuleShell>;
    return <ModuleShell kicker="IP intelligence" title="Addresses & geolocation" desc="Resolved address evidence, ASN, geolocation and reverse DNS."><EmptyNote desc="No IPs resolved for this domain." /></ModuleShell>;
  }
  return (
    <ModuleShell kicker="IP intelligence" title="Addresses & geolocation" desc={`${ips.length} address${ips.length > 1 ? "es" : ""} resolved — geolocation, ASN and reverse DNS.`}
      lead={<div className="results-observation results-observation--ip"><span className="results-observation__label">Primary observation</span><strong>{ips.length} public address{ips.length === 1 ? "" : "es"} returned</strong><p>{ips[0]?.organization || ips[0]?.org || ips[0]?.isp || "Network organization was not returned"}{ips[0]?.asn ? ` · ${ips[0].asn}` : ""}</p></div>}
    >
      <div className="space-y-4">
        {ips.map((ip, i) => <IpRow key={i} ip={ip} />)}
      </div>
    </ModuleShell>
  );
}
export const IpCard = IpView;
