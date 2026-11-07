"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";
import type { NavTab } from "../layout/Sidebar";

function formatCurrency(val: string | number | undefined): string {
  const num = Number(val || 0);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

interface ActionItemsCenterProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenContactModal: () => void;
  onOpenOpportunityModal: () => void;
  onOpenProjectModal: () => void;
  onOpenCustomInvoiceModal: () => void;
  onSyncNotion: () => void;
  syncingNotion: boolean;
}

export function ActionItemsCenter({
  summary,
  loading,
  onNavigate,
  onOpenContactModal,
  onOpenOpportunityModal,
  onOpenProjectModal,
  onOpenCustomInvoiceModal,
  onSyncNotion,
  syncingNotion,
}: ActionItemsCenterProps) {
  const kevinReviewCount =
    summary?.kpis?.kevin_review_opportunities_count ?? 0;
  const flaggedCostsCount = summary?.kpis?.flagged_costs_count ?? 0;
  const activeProjectsCount = summary?.kpis?.active_projects_count ?? 0;
  const activeOppsCount = summary?.kpis?.active_opportunities_count ?? 0;
  const totalPipeline = summary?.kpis?.total_pipeline_value ?? "0";

  return (
    <div className="space-y-4">
      {/* Action Items Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            Executive Action Items &amp; Priority Center
          </h3>
          <p className="text-xs text-stone-400">
            Immediate items requiring client sign-off, founder review, or operational resolution
          </p>
        </div>

        {/* Quick Launch Buttons Strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenContactModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
          <button
            type="button"
            onClick={onOpenOpportunityModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
          <button
            type="button"
            onClick={onOpenCustomInvoiceModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Invoice</span>
          </button>
          <button
            type="button"
            onClick={onSyncNotion}
            disabled={syncingNotion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-amber-400 ${
                syncingNotion ? "animate-spin" : ""
              }`}
            />
            <span>{syncingNotion ? "Syncing..." : "Sync Notion"}</span>
          </button>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Founder Review Queue */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            kevinReviewCount > 0
              ? "bg-amber-950/30 border-amber-500/50 hover:border-amber-400/80 shadow-md shadow-amber-500/10"
              : "bg-stone-900/80 border-stone-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  kevinReviewCount > 0
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-stone-800 text-stone-400"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Founder Review Queue
                </h4>
                <div className="text-[11px] text-stone-400">
                  Deals requiring executive sign-off
                </div>
              </div>
            </div>
            {kevinReviewCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Action Required
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-white">
                {loading ? "..." : kevinReviewCount}
              </span>
              <span className="text-xs text-stone-400 ml-1.5">
                {kevinReviewCount === 1 ? "deal pending" : "deals pending"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("crm")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              <span>Review Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Escalates high-value custom requests or budget variances before design agreements are executed.
          </p>
        </div>

        {/* Card 2: Invoice & Cost Reconciliation */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            flaggedCostsCount > 0
              ? "bg-rose-950/30 border-rose-500/50 hover:border-rose-400/80 shadow-md shadow-rose-500/10"
              : "bg-stone-900/80 border-stone-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  flaggedCostsCount > 0
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-stone-800 text-stone-400"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cost Reconciliation
                </h4>
                <div className="text-[11px] text-stone-400">
                  Supplier invoices &amp; variances
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                flaggedCostsCount > 0
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {flaggedCostsCount > 0 ? "Review Needed" : "Verified Clean"}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-white">
                {loading ? "..." : flaggedCostsCount}
              </span>
              <span className="text-xs text-stone-400 ml-1.5">
                flagged invoice(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("automation")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <span>View Costs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Automated AI invoice parser flags ambiguous project references and cost variances before payment.
          </p>
        </div>

        {/* Card 3: Construction Builds & Milestones */}
        <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Build Phases
                </h4>
                <div className="text-[11px] text-stone-400">
                  4-Phase milestone execution
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              On Schedule
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-white">
                {loading ? "..." : activeProjectsCount}
              </span>
              <span className="text-xs text-stone-400 ml-1.5">
                active custom builds
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("projects")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <span>Inspect Sites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Standardized tracking across Pre-Construction, Construction, Closeout, and Warranty checklists.
          </p>
        </div>
      </div>
    </div>
  );
}

