"use client";

import React from "react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { Badge, OpenLink, statusTone } from "@/components/ui/primitives";
import { formatCurrency, formatDateTimeWithSeconds } from "@/lib/format";
import type { MaterialOrder } from "@/lib/types";

export interface MaterialsViewProps {
  refreshCounter: number;
}

export function MaterialsView({ refreshCounter }: MaterialsViewProps) {
  return (
    <div className="space-y-6">
      <CursorDataTable<MaterialOrder>
        title="Material Orders & Site Procurement"
        endpoint="/material-orders/"
        refreshTrigger={refreshCounter}
        searchPlaceholder="Search materials, suppliers, references..."
        filters={[
          {
            key: "status",
            label: "Delivery Status",
            options: [
              { label: "Pending", value: "Pending" },
              { label: "Ordered", value: "Ordered" },
              { label: "In Transit", value: "In Transit" },
              { label: "Delivered", value: "Delivered" },
              { label: "Delayed", value: "Delayed" },
            ],
          },
        ]}
        columns={[
          {
            key: "item",
            header: "Material / Supplier",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.item_name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {row.supplier} • Ref: {row.order_reference}
                </div>
              </div>
            ),
          },
          {
            key: "project",
            header: "Project",
            render: (row) => (
              <div className="text-xs">
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {row.project_code}
                </span>
                <div className="text-stone-500 dark:text-stone-400">{row.project_name}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status & Cost",
            render: (row) => (
              <div>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                <div className="mt-1 font-bold text-stone-900 dark:text-white text-xs">
                  {formatCurrency(row.unit_cost_total)}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                  Ordered: {formatDateTimeWithSeconds(row.created_at)}
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

