"use client";

import React from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "./ThemeContext";

interface ThemeToggleProps {
  variant?: "segmented" | "compact";
  className?: string;
}

export function ThemeToggle({
  variant = "segmented",
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === "compact") {
    // Single button that cycles through themes or toggles light/dark
    const toggleNext = () => {
      if (theme === "light") setTheme("dark");
      else if (theme === "dark") setTheme("system");
      else setTheme("light");
    };

    return (
      <button
        type="button"
        onClick={toggleNext}
        className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer ${className}`}
        title={`Current theme: ${theme} (click to cycle)`}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 text-indigo-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </button>
    );
  }

  const options: Array<{ id: Theme; label: string; icon: React.ElementType }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Laptop },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`inline-flex items-center rounded-xl border border-slate-200/90 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900/90 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              active
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title={`Switch to ${opt.label} mode`}
            aria-pressed={active}
          >
            <Icon
              className={`h-3.5 w-3.5 ${
                active && opt.id === "dark"
                  ? "text-indigo-500"
                  : active && opt.id === "light"
                  ? "text-amber-500"
                  : ""
              }`}
            />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

