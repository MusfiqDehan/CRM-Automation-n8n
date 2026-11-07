"use client";

import React from "react";
import { AlertTriangle, Clock, FileText, Sparkles } from "lucide-react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { Badge, OpenLink, statusTone } from "@/components/ui/primitives";
import { formatDate, formatDateTimeWithSeconds } from "@/lib/format";
import type { ProjectCost } from "@/lib/types";

export interface InvoicesViewProps {
  refreshCounter: number;
  onOpenNewInvoice: () => void;
  onNavigateToSimulator?: () => void;
}

export function InvoicesView({
  refreshCounter,
  onOpenNewInvoice,
  onNavigateToSimulator,
}: InvoicesViewProps) {
  return (
    <div className="space-y-6">
      {onNavigateToSimulator && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-transparent p-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-transparent">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                Part 3 Live AI Ingestion Simulator Available
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Test duplicate invoice prevention, price surge alerts, and clarification routing with one-click scenarios.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToSimulator}
            className="btn-secondary btn-xs shrink-0 self-start sm:self-auto"
          >
            Open simulator test bench
          </button>
        </div>
      )}

      <CursorDataTable<ProjectCost>
        title="Project costs & invoices"
        endpoint="/costs/"
        refreshTrigger={refreshCounter}
        onAddClick={onOpenNewInvoice}
        addButtonLabel="Ingest invoice"
        searchPlaceholder="Search supplier, invoice ref, project..."
        filters={[
          {
            key: "payment_status",
            label: "Status",
            options: [
              { label: "Unpaid", value: "Unpaid" },
              { label: "Paid", value: "Paid" },
              { label: "Partially Paid", value: "Partially Paid" },
            ],
          },
          {
            key: "needs_clarification",
            label: "Review",
            options: [
              { label: "Needs Clarification", value: "true" },
              { label: "Clean / Matched", value: "false" },
            ],
          },
        ]}
        columns={[
          {
            key: "supplier",
            header: "Supplier & Ref #",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.supplier}
                </div>
                <div className="font-mono text-xs text-amber-700 dark:text-amber-400">
                  {row.document_reference}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500">
                  {row.source_email}
                </div>
              </div>
            ),
          },
          {
            key: "project",
            header: "Linked Build",
            render: (row) => (
              <div className="text-xs">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {row.project_code || "UNLINKED"}
                </span>
                <div className="text-stone-500 dark:text-stone-400">{row.project_name}</div>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount & Status",
            render: (row) => (
              <div>
                <div className="font-bold text-stone-900 dark:text-white">
                  ${row.amount} {row.currency}
                </div>
                <div className="mt-1">
                  <Badge tone={statusTone(row.payment_status)}>
                    {row.payment_status}
                  </Badge>
                </div>
              </div>
            ),
          },
          {
            key: "event_timestamp",
            header: "Recorded / Event Time",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{formatDateTimeWithSeconds(row.event_timestamp || row.created_at)}</span>
                </div>
                {row.invoice_date && (
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Invoice Date: {formatDate(row.invoice_date)}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "clarification",
            header: "Clarification / Notes",
            render: (row) => (
              <div>
                {row.needs_clarification ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Clarification
                  </span>
                ) : (
                  <span className="text-xs text-stone-400 dark:text-stone-500">Clean</span>
                )}
                {row.clarification_notes && (
                  <p className="mt-1 max-w-2xl text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {row.clarification_notes}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "notion",
            header: "Actions",
            className: "w-28 text-right",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                {row.supporting_document_url ? (
                  <a
                    href={row.supporting_document_url}
                    target="_blank"
                    rel="noreferrer"
                    title="View rendered PDF invoice"
                    aria-label={`View PDF for ${row.document_reference}`}
                    className="btn-secondary btn-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </a>
                ) : null}
                <OpenLink href={row.notion_url} label="Open in Notion" />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

