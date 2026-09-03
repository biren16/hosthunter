import { useState } from "react";

export function Copyable({ value, mono = true }) {
  const [copied, setCopied] = useState(false);
  if (value === null || value === undefined || value === "") return <span className="text-stone-400 text-[12px]">—</span>;
  const str = String(value);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(str);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`group flex items-center gap-2 text-left w-full hover:opacity-80 transition ${mono ? "font-mono text-[12px]" : "text-[13px]"} text-ink dark:text-stone-100`}
      title="Copy value"
      aria-label={`Copy ${str}`}
    >
      <span className="flex-1 break-all leading-relaxed">{str}</span>
      <span className="shrink-0 text-[10px] font-sans font-semibold tracking-[.08em] uppercase text-stone-500 group-hover:text-ink dark:group-hover:text-stone-100">{copied ? "Copied" : "Copy"}</span>
      <span className="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>
    </button>
  );
}

export function Field({ label, value, mono, copy, hint }) {
  const displayValue = value === null || value === undefined || value === ""
    ? "Unknown"
    : Array.isArray(value)
      ? value.length ? value.join(", ") : "Unknown"
      : typeof value === "object"
        ? value.name || value.value || value.label || "Unknown"
        : String(value);
  return (
    <div className="results-field py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10.5px] tracking-micro uppercase text-stone-500">{label}</span>
        {hint && <span className="text-[11px] text-stone-500">{hint}</span>}
      </div>
      <div className="mt-1.5">
        {copy ? (
          <Copyable value={displayValue} mono={mono} />
        ) : (
          <span className={`${mono ? "font-mono text-[12.5px]" : "text-[13.5px] leading-relaxed"} text-ink dark:text-stone-100 break-words`}>{displayValue}</span>
        )}
      </div>
    </div>
  );
}
