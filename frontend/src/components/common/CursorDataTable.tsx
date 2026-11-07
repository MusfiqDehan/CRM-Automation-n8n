"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  TableSearchBar,
  TableFilterBar,
  TablePagination,
  TableEmptyState,
  type TableColumn,
  type FilterConfig,
  type SortOption,
} from "./table";

export type { TableColumn, FilterConfig, SortOption };

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

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchInput("");
    setDebouncedSearch("");
    setCursor(null);
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(activeFilters).some(Boolean);

  return (
    <div className="card relative">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-stone-100 dark:border-stone-800 p-4 lg:flex-row lg:items-center">
        {title && (
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 lg:mr-2">{title}</h3>
        )}
        <TableSearchBar
          value={searchInput}
          onChange={(val) => setSearchInput(val)}
          onDebounce={(val) => {
            setDebouncedSearch(val);
            setCursor(null);
          }}
          debounceMs={280}
          placeholder={searchPlaceholder}
          ariaLabel={searchPlaceholder}
          className="lg:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <TableFilterBar
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            sortOptions={sortOptions.length > 1 ? sortOptions : []}
            activeSort={ordering}
            onSortChange={(val) => {
              setOrdering(val);
              setCursor(null);
            }}
            loading={loading}
            onRefresh={fetchRows}
            showActivePills={false}
            actions={
              onAddClick ? (
                <button type="button" onClick={onAddClick} className="btn-primary btn-sm">
                  <Plus className="h-4 w-4" />
                  {addButtonLabel}
                </button>
              ) : null
            }
          />
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
            <tr className="border-b border-stone-100 dark:border-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-sm text-stone-700 dark:text-stone-200">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <TableEmptyState
                    message={hasActiveFilters ? "No results match your search." : emptyMessage}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
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
      <div className="divide-y divide-stone-100 dark:divide-stone-800 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-2.5 p-4" aria-hidden="true">
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <TableEmptyState
            message={hasActiveFilters ? "No results match your search." : emptyMessage}
          />
        ) : (
          rows.map((row) => (
            <div key={row.id} className="space-y-2.5 p-4">
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{columns[0]?.render(row)}</div>
              {columns.slice(1).map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-4 text-sm">
                  <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">{col.header}</span>
                  <div className="text-right text-stone-700 dark:text-stone-200">{col.render(row)}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <TablePagination
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCursor(null);
        }}
        hasPrevious={hasPrev}
        hasNext={hasNext}
        onPrevious={() => setCursor(prevCursor)}
        onNext={() => setCursor(nextCursor)}
        loading={loading}
      />
    </div>
  );
}
