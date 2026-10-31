"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Link2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";

interface ResourceHubProps {
  summary: DashboardSummary | null;
  apiBase: string;
  onSyncNotion: () => void;
  syncingNotion: boolean;
}

export function ResourceHub({
  summary,
  apiBase,
  onSyncNotion,
  syncingNotion,
}: ResourceHubProps) {
  const notionCfg = summary?.notion_workspace;
  const hubUrl =
    notionCfg?.hub_page_url ||
    "https://app.notion.com/p/Kevin-s-Construction-OS-4098194ec3e8811ab5b1c1b79f62bce1";
  const salesDashboardUrl = notionCfg?.sales_dashboard_url;
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678";

  return (
    <div className="space-y-6 pb-12">
      {/* Header Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-xl font-bold text-white">
              Resource Hub &amp; Executive Integrations
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
            Quick access to connected production workspaces, automated n8n workflows,
            executive solution blueprints, and downloadable documentation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`${apiBase}/docs/download/pdf/`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Executive Blueprint (.pdf)</span>
          </a>
          <a
            href={`${apiBase}/docs/download/docx/`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Solution Document (.docx)</span>
          </a>
          <button
            type="button"
            onClick={onSyncNotion}
            disabled={syncingNotion}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-blue-400 ${
                syncingNotion ? "animate-spin" : ""
              }`}
            />
            <span>{syncingNotion ? "Syncing..." : "Sync Notion"}</span>
          </button>
        </div>
      </div>

      {/* Connected Workspaces & External Systems */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>Connected Production Systems &amp; Workspaces</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Notion OS Hub Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                  N
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Live Synced
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Notion Construction OS Hub
              </h4>
              <p className="text-xs text-slate-300">
                The centralized collaborative workspace for clients, architects, and site managers.
                Hosts all databases, milestone checklists, and project records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <a
                href={hubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>Open Notion Hub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-slate-400">Direct Page Link</span>
            </div>
          </div>

          {/* Notion Sales Dashboard Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
                  CRM
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Kanban Board
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Notion Sales Pipeline Board
              </h4>
              <p className="text-xs text-slate-300">
                Visual Kanban board tracking opportunities from New Enquiry through Qualification,
                Design Agreement, and Construction Agreement.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              {salesDashboardUrl ? (
                <a
                  href={salesDashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  <span>Open Sales Board</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Configured in Hub</span>
              )}
              <span className="text-[11px] text-slate-400">Visual Pipeline</span>
            </div>
          </div>

          {/* n8n Automation Engine Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Port 5678
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                n8n Automation Engine
              </h4>
              <p className="text-xs text-slate-300">
                Autonomous workflow orchestrator executing inbound email webhooks, PDF OCR parsing,
                project matching logic, and stakeholder notification dispatches.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <a
                href={n8nUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
              >
                <span>Launch n8n UI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-slate-400">Workflow Canvas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & System Guarantees */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Enterprise Reliability &amp; Data Governance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="font-semibold text-emerald-300 mb-1">
              Duplicate Prevention
            </div>
            <p className="text-slate-400">
              Invoices are hashed by document reference and supplier to prevent duplicate disbursements or double counts.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="font-semibold text-amber-300 mb-1">
              Variance &amp; Scope Escalation
            </div>
            <p className="text-slate-400">
              Any invoice exceeding budget thresholds or missing project codes is automatically routed to Kevin&apos;s Review Queue.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="font-semibold text-blue-300 mb-1">
              Audited Communication Log
            </div>
            <p className="text-slate-400">
              All inbound and outbound emails, verification notices, and status updates are persisted with full audit timestamps.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Architecture & Workflow Diagram */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              End-to-End System Architecture Diagram
            </h3>
            <p className="text-xs text-slate-400">
              Complete blueprint showing data flow between client channels, PostgreSQL, n8n automations, and Notion OS
            </p>
          </div>
          <a
            href={`${apiBase}/docs/download/diagram/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Open High-Res Diagram</span>
          </a>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-800 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${apiBase}/docs/download/diagram/`}
            alt="Kevin's Construction OS Architecture & Workflow Diagram"
            className="w-full h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

