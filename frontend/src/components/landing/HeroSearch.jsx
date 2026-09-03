import { useEffect, useRef, useState } from "react";
import { validateDomain } from "../../lib/validateDomain";
import { useInView } from "../../hooks/useInView";

const MODULES = [
  ["DNS", "A, AAAA, MX, NS, and TXT records expose public routing, delegation, and mail topology."],
  ["WHOIS", "Registrar, lifecycle dates, nameservers, DNSSEC state, and available registration metadata."],
  ["SSL / TLS", "Certificate subject, issuer, validity, public-key details, signatures, and certificate fingerprints."],
  ["IP intelligence", "Resolved addresses, ASN, organization, geolocation, IP version, and reverse DNS."],
  ["Website", "HTTP status, redirects, metadata, final URL, and returned security headers."],
  ["Technology", "Server, framework, CMS, frontend, and platform signals inferred from observable headers and markup."],
  ["CDN", "Resolved addresses and supported provider signals are compared to identify known CDN infrastructure."],
  ["Email security", "Published SPF and DMARC configuration, with DKIM discovery through known selectors where supported."],
];

const RESPONSE_ABRIDGED = `{
  "domain": "google.com",
  "domainexists": true,
  "dns": { "A": ["142.250.x.x"], "MX": ["10 smtp.google.com."] },
  "whois": { "registrar": "MarkMonitor Inc.", "creation_date": "1997-09-15" },
  "ssl": { "issuer": "Google Trust Services", "is_expired": false },
  "ip": { "asn": "AS15169", "organization": "Google LLC" },
  "website": { "status_code": 200, "scheme": "https" },
  "cdn": { "detected": false },
  "technology": { "web_server": "gws" },
  "email_security": { "spf": true, "dmarc": "reject", "dkim": "Unknown" }
}`;

const RESPONSE_SAMPLE = `{
  "domain": "google.com",
  "domainexists": true,
  "dns": { "A": ["142.250.x.x"], "AAAA": ["2404:6800:..."], "MX": ["10 smtp.google.com."], "NS": ["ns1.google.com."], "TXT": ["v=spf1 include:_spf.google.com ~all"] },
  "whois": { "domain_name": "google.com", "registrar": "MarkMonitor Inc.", "organization": "Google LLC", "country": "US", "creation_date": "1997-09-15", "status": ["clientDeleteProhibited"], "dnssec": "unsigned" },
  "ssl": { "subject": { "common_name": "*.google.com" }, "issuer": { "organization_name": "Google Trust Services", "common_name": "WR2" }, "days_until_expiry": 73, "is_expired": false, "public_key_algorithm": "EC", "signature_algorithm": "ecdsa-with-SHA256", "fingerprint_sha256": "..." },
  "ip": { "ips": [{ "address": "142.250.x.x", "version": 4, "is_global": true, "organization": "Google LLC", "asn": "AS15169", "country": "US", "city": "Mountain View", "reverse_dns": null }] },
  "website": { "status_code": 200, "scheme": "https", "final_url": "https://www.google.com/", "security_headers": { "strict_transport_security": { "enabled": true, "value": "max-age=31536000", "description": "..." } } },
  "cdn": { "detected": false, "provider": null, "matched_ip": null, "resolved_ips": ["142.250.x.x"] },
  "technology": { "web_server": { "name": "gws", "version": null }, "backend": { "framework": null }, "cms": { "name": null }, "frontend": { "frameworks": [] } },
  "email_security": { "spf": { "enabled": true, "record": "v=spf1 include:_spf.google.com ~all" }, "dmarc": { "enabled": true, "policy": "reject", "record": "v=DMARC1; p=reject; ..." }, "dkim": { "supported": "Unknown", "selector": null, "record": null, "reason": "No DKIM record found using common selectors; the domain may use a custom selector." } }
}`;

function Reveal({ children, className = "" }) {
  const { ref, isVisible } = useInView();
  return <div ref={ref} className={`reveal-section ${isVisible ? "is-visible" : ""} ${className}`}>{children}</div>;
}

function useSignalsScrollStage(stageRef, viewportRef, listRef) {
  useEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const list = listRef.current;
    const desktop = window.matchMedia("(min-width: 901px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!stage || !viewport || !list || !desktop.matches || reducedMotion.matches) return undefined;

    const reset = () => {
      stage.style.height = "";
      stage.style.removeProperty("--signals-overflow");
      stage.style.removeProperty("--signals-handoff");
      list.style.transform = "";
    };
    let frame = 0;
    let settleFrame = 0;
    let currentOffset = 0;
    let targetOffset = 0;
    const settle = () => {
      settleFrame = 0;
      const distance = targetOffset - currentOffset;
      if (Math.abs(distance) < 0.2) {
        currentOffset = targetOffset;
      } else {
        currentOffset += distance * 0.26;
        settleFrame = requestAnimationFrame(settle);
      }
      list.style.transform = `translate3d(0, ${currentOffset}px, 0)`;
    };
    const update = () => {
      frame = 0;
      if (!desktop.matches || reducedMotion.matches) { reset(); return; }
      const stickyHeight = window.innerHeight - 76;
      const overflow = Math.max(list.scrollHeight - viewport.clientHeight, 0);
      stage.style.height = `${stickyHeight + overflow}px`;
      stage.style.setProperty("--signals-overflow", `${overflow}px`);
      const progress = Math.min(Math.max(-stage.getBoundingClientRect().top / Math.max(overflow, 1), 0), 1);
      const easedProgress = progress * progress * (3 - (2 * progress));
      targetOffset = -overflow * easedProgress;
      const handoff = Math.min(Math.max((progress - 0.72) / 0.28, 0), 1);
      stage.style.setProperty("--signals-handoff", String(handoff));
      if (progress >= 0.999) currentOffset = targetOffset;
      if (!settleFrame) settleFrame = requestAnimationFrame(settle);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    desktop.addEventListener?.("change", schedule);
    reducedMotion.addEventListener?.("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener?.("change", schedule);
      reducedMotion.removeEventListener?.("change", schedule);
      if (frame) cancelAnimationFrame(frame);
      if (settleFrame) cancelAnimationFrame(settleFrame);
      settleFrame = 0;
      currentOffset = 0;
      targetOffset = 0;
      reset();
    };
  }, [listRef, stageRef, viewportRef]);
}

export function HeroSearch({ onScan, loading }) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const inputRef = useRef(null);
  const signalsStageRef = useRef(null);
  const signalsViewportRef = useRef(null);
  const signalsListRef = useRef(null);
  useSignalsScrollStage(signalsStageRef, signalsViewportRef, signalsListRef);

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    const value = validateDomain(raw);
    if (!value.valid) { setErr(value.message); return; }
    setErr("");
    onScan(value.normalized);
  };

  const showError = touched && err;
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  return (
    <main className="landing-shell">
      <section className="domain-hero mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="domain-hero__content">
          <div className="domain-hero__intro">
            <h1 className="font-display text-[clamp(3.2rem,8vw,6rem)] leading-[0.9] font-medium max-w-[11ch]">
              Read the infrastructure behind a domain.
            </h1>
            <p className="mt-6 max-w-[58ch] text-[15px] sm:text-[16px] leading-[1.65] text-graphite dark:text-bone">
              HostHunter turns a domain&apos;s public footprint into one inspectable investigation — passive, evidence-first, and built from publicly observable data.
            </p>
          </div>

          <div className="domain-hero__action">
            <form onSubmit={submit} className={`domain-search ${editing ? "is-editing" : "is-resting"} ${focused ? "is-focused" : ""} ${showError ? "has-error" : ""}`} noValidate>
              <label htmlFor="domain-input" className="sr-only">Domain to investigate</label>
              <div className="domain-search__row">
                <div className="domain-search__control">
                {!editing && <button type="button" className="domain-search__resting" onClick={() => setEditing(true)}>
                  <span>INVESTIGATE</span>
                  <svg className="domain-search__resting-arrow" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M9 5h10v10" /></svg>
                </button>}
                <input
                  ref={inputRef}
                  id="domain-input"
                  value={raw}
                  onChange={(event) => { setRaw(event.target.value); if (err) setErr(""); }}
                  onFocus={() => setFocused(true)}
                  onBlur={(event) => {
                    setFocused(false);
                    if (!raw.trim() && event.relatedTarget?.type === "submit") {
                      setTouched(true);
                      setErr("Domain cannot be empty.");
                    } else if (!raw.trim() && !event.currentTarget.form?.contains(event.relatedTarget)) {
                      setEditing(false);
                    }
                  }}
                  placeholder=""
                  spellCheck={false}
                  autoCapitalize="off"
                  disabled={loading}
                  aria-invalid={showError ? "true" : "false"}
                  aria-describedby={showError ? "domain-error" : undefined}
                />
                </div>
                {editing && <button type="submit" disabled={loading} aria-label={loading ? "Analyzing domain" : "Analyze domain"} className="domain-search__submit">
                    <span>{loading ? "Analyzing" : "Analyze"}</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
                  </button>}
              </div>
              {showError ? (
                <p id="domain-error" className="domain-search__error">{err}</p>
              ) : null}
            </form>
          </div>
        </div>

      </section>

      <Reveal>
        <section className="landing-section landing-section--signals">
          <div ref={signalsStageRef} className="signals-stage mx-auto max-w-[1360px] px-5 sm:px-8">
            <div ref={signalsViewportRef} className="signals-stage__inner">
              <div className="signals-stage__aside">
                <h2>What HostHunter reads</h2>
                <p>Eight passive checks map how a domain is registered, resolved, served, identified, and configured across its public-facing infrastructure.</p>
              </div>
              <div className="signals-stage__viewport">
                <div ref={signalsListRef} className="signals-index">
                  {MODULES.map(([title, detail], index) => (
                    <article key={title} className="signals-index__item" tabIndex={0} aria-label={`${title} evidence dimension`}>
                      <span className="signals-index__number">{String(index + 1).padStart(2, "0")}</span>
                      <h3>{title}</h3>
                      <p>{detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="landing-section landing-section--evidence mx-auto max-w-[1360px] px-5 sm:px-8 py-16 sm:py-20">
          <div className="section-heading section-heading--evidence">
            <h2>Evidence stays attached<br />to the answer.</h2>
            <p>HostHunter separates what was observed, what that observation means, and what could not be confirmed — so interpretation never replaces the underlying evidence.</p>
          </div>
          <div className="evidence-principles mt-8">
            <article><span>Observed</span><h3>What was returned</h3><p>DNS records, IP addresses, certificate fields, HTTP responses, technology signals, and published mail policies remain available as observable evidence.</p></article>
            <article><span>Context</span><h3>What it means</h3><p>Technical context explains what a signal represents and why it may matter without automatically turning it into a security finding.</p></article>
            <article><span>Unknown</span><h3>What was not confirmed</h3><p>Failed lookups, absent fields, unsupported providers, custom selectors, and unavailable sources remain explicitly unknown instead of being guessed.</p></article>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="scan-case-note mx-auto max-w-[1360px] px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="scan-case-note-title">
          <div className="scan-case-note__frame">
            <div className="scan-case-note__content">
              <h2 id="scan-case-note-title">Partial results remain useful.</h2>
              <p className="scan-case-note__support">A source can be unavailable without removing observations returned by the other modules.</p>
            </div>
            <div className="scan-case-note__trace" aria-label="Illustrative independent module outcomes">
              <div className="scan-case-note__trace-labels">
                {["DNS", "WHOIS", "TLS", "IP", "WEB"].map((module) => <span key={module}>{module}</span>)}
              </div>
              <div className="scan-case-note__trace-line" aria-hidden="true">
                {["DNS", "WHOIS", "TLS", "IP", "WEB"].map((module) => <i key={module} className={module === "WHOIS" ? "is-unavailable" : "is-returned"} />)}
              </div>
              <span className="scan-case-note__trace-callout">Unavailable</span>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="landing-section landing-section--correlation response-band">
          <div className="mx-auto max-w-[1360px] px-5 sm:px-8 py-20 sm:py-24 grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-20 items-start">
            <div className="response-band__copy">
              <h2>Eight sources. One returned record.</h2>
              <p>Each scan normalizes independent module results into one structured response. Successful lookups remain available alongside missing fields, unknown states, and module-level failures, preserving partial results instead of collapsing the investigation.</p>
              <div><span>POST /scan</span><span>Normalized response</span></div>
            </div>
            <div className="response-code">
              <header><span>{showFullResponse ? "Complete redacted response" : "Abridged redacted response"}</span><span>google.com</span></header>
              <div className={`response-code__body ${showFullResponse ? "is-expanded" : ""}`}><pre>{showFullResponse ? RESPONSE_SAMPLE : RESPONSE_ABRIDGED}</pre></div>
              <button type="button" className="response-code__toggle" onClick={() => setShowFullResponse((value) => !value)}>{showFullResponse ? "Collapse response ↑" : "View full response ↓"}</button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="landing-section landing-section--passive-closing passive-closing-section closing-statement mx-auto max-w-[1360px] px-5 sm:px-8 py-20 sm:py-28">
          <div className="passive-closing-section__inner">
            <span className="closing-statement__label">Passive by design</span>
            <h2><span>Observe first.</span><span>Interpret second.</span></h2>
            <p className="passive-closing-section__technical">Public evidence · explicit uncertainty · no invented conclusions</p>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
