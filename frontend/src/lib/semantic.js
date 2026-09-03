// Quietly expensive semantic language — no neon, no alarmist red for Unknown.
// Preserves exact backend labels; visual is typographic + dot, not pill.
export const SEMANTIC = {
  Detected: { label: "Detected", tone: "ink", dot: "bg-ink dark:bg-stone-100" },
  Configured: { label: "Configured", tone: "ink", dot: "bg-ink dark:bg-stone-100" },
  Enabled: { label: "Enabled", tone: "ink", dot: "bg-ink dark:bg-stone-100" },
  "Not Detected": { label: "Not detected", tone: "muted", dot: "bg-stone-400" },
  "Not configured": { label: "Not configured", tone: "muted", dot: "bg-stone-400" },
  Disabled: { label: "Disabled", tone: "muted", dot: "bg-stone-400" },
  Unknown: { label: "Unknown", tone: "signal", dot: "bg-signal" },
  Unavailable: { label: "Unavailable", tone: "muted", dot: "bg-stone-400" },
  Informational: { label: "Informational", tone: "muted", dot: "bg-stone-400" },
};

export function getSemantic(label) {
  return SEMANTIC[label] || SEMANTIC.Informational;
}
