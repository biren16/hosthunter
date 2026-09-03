import { useState } from "react";
import { useTheme } from "../../context/useTheme";

export function Navbar({ onHome, showNewScan }) {
  const { toggle, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const returnHome = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      document.documentElement.classList.remove("home-returning");
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add("home-returning");
      window.setTimeout(() => document.documentElement.classList.remove("home-returning"), 720);
    }
    setMenuOpen(false);
    onHome();
  };
  const toggleMenu = () => setMenuOpen((open) => !open);
  return (
    <header className={`site-navbar relative sticky top-0 z-40 bg-white/95 dark:bg-[#151311]/95 backdrop-blur-[14px] ${showNewScan ? "" : "site-navbar--landing"}`}>
      <div className="site-navbar__inner mx-auto max-w-[1360px] px-6 sm:px-8 h-[64px] flex items-center gap-6">
        <button onClick={returnHome} aria-label="Return to HostHunter home" className="site-navbar__brand group">
          <span className="site-navbar__wordmark">HostHunter</span>
        </button>

        <div className="site-navbar__actions ml-auto flex items-center gap-4">
          <button onClick={toggle} aria-label="Toggle theme" aria-pressed={isDark} className="theme-toggle">
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93 5.64 5.64M18.36 18.36 19.07 19.07M2 12h2M20 12h2M6.34 17.66 5.63 18.37M19.07 4.93 18.36 5.64"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={toggleMenu} aria-label="Toggle navigation menu" aria-expanded={menuOpen} aria-controls="site-menu" className={`menu-toggle ${menuOpen ? "is-open" : ""}`}>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <div id="site-menu" className={`site-navbar__menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="site-navbar__menu-inner mx-auto max-w-[1360px] px-6 sm:px-8">
          <button onClick={returnHome} tabIndex={menuOpen ? 0 : -1}>Start a new investigation <span>↗</span></button>
          <a href="https://github.com/biren16/hosthunter" target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1}>GitHub <span>↗</span></a>
        </div>
      </div>
    </header>
  );
}

export function Footer({ variant = "default" }) {
  return (
    <footer className={`site-footer site-footer--${variant} mt-auto`}>
      <div className="site-footer__inner mx-auto max-w-[1360px] px-6 sm:px-8">
        <div className="site-footer__main">
          <div className="site-footer__identity">
            <div className="site-footer__brand">HostHunter</div>
            <p>Open-source passive reconnaissance<br className="hidden sm:block" /> for inspectable domain intelligence.</p>
          </div>
          <div className="site-footer__group">
            <span className="site-footer__label">Project</span>
            <a href="https://github.com/biren16/hosthunter" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
          <div className="site-footer__group">
            <span className="site-footer__label">System</span>
            <span>8 intelligence modules</span>
            <span>Passive collection</span>
            <span>Partial-result tolerant</span>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 HostHunter</span>
          <span>Open source · <a href="https://github.com/biren16/hosthunter" target="_blank" rel="noreferrer">GitHub ↗</a></span>
        </div>
      </div>
    </footer>
  );
}
