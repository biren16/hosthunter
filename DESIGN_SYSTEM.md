# HostHunter Design System

This document records the implemented visual and interaction system in `frontend/`. It is a source of truth for the landing page, scanning state, and results workspace—not a redesign proposal.

## 1. Design Identity

HostHunter presents passive domain reconnaissance as an inspectable investigation. The page is quiet, typographic, and evidence-oriented: a large editorial statement introduces the product, while technical material is organized through rules, numbered rows, restrained surfaces, and readable source detail.

The product family is held together by:

- warm paper-adjacent neutrals with carbon text;
- Fraunces for selected editorial statements;
- Inter for interface language and explanations;
- JetBrains Mono for technical metadata;
- thin rules and deliberate alignment;
- one restrained warm accent family;
- explicit uncertainty and partial-result language;
- motion that clarifies state without delaying data.

It is not a generic SaaS dashboard, cyberpunk interface, terminal simulation, diagrammatic network map, or decorative animation system. Atmosphere comes from composition, contrast, typography, and pacing—not from spectacle.

## 2. Core Design Principles

### Evidence before interpretation

Lead with what was observed, then explain its context. Keep raw or source-level evidence available. Never turn an absent, failed, or unsupported lookup into a security conclusion.

### Calm technical clarity

Use a restrained editorial frame to make technical information approachable. Plain-language explanations sit beside, not in place of, the underlying evidence.

### Tonal separation over decoration

Use white, paper, parchment, and dark contrast surfaces to group information. Prefer rules and alignment before shadows, gradients, cards, or ornamental graphics.

### Motion supports comprehension

Animation reveals or transitions existing landing content, but never hides meaning behind spectacle or delays the hero interaction.

## 3. Color System

The implementation defines the principal palette in `frontend/tailwind.config.js` and uses a small number of direct CSS values in `frontend/src/index.css`.

### Core tokens

| Token | Value | Role |
| --- | --- | --- |
| `paper` | `#F3EDE3` | Warm global paper token and light text-adjacent surface |
| `paper2` / `cream` | `#EAE0D2` | Secondary warm surface |
| `bone` | `#DDD0BF` | Soft light contrast and dark-mode text support |
| `parchment` | `#CDBA9E` | Rules, metadata borders, and quiet warm structure |
| `ink` / `carbon` | `#0D0B09` | Primary dark text and principal dark surface |
| `brown` | `#2A1D16` | Warm dark text and dark-theme support |
| `graphite` | `#655E57` | Supporting text and subdued explanation |
| `brass` / `signal` | `#B68A4A` | Restrained accent, focus, and status emphasis |
| `copper` | `#9A603B` | Warm accent for labels, rules, and selected hover states |

Additional neutral values used by the implementation include `#FFFFFF` for the landing shell and several white-adjacent surfaces, `#FBF9F5` for the footer and evidence surfaces, `#FAF9F6` for the response code panel, `#151311` for dark footer/evidence surfaces, and `#15110E` for the dark partial-results frame.

### Usage rules

- The light landing shell is intentionally white (`#FFFFFF`) in the implemented page; `paper` remains the global product token.
- White is used as the primary landing field. Warm off-whites such as `#FBF9F5` provide local contrast without introducing a new visual family.
- Carbon and deep brown are reserved for high-contrast sections, dark mode, primary text, and the partial-results statement.
- Brass/copper are accents, not general decoration. Use them for a small rule, a micro-label, focus treatment, or meaningful state.
- Graphite is for supporting prose; do not use it for essential small text when contrast becomes weak.
- Semantic error, unavailable, and warning tones are used only when the interface is communicating those states. Unknown is not insecure.
- Dark mode changes the surface and text hierarchy rather than applying a raw color inversion.

## 4. Typography System

Fonts are loaded in `frontend/src/index.css` from the current Google Fonts import. Tailwind aliases are defined as `display`, `sans`, and `mono`.

### Fraunces — editorial display

Fraunces is the display family (`font-display`, with Georgia fallback). It is used for the hero headline and the final closing statement. It supplies HostHunter’s publication-like voice and should be used selectively for emphasis, not as the default for controls or body copy.

Implemented examples:

- hero: Tailwind `clamp(3.2rem, 8vw, 6rem)`, approximately `.9` line-height, medium weight, maximum measure `11ch`;
- final epilogue: `clamp(3.2rem, 4.8vw, 4.1rem)`, weight `500`, line-height `1.02`, tracking `-.055em`.

### Inter — interface and explanation

Inter is the sans family used for navigation, body text, section headings, module names, controls, labels, and supporting copy. Typical implemented sizes are `13–16px` for prose, `18–19px` for module or action headings, and `30–59px` for non-hero section headings. Body copy generally uses `1.65–1.75` line-height.

Use Inter when clarity, scanning, and interface familiarity matter. Do not replace it with display serif styling in navigation, controls, or explanatory copy.

### JetBrains Mono — technical metadata

JetBrains Mono is used for route labels, domains, API labels, source metadata, status details, and compact technical values. Typical sizes are `9–12px`, with tracked uppercase treatment for metadata. It is not a general body font.

### Weight and casing

- Display statements use medium weight rather than heavy black weight.
- Interface headings commonly use `600`.
- Body copy uses regular or medium weight.
- Technical labels use uppercase with approximately `.08–.14em` tracking.
- Casing communicates role: sentence case for explanations, uppercase for metadata/actions, and monospace for technical identifiers.

## 5. Layout & Grid

### Global frame

Landing content uses a maximum width of `1360px` with responsive horizontal padding of `20px` (`px-5`) or `32px` (`px-8`). Navbar and footer use `24px` (`px-6`) at the smallest layout and `32px` from the `sm` breakpoint.

The global application remains a vertical flex layout with a minimum viewport height. The footer is pushed down with the flex spacer when content is short.

### Hero composition

The hero is intentionally asymmetric: the active content occupies a controlled left measure and the remaining space acts as framing. `.domain-hero` uses one column capped at `760px`, with the content shifted by `clamp(0px, 4vw, 58px)`. It is not a centered marketing grid.

Desktop hero height is `calc(100svh - 76px)`; the mobile rule uses `calc(100svh - 68px)`. It uses `align-content: center`, with responsive top and bottom padding. The action is wider than the text measure but remains capped at `616px`; the domain interaction itself is capped at `440px`.

### Signals section

The “What HostHunter reads” section is a landing-specific scroll stage. At desktop it uses a sticky inner frame with a two-part grid: a left explanatory aside and a right viewport containing the eight ruled module rows. The columns are `minmax(220px, .72fr)` and `minmax(0, 1.28fr)`, with a responsive gap between `3rem` and `8vw`.

The right list is internally translated through `requestAnimationFrame` while the stage reserves the required document height. This creates the landing page’s contained reading sequence.

### Responsive behavior

- At `max-width: 900px`, the hero and signals stage become one-column layouts; the signals stage is no longer sticky and the full list becomes normally visible.
- At `max-width: 640px`, the hero uses smaller display type, reduced padding, and a one-column module list. Response code remains vertically scrollable.
- Multi-column evidence and response layouts collapse explicitly rather than relying on accidental flex wrapping.
- The landing page keeps the left edge, right edge, and hierarchy predictable as compositions change.

## 6. Spacing & Vertical Rhythm

The landing page uses generous spacing as framing, but spacing is controlled by `clamp()` values rather than a universal full-screen rule.

Recurring implementation patterns include:

- hero padding of roughly `4–8vh` on desktop and `3.5rem` on mobile;
- hero content gap of `clamp(2rem, 4vh, 3.25rem)`;
- section padding commonly `4–6rem` on mobile and `4–6rem` or `5–6rem` on desktop;
- signals rows at a minimum `150px` tall;
- evidence articles at a minimum `188px` on desktop;
- code and dark evidence frames using internal padding of roughly `1.25–4.5rem` depending on viewport;
- footer primary and bottom rows separated by approximately `5–5.5rem` on desktop.

Whitespace establishes hierarchy and reading pace. It is a landing-page composition tool, not a universal spacing requirement.

## 7. Rules, Borders & Surfaces

Thin horizontal rules are the primary structural device. They separate evidence rows, metadata, response code headers, footer regions, and the landing hero action without making the page feel boxed in.

- Use one-pixel rules in parchment, cream, or neutral graphite tones.
- The signals list uses a top rule and bottom rules for each item; hover adds a short warm rule extension.
- The hero domain interaction uses a persistent one-pixel baseline and a transform-revealed active rule.
- The response code surface uses a thin border and a separate header divider.
- The dark partial-results frame is a deliberate exception: it uses a `26px` radius and a thin dark-brown border to create a contained statement banner.
- Evidence articles are borderless and rely on very light tonal surfaces and restrained shadows.
- Avoid adding cards or rounded containers to every datum. A boundary should explain grouping or hierarchy.

Shadows are sparse and tinted toward the warm page family. The landing shell itself is mostly flat; depth comes from tonal contrast, rules, and transitions.

## 8. Editorial vs Interface Typography

Landing typography is expressive because this page introduces the product. The hero’s large Fraunces statement is a page-specific opening gesture. Within the same landing page, Inter carries navigation, explanations, module descriptions, and actions, while JetBrains Mono carries compact technical metadata.

The landing page’s shared family comes from the relationship between these roles—not from applying the hero’s scale or serif treatment everywhere. Fraunces is reserved for the hero and final epilogue; it is not used for the signals index, response metadata, or controls.

## 9. Information Hierarchy

The landing page follows this order:

1. editorial product statement;
2. short plain-language explanation;
3. domain investigation action;
4. section purpose and explanatory copy;
5. named evidence dimensions;
6. technical artifact or structured response;
7. uncertainty and operating constraints.

Within a module row or evidence block, the visual order is number/metadata → subject → explanation.

The interface must distinguish:

- observed values;
- contextual explanation;
- unavailable, unknown, or unconfirmed values;
- technical provenance and raw response detail.

## 10. Technical / Evidence Presentation

### Module index

The signals index uses eight real modules: DNS, WHOIS, SSL / TLS, IP intelligence, Website, Technology, CDN, and Email security. Each row has a mono number, an Inter title, and a concise description. Rows are ruled rather than presented as eight independent cards.

### Partial-result statement

The dark landing banner explains that partial results remain useful. Its five-item illustrative trace represents returned/unavailable outcomes as a visual explanation of independent collection. It is not a live progress indicator and must not be presented as backend module completion.

### Response record

The response section presents an abridged redacted `google.com` example and can expand to the complete redacted presentation sample. It uses:

- `POST /scan` and `NORMALIZED RESPONSE` metadata;
- a code header identifying `ABRIDGED REDACTED RESPONSE` or the complete state;
- a vertical scroll area capped at `420px` by default and `720px` when expanded;
- `white-space: pre-wrap`, `overflow-wrap: anywhere`, and word breaking so the code does not force a wide page;
- a plain text disclosure, not a modal or dramatic expansion.

The sample is presentation content. It must not be treated as a new backend contract or used to infer unsupported findings, scores, severity, confidence, or verdicts.

## 11. Dark Contrast Surfaces

Dark surfaces are intentional contrast chapters, not the default for every section.

- Dark mode uses carbon/deep brown rather than a cool dashboard black.
- The dark landing shell and signals viewport use `#0D0B09`.
- Evidence article surfaces use approximately `#151311`.
- The partial-results frame uses approximately `#15110E`.
- The footer uses `#151311` in dark mode.
- Primary dark-surface text is `#F3EDE3`; supporting text uses bone/graphite relatives such as `#A89D92` and `#D8C8B3`.
- Dark rules use values such as `#3B2B22` and `#4A382B`.

The light and dark themes preserve the same semantic hierarchy. A dark mode surface must not make available, unknown, and error states indistinguishable.

## 12. Interaction Language

Interactive feedback is quiet and physical:

- links may shift a few pixels or extend a rule;
- the navbar wordmark lifts by `1px` on hover;
- menu bars widen subtly on hover and morph into a close mark when open;
- theme icons rotate/scale slightly on press;
- controls use warm focus outlines or a visible accent rule rather than browser-blue outlines;
- the signals rows shift about `3px` and reveal a short brass rule on hover/focus;
- the response disclosure changes surface/text tone without becoming a card or modal.

Focus remains visible for keyboard users. `:focus:not(:focus-visible)` suppresses mouse-only outlines, while `:focus-visible` uses a one-pixel warm focus outline with a `3px` offset. Inputs, buttons, links, disclosures, and module rows retain semantic keyboard access.

## 13. Motion System

Motion is implemented with CSS animations/transitions, `requestAnimationFrame` for the contained signals list, and `IntersectionObserver` for section visibility. No animation library, canvas, WebGL, shader, or third-party motion dependency is used.

### Actual timings and curves

- hero stage reveal: `1100ms`, `cubic-bezier(.16,1,.3,1)`;
- navbar entrance: `900ms`, same curve;
- hero headline/body/action entrance: `820ms`, with `0ms`, `90ms`, and `170ms` delays;
- section reveal: approximately `680–760ms`, with opacity, `translateY(22px)`, blur reduction, and clip-path cleanup;
- partial-results content reveals: approximately `650–760ms` with small staggered delays;
- final epilogue reveals: approximately `620–760ms` with small staggered delays;
- theme surface transition: `350ms` while `theme-transitioning` is present;
- signals list settling: `requestAnimationFrame` interpolation toward the scroll target at a `0.26` easing factor;
- domain baseline reveal: `720ms`, `cubic-bezier(.16,1,.3,1)`;
- domain error reveal: `480ms`, same premium ease;
- domain action reveal: `480ms` with a `120ms` delay.

The landing reveal hook intentionally updates visibility when an element re-enters the viewport, so sections can reveal again during normal reverse scrolling. It defaults visible when `IntersectionObserver` is unavailable.

### Reduced motion

`prefers-reduced-motion: reduce` removes or effectively minimizes animation and transition duration, disables signals-stage sticky movement, disables the landing scan-rule animation, and leaves content fully visible. State changes and focus behavior remain intact.

## 14. Domain Investigation Interaction

The hero action is a signature interaction, but it is deliberately not styled like a conventional search box.

### Resting state

The resting action is a transparent, borderless editorial invitation:

`INVESTIGATE  ↗`

It uses Inter, `18px`, weight `700`, line-height `1.1`, tracking `-.025em`, and carbon text. The arrow is an inline SVG with an `18px` box and approximately `2.15px` stroke. It sits `8px` after the label and is optically raised by `1px`. There is no container, fill, pill, or visible field border.

The interaction has a persistent one-pixel carbon baseline. A second carbon rule uses a transform reveal and becomes approximately twice as thick on hover/focus. The line travels with a `720ms` editorial ease; this is the primary resting-state feedback.

### Activation and editing

Clicking the resting button sets `editing` and focuses the real HTML input through a ref. The input occupies the same row coordinates, with no surrounding box, and preserves an accessible label (`Domain to investigate`) via a screen-reader-only label. The editable text uses Inter, `18px`, weight `500`, a transparent background, a warm caret, and a clean line-height of `54px`.

The `Analyze →` action appears only while editing. It is transparent, uppercase Inter, and aligned to the same baseline. Its reveal uses a short opacity/left-translation animation; hover moves it a few pixels without changing its color or adding a button slab.

Enter submits the same form as clicking Analyze. Existing domain validation and the hero’s application handoff are unchanged. Empty submission keeps the editing state through the button-focus handoff, suppresses the placeholder flash, and shows `Domain cannot be empty.` below the line. Clicking away from an empty field returns to the resting invitation.

### Interaction philosophy

The command surface should feel like text transforming into an investigation command, not a modal or a new screen opening. Keep the geometry stable, keep the action legible, and let the rule, caret, arrow, and typography communicate state.

## 15. Navigation

The navbar is a sticky, minimal editorial header:

- white with slight transparency in light mode and `#151311` in dark mode;
- `64px` inner height;
- `1360px` maximum inner width;
- `24px` horizontal padding at the smallest layout and `32px` from `sm`;
- `14px` backdrop blur;
- top rule in a restrained warm copper alpha value;
- no visible bottom border;
- light warm shadow for separation;
- `HostHunter` wordmark in Inter, `18px`, weight `600`, tracking `-.045em`;
- theme and menu controls are `36px` transparent icon buttons;
- action gap is approximately `1.25rem`.

The hamburger is CSS-built from two bars and morphs to a close mark. The menu expands with a `420ms` max-height transition and a shorter opacity transition. Menu links remain centered and are limited to real actions: starting a new investigation and the actual HostHunter GitHub repository.

The navbar is part of the landing entrance sequence, but its controls must remain immediately usable. Theme toggling adds the `theme-transitioning` root class for the coordinated `350ms` surface/text transition, unless reduced motion is active.

## 16. Footer

The footer is the technical colophon after the final editorial epilogue. It uses the same `1360px` frame and `24px/32px` responsive margins, with a warm off-white surface (`#FBF9F5`) in light mode and `#151311` in dark mode.

Desktop layout:

- primary grid: `1.8fr .8fr 1fr`;
- column gap: `clamp(3rem, 5vw, 5rem)`;
- minimum primary-row height: `112px`;
- top padding: `clamp(2.75rem, 4vw, 3.75rem)`;
- bottom metadata row separated by roughly `5–5.5rem`.

The primary groups are:

- HostHunter and its open-source passive-reconnaissance description;
- Project, containing the real GitHub link;
- System, containing module count, passive collection, and partial-result tolerance.

Footer labels use small uppercase Inter. Technical metadata uses restrained sans/mono treatment. The bottom row contains copyright and the open-source/GitHub metadata. A thin divider separates the colophon structure from the preceding epilogue; do not repeat the epilogue’s philosophical statement in the footer.

On mobile the three groups stack with controlled gaps, followed by the bottom metadata row. GitHub uses a small color/rule or arrow movement on hover, never a pill, filled button, or color flash.

## 17. Scanning and Results

### Scanning state

The scanning screen is a compact, truthful combined investigation state. It may communicate that HostHunter is collecting the public record, but it must not present simulated per-module completion or sequential activity unsupported by the API. When a request fails, state whether results were received, preserve an obvious retry action, and provide a route back to the landing page.

### Results hierarchy and evidence disclosure

Results begin with scan identity and orientation, then allow users to inspect module evidence and finally the raw normalized response. The overview may summarize returned observations and limitations, but it must not create a score, severity, confidence, or security verdict. Every module must make clear what was checked, what was observed, what remains unknown or incomplete, and where supporting evidence appears.

Use shared status, summary, evidence, provenance, and limitation conventions while allowing each module’s layout to suit its data. A failed or partial module remains visible; distinguish unavailable, unknown, not checked, and not detected. Pair technical terms with a short plain-language explanation at first use, while preserving the original technical value.

### Continuity and accessibility

Module navigation preserves the scan identity and keeps raw evidence available through progressive disclosure. Route or visual transitions may change paint and transforms but must never delay results after the `/scan` response is available. Preserve keyboard access, visible focus, readable contrast, reduced-motion behavior, narrow-screen layouts, and recovery paths for invalid input, request failure, and partial success.

## Implementation References

The current landing system is implemented primarily in:

- `frontend/src/components/landing/HeroSearch.jsx` — hero, signals index, evidence, partial-results banner, response record, and epilogue;
- `frontend/src/components/scanning/ScanningState.jsx` — truthful combined scan state and recovery actions;
- `frontend/src/components/results/Workspace.jsx` — results workspace, evidence navigation, and raw-response disclosure;
- `frontend/src/components/layout/Navbar.jsx` — navbar and footer;
- `frontend/src/index.css` — global tokens, responsive rules, motion, and theme surfaces;
- `frontend/src/hooks/useInView.js` — reusable viewport reveal state;
- `frontend/src/context/ThemeContext.jsx` — stored theme, system fallback, and coordinated theme transition;
- `frontend/tailwind.config.js` — palette, typography aliases, and shared animation definitions.

When extending HostHunter, first identify whether a proposed choice belongs to core identity, shared interface grammar, or landing-only composition. Preserve evidence integrity and functional immediacy before adding atmosphere.
