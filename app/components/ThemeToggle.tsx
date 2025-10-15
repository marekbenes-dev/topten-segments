"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "topten-segments-theme";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const darkNow = document.documentElement.classList.contains("dark");
    setIsDark(darkNow);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  // ⬇️ Neutral markup on the server to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        aria-pressed={undefined}
        aria-label="Toggle color theme"
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
                   border-slate-300 text-slate-800 hover:bg-slate-50
                   dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/60
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        title="Switch mode placeholder"
      >
        <span aria-hidden="true" className="text-base leading-none">
          🌗
        </span>
        <span className="select-none hidden md:block">Switch Mode</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label="Switch mode"
      title="Switch mode"
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
                 border-slate-300 text-slate-800 hover:bg-slate-50
                 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/60
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {isDark ? "🌙" : "🌞"}
      </span>
      <span className="select-none hidden md:block">Switch Mode</span>
    </button>
  );
}
