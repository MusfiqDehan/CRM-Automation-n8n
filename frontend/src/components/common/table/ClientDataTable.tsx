"use client";

import React, { useMemo, useState } from "react";
import { TableSearchBar } from "./TableSearchBar";
import { TableFilterBar, type TableFilterConfig, type TableSortOption } from "./TableFilterBar";
import { TablePagination } from "./TablePagination";
import { TableEmptyState } from "./TableEmptyState";

export interface ClientTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface ClientDataTableProps<T extends { id?: string | number }> {
  /** Optional title shown in the toolbar. */
  title?: string;
  /** Optional subtitle or description. */
  description?: string;
  /** Full list of data items. */
  items: T[];
  /** Column definitions. */
  columns: ClientTableColumn<T>[];
  /** Keys or accessor functions used to filter rows when searching. */
  searchKeys?: Array<keyof T | ((item: T) => string | number | undefined | null)>;
  /** Search input placeholder. Defaults to "Search...". */
  searchPlaceholder?: string;
  /** Available filter configurations. */
  filters?: TableFilterConfig[];
  /** Custom filter matching function. Optional. */
  filterMatcher?: (item: T, key: string, filterValue: string) => boolean;
  /** Available sorting options. */
  sortOptions?: TableSortOption[];
  /** Custom sorting comparator. Optional. */
  sortComparator?: (a: T, b: T, sortKey: string) => number;
  /** Default page size. Defaults to 10. */
  defaultPageSize?: number;
  /** Available page sizes. Defaults to [5, 10, 25, 50]. */
  pageSizeOptions?: number[];
  /** Action buttons rendered on the right side of toolbar. */
  actions?: React.ReactNode;
  /** Message displayed when no items match. */
  emptyMessage?: string;
  /** Item label for the pagination summary (e.g. "users", "tenants"). */
  itemLabel?: string;
  /** Optional custom class name per row (e.g. for selection or highlight). */
  rowClassName?: (item: T) => string;
  /** Additional container styling. */
  className?: string;
}

export function ClientDataTable<T extends { id?: string | number }>({
  title,
  description,
  items,
  columns,
  searchKeys = [],
  searchPlaceholder = "Search...",
  filters = [],
  filterMatcher,
  sortOptions = [],
  sortComparator,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  actions,
  emptyMessage = "No records found.",
  itemLabel = "records",
  rowClassName,
  className = "",
}: ClientDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeSort, setActiveSort] = useState<string>(sortOptions[0]?.value || "");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  // 1. Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Check search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        let matched = false;

        if (searchKeys.length > 0) {
          matched = searchKeys.some((k) => {
            const val = typeof k === "function" ? k(item) : item[k];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
          });
        } else {
          // Default: match all string/number properties on item
          matched = Object.values(item).some((val) => {
            if (typeof val === "string" || typeof val === "number") {
              return String(val).toLowerCase().includes(query);
            }
            return false;
          });
        }

        if (!matched) return false;
      }

      // Check active filters
      for (const [key, filterVal] of Object.entries(activeFilters)) {
        if (!filterVal) continue;
        if (filterMatcher) {
          if (!filterMatcher(item, key, filterVal)) return false;
        } else {
          const itemVal = (item as Record<string, unknown>)[key];
          if (typeof itemVal === "boolean") {
            const boolVal = filterVal === "true";
            if (itemVal !== boolVal) return false;
          } else if (itemVal !== undefined && itemVal !== null) {
            if (String(itemVal).toLowerCase() !== filterVal.toLowerCase()) return false;
          } else {
            return false;
          }
        }
      }

      return true;
    });
  }, [items, search, searchKeys, activeFilters, filterMatcher]);

  // 2. Sort items
  const sortedItems = useMemo(() => {
    if (!activeSort) return filteredItems;
    if (sortComparator) {
      return [...filteredItems].sort((a, b) => sortComparator(a, b, activeSort));
    }

    const isDesc = activeSort.startsWith("-");
    const sortField = isDesc ? activeSort.substring(1) : activeSort;

    return [...filteredItems].sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortField];
      const valB = (b as Record<string, unknown>)[sortField];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return isDesc ? 1 : -1;
      if (valB === undefined || valB === null) return isDesc ? -1 : 1;

      if (typeof valA === "number" && typeof valB === "number") {
        return isDesc ? valB - valA : valA - valB;
      }

      const comp = String(valA).localeCompare(String(valB));
      return isDesc ? -comp : comp;
    });
  }, [filteredItems, activeSort, sortComparator]);

  // 3. Paginate items
  const totalCount = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, safePage, pageSize]);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearch("");
    setCurrentPage(1);
  };

  const hasSearchOrFilters = Boolean(search) || Object.values(activeFilters).some(Boolean);

  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-stone-100 dark:border-stone-800 p-4 lg:flex-row lg:items-center justify-between">
        <div className="min-w-0">
          {title && (
            <h3 className="text-base font-bold text-stone-900 dark:text-white truncate">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
          <TableSearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="sm:w-64"
          />

          <TableFilterBar
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            sortOptions={sortOptions}
            activeSort={activeSort}
            onSortChange={(val) => {
              setActiveSort(val);
              setCurrentPage(1);
            }}
            actions={actions}
            showActivePills={false}
          />
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {hasSearchOrFilters && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 px-4 py-2 bg-stone-50/60 dark:bg-stone-950/40 text-xs">
          <span className="font-semibold text-stone-500 dark:text-stone-400">
            Active filters ({totalCount} matches):
          </span>
          {search && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              Query: &ldquo;{search}&rdquo;
              <button
                type="button"
                onClick={() => setSearch("")}
                className="hover:text-amber-950 dark:hover:text-amber-100"
              >
                ✕
              </button>
            </span>
          )}
          {Object.entries(activeFilters).map(([k, v]) => {
            if (!v) return null;
            const filterLabel = filters.find((f) => f.key === k)?.label || k;
            return (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
              >
                {filterLabel}: {v}
                <button
                  type="button"
                  onClick={() => handleFilterChange(k, "")}
                  className="hover:text-amber-950 dark:hover:text-amber-100"
                >
                  ✕
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={handleClearFilters}
            className="font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-400">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-stone-700 dark:text-stone-200">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <TableEmptyState
                    message={hasSearchOrFilters ? "No records match your search or filter." : emptyMessage}
                  />
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const customCls = rowClassName ? rowClassName(item) : "";
                return (
                  <tr
                    key={item.id !== undefined ? String(item.id) : idx}
                    className={`transition hover:bg-stone-50/75 dark:hover:bg-stone-800/40 ${customCls}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 align-middle ${col.className || ""}`}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="divide-y divide-stone-100 dark:divide-stone-800 md:hidden">
        {paginatedItems.length === 0 ? (
          <TableEmptyState
            message={hasSearchOrFilters ? "No records match your search or filter." : emptyMessage}
          />
        ) : (
          paginatedItems.map((item, idx) => {
            const customCls = rowClassName ? rowClassName(item) : "";
            return (
              <div key={item.id !== undefined ? String(item.id) : idx} className={`space-y-2.5 p-4 text-xs ${customCls}`}>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {columns[0]?.render(item)}
                </div>
                {columns.slice(1).map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-4">
                    <span className="shrink-0 text-stone-500 dark:text-stone-400 font-medium">{col.header}</span>
                    <div className="text-right text-stone-700 dark:text-stone-200">{col.render(item)}</div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Reusable Pagination */}
      <TablePagination
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        hasPrevious={safePage > 1}
        hasNext={safePage < totalPages}
        onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
        currentCount={paginatedItems.length}
        itemLabel={itemLabel}
      />
    </div>
  );
}
