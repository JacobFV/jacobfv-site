"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Floating bottom-right toggle. The pre-paint script in app/layout.tsx
// has already set data-theme on <html>, so we just read it on mount and
// flip on click — persisting the choice in localStorage.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current ?? "dark");
  }, []);

  if (!theme) return null;

  const next: Theme = theme === "dark" ? "light" : "dark";
  const onClick = () => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode / disabled storage — ignore */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 4,
        width: 36,
        height: 36,
        borderRadius: 999,
        border: "none",
        background: "var(--color-bg-1)",
        color: "var(--color-ink-dim)",
        boxShadow: "var(--ring-soft)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        lineHeight: 1,
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
