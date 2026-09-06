# HostHunter Roadmap

Priorities are product outcomes, not a list of speculative implementation tasks. Reorder them when evidence or user feedback changes the sequence.

## P0 — establish truthful scan performance

- Establish a dated, repeatable baseline for a representative public domain in the current `frontend/` application.
- Trace T0 submit, T1 request sent, T2 response received, T3 state committed, T4 navigation begins, and T5 result visible.
- Compare request payloads, concurrency, duplicate calls, delays, state updates, route behavior, and result rendering.
- Remove only the proven bottleneck; preserve the working API contract.
- Keep data lifecycle and visual lifecycle independent.

## P1 — make the current scan understandable

- Shorten and sharpen the landing page around domain entry and passive-scan expectations.
- Build the two-depth results model: plain-language Overview first, complete evidence underneath.
- Add honest labels for partial, unavailable, not checked, and unknown states.
- Improve error recovery with cause, scan status, remaining data, and retry.
- Explain technical terms in context and raise supporting-text readability.

## P1 — establish the module system

- Apply shared status, summary, evidence, provenance, and limitation conventions to DNS, WHOIS, SSL/TLS, IP Intelligence, Website, Technology, CDN, and Email Security.
- Keep module layouts semantically appropriate instead of forcing identical card structures.
- Ensure raw JSON remains available without making it the default reading experience.

## P2 — refine identity and interaction

- Introduce one restrained HostHunter signature signal or visual motif based on signal → connection → explanation.
- Add non-blocking, reduced-motion-aware transitions and scan-state continuity.
- Refine typography, contrast, spacing, iconography, and dark-mode behavior against real device sizes.
- Challenge editorial choices that continue to obstruct approachability.

## P2 — persistence and analysis

- Add scan persistence and history with clear timestamps and domain identity.
- Define an analysis engine that can explain supported relationships and observations without pretending to certainty.
- Add cross-module correlation and origin-exposure analysis only when evidence and rules are explicit.
- Explore proxy/VPN detection with documented coverage and limitations.

## P3 — durable outputs

- Design reports around evidence, citations/provenance, limitations, and generated time.
- Support sharing/export only after the underlying analysis and history model is trustworthy.

## Guardrails

- Do not expand scope while the P0 performance regression remains unresolved.
- Do not market roadmap concepts as current capability.
- Every milestone must preserve partial success and uncertainty.
- Prefer measurable comprehension and timing improvements over visual novelty.
