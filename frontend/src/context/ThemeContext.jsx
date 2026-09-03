import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeContext } from "./themeContext";

export function ThemeProvider({ children }) {
  const transitionTimer = useRef(0);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("hh-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("hh-theme", theme);
  }, [theme]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimer.current);
    document.documentElement.classList.remove("theme-transitioning");
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(transitionTimer.current);
    if (!reduceMotion) root.classList.add("theme-transitioning");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    if (!reduceMotion) transitionTimer.current = window.setTimeout(() => root.classList.remove("theme-transitioning"), 380);
  };

  return <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>{children}</ThemeContext.Provider>;
}
