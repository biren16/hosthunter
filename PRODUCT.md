# HostHunter Product Brief

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

HostHunter is a passive, evidence-first domain intelligence and reconnaissance platform. A user enters a domain and receives a readable investigation of publicly observable signals—without intrusive probing, unsupported conclusions, or the posture of a vulnerability scanner.

**Positioning:** a professional cyber tool made approachable.

The product should feel credible to security-minded users while remaining understandable to someone who only wants to know what a domain exposes, how its infrastructure connects, and what the observations mean.

## Core promise

> Evidence first. Explanation second. Verdicts only when justified.

HostHunter helps users move from a domain name to an oriented understanding of its public footprint. It presents two depths:

1. **Orientation:** plain-language analysis that tells the user what was observed, why it matters, and what remains unknown.
2. **Evidence:** complete module output, provenance, timestamps, raw values, and failure/partial-success details for verification.

The Overview is the orientation layer. It is not a second raw-data dump and must not manufacture a score, severity, confidence, or verdict.

## Initial capability surface

The scan is organized into eight modules:

- DNS
- WHOIS
- SSL/TLS
- IP Intelligence
- Website
- Technology
- CDN
- Email Security

Each module may succeed, fail, or return partial evidence independently. A partial scan is still useful and must remain visible as partial rather than being flattened into success or failure.

## Trust rules

- HostHunter is passive by default; do not imply intrusive testing.
- An observation is not automatically a risk finding.
- **Unknown ≠ insecure.** Missing data can reflect unavailable coverage, privacy controls, DNS behavior, rate limits, or a failed module.
- DKIM non-detection through common selectors is not proof that DKIM is absent.
- Never invent severity, confidence, risk scores, or verdicts without a defined, supported basis.
- Keep evidence distinct from interpretation, and label interpretation as such.
- Preserve uncertainty, provenance, timing, and module errors.

## Experience direction

HostHunter should be fast, quiet, precise, and controlled. “Cinematic” means pacing, composition, typography, continuity, and restrained motion—not effects, artificial waiting, or a theatrical loading screen.

The landing page should be shorter and more decisive: explain the product in plain language, make domain entry unmistakable, show a few useful examples, and defer deep philosophy, API detail, and roadmap material to appropriate documentation.

The results experience should make the next question obvious: what was observed, what does it mean, what should I inspect next, and where is the supporting evidence?

## Operating Context

The scan is one investigation across DNS, WHOIS, SSL/TLS, IP intelligence, Website, Technology, CDN, and Email Security. Users begin with orientation and then inspect each module’s supporting evidence and raw response details.

## Users

- Curious domain owners and operators who need a clear public-footprint explanation.
- Developers and product teams checking domains, hosting, certificates, technologies, and email posture.
- Security practitioners who need complete evidence and raw detail without a noisy dashboard.

Plain language is the default. Technical terms may appear when useful, but should be explained in place or paired with a human-readable label.

## Brand Commitments

- Preserve the HostHunter name and evidence-first voice.
- The product should feel credible, calm, precise, and approachable.
- The existing editorial visual identity is binding: warm ivory/black palette, serif-led typography, restrained motion, and infrastructure-focused composition.

## Evidence on Hand

- The repository contains the eight-module `/scan` response contract and frontend implementation.
- No customer testimonials, performance benchmarks, or external endorsements are available; do not fabricate them.

## Product Principles

1. Evidence first. Explanation second. Verdicts only when justified.
2. Unknown is not insecure; preserve uncertainty and provenance.
3. Make expert evidence understandable without flattening it into a score.
4. Keep investigation behavior truthful: no fake progress, artificial waiting, or unsupported claims.
5. Preserve the raw record so users can verify the explanation.

## Accessibility & Inclusion

Keyboard access, readable contrast, reduced-motion behavior, narrow-screen layouts, and clear recovery states are required. The interface must remain understandable to users without networking or cybersecurity expertise.

## Non-goals for the current product

- Active exploitation, vulnerability scanning, or stealth claims.
- A universal security grade for every domain.
- Replacing expert judgment with a single composite score.
- Making the interface impressive by hiding uncertainty or slowing the user down.

## Future differentiation

The product can grow from a polished evidence viewer into an understandable analysis product through persistence/history, an analysis engine, proxy/VPN detection, origin-exposure and cross-module correlation, and reports. Reports are later-stage output, not a reason to burden the first scan.
