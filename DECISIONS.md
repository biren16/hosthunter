# HostHunter — Engineering Decisions

## 1. Modular Reconnaissance Architecture

**Decision:** HostHunter separates reconnaissance into independent modules for DNS, WHOIS, SSL, IP intelligence, website analysis, technology detection, CDN detection, and email security.

**Why:** Each module has a focused responsibility, making the system easier to extend and maintain as new reconnaissance capabilities are added.

---

## 2. Partial Failure Handling

**Decision:** A failure in one reconnaissance module does not terminate the complete scan.

**Why:** External DNS, WHOIS, HTTP, and IP intelligence lookups can fail independently. Returning successful results alongside module-specific errors makes the API more resilient and useful.

---

## 3. Public-Destination Validation

**Decision:** HTTP requests validate the resolved destination before connecting.

**Why:** The reconnaissance endpoint accepts domains supplied by users, so requests must not be allowed to reach private or internal network destinations.

---

## 4. DKIM Detection

**Decision:** DKIM detection checks a defined set of common selectors and reports `Unknown` when no usable record is found.

**Why:** A missing result does not necessarily mean DKIM is disabled. A domain may use a custom selector that is outside the selectors HostHunter checks.

---

## 5. Backend as the Source of Truth

**Decision:** The frontend renders reconnaissance results returned by the backend rather than duplicating reconnaissance logic.

**Why:** This keeps the scan logic centralized and ensures that the information presented in the UI corresponds to the actual API response.

---

## 6. Explicit Uncertainty

**Decision:** HostHunter distinguishes between states such as detected, missing, invalid, and unknown instead of treating every unsuccessful lookup as a negative result.

**Why:** Reconnaissance data is inherently incomplete. Representing uncertainty explicitly avoids making claims that the scan cannot actually establish.

---

## 7. No Synthesized Verdict or Security Score

**Decision:** The result interface does not issue a synthesized verdict or numerical security score.

**Why:** The collected reconnaissance data provides observations about infrastructure and configuration, but does not by itself justify a precise overall security rating or conclusion. The overview orients the user to returned evidence and limitations without replacing expert judgment.

---

## 8. Passive Certificate-Transparency Subdomain Discovery

**Decision:** Add subdomain evidence from Cert Spotter's certificate-transparency search API as an additive `/scan` module. Return normalized certificate-observed names, wildcard state, issuance counts, validity timestamps, provider metadata, and explicit collection limitations.

**Why:** Certificate-transparency records add passive hostname evidence without DNS brute forcing or active probing. Cert Spotter provides a documented domain search with subdomain inclusion and pagination.

**Rejected:** Treating certificate names as live assets, resolving every returned name during the scan, or silently falling back to an undocumented provider.

---

## 9. Backend-Owned Correlation Rules

**Decision:** Generate deterministic, evidence-referenced analysis on the backend after collection. Each rule emits an observation or an explicit unavailable entry.

**Why:** The backend remains the source of truth, while the frontend can present the same interpretation consistently. Analysis must remain inspectable and must not manufacture scores, severity, confidence, or verdicts.

**Rejected:** Duplicating correlation logic in React or inferring current reachability, origin exposure, or insecurity from missing signals.
