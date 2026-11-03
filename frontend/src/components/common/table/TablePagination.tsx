"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

export interface TablePaginationProps {
  /** Current rows per page. Defaults to 10. */
  pageSize: number;
  /** Available page size choices. Defaults to [5, 10, 25, 50]. */
  pageSizeOptions?: number[];
  /** Callback fired when page size selection changes. */
  onPageSizeChange?: (newSize: number) => void;

  // Cursor pagination controls
  /** Whether there is a previous page available via cursor. */
  hasPrevious?: boolean;
  /** Whether there is a next page available via cursor. */
  hasNext?: boolean;
  /** Handler to navigate to previous page (cursor or offset). */
  onPrevious?: () => void;
  /** Handler to navigate to next page (cursor or offset). */
  onNext?: () => void;

  // Offset / Page-based pagination controls
  /** Current active page number (1-indexed). Optional. */
  currentPage?: number;
  /** Total number of pages available. Optional. */
  totalPages?: number;
  /** Total number of items across all pages. Optional. */
  totalCount?: number;
  /** Current number of items currently visible on this page. Optional. */
  currentCount?: number;

  /** Human-readable item label (e.g., "records", "tenants", "invoices"). Defaults to "records". */
  itemLabel?: string;
  /** Whether a page transition is loading. */
  loading?: boolean;
  /** Additional container class names. */
  className?: string;
}

export function TablePagination({
  pageSize,
  pageSizeOptions = [5, 10, 25, 50],
  onPageSizeChange,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  currentPage,
  totalPages,
  totalCount,
  currentCount,
  itemLabel = "records",
  loading = false,
  className = "",
}: TablePaginationProps) {
  // Compute descriptive label for the range
  const getRangeDescription = () => {
    if (currentPage !== undefined && totalCount !== undefined) {
      const start = Math.min((currentPage - 1) * pageSize + 1, totalCount);
      const end = Math.min(start + (currentCount ?? pageSize) - 1, totalCount);
      return `Showing ${start}–${end} of ${totalCount} ${itemLabel}`;
    }
    if (totalCount !== undefined) {
      return `${totalCount} total ${itemLabel}`;
    }
    if (currentPage !== undefined && totalPages !== undefined) {
      return `Page ${currentPage} of ${totalPages}`;
    }
    return `Showing up to ${pageSize} ${itemLabel} per page`;
  };

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400 sm:flex-row ${className}`}
    >
      {/* Left: Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs">Show</span>
        {onPageSizeChange ? (
          <DropdownSelect
            size="sm"
            fullWidth={false}
            direction="up"
            ariaLabel="Rows per page"
            value={pageSize}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizeOptions.map((sz) => ({
              value: sz,
              label: String(sz),
            }))}
            buttonClassName="min-w-[64px]"
          />
        ) : (
          <span className="font-semibold text-stone-800 dark:text-stone-200 text-xs">
            {pageSize}
          </span>
        )}
        <span className="text-xs">per page</span>
      </div>

      {/* Center: Range or Summary Indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
        {loading && <Loader2 className="size-3.5 animate-spin text-amber-600 dark:text-amber-400" />}
        <span>{getRangeDescription()}</span>
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
          title="Previous page"
          aria-label="Previous page"
          className="btn-secondary btn-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={onNext}
          title="Next page"
          aria-label="Next page"
          className="btn-secondary btn-sm"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
