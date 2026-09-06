# HostHunter Agent Instructions

## Mission

Improve HostHunter as a fast, evidence-first passive domain intelligence product. Optimize for truthful behavior, user comprehension, and maintainable code—not spectacle.

## Before modifying anything

1. Inspect the repository structure and the relevant implementation.
2. Identify the current behavior, API boundary, and source of truth.
3. If debugging scan speed, instrument the current `frontend/` flow and measure the full lifecycle before attributing delay to any layer.
4. State the smallest change that can test the hypothesis.

## Non-negotiable rules

- Preserve API contracts unless code evidence proves a contract change is required.
- Do not rewrite working modules or architecture for aesthetic reasons.
- Diagnose before fixing; do not guess at a performance cause.
- Never invent backend data, severity, confidence, scores, or verdicts.
- Preserve partial success, module errors, provenance, and unknown states.
- Treat “Unknown ≠ insecure” as a product rule.
- Keep animation and data lifecycles independent. Animation must never block, serialize, or delay results.
- Prefer the smallest correct change, with a focused validation path.
- Keep plain-language explanation in front of technical evidence, without hiding the evidence.

## UI constraints

Protect the editorial black/warm-ivory foundation, serif display + sans/mono technical typography, and calm investigative tone when they serve the user. Challenge them when readability, accessibility, approachability, or comprehension suffers.

Do not add generic SaaS styling, neon cyberpunk, glassmorphism, excessive cards, fake terminal effects, decorative diagrams unsupported by data, or artificial cinematic delays.

Shared module grammar should create predictable meaning and interaction, not identical layouts.

## Performance investigations

Treat scan responsiveness as a measurable product requirement. Do not assume a historical timing baseline or blame animation without evidence. Measure:

`T0 submit → T1 request sent → T2 response received → T3 state committed → T4 navigation begins → T5 result visible`

Check for artificial timers, sequential awaits, duplicate requests, polling, remounts, transition gates, expensive transformations, and delayed navigation. Results must render as soon as the actual data is available.

## Working style

- Read existing code and nearby conventions before introducing abstractions.
- Keep changes scoped and explain why a new dependency or pattern is needed.
- Update documentation when behavior or a product decision changes.
- Do not silently broaden the task.
- Report what was verified, including known limitations or untested paths.

## Validation

Use the repository’s existing package scripts, test commands, type checks, and build checks after inspecting them. Do not invent commands. For performance work, record the timing checkpoints above and compare against a dated, reproducible measurement. For UI work, verify loading, success, partial success, failure, reduced motion, narrow screens, and dark mode where applicable.

## Project map

- `README.md` owns setup and public project orientation.
- `PRODUCT.md` owns product principles, evidence semantics, and non-goals.
- `DESIGN_SYSTEM.md` owns implemented visual and interaction guidance.
- `DECISIONS.md` owns durable architectural decisions and their rationale.
- `docs/ARCHITECTURE.md` owns frontend/backend boundaries and the `/scan` data flow.
- `ROADMAP.md` owns future priorities, not implementation instructions.
