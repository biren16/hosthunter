import { Status } from "../../ui/Status";
import { Copyable } from "../../ui/Copyable";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";

function Block({ title, enabled, policy, record, reason, selector }) {
  let label = "Unknown";
  if (enabled === true) label = "Enabled";
  else if (enabled === false) label = "Not Detected";
  else if (typeof enabled === "string") label = enabled;

  return (
    <div className="results-evidence-group pt-6 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-sans text-[18px] font-semibold leading-[1.15] tracking-[-.025em]">{title}</h3>
        <Status label={label} />
      </div>

      {policy && <div className="text-[13px] mt-2"><span className="text-stone-500">Policy</span> <span className="font-mono ml-2">{policy}</span></div>}
      {selector && <div className="text-[13px] mt-1"><span className="text-stone-500">Selector</span> <span className="font-mono ml-2">{selector}</span></div>}
      {reason && <div className="mt-3 text-[12px] leading-relaxed border hairline px-3 py-2 bg-[#FFFBF0] dark:bg-signal/10">{reason}</div>}

      {record ? (
        <div className="mt-3 border hairline bg-stone-50 dark:bg-stone-800/20 px-3 py-3">
          <div className="text-[11px] tracking-micro uppercase text-stone-500">Raw record</div>
          <div className="mt-2"><Copyable value={record} mono /></div>
        </div>
      ) : !reason ? (
        <div className="text-[13px] text-stone-500 mt-3">No record published.</div>
      ) : null}
    </div>
  );
}

export function EmailView({ data, error }) {
  if (error) return <ModuleShell kicker="Email security" title="SPF · DMARC · DKIM" desc="Returned publication state for common email-authentication records."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data) return <ModuleShell kicker="Email security" title="SPF · DMARC · DKIM" desc="Returned publication state for common email-authentication records."><EmptyNote desc="Email security data unavailable." /></ModuleShell>;

  const spf = data.spf || {};
  const dmarc = data.dmarc || {};
  const dkim = data.dkim || {};
  const dkimLabel = dkim.supported || (dkim.enabled === true ? "Detected" : dkim.enabled === false ? "Not Detected" : "Unknown");

  return (
    <ModuleShell kicker="Email security" title="SPF · DMARC · DKIM" desc="Raw publication state. Unknown for DKIM means could not confirm via common selectors — not “Insecure”."
      lead={<div className="results-observation results-observation--split results-observation--email"><div><span className="results-observation__label">Policy snapshot</span><strong>{[spf.enabled === true ? "SPF" : null, dmarc.enabled === true ? "DMARC" : null, dkim.enabled === true ? "DKIM" : null].filter(Boolean).join(" · ") || "No confirmed policies"}</strong></div><div><span className="results-observation__label">Interpretation</span><p>Each policy is reported independently; an unknown DKIM result is not evidence of absence.</p></div></div>}
    >

      <div className="space-y-8 pt-6">
        <Block title="SPF" enabled={spf.enabled} record={spf.record} reason={spf.reason} />
        <Block title="DMARC" enabled={dmarc.enabled} policy={dmarc.policy} record={dmarc.record} reason={dmarc.reason} />
        <Block title="DKIM" enabled={dkimLabel} record={dkim.record} reason={dkim.reason} selector={dkim.selector} />
      </div>
    </ModuleShell>
  );
}
export const EmailCard = EmailView;
