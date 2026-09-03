import { AnalysisBanner } from "./AnalysisBanner";
import { DnsCard } from "./modules/DnsCard";
import { WhoisCard } from "./modules/WhoisCard";
import { SslCard } from "./modules/SslCard";
import { IpCard } from "./modules/IpCard";
import { WebsiteCard } from "./modules/WebsiteCard";
import { TechCard } from "./modules/TechCard";
import { CdnCard } from "./modules/CdnCard";
import { EmailCard } from "./modules/EmailCard";

export function Dashboard({ data, domain }) {
  const errors = data.errors || {};
  const whois = data.whois || {};
  const ssl = data.ssl || {};
  const ip = data.ip || {};
  const website = data.website || {};
  const tech = data.technology || {};
  const cdn = data.cdn || {};
  const email = data.email_security || data.emailSecurity || {};

  // summary stats
  const dnsCount = ["A","AAAA","MX","NS","TXT"].reduce((acc,k)=>acc + (Array.isArray(data.dns?.[k]) ? data.dns[k].length : 0), 0);
  const ipCount = ip.ips?.length || (ip.address ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-10">
      {/* domain header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">{domain}</h2>
            <span className={`h-2 w-2 rounded-full ${data.domainexists ? "bg-emerald-500" : data.domainexists===false ? "bg-slate-400" : "bg-amber-400"}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{data.domainexists ? "Domain exists" : data.domainexists===false ? "Domain not found" : "Existence unknown"}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full border border-slate-200 dark:border-[#243045] bg-white dark:bg-[#111827] font-mono text-slate-600 dark:text-slate-300">{dnsCount} DNS records</span>
            <span className="px-2 py-1 rounded-full border border-slate-200 dark:border-[#243045] bg-white dark:bg-[#111827] font-mono text-slate-600 dark:text-slate-300">{ipCount} IPs</span>
            {whois.registrar && <span className="px-2 py-1 rounded-full border border-slate-200 dark:border-[#243045] bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300">{String(whois.registrar).slice(0,28)}</span>}
            {Object.keys(errors).length>0 && <span className="px-2 py-1 rounded-full bg-amber-500 text-white font-medium">{Object.keys(errors).length} signal source{Object.keys(errors).length>1?"s":""} unavailable</span>}
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
          <div>Scanned just now</div>
          <div className="font-mono text-[11px]">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Analysis & Insights placeholder — future proof */}
      <div className="mt-6">
        <AnalysisBanner domain={domain} />
      </div>

      {Object.keys(errors).length>0 && (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Some signal sources were unavailable. Returned evidence remains visible below.</div>
          <div className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1 font-mono break-words">{Object.entries(errors).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div>
        </div>
      )}

      {/* BENTO GRID */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Row 1: DNS (7) + WHOIS (5) */}
        <div className="lg:col-span-7"><DnsCard dnsPayload={data.dns} domainExists={data.domainexists} error={errors.dns} /></div>
        <div className="lg:col-span-5"><WhoisCard data={whois} error={errors.whois} /></div>

        {/* Row 2: SSL (5) + IP (7) */}
        <div className="lg:col-span-5"><SslCard data={ssl} error={errors.ssl} /></div>
        <div className="lg:col-span-7"><IpCard data={ip} error={errors.ip} /></div>

        {/* Row 3: Website full width but bento style - span 12, internal 2 cols for headers */}
        <div className="lg:col-span-12"><WebsiteCard data={website} error={errors.website} /></div>

        {/* Row 4: Tech (6) + CDN (6) */}
        <div className="lg:col-span-6"><TechCard data={tech} error={errors.technology} /></div>
        <div className="lg:col-span-6"><CdnCard data={cdn} error={errors.cdn} /></div>

        {/* Row 5: Email full */}
        <div className="lg:col-span-12"><EmailCard data={email} error={errors.email_security} /></div>
      </div>

      {/* raw JSON disclosure */}
      <details className="mt-6 rounded-2xl border border-slate-200 dark:border-[#1F2A44] bg-white dark:bg-[#111827] overflow-hidden">
        <summary className="px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
          <span>Raw API response (debug)</span>
          <span className="text-[11px] font-mono text-slate-400">POST /scan</span>
        </summary>
        <div className="border-t border-slate-200 dark:border-[#1F2A44] bg-slate-50 dark:bg-[#0B0F19] p-4 overflow-auto max-h-[420px]">
          <pre className="font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}
