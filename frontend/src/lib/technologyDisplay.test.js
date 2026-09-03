import test from "node:test";
import assert from "node:assert/strict";
import { formatTechnologySignal } from "./technologyDisplay.js";

test("formats technology objects without exposing raw object strings", () => {
  assert.deepEqual(formatTechnologySignal({ name: "gws", version: null }), {
    value: "gws",
    version: null,
    source: "headers / markup",
  });
  assert.deepEqual(formatTechnologySignal({ detected: null, source: "HTML" }), {
    value: "Unknown",
    version: null,
    source: "HTML",
  });
});

test("uses a clean fallback for empty or unsupported values", () => {
  assert.deepEqual(formatTechnologySignal(null), {
    value: "Unknown",
    version: null,
    source: "technology signal",
  });
  assert.deepEqual(formatTechnologySignal({ framework: "React", version: "18" }), {
    value: "React",
    version: "18",
    source: "headers / markup",
  });
});

test("preserves a named detection returned in the detected field", () => {
  assert.deepEqual(formatTechnologySignal({ detected: "Cloudflare", source: "header" }), {
    value: "Cloudflare",
    version: null,
    source: "header",
  });
});
