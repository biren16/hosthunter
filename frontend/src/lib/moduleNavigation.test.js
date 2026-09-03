import test from "node:test";
import assert from "node:assert/strict";
import { getModuleDirection } from "./moduleNavigation.js";

test("returns forward when the next module follows the current module", () => {
  assert.equal(getModuleDirection("overview", "dns"), "forward");
  assert.equal(getModuleDirection("website", "email"), "forward");
});

test("returns backward when the next module precedes the current module", () => {
  assert.equal(getModuleDirection("email", "technology"), "backward");
  assert.equal(getModuleDirection("tls", "overview"), "backward");
});

test("returns same for identical or unknown module ids", () => {
  assert.equal(getModuleDirection("dns", "dns"), "same");
  assert.equal(getModuleDirection("missing", "dns"), "same");
});
