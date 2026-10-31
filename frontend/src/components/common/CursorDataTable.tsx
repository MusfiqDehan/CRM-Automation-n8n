"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus, RefreshCw, Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: Array<{ label: string; value: string }>;
}

export interface SortOption {
  label: string;
  value: string;
}

interface CursorDataTableProps<T extends { id: string }> {
  /** Optional heading shown above the search bar. */
  title?: string;
  endpoint: string;
  columns: TableColumn<T>[];
  filters?: FilterConfig[];
  initialFilters?: Record<string, string>;
  sortOptions?: SortOption[];
  searchPlaceholder?: string;
  refreshTrigger?: number;
  onAddClick?: () => void;
  addButtonLabel?: string;
  emptyMessage?: string;
  defaultPageSize?: number;
}

export function CursorDataTable<T extends { id: string }>({
  title,
  endpoint,
  columns,
  filters = [],
  initialFilters,
  sortOptions = [],
  searchPlaceholder = "Search...",
  refreshTrigger = 0,
  onAddClick,
  addButtonLabel = "Add new",
  emptyMessage = "Nothing here yet.",
  defaultPageSize = 10,
}: CursorDataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(initialFilters || {});

  useEffect(() => {
    if (initialFilters) {
      setActiveFilters(initialFilters);
      setCursor(null);
    }
  }, [JSON.stringify(initialFilters)]);
  const [ordering, setOrdering] = useState<string>(
    sortOptions[0]?.value || "-created_at"
  );
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);

  // Debounce search input and reset cursor when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCursor(null);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string | number | undefined | null> = {
        page_size: pageSize,
        ordering,
        search: debouncedSearch || undefined,
        cursor: cursor || undefined,
        ...activeFilters,
      };
      const data = await apiClient.listPaginated<T>(endpoint, queryParams);
      setRows(data.results || []);
      setNextCursor(data.next_cursor);
      setPrevCursor(data.previous_cursor);
      setHasNext(Boolean(data.has_next));
      setHasPrev(Boolean(data.has_previous));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this list.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, pageSize, ordering, debouncedSearch, cursor, activeFilters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, refreshTrigger]);

  const handleFilterChange = (key: string, val: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: val }));
    setCursor(null);
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(activeFilters).some(Boolean);

  return (
    <div className="card relative">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 p-4 lg:flex-row lg:items-center">
        {title && (
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 lg:mr-2">{title}</h3>
        )}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="input py-2 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {filters.map((f) => (
            <DropdownSelect
              key={f.key}
              size="sm"
              fullWidth={false}
              ariaLabel={f.label}
              value={activeFilters[f.key] || ""}
              onChange={(val) => handleFilterChange(f.key, val)}
              placeholder={`${f.label}: All`}
              options={[
                { value: "", label: `${f.label}: All` },
                ...f.options.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
              buttonClassName="min-w-[120px]"
            />
          ))}

          {sortOptions.length > 1 && (
            <DropdownSelect
              size="sm"
              fullWidth={false}
              ariaLabel="Sort order"
              value={ordering}
              onChange={(val) => {
                setOrdering(val);
                setCursor(null);
              }}
              options={sortOptions.map((s) => ({
                value: s.value,
                label: `Sort: ${s.label}`,
              }))}
              buttonClassName="min-w-[130px]"
            />
          )}

          <button
            type="button"
            onClick={fetchRows}
            title="Refresh"
            aria-label="Refresh list"
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {onAddClick && (
            <button type="button" onClick={onAddClick} className="btn-primary py-2 text-xs sm:text-sm">
              <Plus className="h-4 w-4" />
              <span>{addButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-200">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    message={hasActiveFilters ? "No results match your search." : emptyMessage}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 align-middle ${col.className || ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            message={hasActiveFilters ? "No results match your search." : emptyMessage}
          />
        ) : (
          rows.map((row) => (
            <div key={row.id} className="space-y-2.5 p-4">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{columns[0]?.render(row)}</div>
              {columns.slice(1).map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-4 text-sm">
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{col.header}</span>
                  <div className="text-right text-slate-700 dark:text-slate-200">{col.render(row)}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <DropdownSelect
            size="sm"
            fullWidth={false}
            direction="up"
            ariaLabel="Rows per page"
            value={pageSize}
            onChange={(val) => {
              setPageSize(Number(val));
              setCursor(null);
            }}
            options={[
              { value: 5, label: "5" },
              { value: 10, label: "10" },
              { value: 25, label: "25" },
            ]}
            buttonClassName="min-w-[64px]"
          />
          <span>per page</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPrev || loading}
            onClick={() => setCursor(prevCursor)}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => setCursor(nextCursor)}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-400 dark:text-slate-500">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
