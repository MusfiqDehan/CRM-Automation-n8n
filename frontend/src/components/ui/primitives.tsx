"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */
export type Tone = "gray" | "green" | "amber" | "red" | "blue" | "indigo" | "violet";

const toneClasses: Record<Tone, string> = {
  gray: "bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800",
  amber: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
  red: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800",
  blue: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
  indigo: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
  violet: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
};

export function Badge({
  tone = "gray",
  children,
  icon: Icon,
}: {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/** Maps common status words to a colour so every table reads the same way. */
export function statusTone(status: string | undefined | null): Tone {
  const s = (status || "").toLowerCase();
  // Order matters: check "problem" and "waiting" words before "good" words,
  // so that e.g. "Unpaid" or "Sent to Client" never shows as green.
  if (/(delayed|blocked|lost|flagged)/.test(s)) return "red";
  if (/(at risk|unpaid|partially|pending|review|scheduled|in progress|ordered|sent to)/.test(s)) return "amber";
  if (/(paid|done|delivered|received|completed|on track|signed|won|processed|sent)/.test(s)) return "green";
  return "gray";
}

/* ------------------------------------------------------------------ */
/* Tabs (segmented control)                                            */
/* ------------------------------------------------------------------ */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-900 border border-transparent dark:border-stone-800"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer ${
              active
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-white"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  active
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */
export function Field({
  label,
  hint,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-stone-500 dark:text-stone-400">{hint}</span>
      ) : null}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
  loading,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tone?: "indigo" | "green" | "amber" | "red";
  loading?: boolean;
  onClick?: () => void;
}) {
  const iconTone = {
    indigo: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
  }[tone];

  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card p-5 text-left ${
        onClick ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md dark:hover:border-stone-700" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</span>
        <span className={`rounded-xl p-2 ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" /> : value}
      </div>
      {hint && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/* Small inline link to an external record (e.g. Notion page)          */
/* ------------------------------------------------------------------ */
export function OpenLink({ href, label = "Open" }: { href?: string; label?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={label}
      aria-label={label}
      className="inline-flex items-center rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-amber-600 dark:hover:bg-stone-800 dark:hover:text-amber-400"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */
export function SectionIntro({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Re-export custom themed DropdownSelect                              */
/* ------------------------------------------------------------------ */
export { DropdownSelect } from "./DropdownSelect";
export type { DropdownOption, DropdownSelectProps } from "./DropdownSelect";

