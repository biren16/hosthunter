import { EmptyNote, ModuleErrorNote } from "../../ui/Section";
import { ResultsModuleShell as ModuleShell } from "../ResultsModuleShell";
import { formatTechnologySignal } from "../../../lib/technologyDisplay";

function Group({ title, items }) {
  if (!items || items.length === 0) return (
    <div className="results-tech-row results-tech-row--unknown">
      <div className="results-evidence-label">{title}</div>
      <div className="text-[13px] text-stone-500">Not confirmed from returned headers or markup.</div>
    </div>
  );
  return (
    <div className="results-tech-row">
      <div className="results-evidence-label">{title}</div>
      <div className="mt-2 grid gap-2">
        {items.map((it, i) => {
          const signal = formatTechnologySignal(it);
          return (
            <span key={i} className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-[12px] text-ink dark:text-stone-100 break-words">{signal.value}{signal.version ? ` ${signal.version}` : ""}</span>
              <span className="text-[10px] font-sans font-medium tracking-[.08em] uppercase text-stone-500 shrink-0">{signal.source}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TechView({ data, error }) {
  if (error) return <ModuleShell kicker="Technology intelligence" title="Fingerprinted stack" desc="Signals returned from headers and page markup."><ModuleErrorNote error={error} /></ModuleShell>;
  if (!data || Object.keys(data).filter((k) => k !== "error").length === 0) return <ModuleShell kicker="Technology intelligence" title="Fingerprinted stack" desc="Signals returned from headers and page markup."><EmptyNote desc="Technology fingerprint unavailable for this host." /></ModuleShell>;

  const webServer = data.web_server || data.webServer;
  const edge = data.edge || data.cdn_platform || data.edge_platform;
  const backend = data.backend;
  const frontend = data.frontend;
  const cms = data.cms;
  const js = data.javascript_libraries || data.js_libraries || data.javascriptLibraries;

  const lists = {
    "Web Server": webServer ? [webServer] : [],
    "Edge Platform": edge ? [edge] : [],
    "Backend Framework": backend?.framework ? [backend.framework] : backend?.name ? [backend] : backend ? [backend] : [],
    "Frontend Frameworks": frontend?.frameworks || frontend || [],
    "JavaScript Libraries": js || [],
    "CMS": cms?.name ? [cms] : [],
  };
  const hasAny = Object.values(lists).some((a) => a.length > 0);
  if (!hasAny) return <ModuleShell kicker="Technology intelligence" title="Fingerprinted stack" desc="Signals returned from headers and page markup."><EmptyNote title="No fingerprints" desc="No technology signals detected via headers or HTML." /></ModuleShell>;

  const observed = Object.values(lists).flat().map((item) => formatTechnologySignal(item).value).filter(Boolean);

  return (
    <ModuleShell kicker="Technology intelligence" title="Fingerprinted stack" desc="Signals from headers and HTML — not a verdict."
      lead={<div className="results-observation"><span className="results-observation__label">Observed</span><strong>{observed[0] || "Technology signal returned"}</strong><p>{observed.length} technology signal{observed.length === 1 ? "" : "s"} inferred from observable headers or markup.</p></div>}
    >

      <div className="results-tech-index">
        <Group title="Web Server" items={lists["Web Server"]} />
        <Group title="Edge Platform" items={lists["Edge Platform"]} />
        <Group title="Backend Framework" items={lists["Backend Framework"]} />
        <Group title="Frontend Frameworks" items={lists["Frontend Frameworks"]} />
        <Group title="JavaScript Libraries" items={lists["JavaScript Libraries"]} />
        <Group title="CMS" items={lists["CMS"]} />
      </div>
    </ModuleShell>
  );
}
export const TechCard = TechView;
