import { getSemantic } from "../../lib/semantic";

export function Status({ label, size = "sm" }) {
  const s = getSemantic(label);
  const textTone =
    s.tone === "ink"
      ? "text-ink dark:text-stone-100"
      : s.tone === "signal"
        ? "text-[#8A7656] dark:text-signal"
        : "text-stone-500 dark:text-stone-400";
  return (
    <span className={`inline-flex items-center gap-1.5 ${size === "sm" ? "text-[11.5px]" : "text-xs"} tracking-[-0.01em] ${textTone}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}

export function StatusDot({ label }) {
  const s = getSemantic(label);
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />;
}
