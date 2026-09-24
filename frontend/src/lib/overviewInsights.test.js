import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalysisInsights, buildOverviewInsights, formatScanError } from "./overviewInsights.js";

test("buildOverviewInsights explains observed infrastructure without inventing risk", () => {
  const insights = buildOverviewInsights({
    domainexists: true,
    dns: { A: ["192.0.2.1"], MX: ["10 mail.example.com"] },
    ip: { ips: [{ address: "192.0.2.1", asn: "AS64500" }] },
    ssl: { is_expired: false, days_until_expiry: 42 },
    cdn: { detected: true, provider: "Example CDN" },
    website: { status_code: 200 },
    email_security: { spf: { enabled: true }, dmarc: { enabled: false }, dkim: {} },
    errors: {},
  });

  assert.equal(insights.length, 4);
  assert.match(insights[0].title, /domain/i);
  assert.match(insights[0].detail, /resolv/i);
  assert.match(insights[1].detail, /42 days/i);
  assert.match(insights[2].detail, /Example CDN/i);
  assert.match(insights[3].detail, /DMARC/i);
  assert.equal(insights.some((item) => /risk|score|verdict|severity|confidence/i.test(`${item.title} ${item.detail}`)), false);
});

test("buildOverviewInsights preserves uncertainty when modules are incomplete", () => {
  const insights = buildOverviewInsights({
    domainexists: null,
    dns: {},
    ip: {},
    ssl: {},
    cdn: {},
    website: {},
    email_security: {},
    errors: { dns: "timeout" },
  });

  assert.ok(insights.some((item) => /unknown|unavailable|partial/i.test(`${item.title} ${item.detail}`)));
});

test("buildAnalysisInsights renders backend observations and unavailable rules", () => {
  const insights = buildAnalysisInsights({
    analysis: {
      version: "1",
      observations: [
        {
          id: "web-tls-delivery",
          title: "Web and TLS delivery signals",
          summary: "The website response used the HTTPS scheme.",
          related_modules: ["website", "ssl"],
          evidence_refs: ["website.scheme"],
          limitations: ["This is an observation."],
        },
      ],
      unavailable: [
        {
          id: "mail-configuration",
          related_modules: ["dns", "email_security"],
          reason: "Email evidence was unavailable.",
        },
      ],
    },
  });

  assert.equal(insights.observations[0].title, "Web and TLS delivery signals");
  assert.equal(insights.observations[0].focus, "website");
  assert.equal(insights.unavailable[0].reason, "Email evidence was unavailable.");
});

test("formatScanError gives users a recovery action", () => {
  assert.deepEqual(formatScanError(new TypeError("Failed to fetch")), {
    title: "The scan service is unavailable",
    detail: "HostHunter could not connect to the scan service. No results were received.",
  });
});

test("formatScanError distinguishes a timed out investigation", () => {
  assert.match(formatScanError({ code: "SCAN_TIMEOUT" }).title, /timed out/i);
});

test("formatScanError keeps server failures actionable without leaking raw details", () => {
  const formatted = formatScanError({ status: 503, message: "upstream detail" });
  assert.equal(formatted.title, "The scan service returned an error");
  assert.doesNotMatch(`${formatted.detail} ${formatted.action}`, /upstream detail/i);
});
