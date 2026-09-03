import { useState } from "react";

export function Disclosure({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#243045] bg-slate-50/60 dark:bg-[#0B0F19]/60 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-white dark:hover:bg-[#111827] transition">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          {title}
          {count !== undefined && <span className="text-[11px] font-mono bg-white dark:bg-[#1A2236] border border-slate-200 dark:border-[#243045] px-1.5 py-0.5 rounded">{count}</span>}
        </span>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>
      <div className={`grid transition-all ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
