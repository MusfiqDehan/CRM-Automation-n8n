"use client";

import React from "react";
import { RefreshCw, X } from "lucide-react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface TableSortOption {
  label: string;
  value: string;
}

export interface TableFilterBarProps {
  /** Array of available filter configurations. */
  filters?: TableFilterConfig[];
  /** Key-value record of current filter selections. */
  activeFilters?: Record<string, string>;
  /** Callback fired when a filter value changes. */
  onFilterChange?: (key: string, value: string) => void;
  /** Callback to reset all filters. */
  onClearFilters?: () => void;
  /** Array of available sorting options. */
  sortOptions?: TableSortOption[];
  /** Current active sorting value. */
  activeSort?: string;
  /** Callback fired when sort option changes. */
  onSortChange?: (value: string) => void;
  /** Whether data is currently loading (spins the refresh button). */
  loading?: boolean;
  /** Callback fired when the refresh button is clicked. */
  onRefresh?: () => void;
  /** Custom action slot (e.g. "Add Record" button). */
  actions?: React.ReactNode;
  /** Whether to show active filter pill badges below the controls. Defaults to true. */
  showActivePills?: boolean;
  /** Additional container styling. */
  className?: string;
}

export function TableFilterBar({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  sortOptions = [],
  activeSort,
  onSortChange,
  loading = false,
  onRefresh,
  actions,
  showActivePills = true,
  className = "",
}: TableFilterBarProps) {
  // Identify active filters that have a non-empty value
  const activeEntries = Object.entries(activeFilters).filter(([, val]) => Boolean(val));
  const hasActiveFilters = activeEntries.length > 0;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Dynamic Filter Dropdowns */}
        {filters.map((f) => {
          const currentVal = activeFilters[f.key] || "";
          return (
            <DropdownSelect
              key={f.key}
              size="sm"
              fullWidth={false}
              ariaLabel={f.label}
              value={currentVal}
              onChange={(val) => onFilterChange?.(f.key, val)}
              placeholder={`${f.label}: All`}
              options={[
                { value: "", label: `${f.label}: All` },
                ...f.options.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
              buttonClassName={`min-w-[120px] ${
                currentVal
                  ? "border-amber-300 bg-amber-50/70 font-semibold text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
                  : ""
              }`}
            />
          );
        })}

        {/* Sort Order Dropdown */}
        {sortOptions.length > 1 && onSortChange && (
          <DropdownSelect
            size="sm"
            fullWidth={false}
            ariaLabel="Sort order"
            value={activeSort || sortOptions[0]?.value || ""}
            onChange={(val) => onSortChange(val)}
            options={sortOptions.map((s) => ({
              value: s.value,
              label: `Sort: ${s.label}`,
            }))}
            buttonClassName="min-w-[130px]"
          />
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh list"
            aria-label="Refresh data table"
            disabled={loading}
            className="btn-secondary btn-sm btn-icon"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-600 dark:text-amber-400" : ""}`} />
          </button>
        )}

        {/* Custom Actions Slot */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Active Filter Pills Bar */}
      {showActivePills && hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mr-1">
            Active filters:
          </span>
          {activeEntries.map(([key, val]) => {
            const filterConfig = filters.find((f) => f.key === key);
            const optionConfig = filterConfig?.options.find((o) => o.value === val);
            const label = filterConfig?.label || key;
            const displayVal = optionConfig?.label || val;

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <span className="font-semibold text-amber-700 dark:text-amber-400">{label}:</span>
                <span>{displayVal}</span>
                {onFilterChange && (
                  <button
                    type="button"
                    onClick={() => onFilterChange(key, "")}
                    title={`Remove ${label} filter`}
                    aria-label={`Remove filter for ${label}`}
                    className="ml-0.5 rounded p-0.5 hover:bg-amber-200/60 text-amber-700 dark:hover:bg-amber-900/60 dark:text-amber-300 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            );
          })}

          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline dark:text-stone-400 dark:hover:text-stone-200 ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

