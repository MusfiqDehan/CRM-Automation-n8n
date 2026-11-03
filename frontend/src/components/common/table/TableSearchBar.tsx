"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

export interface TableSearchBarProps {
  /** The current search query string. */
  value: string;
  /** Callback fired whenever the search input changes. */
  onChange: (value: string) => void;
  /** Optional placeholder text. Defaults to "Search...". */
  placeholder?: string;
  /** Optional debounce delay in ms. If > 0, fires onDebounce after delay. Defaults to 0 (controlled by parent). */
  debounceMs?: number;
  /** Callback fired after the debounce timeout has elapsed. */
  onDebounce?: (debouncedValue: string) => void;
  /** Optional loading indicator (shows a spinning spinner). */
  loading?: boolean;
  /** Accessible label for the search input. */
  ariaLabel?: string;
  /** Additional container class names. */
  className?: string;
  /** Additional input class names. */
  inputClassName?: string;
  /** Size variant. Defaults to "md". */
  size?: "sm" | "md";
}

export function TableSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 0,
  onDebounce,
  loading = false,
  ariaLabel,
  className = "",
  inputClassName = "",
  size = "md",
}: TableSearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce handler if configured
  useEffect(() => {
    if (!debounceMs || !onDebounce) return;
    const timer = setTimeout(() => {
      onDebounce(internalValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onDebounce]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInternalValue(next);
    onChange(next);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    if (onDebounce) {
      onDebounce("");
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && internalValue) {
      e.preventDefault();
      handleClear();
    }
  };

  const isSmall = size === "sm";

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      {/* Left Search Icon or Loading Spinner */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
        {loading ? (
          <Loader2 className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin text-amber-600 dark:text-amber-400`} />
        ) : (
          <Search className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className={`w-full rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-amber-500 dark:focus:ring-amber-900/40 transition-colors ${
          isSmall ? "py-1.5 pl-8.5 pr-8 text-xs" : "py-2 pl-9 pr-9 text-sm"
        } ${inputClassName}`}
      />

      {/* Clear Button */}
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search (Esc)"
          aria-label="Clear search query"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors cursor-pointer"
        >
          <X className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
      )}
    </div>
  );
}
