import { useState } from "react";
import { Status } from "../../ui/Status";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { filterSubdomainNames, formatSubdomainDate, getSubdomainStatusLabel } from "../../../lib/subdomainDisplay";

function statusDescription(data) {
  if (data.status === "complete") return "The provider query completed within the available collection limits.";
  if (data.status === "partial") return "Some certificate-observed names were returned, but collection did not finish.";
  if (data.status === "unavailable") return "No usable certificate-transparency evidence was returned.";
  return "The collection state was not confirmed.";
}

export function SubdomainView({ data, error }) {
  const [query, setQuery] = useState("");
  const names = Array.isArray(data?.names) ? data.names : [];
  const filteredNames = filterSubdomainNames(names, query);

  if (error && (!data || data.status === "unavailable")) {
    return <ModuleShell kicker="Subdomain intelligence" title="Certificate-observed names" desc="Names present in public certificate-transparency records."><ModuleErrorNote error={error} /></ModuleShell>;
  }
  if (!data) {
    return <ModuleShell kicker="Subdomain intelligence" title="Certificate-observed names" desc="Names present in public certificate-transparency records."><EmptyNote desc="Subdomain evidence was not returned." /></ModuleShell>;
  }

  const statusLabel = getSubdomainStatusLabel(data);

  return (
    <ModuleShell
      kicker="Subdomain intelligence"
      title="Certificate-observed names"
      desc="Hostnames found in public certificate-transparency records. These observations may be historical and do not confirm current reachability."
      status={<><Status label={statusLabel} /><span className="text-[13px] text-stone-600 dark:text-stone-400">{statusDescription(data)}</span></>}
      lead={<div className="results-observation results-observation--split"><div><span className="results-observation__label">Returned names</span><strong>{data.returned_count ?? names.length}</strong></div><div><span className="results-observation__label">Coverage</span><p>{data.coverage || "Unknown"}</p></div></div>}
    >
      {data.error && <div className="mt-6 border border-amber-300/70 bg-amber-50 px-3 py-3 text-[12px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{data.error} Earlier returned evidence remains visible.</div>}

      <div className="grid gap-4 pt-6 sm:grid-cols-3">
        <div><div className="results-evidence-label">Provider</div><div className="mt-2 text-[13px]">{data.source?.provider || "Unknown"}</div></div>
        <div><div className="results-evidence-label">Wildcard observations</div><div className="mt-2 font-mono text-[13px]">{data.wildcard_count ?? 0}</div></div>
        <div><div className="results-evidence-label">Apex observed</div><div className="mt-2 text-[13px]">{data.apex_observed === true ? "Yes" : data.apex_observed === false ? "No" : "Unknown"}</div></div>
      </div>

      <div className="mt-8 border-t hairline pt-6">
        <label className="results-evidence-label" htmlFor="subdomain-search">Filter returned names</label>
        <input id="subdomain-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hostname" className="mt-3 w-full border hairline bg-transparent px-3 py-2 font-mono text-[12px] text-ink outline-none placeholder:text-stone-400 focus:border-stone-500 dark:text-stone-100" />
      </div>

      <div className="mt-6">
        <div className="results-evidence-label">Certificate-observed hostnames · {filteredNames.length}</div>
        {filteredNames.length ? (
          <ul className="mt-3 divide-y hairline">
            {filteredNames.map((item) => (
              <li key={`${item.hostname}-${item.wildcard}`} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="break-all font-mono text-[13px] text-ink dark:text-stone-100">{item.hostname}</span>
                  {item.wildcard && <span className="text-[10px] uppercase tracking-[.08em] text-stone-500">Wildcard</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-stone-500">
                  <span>{item.issuance_count ?? 0} certificate observation{item.issuance_count === 1 ? "" : "s"}</span>
                  <span>Validity {formatSubdomainDate(item.earliest_not_before)} → {formatSubdomainDate(item.latest_not_after)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-stone-500">{names.length ? "No returned names match this filter." : "No descendant hostname was returned within the provider coverage for this query."}</p>
        )}
      </div>

      <div className="mt-8 border-t hairline pt-5 text-[12px] leading-relaxed text-stone-500">{data.limitation || "Certificate observations do not establish current DNS resolution or reachability."}</div>
    </ModuleShell>
  );
}

export const SubdomainCard = SubdomainView;
