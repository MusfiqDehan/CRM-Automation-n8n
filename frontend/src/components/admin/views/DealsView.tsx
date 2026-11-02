"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Edit2 } from "lucide-react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { ExecutivePipelineOverview } from "@/components/dashboard/ExecutivePipelineOverview";
import { Badge, OpenLink, statusTone } from "@/components/ui/primitives";
import { formatCurrency, formatDate, formatDateTimeWithSeconds } from "@/lib/format";
import type { DashboardSummary, Opportunity } from "@/lib/types";

export interface DealsViewProps {
  summary: DashboardSummary | null;
  refreshCounter: number;
  selectedPipelineStage: string;
  selectedReviewFilter: string;
  onFilterStage: (stage: string) => void;
  onFilterReview: () => void;
  onClearFilters: () => void;
  onOpenNewDeal: () => void;
  onEditDeal: (deal: Opportunity) => void;
  onReviewDeal: (dealSummary: { id: string; name: string }) => void;
}

export function DealsView({
  summary,
  refreshCounter,
  selectedPipelineStage,
  selectedReviewFilter,
  onFilterStage,
  onFilterReview,
  onClearFilters,
  onOpenNewDeal,
  onEditDeal,
  onReviewDeal,
}: DealsViewProps) {
  return (
    <div className="space-y-6">
      {/* Executive Sales Pipeline Visual Overview & Funnel */}
      <ExecutivePipelineOverview
        summary={summary}
        onFilterStage={onFilterStage}
        onFilterReview={onFilterReview}
        onReviewDeal={onReviewDeal}
      />

      {/* Active Filter Indicators */}
      {(selectedPipelineStage || selectedReviewFilter) && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <span className="font-semibold">Active Filter:</span>
          {selectedPipelineStage && (
            <span className="rounded-md bg-amber-200/80 px-2 py-0.5 font-bold text-amber-950 dark:bg-amber-900 dark:text-amber-100">
              Stage: {selectedPipelineStage}
            </span>
          )}
          {selectedReviewFilter && (
            <span className="rounded-md bg-rose-200/80 px-2 py-0.5 font-bold text-rose-950 dark:bg-rose-900 dark:text-rose-100">
              Needs Kevin Review
            </span>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-auto font-medium text-amber-800 underline hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Deals & Opportunities Table */}
      <CursorDataTable<Opportunity>
        title="Deals & Opportunities"
        endpoint="/opportunities/"
        refreshTrigger={refreshCounter}
        initialFilters={{
          ...(selectedPipelineStage ? { stage: selectedPipelineStage } : {}),
          ...(selectedReviewFilter ? { requires_kevin_review: selectedReviewFilter } : {}),
        }}
        onAddClick={onOpenNewDeal}
        addButtonLabel="New deal"
        searchPlaceholder="Search deals, sales owners, clients..."
        filters={[
          {
            key: "stage",
            label: "Stage",
            options: [
              { label: "1. New Enquiry", value: "1. New Enquiry" },
              { label: "2. Qualification", value: "2. Qualification" },
              {
                label: "3. Design Agreement",
                value: "3. Design Agreement",
              },
              {
                label: "4. Construction Agreement",
                value: "4. Construction Agreement",
              },
              {
                label: "5. Won",
                value: "5. Won — Handed to Ops",
              },
            ],
          },
          {
            key: "requires_kevin_review",
            label: "Kevin Review",
            options: [
              { label: "Needs Kevin's Review", value: "true" },
              { label: "Standard (No Review)", value: "false" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Newest First", value: "-created_at" },
          { label: "Value (High to Low)", value: "-estimated_value" },
          { label: "Next Follow-Up", value: "next_follow_up_date" },
        ]}
        columns={[
          {
            key: "name",
            header: "Opportunity / Home",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Client: {row.contact_name || "Unassigned"} • Owner:{" "}
                  {row.sales_owner}
                </div>
                {row.project_code && (
                  <span className="inline-block mt-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    Linked: {row.project_code}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "stage",
            header: "Stage & Agreement",
            render: (row) => (
              <div className="space-y-1">
                <Badge tone={statusTone(row.stage)}>{row.stage}</Badge>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  Build: {row.construction_agreement_status}
                </div>
              </div>
            ),
          },
          {
            key: "value",
            header: "Estimated Value & Schedule",
            render: (row) => (
              <div>
                <div className="font-bold text-stone-900 dark:text-white">
                  {formatCurrency(row.estimated_value)}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Follow-up: {formatDate(row.next_follow_up_date)}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                  Logged: {formatDateTimeWithSeconds(row.created_at)}
                </div>
              </div>
            ),
          },
          {
            key: "review",
            header: "Review Status",
            render: (row) => (
              <div>
                {row.requires_kevin_review ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Founder Review
                  </span>
                ) : (
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    Managed by Sales Lead
                  </span>
                )}
                {row.kevin_review_notes && (
                  <p className="mt-1 max-w-xl text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {row.kevin_review_notes}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-36 text-right",
            render: (row) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditDeal(row)}
                  className={`${row.requires_kevin_review ? "btn-primary" : "btn-secondary"} btn-xs`}
                  aria-label={`${row.requires_kevin_review ? "Review" : "Edit"} ${row.name}`}
                >
                  {row.requires_kevin_review ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Edit2 className="h-3.5 w-3.5" />
                  )}
                  {row.requires_kevin_review ? "Review" : "Edit"}
                </button>
                <OpenLink href={row.notion_url} label="Open in Notion" />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
