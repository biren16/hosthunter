import { useEffect, useRef, useState } from "react";
import { Overview } from "./Overview";
import { DnsView } from "./modules/DnsCard";
import { WhoisView } from "./modules/WhoisCard";
import { SslView } from "./modules/SslCard";
import { IpView } from "./modules/IpCard";
import { WebsiteView } from "./modules/WebsiteCard";
import { TechView } from "./modules/TechCard";
import { CdnView } from "./modules/CdnCard";
import { EmailView } from "./modules/EmailCard";
import { getModuleDirection } from "../../lib/moduleNavigation";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "dns", label: "DNS" },
  { id: "whois", label: "WHOIS" },
  { id: "tls", label: "SSL / TLS" },
  { id: "ip", label: "IP Intelligence" },
  { id: "website", label: "Website" },
  { id: "technology", label: "Technology" },
  { id: "cdn", label: "CDN" },
  { id: "email", label: "Email Security" },
];

const ERROR_KEYS = { tls: "ssl", email: "email_security" };

export function Workspace({ data, domain, onHome }) {
  const [active, setActive] = useState("overview");
  const [direction, setDirection] = useState("same");
  const headingRef = useRef(null);
  const errors = data.errors || {};

  const errorCount = Object.keys(errors).length;
  const activeIndex = NAV.findIndex((item) => item.id === active);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [active]);

  const navigateTo = (next) => {
    setDirection(getModuleDirection(active, next));
    setActive(next);
  };

  return (
    <div className="results-dossier mx-auto max-w-[1360px] px-6 sm:px-8 motion-safe:animate-[page-enter_0.55s_cubic-bezier(0.22,1,0.36,1)]">
      <div className="grid lg:grid-cols-[220px_minmax(0,920px)] gap-8 lg:gap-10 pt-6">
        <nav aria-label="Evidence chapters" className="results-rail lg:sticky lg:top-[72px] lg:h-[calc(100vh-88px)] -mx-6 px-6 lg:mx-0 lg:px-0">
          <div className="results-rail__identity">
            <span>Public investigation</span>
            <strong>{domain}</strong>
            <small>{data.domainexists ? "Domain exists" : data.domainexists === false ? "Not detected" : "Existence unknown"}</small>
            <em>{errorCount ? `${errorCount} source${errorCount > 1 ? "s" : ""} unavailable` : "Returned record"}</em>
          </div>
          <div className="results-rail__header"><span>Evidence index</span></div>
          <div className="module-nav relative flex lg:flex-col gap-1 overflow-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none">
            {NAV.map((n, index) => {
              const isActive = active === n.id;
              const hasError = errors[ERROR_KEYS[n.id] || n.id];
              return (
                <button
                  key={n.id}
                  onClick={() => navigateTo(n.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-controls="active-evidence-module"
                  className={`results-rail__item text-left shrink-0 whitespace-nowrap lg:whitespace-normal ${isActive ? "is-active" : ""}`}
                >
                  <span className="results-rail__number">{String(index).padStart(2, "0")}</span>
                  <span className="results-rail__label">{n.label}</span>
                  {hasError && <span className="results-rail__issue">unavailable</span>}
                </button>
              );
            })}
          </div>

          <div className="results-rail__note hidden lg:block">
            <div>Public evidence only</div>
            <span>Unavailable sources stay explicit.</span>
          </div>

          <button type="button" onClick={onHome} className="results-rail__back">
            ← Back to search
          </button>
        </nav>

        {/* main — only selected module */}
        <main ref={headingRef} tabIndex={-1} aria-label={`${NAV[activeIndex]?.label || "Evidence"} results`} className="min-w-0 w-full pb-12 focus:outline-none">
          <div id="active-evidence-module" key={active} data-direction={direction} role="region" aria-live="polite" aria-atomic="false" className="module-viewport w-full min-w-0">
            {active === "overview" && <Overview data={data} domain={domain} onNavigate={navigateTo} />}
            {active === "dns" && <DnsView dnsPayload={data.dns} domainExists={data.domainexists} error={errors.dns} />}
            {active === "whois" && <WhoisView data={data.whois || {}} error={errors.whois} />}
            {active === "tls" && <SslView data={data.ssl || {}} error={errors.ssl} />}
            {active === "ip" && <IpView data={data.ip || {}} error={errors.ip} />}
            {active === "website" && <WebsiteView data={data.website || {}} error={errors.website} />}
            {active === "technology" && <TechView data={data.technology || {}} error={errors.technology} />}
            {active === "cdn" && <CdnView data={data.cdn || {}} error={errors.cdn} />}
            {active === "email" && <EmailView data={data.email_security || data.emailSecurity || {}} error={errors.email_security} />}
          </div>

          {/* raw response — disclosure, not card */}
          <details className="results-raw mt-10">
            <summary>
              <span>Underlying evidence</span><span className="results-raw__route">Full normalized scan response · POST /scan</span>
              <span className="results-raw__toggle">Open raw record ↗</span>
            </summary>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </details>
        </main>
      </div>
    </div>
  );
}
