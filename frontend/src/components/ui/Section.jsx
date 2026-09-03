export function Section({ kicker, title, desc, action, children, className = "" }) {
  return (
    <div className={className}>
      {(kicker || title) && (
        <div className="flex items-start justify-between gap-6 pb-6 border-b hairline">
          <div>
            {kicker && <div className="text-[11px] tracking-micro uppercase text-stone-500">{kicker}</div>}
            {title && <h2 className="font-display text-[22px] sm:text-[26px] leading-none mt-2">{title}</h2>}
            {desc && <p className="text-[13px] leading-relaxed text-stone-600 dark:text-stone-400 mt-2 max-w-[60ch]">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="pt-6">{children}</div>
    </div>
  );
}

export function Rule() {
  return <div className="h-px bg-stone-200 dark:bg-stone-800 my-8" />;
}

export function EmptyNote({ title = "Data unavailable", desc }) {
  return (
    <div className="py-8 border hairline bg-stone-50/50 dark:bg-stone-800/20 px-6">
      <div className="text-[13px] font-medium">{title}</div>
      {desc && <div className="text-[13px] leading-relaxed text-stone-600 dark:text-stone-400 mt-1 max-w-[50ch]">{desc}</div>}
    </div>
  );
}

export function ModuleErrorNote({ error }) {
  return (
    <div className="py-6 px-6 border hairline bg-[#FFF8E7] dark:bg-signal/10">
      <div className="text-[12px] tracking-micro uppercase text-stone-600">Signal unavailable</div>
      <div className="text-[13px] leading-relaxed mt-1">{error || "Data unavailable for this module — other modules remain intact."}</div>
    </div>
  );
}
