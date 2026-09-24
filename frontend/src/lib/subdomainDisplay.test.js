import test from "node:test";
import assert from "node:assert/strict";
import { filterSubdomainNames, getSubdomainStatusLabel } from "./subdomainDisplay.js";

const names = [
  { hostname: "api.example.com", wildcard: false },
  { hostname: "*.example.com", wildcard: true },
  { hostname: "mail.example.com", wildcard: false },
];

test("filters certificate-observed names case-insensitively", () => {
  assert.deepEqual(filterSubdomainNames(names, "API"), [names[0]]);
  assert.deepEqual(filterSubdomainNames(names, "example"), names);
  assert.deepEqual(filterSubdomainNames(names, "missing"), []);
});

test("labels complete, partial, unavailable, and truncated states", () => {
  assert.equal(getSubdomainStatusLabel({ status: "complete", truncated: false }), "Complete");
  assert.equal(getSubdomainStatusLabel({ status: "partial", truncated: false }), "Partial");
  assert.equal(getSubdomainStatusLabel({ status: "unavailable", truncated: false }), "Unavailable");
  assert.equal(getSubdomainStatusLabel({ status: "partial", truncated: true }), "Partial · truncated");
});
