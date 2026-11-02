"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Info, TriangleAlert, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */
type ModalSize = "sm" | "md" | "lg" | "xl";

const modalWidths: Record<ModalSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

const ModalTitleContext = React.createContext<string | undefined>(undefined);

/**
 * Shared dialog shell: a bottom sheet on phones and a centred panel from
 * `sm` up. Handles Escape, backdrop dismissal, and background scroll lock.
 */
export function Modal({
  isOpen,
  onClose,
  size = "md",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-fade-up flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-stone-200/80 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:rounded-3xl ${modalWidths[size]}`}
      >
        <ModalTitleContext.Provider value={titleId}>{children}</ModalTitleContext.Provider>
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  icon,
  onClose,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Leading visual: brand mark or an icon tile. */
  icon?: React.ReactNode;
  onClose: () => void;
  /** Optional content rendered under the title row (e.g. status chips). */
  children?: React.ReactNode;
}) {
  const titleId = React.useContext(ModalTitleContext);
  return (
    <div className="shrink-0 border-b border-stone-100 px-5 py-4 dark:border-stone-800 sm:px-6">
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-base font-semibold text-stone-900 dark:text-stone-100 sm:text-lg">
            {title}
          </h2>
          {subtitle && <div className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 sm:text-sm">{subtitle}</div>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="btn-ghost btn-icon -mr-2 -mt-1">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** Icon tile used as a modal or section leading visual. */
export function IconTile({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function ModalBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 ${className}`}>{children}</div>;
}

/**
 * Action bar pinned to the bottom of a modal. Buttons right-align on desktop
 * (secondary then primary) and stack full-width with the primary on top on
 * phones. An optional `hint` sits on the left.
 */
export function ModalFooter({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-stone-100 bg-stone-50/70 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/50 sm:flex-row sm:items-center sm:px-6">
      {hint && <div className="text-xs text-stone-500 dark:text-stone-400 sm:mr-auto">{hint}</div>}
      <div className="flex flex-col-reverse gap-2 *:w-full sm:ml-auto sm:flex-row sm:items-center sm:*:w-auto">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal section tabs (underline style, scrolls horizontally)          */
/* ------------------------------------------------------------------ */
export function ModalTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: Array<{ id: T; label: string; icon?: React.ElementType; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-stone-100 px-3 dark:border-stone-800 sm:px-4"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition sm:text-sm ${
              active
                ? "border-amber-500 text-stone-900 dark:border-amber-400 dark:text-stone-100"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            {Icon && (
              <Icon className={`h-4 w-4 ${active ? "text-amber-600 dark:text-amber-400" : ""}`} />
            )}
            {t.label}
            {typeof t.count === "number" && (
              <span className="rounded-full bg-stone-100 px-1.5 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
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
/* Inline alert                                                        */
/* ------------------------------------------------------------------ */
type AlertTone = "success" | "error" | "warning" | "info";

const alertStyles: Record<AlertTone, { box: string; icon: React.ElementType }> = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    box: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: AlertCircle,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    icon: TriangleAlert,
  },
  info: {
    box: "border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-300",
    icon: Info,
  },
};

export function InlineAlert({
  tone,
  title,
  children,
  onDismiss,
  className = "",
}: {
  tone: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const { box, icon: Icon } = alertStyles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm ${box} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="break-words">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-m-1 cursor-pointer rounded-md p-1 opacity-70 transition hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className = "",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-stone-800 dark:text-stone-200">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-amber-900 ${
          checked ? "bg-amber-400" : "bg-stone-200 dark:bg-stone-700"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action menu                                                         */
/* ------------------------------------------------------------------ */
export interface ActionMenuItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  onSelect: () => void;
  /** Visibility classes (e.g. `lg:hidden`) when an item duplicates a visible control. */
  className?: string;
}

export interface ActionMenuSection {
  label?: string;
  items: ActionMenuItem[];
  /** Visibility classes for the whole group, including its divider. */
  className?: string;
}

/**
 * Dropdown menu for grouped page-level actions. The trigger is a regular
 * button styled by the caller so it can match primary or secondary emphasis.
 */
export function ActionMenu({
  ariaLabel,
  triggerClassName,
  triggerContent,
  showChevron = true,
  sections,
  align = "right",
  widthClassName = "w-72",
}: {
  ariaLabel: string;
  triggerClassName: string;
  triggerContent: React.ReactNode;
  showChevron?: boolean;
  sections: ActionMenuSection[];
  align?: "left" | "right";
  widthClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visibleSections = sections.filter((s) => s.items.length > 0);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {triggerContent}
        {showChevron && (
          <ChevronDown className={`hidden h-3.5 w-3.5 opacity-70 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          className={`animate-fade-up absolute top-full z-50 mt-2 max-h-[70dvh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto max-sm:max-w-none border-stone-200/90 bg-white p-1.5 shadow-xl dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/50 ${widthClassName} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {visibleSections.map((section, idx) => (
            <div
              key={section.label ?? idx}
              role="group"
              aria-label={section.label}
              className={`${idx > 0 ? "mt-1 border-t border-stone-100 pt-1 dark:border-stone-800" : ""} ${section.className ?? ""}`}
            >
              {section.label && (
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800 ${
                      item.className ?? ""
                    }`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-stone-800 dark:text-stone-100">{item.label}</span>
                      {item.description && (
                        <span className="block text-xs text-stone-500 dark:text-stone-400">{item.description}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
