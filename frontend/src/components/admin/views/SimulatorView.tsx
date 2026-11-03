"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Play,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type { SimulatorTriggerResponse } from "@/lib/types";

export interface SimulatorViewProps {
  runningScenario: string | null;
  lastSimulation: SimulatorTriggerResponse | null;
  onRunScenario: (scenarioKey: string) => void;
  onNavigateToInvoices?: () => void;
}

const SCENARIOS = [
  {
    key: "1_unpaid_invoice",
    title: "1. Unpaid Invoice Ingestion",
    desc: "Sierra HVAC • $18.5k Unpaid • PRJ-101 (Clean import to Notion & DB)",
    tag: "Standard Import",
    tagTone: "blue",
  },
  {
    key: "2_paid_receipt",
    title: "2. Paid Receipt Ingestion",
    desc: "Cascade Millwork • $14.2k Paid • PRJ-102 (Auto marked Paid)",
    tag: "Paid Receipt",
    tagTone: "emerald",
  },
  {
    key: "3_duplicate_submission",
    title: "3. Duplicate Resend Protection",
    desc: "Re-sends identical $18.5k Sierra HVAC bill • Margin shield rejects duplicate",
    tag: "Margin Shield",
    tagTone: "amber",
  },
  {
    key: "4_status_update_paid",
    title: "4. Status Transition to Paid",
    desc: "Subcontractor confirms EFT payment • Updates status in-place without duplicate record",
    tag: "State Sync",
    tagTone: "indigo",
  },
  {
    key: "5_flagged_clarification",
    title: "5. Ambiguous Invoice (Missing Job Code)",
    desc: "No build project specified • Auto-flags for founder review with high variance alert",
    tag: "Exception Routing",
    tagTone: "rose",
  },
  {
    key: "6_field_employee_asif",
    title: "6. Field Employee Asif -> Kevin",
    desc: "Asif • $27.5k Framing • musfiq.works+pc1 (Live email trigger with attachment)",
    tag: "Field Dispatch",
    tagTone: "purple",
  },
] as const;

export function SimulatorView({
  runningScenario,
  lastSimulation,
  onRunScenario,
  onNavigateToInvoices,
}: SimulatorViewProps) {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="card p-6 border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-white dark:border-amber-950 dark:from-amber-950/20 dark:via-stone-900 dark:to-stone-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Live AI Margin Shield &amp; Invoice Processing Test Bench
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Part 3 Assessment
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
                Execute automated inbound subcontractor email workflows. Each scenario simulates an incoming email with PDF attachment, triggers OCR extraction, matches against construction project budgets, verifies duplicate status, and syncs directly to Notion and PostgreSQL.
              </p>
            </div>
          </div>

          {onNavigateToInvoices && (
            <button
              type="button"
              onClick={onNavigateToInvoices}
              className="btn-secondary btn-sm self-start sm:self-center shrink-0"
            >
              <FileText className="size-3.5" />
              View Invoices Table
            </button>
          )}
        </div>

        {/* 6 One-Click Scenarios Grid */}
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
            Select a Scenario to Execute
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SCENARIOS.map((sc) => {
              const isRunning = runningScenario === sc.key;
              return (
                <button
                  key={sc.key}
                  type="button"
                  disabled={runningScenario !== null}
                  onClick={() => onRunScenario(sc.key)}
                  aria-busy={isRunning}
                  className={`group relative rounded-2xl border p-4 text-left transition outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    isRunning
                      ? "border-amber-500 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/40"
                      : "border-stone-200/90 bg-white hover:border-amber-400 hover:shadow-xs dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900 dark:text-white text-xs">
                      {sc.title}
                    </span>
                    {isRunning ? (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Play className="h-4 w-4 shrink-0 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-400" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {sc.desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400">
                    <span>{sc.tag}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                      {isRunning ? "Simulating..." : "Run scenario →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Execution Trace Result Console */}
      {lastSimulation && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs dark:border-emerald-800 dark:bg-stone-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Workflow Execution Trace
                </h3>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {lastSimulation.scenario_label}: {lastSimulation.action_taken}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-900 text-xs dark:bg-emerald-900/60 dark:text-emerald-200">
              Duplicate Prevented: {lastSimulation.duplicate_prevented ? "YES (Blocked)" : "NO (Clean/Unique)"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 font-mono text-xs text-stone-700 dark:bg-stone-950 dark:text-stone-300">
            <Clock className="size-4 text-amber-500 shrink-0" />
            <span>
              Recorded Timestamp:{" "}
              <strong className="text-stone-900 dark:text-white">
                {formatDateTimeWithSeconds(
                  lastSimulation.triggered_at ||
                    lastSimulation.event_timestamp ||
                    lastSimulation.cost_record?.created_at
                )}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 text-xs dark:border-stone-800 dark:bg-stone-950/50 sm:grid-cols-4">
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[11px] font-semibold uppercase">
                Supplier
              </span>
              <span className="font-bold text-stone-900 dark:text-white mt-1 block">
                {lastSimulation.cost_record.supplier}
              </span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[11px] font-semibold uppercase">
                Document Ref
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 mt-1 block">
                {lastSimulation.cost_record.document_reference}
              </span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[11px] font-semibold uppercase">
                Amount &amp; Status
              </span>
              <span className="font-bold text-stone-900 dark:text-white mt-1 block">
                ${lastSimulation.cost_record.amount} {lastSimulation.cost_record.currency} ({lastSimulation.cost_record.payment_status})
              </span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[11px] font-semibold uppercase">
                Review Status
              </span>
              <span className="mt-1 block">
                {lastSimulation.needs_clarification ? (
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    Flagged for Clarification
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Clean / Approved
                  </span>
                )}
              </span>
            </div>
          </div>

          {lastSimulation.cost_record.supporting_document_url && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={lastSimulation.cost_record.supporting_document_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary btn-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                View Generated PDF Document ({lastSimulation.cost_record.document_reference}.pdf)
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 break-all">
                {lastSimulation.cost_record.supporting_document_url}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

