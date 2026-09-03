export function ScanningState({ domain }) {
  return (
    <main role="status" aria-live="polite" aria-busy="true" className="scan-transition mx-auto w-full max-w-[1360px] px-6 sm:px-8">
      <div className="scan-transition__layout">
        <div className="scan-transition__intro">
          <div className="scan-transition__eyebrow"><span aria-hidden="true" />Passive investigation</div>
          <h1>Reading the public footprint of <span>{domain}</span></h1>
          <p>HostHunter is gathering the publicly observable record for this domain and will show the returned evidence as soon as it is available.</p>
          <div className="scan-transition__dots" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </main>
  );
}
