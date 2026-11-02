"use client";

import React from "react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { Badge, OpenLink, statusTone } from "@/components/ui/primitives";
import { formatCurrency, formatDate, formatDateTimeWithSeconds } from "@/lib/format";
import type { ConstructionProject } from "@/lib/types";

export interface JobSitesViewProps {
  refreshCounter: number;
  onOpenNewProject: () => void;
  isBoardFeatureEnabled: boolean;
}

export function JobSitesView({
  refreshCounter,
  onOpenNewProject,
  isBoardFeatureEnabled,
}: JobSitesViewProps) {
  return (
    <div className="space-y-6">
      {/* 4-Phase Lifecycle Strip */}
      {isBoardFeatureEnabled && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              phase: "Pre-Construction",
              desc: "Permits, soil tests & baseline schedule",
            },
            {
              phase: "Construction",
              desc: "Grading, framing, rough MEP & inspections",
            },
            {
              phase: "Closeout",
              desc: "Punchlists, Certificate of Occupancy",
            },
            {
              phase: "Warranty",
              desc: "30-day & 11-month post-handover care",
            },
          ].map((item, i) => (
            <div
              key={item.phase}
              className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
            >
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Phase {i + 1}: {item.phase}
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      <CursorDataTable<ConstructionProject>
        title="Construction projects"
        endpoint="/projects/"
        refreshTrigger={refreshCounter}
        onAddClick={onOpenNewProject}
        addButtonLabel="New project"
        searchPlaceholder="Search by code (PRJ-101), name, PM..."
        filters={[
          {
            key: "phase",
            label: "Phase",
            options: [
              { label: "Pre-Construction", value: "Pre-Construction" },
              { label: "Construction", value: "Construction" },
              { label: "Closeout", value: "Closeout" },
              { label: "Warranty", value: "Warranty" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "On Track", value: "On Track" },
              { label: "At Risk", value: "At Risk" },
              { label: "Delayed", value: "Delayed" },
              { label: "Completed", value: "Completed" },
            ],
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Project Code & Name",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  <span className="font-mono text-amber-600 dark:text-amber-400 mr-1.5">
                    {row.code}
                  </span>
                  {row.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  PM: {row.project_manager} • {row.site_address}
                </div>
              </div>
            ),
          },
          {
            key: "phase",
            header: "Phase & Status",
            render: (row) => (
              <div className="space-y-1">
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                  {row.phase} ({row.progress_percent}%)
                </div>
              </div>
            ),
          },
          {
            key: "budget",
            header: "Budget & Progress",
            render: (row) => (
              <div>
                <div className="font-bold text-stone-900 dark:text-white">
                  {formatCurrency(row.contract_budget)}
                </div>
                <div className="h-1.5 w-28 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${row.progress_percent}%` }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "dates",
            header: "Schedule & Tasks",
            render: (row) => (
              <div className="text-xs text-stone-500 dark:text-stone-400 space-y-0.5">
                <div>Target: {formatDate(row.target_completion_date)}</div>
                <div className="font-medium text-stone-700 dark:text-stone-300">
                  {row.tasks_count} tasks • {row.costs_count} costs
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                  Created: {formatDateTimeWithSeconds(row.created_at)}
                </div>
              </div>
            ),
          },
          {
            key: "notion",
            header: "",
            className: "w-8 text-right",
            render: (row) => (
              <OpenLink href={row.notion_url} label="Open in Notion" />
            ),
          },
        ]}
      />
    </div>
  );
}
