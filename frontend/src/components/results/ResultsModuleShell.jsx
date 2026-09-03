export function ResultsModuleShell({ kicker, title, desc, status, lead, children }) {
  return (
    <section className="results-module-shell w-full min-w-0">
      <header className="results-module-shell__header">
        <div className="results-module-shell__kicker">{kicker}</div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
        {status && <div className="results-module-shell__status">{status}</div>}
      </header>
      {lead && <div className="results-module-shell__lead">{lead}</div>}
      <div className="results-module-shell__body w-full min-w-0">{children}</div>
    </section>
  );
}
