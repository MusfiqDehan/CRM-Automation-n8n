"use client";

import React from "react";
import { Clock, Mail, Play, RefreshCw, Settings } from "lucide-react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { Badge } from "@/components/ui/primitives";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type { EmailCommunicationLog } from "@/lib/types";

export interface EmailActivityViewProps {
  refreshCounter: number;
  dispatchingEmail: string | null;
  onTriggerEmail: (payload: {
    client_email: string;
    client_name: string;
    project_code: string;
    email_type: string;
    keyLabel: string;
  }) => void;
  onOpenSmtpSettings: () => void;
}

export function EmailActivityView({
  refreshCounter,
  dispatchingEmail,
  onTriggerEmail,
  onOpenSmtpSettings,
}: EmailActivityViewProps) {
  return (
    <div className="space-y-6">
      {/* Live Email Automation Trigger Bar */}
      <div className="card space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Mail className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Live Part 3 Assessment Email Automation Test Bench
              </h3>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Trigger real client communications and founder review alerts delivered via Gmail SMTP SSL (<span className="font-mono">smtp.gmail.com:465</span>).
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSmtpSettings}
            className="btn-secondary btn-sm self-start sm:self-auto"
          >
            <Settings className="h-3.5 w-3.5" />
            Email settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Client 1 Trigger */}
          <button
            type="button"
            disabled={dispatchingEmail !== null}
            onClick={() =>
              onTriggerEmail({
                client_email: "musfiq.works+client1@gmail.com",
                client_name: "Arthur & Clara Henderson",
                project_code: "PRJ-101",
                email_type: "milestone_update",
                keyLabel: "client1",
              })
            }
            className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
              <span>Arthur Henderson (PRJ-101)</span>
              {dispatchingEmail === "client1" ? (
                <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
              ) : (
                <Play className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
              musfiq.works+client1@gmail.com
            </div>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Milestone Update: Phase 2 Structural Framing Approved
            </p>
          </button>

          {/* Client 2 Trigger */}
          <button
            type="button"
            disabled={dispatchingEmail !== null}
            onClick={() =>
              onTriggerEmail({
                client_email: "musfiq.works+client2@gmail.com",
                client_name: "Dr. Elena Rostova",
                project_code: "PRJ-102",
                email_type: "design_agreement",
                keyLabel: "client2",
              })
            }
            className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
              <span>Dr. Elena Rostova (PRJ-102)</span>
              {dispatchingEmail === "client2" ? (
                <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
              ) : (
                <Play className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
              musfiq.works+client2@gmail.com
            </div>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Design Agreement Ready: $4.1M Coastal Villa
            </p>
          </button>

          {/* Founder Review Alert Trigger */}
          <button
            type="button"
            disabled={dispatchingEmail !== null}
            onClick={() =>
              onTriggerEmail({
                client_email: "musfiq.works@gmail.com",
                client_name: "Dr. Elena Rostova",
                project_code: "PRJ-102",
                email_type: "review_alert",
                keyLabel: "founder",
              })
            }
            className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
              <span>Kevin / Founder Alert</span>
              {dispatchingEmail === "founder" ? (
                <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
              ) : (
                <Play className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
              musfiq.works@gmail.com
            </div>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Action Required: Scope &amp; Structural Margin Review
            </p>
          </button>
        </div>
      </div>

      <CursorDataTable<EmailCommunicationLog>
        title="Inbound & Outbound Email Automation Logs"
        endpoint="/email-logs/"
        refreshTrigger={refreshCounter}
        searchPlaceholder="Search sender, recipient, subject..."
        filters={[
          {
            key: "direction",
            label: "Direction",
            options: [
              { label: "Inbound", value: "Inbound" },
              { label: "Outbound", value: "Outbound" },
            ],
          },
        ]}
        columns={[
          {
            key: "subject",
            header: "Subject & Attachment",
            render: (row) => (
              <div>
                <div className="font-semibold text-stone-900 dark:text-white">
                  {row.subject}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate max-w-xl">
                  {row.body_preview}
                </div>
                {row.attachment_name && (
                  <span className="inline-block mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    PDF: {row.attachment_name}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "parties",
            header: "Sender / Recipient",
            render: (row) => (
              <div className="text-xs space-y-0.5 text-stone-600 dark:text-stone-400">
                <div>From: {row.sender}</div>
                <div>To: {row.recipient}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Direction & Status",
            render: (row) => (
              <div className="space-y-1">
                <Badge tone={row.direction === "Inbound" ? "blue" : "green"}>
                  {row.direction}
                </Badge>
                <div className="text-xs text-stone-500 dark:text-stone-400">{row.status}</div>
              </div>
            ),
          },
          {
            key: "time",
            header: "Exact Log Time",
            render: (row) => (
              <div className="text-xs text-stone-700 dark:text-stone-300 font-mono flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-stone-400 shrink-0" />
                <span>{formatDateTimeWithSeconds(row.created_at)}</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

