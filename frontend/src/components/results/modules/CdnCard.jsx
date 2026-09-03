import { Status } from "../../ui/Status";
import { Copyable } from "../../ui/Copyable";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";

export function CdnView({ data, error }) {
  if (error) return <ModuleShell kicker="CDN intelligence" title="Edge vs origin" desc="Public signals associated with supported edge providers."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data) return <ModuleShell kicker="CDN intelligence" title="Edge vs origin" desc="Public signals associated with supported edge providers."><EmptyNote desc="CDN check unavailable." /></ModuleShell>;

  const detected = data.detected;
  const label = detected ? "Detected" : detected === false ? "Not Detected" : "Unknown";
  const statusText = detected === true
    ? `Detected — ${data.provider || "provider not identified"}`
    : detected === false
      ? "Not detected — no supported CDN match"
      : "Could not confirm CDN use from the returned signals";

  return (
    <ModuleShell kicker="CDN intelligence" title="Edge vs origin" desc="Whether public surface is fronted by a CDN." status={<><Status label={label} /><span className="text-[13px] text-stone-600 dark:text-stone-400">{statusText}</span></>}
      lead={<div className="results-observation"><span className="results-observation__label">Primary observation</span><strong>{detected === true ? data.provider || "Supported CDN match" : detected === false ? "No supported CDN match" : "CDN use not confirmed"}</strong><p>{detected === true ? "A supported provider signal was returned for inspection." : detected === false ? "The returned IP and header evidence did not match a supported provider." : "The returned signals were insufficient to confirm a supported provider."}</p></div>}
    >

      <div className="results-cdn-evidence pt-6">
        <div className="results-cdn-evidence__primary">
          <div className="results-evidence-label">Provider signal</div>
          <div className="text-[18px] font-medium tracking-[-.02em] mt-2">{data.provider || "Not identified"}</div>
          <p className="text-[12px] leading-relaxed text-stone-500 mt-1">A supported provider name is shown only when returned by the check.</p>
        </div>
        <div className="results-cdn-evidence__match">
          <div className="results-evidence-label">Matched address</div>
          <div className="mt-2"><Copyable value={data.matched_ip || data.matchedIp || "Unknown"} mono /></div>
        </div>
      </div>

      <div className="mt-6">
        <div className="results-evidence-label">Resolved addresses · {(data.resolved_ips || data.resolvedIps || []).length}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(data.resolved_ips || data.resolvedIps || []).length ? (data.resolved_ips || data.resolvedIps).map((ip, i) => (
            <span key={i} className="font-mono text-[11px] border hairline px-2.5 py-1 bg-stone-50 dark:bg-stone-800/20">{ip}</span>
          )) : <span className="text-stone-500 text-[13px]">Unknown</span>}
        </div>
      </div>
    </ModuleShell>
  );
}
export const CdnCard = CdnView;
