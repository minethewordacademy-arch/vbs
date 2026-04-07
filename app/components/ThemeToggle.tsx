// app/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Initialize state directly from localStorage + system preference
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) return saved;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  // Apply theme to <html> and save to localStorage whenever `theme` changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toggle dark mode"
    >
      {theme === "light" ? (
        // Moon emoji (no external icons)
        <span className="text-2xl" role="img" aria-label="Dark mode">🌙</span>
      ) : (
        <span className="text-2xl" role="img" aria-label="Light mode">☀️</span>
      )}
    </button>
  );
}