export function EmptyState({ title = "Data Unavailable", desc = "This module returned no data or timed out.", icon: Icon }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#2A3652] bg-slate-50 dark:bg-[#0F172A]/50 px-4 py-6 text-center">
      {Icon && <div className="mx-auto h-8 w-8 rounded-lg bg-white dark:bg-[#1A2236] border border-slate-200 dark:border-[#243045] flex items-center justify-center mb-2 text-slate-400"><Icon size={16} /></div>}
      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[28ch] mx-auto leading-relaxed">{desc}</div>
    </div>
  );
}

export function ModuleError({ error }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-4">
      <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Module Timeout
      </div>
      <div className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1 break-words">{error || "Data Unavailable for this module. Other modules are still rendered."}</div>
    </div>
  );
}
