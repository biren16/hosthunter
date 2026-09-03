import { Status } from "../../ui/Status";
import { Field, Copyable } from "../../ui/Copyable";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";

export function SslView({ data, error }) {
  if (error) return <ModuleShell kicker="TLS intelligence" title="Certificate validity" desc="Chain, issuer and expiry — shows the certificate state."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data || Object.keys(data).filter((k) => k !== "error").length === 0) return <ModuleShell kicker="TLS intelligence" title="Certificate validity" desc="Chain, issuer and expiry — shows the certificate state."><EmptyNote desc="No certificate retrieved — host may not serve TLS on 443." /></ModuleShell>;

  const days = data.days_until_expiry;
  const isExpired = data.is_expired;
  const subject = data.subject || {};
  const issuer = data.issuer || {};
  const expiryLabel = isExpired ? "Expired" : typeof days === "number" ? "Detected" : "Unknown";
  const validFrom = data.valid_from || data.not_before;
  const validUntil = data.valid_until || data.valid_to || data.not_after;

  // Large primary inside shell's children keeps header consistent; status in shell
  return (
    <ModuleShell
      kicker="TLS intelligence"
      title="Certificate validity"
      desc="Chain, issuer and expiry — shows the certificate state."
      status={<Status label={expiryLabel} />}
      lead={
        <div className="results-observation results-observation--certificate">
          <div><span className="results-observation__label">Primary observation</span><strong>{typeof days === "number" ? `${days} days until expiry` : "Validity interval unknown"}</strong></div>
          <p>{validFrom || validUntil ? `${validFrom || "Unknown start"} → ${validUntil || "Unknown end"}` : "No validity interval was returned."}</p>
        </div>
      }
    >
      {/* details */}
      <div className="grid sm:grid-cols-2 gap-x-8">
        <Field label="Subject CN" value={subject.common_name || subject.commonName || data.subject_cn} mono copy />
        <Field label="Subject Org" value={subject.organization_name || subject.organizationName || subject.o} />
        <Field label="Issuer Org" value={issuer.organization_name || issuer.organizationName || issuer.o || data.issuer} />
        <Field label="Issuer CN" value={issuer.common_name || issuer.commonName} mono />
        <Field label="Issuer Country" value={issuer.country_name || issuer.countryName} />
        <Field label="Valid From" value={validFrom} mono />
        <Field label="Valid To" value={validUntil} mono />
        <Field label="Public Key Alg" value={data.public_key_algorithm || data.public_key_alg} mono />
        <Field label="Key Size / Curve" value={[data.key_size, data.curve].filter(Boolean).join(" · ") || "—"} mono />
        <Field label="Signature Alg" value={data.signature_algorithm || data.signature_alg} mono />
      </div>

      {/* raw evidence */}
      <div className="mt-8 border-t hairline pt-6">
        <div className="text-[11px] tracking-micro uppercase text-stone-500">Fingerprints — raw evidence</div>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[11px] tracking-micro uppercase text-stone-500">SHA-256</div>
            <div className="mt-2 border hairline px-3 py-3 bg-stone-50 dark:bg-stone-800/20"><Copyable value={data.fingerprint_sha256 || data.sha256} mono /></div>
          </div>
          <div>
            <div className="text-[11px] tracking-micro uppercase text-stone-500">SHA-1</div>
            <div className="mt-2 border hairline px-3 py-3 bg-stone-50 dark:bg-stone-800/20"><Copyable value={data.fingerprint_sha1 || data.sha1} mono /></div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
export const SslCard = SslView;
