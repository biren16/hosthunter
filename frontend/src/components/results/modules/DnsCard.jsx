import { Status } from "../../ui/Status";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";

function RecordList({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="results-evidence-group py-5">
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] tracking-micro uppercase text-stone-500">{title}</span>
        <span className="text-[11px] font-mono text-stone-500">{rows.length}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="font-mono text-[12px] leading-relaxed break-words text-ink dark:text-stone-100 pl-3 border-l-2 border-[#CDBA9E] dark:border-[#6B503D]">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DnsView({ dnsPayload, domainExists, error }) {
  if (error) return <ModuleShell kicker="DNS intelligence" title="Domain existence & records" desc="Authoritative record enumeration — routing, mail and delegation."><ModuleErrorNote error={error} /></ModuleShell>;
  const dns = dnsPayload;
  if (!dns) return <ModuleShell kicker="DNS intelligence" title="Domain existence & records" desc="Authoritative record enumeration — routing, mail and delegation."><EmptyNote desc="DNS data not returned for this scan." /></ModuleShell>;

  const existsLabel = domainExists ? "Detected" : domainExists === false ? "Not Detected" : "Unknown";
  const addressCount = (dns.A?.length || 0) + (dns.AAAA?.length || 0);
  const routeCount = (dns.NS?.length || 0) + (dns.MX?.length || 0) + (dns.TXT?.length || 0);

  return (
    <ModuleShell
      kicker="DNS intelligence"
      title="Domain existence & records"
      desc="Authoritative record enumeration — routing, mail and delegation."
      status={
        <>
          <Status label={existsLabel} />
          <span className="text-[13px] text-stone-600 dark:text-stone-400">{domainExists ? "Exists — resolvable" : domainExists === false ? "Not found in DNS" : "Could not confirm"}</span>
        </>
      }
      lead={
        <div className="results-observation results-observation--split results-observation--dns">
          <div><span className="results-observation__label">Primary observation</span><strong>{addressCount ? `${addressCount} address${addressCount === 1 ? "" : "es"} resolved` : "No address records returned"}</strong></div>
          <div><span className="results-observation__label">Supporting routing</span><p>{routeCount ? `${routeCount} nameserver, mail, or text record${routeCount === 1 ? "" : "s"} available to inspect.` : "No supporting routing or mail records returned."}</p></div>
        </div>
      }
    >

      {/* important: A/AAAA */}
      <div className="results-evidence-grid grid sm:grid-cols-2 gap-0">
        <div className="py-6 sm:pr-6">
          <div className="text-[11px] tracking-micro uppercase text-stone-500">Primary</div>
          <div className="mt-3 space-y-0">
            <RecordList title="A — IPv4" rows={dns.A} />
            <RecordList title="AAAA — IPv6" rows={dns.AAAA} />
            {!dns.A?.length && !dns.AAAA?.length && <div className="text-[13px] text-stone-500 py-4">No address records.</div>}
          </div>
        </div>
        <div className="py-6 sm:pl-6">
          <div className="text-[11px] tracking-micro uppercase text-stone-500">Authority & mail</div>
          <div className="mt-3">
            <RecordList title="NS" rows={dns.NS} />
            <RecordList title="MX" rows={dns.MX} />
            {!dns.NS?.length && !dns.MX?.length && <div className="text-[13px] text-stone-500 py-4">No NS/MX records.</div>}
          </div>
        </div>
      </div>

      {/* supporting: TXT */}
      <div className="results-dns-text-records py-6">
        <div className="text-[11px] tracking-micro uppercase text-stone-500">Text records</div>
        {dns.TXT?.length ? (
          <div className="mt-3 space-y-1.5">
            {dns.TXT.map((r, i) => (
              <div key={i} className="font-mono text-[12px] leading-relaxed break-words pl-3 border-l-2 border-[#CDBA9E] dark:border-[#6B503D]">
                {r}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-stone-500 mt-3">No TXT records.</div>
        )}
      </div>
    </ModuleShell>
  );
}

// compat
export const DnsCard = DnsView;
