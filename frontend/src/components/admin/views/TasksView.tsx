"use client";

import React from "react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { Badge, OpenLink, statusTone } from "@/components/ui/primitives";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type { ProjectTask } from "@/lib/types";

export interface TasksViewProps {
  refreshCounter: number;
}

export function TasksView({ refreshCounter }: TasksViewProps) {
  return (
    <div className="space-y-6">
      <CursorDataTable<ProjectTask>
        title="Tasks & Milestones"
        endpoint="/tasks/"
        refreshTrigger={refreshCounter}
        searchPlaceholder="Search tasks, project codes, assigned PM..."
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
              { label: "Not Started", value: "Not Started" },
              { label: "In Progress", value: "In Progress" },
              { label: "Completed", value: "Completed" },
              { label: "Blocked", value: "Blocked" },
            ],
          },
          {
            key: "priority",
            label: "Priority",
            options: [
              { label: "High", value: "High" },
              { label: "Medium", value: "Medium" },
              { label: "Low", value: "Low" },
            ],
          },
        ]}
        columns={[
          {
            key: "title",
            header: "Milestone Task",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.title}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold mr-1">
                    {row.project_code}
                  </span>
                  • {row.project_name}
                </div>
              </div>
            ),
          },
          {
            key: "phase",
            header: "Phase & Assigned",
            render: (row) => (
              <div className="text-xs">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {row.phase}
                </span>
                <div className="text-stone-500 dark:text-stone-400 mt-0.5">{row.assigned_to}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status & Priority",
            render: (row) => (
              <div className="space-y-1">
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {row.priority} Priority
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                  Logged: {formatDateTimeWithSeconds(row.created_at)}
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
