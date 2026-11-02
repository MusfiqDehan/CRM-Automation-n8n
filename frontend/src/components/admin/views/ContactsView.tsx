"use client";

import React from "react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { OpenLink } from "@/components/ui/primitives";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type { Contact } from "@/lib/types";

export interface ContactsViewProps {
  refreshCounter: number;
  onOpenNewContact: () => void;
}

export function ContactsView({
  refreshCounter,
  onOpenNewContact,
}: ContactsViewProps) {
  return (
    <div className="space-y-6">
      <CursorDataTable<Contact>
        title="Contacts & Client Inquiries"
        endpoint="/contacts/"
        refreshTrigger={refreshCounter}
        onAddClick={onOpenNewContact}
        addButtonLabel="New contact"
        searchPlaceholder="Search contacts by name, email, referral..."
        filters={[
          {
            key: "contact_type",
            label: "Type",
            options: [
              {
                label: "Prospective Client",
                value: "Prospective Client",
              },
              { label: "Active Client", value: "Active Client" },
              {
                label: "Referral Partner",
                value: "Referral Partner / Architect",
              },
            ],
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Client & Household",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {row.company_or_household || row.contact_type}
                </div>
              </div>
            ),
          },
          {
            key: "comms",
            header: "Contact Info",
            render: (row) => (
              <div className="text-xs space-y-0.5">
                <div className="text-stone-800 dark:text-stone-200 font-medium">
                  {row.email}
                </div>
                <div className="text-stone-500 dark:text-stone-400">
                  {row.phone || "No phone"} • Prefers:{" "}
                  {row.preferred_channel}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                  Added: {formatDateTimeWithSeconds(row.created_at)}
                </div>
              </div>
            ),
          },
          {
            key: "referral",
            header: "Referral & Project Scope",
            render: (row) => (
              <div className="max-w-xl text-xs">
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Source: {row.referral_source || "Direct"}
                </span>
                <p className="mt-0.5 text-stone-600 dark:text-stone-300 line-clamp-2">
                  {row.enquiry_summary || "No notes"}
                </p>
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
