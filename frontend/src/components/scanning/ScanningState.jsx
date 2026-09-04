export function ScanningState({ domain, error, onRetry, onHome }) {
  const hasError = Boolean(error);

  return (
    <main role={hasError ? "alert" : "status"} aria-live={hasError ? "assertive" : "polite"} aria-busy={!hasError} className={`scan-transition mx-auto w-full max-w-[1360px] px-6 sm:px-8 ${hasError ? "scan-transition--error" : ""}`}>
      <div className="scan-transition__layout">
        <div className="scan-transition__intro">
          <div className="scan-transition__eyebrow"><span aria-hidden="true" />{hasError ? "Investigation unavailable" : "Passive investigation"}</div>
          {hasError ? (
            <>
              <h1>{error.title}</h1>
              <div className="scan-transition__error-domain">{domain}</div>
              <p>{error.detail}</p>
              <div className="scan-transition__error-actions">
                <button type="button" onClick={onRetry} autoFocus>Retry investigation <span aria-hidden="true">↗</span></button>
                <button type="button" onClick={onHome}>Back to search</button>
              </div>
            </>
          ) : (
            <>
              <h1>Reading the public footprint of <span>{domain}</span></h1>
              <p>HostHunter is gathering the publicly observable record for this domain and will show the returned evidence as soon as it is available.</p>
              <div className="scan-transition__dots" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
