import { pillClass } from "../../lib/semantic";

export function Pill({ label, size = "sm", dot = false }) {
  const cls = pillClass(label);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide ${cls} ${
        size === "xs" ? "px-2 py-0.5 text-[10px]" : size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${label === "Unknown" ? "bg-amber-500" : label === "Detected" || label === "Enabled" || label === "Configured" ? "bg-emerald-500" : "bg-slate-400"}`} />}
      {label}
    </span>
  );
}

export function StatusDot({ label }) {
  const color =
    label === "Unknown"
      ? "bg-amber-400"
      : label === "Detected" || label === "Enabled" || label === "Configured"
        ? "bg-emerald-500"
        : label === "Informational"
          ? "bg-sky-500"
          : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
