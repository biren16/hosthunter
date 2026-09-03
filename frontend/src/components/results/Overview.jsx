import { buildOverviewInsights } from "../../lib/overviewInsights";
import { ResultsModuleShell } from "./ResultsModuleShell";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "Unknown";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Unknown";
  if (typeof value === "object") return value.name || value.value || value.label || "Unknown";
  return String(value);
}

function RecordRow({ label, value, mono = false }) {
  return <div className="overview-record__row"><span>{label}</span><strong className={mono ? "font-mono" : ""}>{formatValue(value)}</strong></div>;
}

export function Overview({ data, onNavigate }) {
  const dns = data.dns || {};
  const whois = data.whois || {};
  const ssl = data.ssl || {};
  const ip = data.ip || {};
  const website = data.website || {};
  const tech = data.technology || {};
  const cdn = data.cdn || {};
  const insights = buildOverviewInsights(data);
  const dnsCount = ["A", "AAAA", "MX", "NS", "TXT"].reduce((total, key) => total + (Array.isArray(dns[key]) ? dns[key].length : 0), 0);
  const ipCount = ip.ips?.length || (ip.address ? 1 : 0);
  const technologyCount = [tech.web_server?.name, tech.edge?.name, tech.backend?.framework, tech.cms?.name, ...(tech.frontend?.frameworks || []), ...(tech.javascript_libraries || tech.javascriptLibraries || [])].filter(Boolean).length;

  return (
    <ResultsModuleShell kicker="Orientation · returned record" title="What did HostHunter observe?" desc="A concise reading of the returned record. Start with the observations, then open a chapter to inspect the source fields behind them.">
      <div className="overview-orientation">
        <section className="overview-observations" aria-labelledby="overview-observations-title">
          <div className="overview-section-label" id="overview-observations-title">Primary observations</div>
          <div className="overview-observations__list">
            {insights.map((insight, index) => (
              <article className="overview-observation" key={insight.title}>
                <span className="overview-observation__index">{String(index + 1).padStart(2, "0")}</span>
                <div className="overview-observation__content"><h3>{insight.title}</h3><p>{insight.detail}</p></div>
                {insight.focus && <button type="button" onClick={() => onNavigate(insight.focus)} className="overview-observation__action">{insight.focus === "email" ? "Email Security" : insight.focus === "tls" ? "SSL / TLS" : insight.focus.toUpperCase()} <span aria-hidden="true">↗</span></button>}
              </article>
            ))}
          </div>
        </section>

        <section className="overview-record" aria-labelledby="overview-record-title">
          <div className="overview-section-label" id="overview-record-title">Record summary</div>
          <div className="overview-record__grid">
            <RecordRow label="DNS records" value={dnsCount} mono />
            <RecordRow label="Resolved addresses" value={ipCount} mono />
            <RecordRow label="Registrar" value={whois.registrar} />
            <RecordRow label="HTTP status" value={website.status_code} mono />
            <RecordRow label="Technology signals" value={technologyCount} mono />
            <RecordRow label="CDN state" value={cdn.detected === true ? "Detected" : cdn.detected === false ? "No supported match" : "Unknown"} />
            {typeof ssl.days_until_expiry === "number" && <RecordRow label="TLS expiry" value={`${ssl.days_until_expiry} days`} mono />}
          </div>
        </section>
      </div>
    </ResultsModuleShell>
  );
}
