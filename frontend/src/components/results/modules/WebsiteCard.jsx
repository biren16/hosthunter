import { Status } from "../../ui/Status";
import { Field } from "../../ui/Copyable";
import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";

const HEADER_DEFS = [
  { key: "strict_transport_security", label: "Strict-Transport-Security" },
  { key: "content_security_policy", label: "Content-Security-Policy" },
  { key: "x_frame_options", label: "X-Frame-Options" },
  { key: "x_content_type_options", label: "X-Content-Type-Options" },
  { key: "referrer_policy", label: "Referrer-Policy" },
  { key: "permissions_policy", label: "Permissions-Policy" },
  { key: "cross_origin_opener_policy", label: "Cross-Origin-Opener-Policy" },
  { key: "cross_origin_embedder_policy", label: "Cross-Origin-Embedder-Policy" },
  { key: "cross_origin_resource_policy", label: "Cross-Origin-Resource-Policy" },
];

function normalizeHeaders(raw) {
  if (!raw) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k.toLowerCase().replace(/-/g, "_")] = v;
  return out;
}

export function WebsiteView({ data, error }) {
  if (error) return <ModuleShell kicker="Website intelligence" title="Metadata & security headers" desc="Page metadata, redirects and returned security headers."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data || Object.keys(data).filter((k) => k !== "error").length === 0) return <ModuleShell kicker="Website intelligence" title="Metadata & security headers" desc="Page metadata, redirects and returned security headers."><EmptyNote desc="Website fetch failed or host unreachable." /></ModuleShell>;

  const headers = normalizeHeaders(data.security_headers || data.headers);
  const metadata = data.metadata || {};
  const status = data.status_code ?? data.statusCode;

  return (
    <ModuleShell
      kicker="Website intelligence"
      title="Metadata & security headers"
      desc="The returned HTTP response, page metadata, redirects, and observable security headers."
      status={
        <>
          {status && <span className={`font-mono text-[12px] px-2 py-1 border hairline ${status >= 200 && status < 300 ? "bg-ink text-paper dark:bg-stone-100 dark:text-stone-900" : "bg-white dark:bg-stone-800"}`}>{status}</span>}
          <span className="text-[13px] text-stone-600 dark:text-stone-400">{data.final_url || data.finalUrl || data.requested_url || "—"}</span>
        </>
      }
      lead={<div className="results-observation"><span className="results-observation__label">Primary observation</span><strong>{status ? `HTTP ${status}` : "HTTP status unknown"}</strong><p>{data.final_url || data.finalUrl || data.requested_url || data.requestedUrl || "No final URL returned."}</p></div>}
    >

      <div className="results-evidence-layout results-evidence-layout--website">
        <div className="results-evidence-intro"><span className="results-evidence-label">Response identity</span><p>What the host returned and where the request settled.</p></div>
        <div className="grid sm:grid-cols-2 gap-x-8">
        <Field label="Requested URL" value={data.requested_url || data.requestedUrl} mono copy />
        <Field label="Final URL" value={data.final_url || data.finalUrl} mono copy />
        <Field label="Scheme" value={data.scheme} mono />
        <Field label="Status" value={status} mono />
        <Field label="Page Title" value={metadata.title || data.title} />
        <Field label="Language" value={metadata.language || metadata.lang || data.language || data.lang} />
        <Field label="Charset" value={metadata.charset || data.charset} mono />
        <Field label="Canonical URL" value={metadata.canonical_url || metadata.canonical || data.canonical_url || data.canonical} mono copy />
        <Field label="Robots" value={metadata.robots || data.robots} mono />
        <Field label="Generator" value={metadata.generator || data.generator} />
        <Field label="Favicon" value={metadata.favicon || data.favicon} mono copy />
        </div>
      </div>

      {metadata.meta_description || metadata.description || data.meta_description || data.description ? (
        <div className="mt-6 border-t hairline pt-6">
          <div className="text-[11px] tracking-micro uppercase text-stone-500">Meta Description</div>
          <div className="text-[13px] leading-relaxed mt-2">{metadata.meta_description || metadata.description || data.meta_description || data.description}</div>
        </div>
      ) : null}

      <div className="results-header-observations mt-8 pt-6">
        <div className="flex items-baseline justify-between">
          <div className="results-evidence-label">Returned security headers</div>
          <div className="text-[11px] text-stone-500">Unknown is not Insecure</div>
        </div>

        <div className="results-header-list mt-4">
          {HEADER_DEFS.map((def) => {
            const h = headers[def.key];
            let enabled = null, value = "", desc = "";
            if (h && typeof h === "object" && "enabled" in h) { enabled = h.enabled; value = h.value || ""; desc = h.description || ""; }
            else if (typeof h === "string") { enabled = h.length > 0; value = h; }
            else if (typeof h === "boolean") enabled = h;

            let label = "Unknown";
            if (enabled === true) label = "Enabled";
            else if (enabled === false) label = "Not Detected";

            return (
              <div key={def.key} className="results-header-row">
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-[12px] font-medium text-ink dark:text-stone-100">{def.label}</div>
                  {value ? <div className="font-mono text-[11px] leading-relaxed break-words text-stone-600 dark:text-stone-400 mt-1">{value}</div> : <div className="text-[12px] text-stone-500 mt-1">No value returned.</div>}
                  {desc && <div className="text-[11px] leading-relaxed text-stone-500 mt-1">{desc}</div>}
                </div>
                <div className="shrink-0"><Status label={label} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </ModuleShell>
  );
}
export const WebsiteCard = WebsiteView;
