import { Status } from "../../ui/Status";
import { Field } from "../../ui/Copyable";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";

function fmt(v) {
  if (v === null || v === undefined || v === "") return "Unknown";
  if (Array.isArray(v)) return v.length ? v.map((item) => fmt(item)).join(", ") : "Unknown";
  if (typeof v === "object") return v.name || v.value || v.label || "Unknown";
  return String(v);
}

export function WhoisView({ data, error }) {
  if (error) return <ModuleShell kicker="WHOIS intelligence" title="Registration & delegation" desc="Registrar, registrant and lifecycle details returned for this domain."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data || Object.keys(data).filter((k) => k !== "error").length === 0) return <ModuleShell kicker="WHOIS intelligence" title="Registration & delegation" desc="Registrar, registrant and lifecycle details returned for this domain."><EmptyNote desc="WHOIS unavailable — rate limit or privacy redaction." /></ModuleShell>;

  const dnssecRaw = data.dnssec ? String(data.dnssec).toLowerCase() : "";
  const dnssecLabel = !data.dnssec ? "Unknown" : dnssecRaw.includes("signed") ? "Configured" : dnssecRaw.includes("unsigned") ? "Not Detected" : "Informational";

  return (
    <ModuleShell
      kicker="WHOIS intelligence"
      title="Registration & delegation"
      desc="Registrar, registrant and lifecycle details returned for this domain."
      status={
        <>
          <Status label={dnssecLabel} />
          <span className="text-[13px] text-stone-600 dark:text-stone-400">DNSSEC · {fmt(data.dnssec)}</span>
        </>
      }
      lead={
        <div className="results-observation">
          <span className="results-observation__label">Primary observation</span>
          <strong>{fmt(data.registrar)}</strong>
          <p>Registrar information is available alongside the domain’s registration lifecycle and delegation fields.</p>
        </div>
      }
    >

      <div className="grid sm:grid-cols-2 gap-x-8">
        <Field label="Domain Name" value={fmt(data.domain_name)} mono copy />
        <Field label="Registrar" value={fmt(data.registrar)} />
        <Field label="Organization" value={fmt(data.organization)} />
        <Field label="Registrant Country" value={fmt(data.country)} />
        <Field label="Creation Date" value={fmt(data.creation_date)} mono />
        <Field label="Updated Date" value={fmt(data.updated_date || data.update_date)} mono />
        <Field label="Expiration Date" value={fmt(data.expiration_date || data.expiry_date)} mono />
        <Field label="DNSSEC" value={fmt(data.dnssec)} hint={dnssecLabel} />
      </div>

      <div className="mt-2 pt-2">
        <Field label="Domain Status" value={fmt(data.status)} />
        <Field label="Name Servers" value={fmt(data.name_servers || data.name_servers_list)} mono />
      </div>
    </ModuleShell>
  );
}
export const WhoisCard = WhoisView;
