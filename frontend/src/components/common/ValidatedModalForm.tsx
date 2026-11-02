"use client";

import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface ValidatedModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  generalError?: string | null;
  children: React.ReactNode;
}

export function ValidatedModalForm({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  generalError,
  children,
}: ValidatedModalFormProps) {
  // Close on Escape and lock background scrolling while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-up flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-stone-900 border border-transparent dark:border-stone-800 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {generalError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-sm text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}
            {children}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 px-6 py-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
