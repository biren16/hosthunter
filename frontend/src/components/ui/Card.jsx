export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#111827] border-slate-200 dark:border-[#1F2A44] shadow-card ${hover ? "hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action, kicker }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 pb-3">
      <div className="flex gap-3">
        {Icon && (
          <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0">
            <Icon size={16} />
          </div>
        )}
        <div>
          {kicker && <div className="text-[10px] tracking-[0.14em] font-semibold text-slate-500 dark:text-slate-400 uppercase">{kicker}</div>}
          <h3 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}

export function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-[#1F2A44] mx-5" />;
}
