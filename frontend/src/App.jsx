import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navbar, Footer } from "./components/layout/Navbar";
import { HeroSearch } from "./components/landing/HeroSearch";
import { ScanningState } from "./components/scanning/ScanningState";
import { Workspace } from "./components/results/Workspace";
import { scanDomain } from "./lib/api";
import { formatScanError } from "./lib/overviewInsights";

export default function App() {
  const [phase, setPhase] = useState("landing"); // landing | scanning | results
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastDomain, setLastDomain] = useState("");
  const requestIdRef = useRef(0);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    if (phase === "results" || (phase === "landing" && error)) {
      const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      resetScroll();
      const frame = requestAnimationFrame(resetScroll);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [error, phase]);

  useEffect(() => {
    if (!import.meta.env.DEV || phase !== "results" || !result) return;
    performance.mark("hosthunter:T3-state-committed");
    requestAnimationFrame(() => {
      performance.mark("hosthunter:T5-result-visible");
      const names = ["T0-submit", "T1-request-sent", "T2-response-received", "T3-state-committed", "T4-navigation", "T5-result-visible"];
      const timings = Object.fromEntries(names.map((name) => [name, performance.getEntriesByName(`hosthunter:${name}`, "mark").at(-1)?.startTime ?? null]));
      console.table(timings);
    });
  }, [phase, result]);

  const handleScan = async (normalized) => {
    const requestId = ++requestIdRef.current;
    if (import.meta.env.DEV) performance.getEntriesByType("mark").filter(({ name }) => name.startsWith("hosthunter:")).forEach(({ name }) => performance.clearMarks(name));
    if (import.meta.env.DEV) performance.mark("hosthunter:T0-submit");
    setDomain(normalized);
    setLastDomain(normalized);
    setPhase("scanning");
    setError(null);
    setResult(null);
    try {
      const data = await scanDomain(normalized);
      if (requestId !== requestIdRef.current) return;
      setResult(data);
      if (import.meta.env.DEV) performance.mark("hosthunter:T4-navigation");
      setPhase("results");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(formatScanError(e));
      setPhase("landing");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const handleHome = () => {
    requestIdRef.current += 1;
    setPhase("landing");
    setResult(null);
    setError(null);
    setDomain("");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <div className={`min-h-screen flex flex-col ${phase === "scanning" || phase === "results" ? "bg-white" : "bg-paper"} dark:bg-stone-900`}>
      <Navbar onHome={handleHome} showNewScan={phase === "results"} />

      {phase === "landing" && (
        <>
          {error && (
            <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 pt-5">
              <div role="alert" className="max-w-[720px] border border-[#B98973] dark:border-[#704936] bg-[#EAD8CB]/70 dark:bg-[#2A1D16] px-4 py-4 text-[13px] leading-relaxed">
                <div className="font-medium text-[#6F382B] dark:text-[#E6C4B4]">{error.title}</div>
                <div className="mt-1 text-[#774638] dark:text-[#D4A995]">{error.detail}</div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button onClick={() => handleScan(lastDomain)} className="border border-[#B98973] dark:border-[#704936] px-3 py-1.5 text-[11px] tracking-micro uppercase text-[#6F382B] dark:text-[#E6C4B4] hover:bg-[#DFC7B8]/70 dark:hover:bg-[#3B281F] transition-colors">Retry scan</button>
                  <span className="text-[12px] text-[#774638] dark:text-[#D4A995]">{error.action}</span>
                </div>
              </div>
            </div>
          )}
          <HeroSearch onScan={handleScan} loading={false} />
        </>
      )}

      {phase === "scanning" && <ScanningState domain={domain} />}

      {phase === "results" && result && (
        <>
          <Workspace data={result} domain={domain} onHome={handleHome} />
        </>
      )}

      <div className="flex-1" />
      {phase !== "scanning" && <Footer variant={phase === "results" ? "results" : "default"} />}
    </div>
  );
}
