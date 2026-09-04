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
  const [scanError, setScanError] = useState(null);
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
    if (phase === "results") {
      const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      resetScroll();
      const frame = requestAnimationFrame(resetScroll);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [phase]);

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
    setScanError(null);
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
      setScanError(formatScanError(e));
      setPhase("scanning");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const handleHome = () => {
    requestIdRef.current += 1;
    setPhase("landing");
    setResult(null);
    setScanError(null);
    setDomain("");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-stone-900">
      <Navbar onHome={handleHome} showNewScan={phase === "results"} />

      {phase === "landing" && (
        <>
          <HeroSearch onScan={handleScan} loading={false} />
        </>
      )}

      {phase === "scanning" && <ScanningState domain={domain} error={scanError} onRetry={() => handleScan(lastDomain)} onHome={handleHome} />}

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
