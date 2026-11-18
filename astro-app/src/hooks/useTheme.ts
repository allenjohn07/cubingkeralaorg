import { useCallback, useEffect, useState } from "react";

/**
 * Manual dark/light toggle, defaulting to dark — not a system-preference
 * auto-switch. Persisted in localStorage; the inline script in Layout.astro
 * applies the stored class before first paint so there's no flash of the
 * wrong theme on load.
 */
const STORAGE_KEY = "ck_theme";

function readStoredTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const applyTheme = useCallback((next: "light" | "dark") => {
    setTheme(next);
    // Flip the theme with transitions suspended (see `theme-switching` in
    // global.css), so every element changes color in the same frame instead
    // of `transition-colors` elements fading behind the rest. Forcing a
    // layout (offsetHeight) makes the browser compute every element's new
    // style right now, while transitions are still off; removing the class
    // two frames later then changes nothing visible.
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", next === "dark");
    void document.body.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — theme still applies for this load, just
      // won't persist across reloads.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [applyTheme, theme]);

  return { theme, toggleTheme };
}
