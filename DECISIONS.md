# HostHunter — Architecture Decisions

## 1. Passive Reconnaissance

**Decision:** HostHunter focuses on passive domain reconnaissance.

**Reason:** The project is intended to gather publicly available
infrastructure intelligence without performing exploitation or intrusive
scanning.

---

## 2. Frontend Design

**Decision:** Use a signal-intelligence visual language instead of a
traditional hacker/terminal aesthetic.

**Reason:** The interface should communicate technical information clearly
without relying on decorative cybersecurity clichés.

---

## 3. Email Security

**Decision:** Treat SPF, DMARC, and DKIM as three independent checks.

**Reason:** Each protocol provides different information about a domain's
email configuration and should not be collapsed into a single status.

---

## 4. DKIM Unknown State

**Decision:** DKIM may return `Unknown`.

**Reason:** HostHunter checks a defined set of common selectors. A domain
may use a custom selector that cannot be discovered through that approach.
`Unknown` therefore means "not determined", not "not configured".

---

## 5. Backend Data Fidelity

**Decision:** The frontend must display actual backend results and must not
invent fallback data.

**Reason:** Reconnaissance results need to remain traceable to the
underlying scan data.

---

## 6. Verdicts

**Decision:** The verdict banner provides a synthesized interpretation
rather than an arbitrary numerical security score.

**Reason:** A single score could imply a level of certainty that the
underlying reconnaissance data does not support.