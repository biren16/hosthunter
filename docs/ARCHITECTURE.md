# HostHunter Architecture

## System boundary

HostHunter has a React frontend in `frontend/` and a FastAPI backend in
`backend/`. The frontend presents returned evidence; the backend owns domain
validation, public-data collection, and the `/scan` response contract.

## Scan flow

1. A user submits a domain through the landing experience.
2. The frontend validates the input and sends `POST /scan` with
   `{ "domain": "example.com" }`.
3. The backend normalizes and validates the domain, rejecting malformed input,
   credentials, IP literals, and invalid labels.
4. `backend/main.py` collects DNS, WHOIS, SSL/TLS, IP, Website, Technology,
   CDN, and Email Security evidence.
5. The backend returns one normalized record. Successful module data remains
   present when another module returns an error; module failures are collected
   in the optional `errors` object.
6. The frontend commits the response and renders the results workspace without
   waiting for decorative animation.

## Ownership and invariants

- `backend/main.py` is the source of truth for the `/scan` schema.
- `backend/modules/` contains the independent evidence collectors. They are
  currently called sequentially by the route handler; do not describe them as
  concurrent unless code and measurement establish that behavior.
- `frontend/src/lib/api.js` owns request transport and its client timeout.
- `frontend/src/App.jsx` owns landing, scanning, and results phase changes.
- `frontend/src/components/results/` translates returned data into orientation,
  module evidence, and raw-response disclosure. It must not invent backend
  fields or conclusions.

## Evidence semantics

An unavailable lookup, missing field, unsupported detector, and unknown value
are different states. Preserve module-level errors and partial results. Unknown
does not mean insecure, and a result record does not support a synthesized
security score or verdict.

## Related documents

- `PRODUCT.md` defines product intent and non-goals.
- `DESIGN_SYSTEM.md` defines implemented visual and interaction guidance.
- `DECISIONS.md` records durable choices and their rationale.
- `AGENTS.md` gives coding agents the operating map for safe changes.
