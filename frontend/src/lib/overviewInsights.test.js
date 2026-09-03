import test from "node:test";
import assert from "node:assert/strict";
import { buildOverviewInsights, formatScanError } from "./overviewInsights.js";

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

test("formatScanError gives users a recovery action", () => {
  assert.deepEqual(formatScanError(new TypeError("Failed to fetch")), {
    title: "The investigation could not start",
    detail: "The scan service did not respond. No results were received.",
    action: "Retry the scan or check that the API is available.",
  });
});
