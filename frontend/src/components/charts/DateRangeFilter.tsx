"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, RefreshCw, X } from "lucide-react";

export type DateRangePreset = "7d" | "30d" | "90d" | "ytd" | "all" | "custom";

export interface DateRangeFilterProps {
  activePreset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  onChange: (preset: DateRangePreset, startDate?: string, endDate?: string) => void;
  className?: string;
  loading?: boolean;
}

const PRESETS: Array<{ id: DateRangePreset; label: string; short: string }> = [
  { id: "7d", label: "Last 7 Days", short: "7D" },
  { id: "30d", label: "Last 30 Days", short: "30D" },
  { id: "90d", label: "Last 90 Days", short: "90D" },
  { id: "ytd", label: "Year to Date", short: "YTD" },
  { id: "all", label: "All Time", short: "All" },
];

export function DateRangeFilter({
  activePreset,
  startDate = "",
  endDate = "",
  onChange,
  className = "",
  loading = false,
}: DateRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(activePreset === "custom");
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handlePresetClick = (preset: DateRangePreset) => {
    setCustomOpen(false);
    onChange(preset);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onChange("custom", customStart, customEnd);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Segmented Preset Buttons */}
      <div className="inline-flex rounded-xl border border-stone-200/80 bg-stone-100/80 p-1 dark:border-stone-800 dark:bg-stone-900">
        {PRESETS.map((p) => {
          const isActive = activePreset === p.id && !customOpen;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-white"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              <span className="hidden sm:inline">{p.label}</span>
              <span className="sm:hidden">{p.short}</span>
            </button>
          );
        })}

        {/* Custom Range Toggle Button */}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
            activePreset === "custom" || customOpen
              ? "bg-amber-400 text-stone-950 shadow-xs"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
          aria-expanded={customOpen}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Custom</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${customOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {loading && (
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
      )}

      {/* Expandable Custom Date Range Inputs */}
      {customOpen && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40 animate-fade-up"
        >
          <div className="flex items-center gap-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium">From:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 outline-none focus:border-amber-400 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium">To:</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 outline-none focus:border-amber-400 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-3 py-1 font-bold text-stone-950 hover:bg-amber-300 transition cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomOpen(false);
              onChange("30d");
            }}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            aria-label="Close custom range"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
