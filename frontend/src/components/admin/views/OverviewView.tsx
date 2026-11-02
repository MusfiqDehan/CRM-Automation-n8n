"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  DollarSign,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { DateRangeFilter, type DateRangePreset } from "@/components/charts/DateRangeFilter";
import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";
import { InteractiveBarChart } from "@/components/charts/InteractiveBarChart";
import { InteractiveDonutChart } from "@/components/charts/InteractiveDonutChart";
import { SectionIntro, StatCard } from "@/components/ui/primitives";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";

export interface OverviewViewProps {
  summary: DashboardSummary | null;
  loadingSummary: boolean;
  dateRange: DateRangePreset;
  customStart: string;
  customEnd: string;
  onDateRangeChange: (preset: DateRangePreset, start?: string, end?: string) => void;
  onNavigateToDeals: () => void;
  onNavigateToBuilds: () => void;
  onNavigateToInvoices: () => void;
  onSelectPipelineStage: (stage: string) => void;
}

export function OverviewView({
  summary,
  loadingSummary,
  dateRange,
  customStart,
  customEnd,
  onDateRangeChange,
  onNavigateToDeals,
  onNavigateToBuilds,
  onNavigateToInvoices,
  onSelectPipelineStage,
}: OverviewViewProps) {
  const kpis = summary?.kpis;
  const kevinReviewCount = kpis?.kevin_review_opportunities_count ?? 0;
  const flaggedCostsCount = kpis?.flagged_costs_count ?? 0;

  return (
    <div className="space-y-8">
      {/* Filter Bar with Presets & Date Pickers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Building2 className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                Operations Intelligence &amp; Performance
              </h2>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Sales &amp; Clients
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Live pipeline conversion, 4-phase build delivery, and supplier cost auditing
            </p>
          </div>
        </div>

        <DateRangeFilter
          activePreset={dateRange}
          startDate={customStart}
          endDate={customEnd}
          onChange={onDateRangeChange}
          loading={loadingSummary}
        />
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pipeline Value"
          value={formatCompactCurrency(kpis?.total_pipeline_value)}
          hint={`${kpis?.active_opportunities_count ?? 0} active client deals`}
          icon={DollarSign}
          tone="indigo"
          loading={loadingSummary}
          onClick={onNavigateToDeals}
        />
        <StatCard
          label="Active Luxury Builds"
          value={`${kpis?.active_projects_count ?? 0} Homes`}
          hint="Under 4-phase construction"
          icon={Layers}
          tone="green"
          loading={loadingSummary}
          onClick={onNavigateToBuilds}
        />
        <StatCard
          label="Bills & Invoices Ingested"
          value={`${kpis?.total_costs_records ?? 0} Records`}
          hint={`${formatCompactCurrency(kpis?.paid_costs_total)} paid • ${formatCompactCurrency(kpis?.unpaid_costs_total)} unpaid`}
          icon={FileSpreadsheet}
          tone="amber"
          loading={loadingSummary}
          onClick={onNavigateToInvoices}
        />
        <StatCard
          label="Needs Founder Attention"
          value={
            kevinReviewCount + flaggedCostsCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400">
                {kevinReviewCount + flaggedCostsCount} Items
              </span>
            ) : (
              "0 Clean"
            )
          }
          hint={`${kevinReviewCount} deals to review • ${flaggedCostsCount} bills flagged`}
          icon={AlertTriangle}
          tone="red"
          loading={loadingSummary}
          onClick={() => {
            if (kevinReviewCount > 0) onNavigateToDeals();
            else if (flaggedCostsCount > 0) onNavigateToInvoices();
          }}
        />
      </div>

      {/* Founder Attention Queue */}
      {(kevinReviewCount > 0 || flaggedCostsCount > 0) && (
        <div className="card border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-100 dark:bg-amber-900/60 p-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                  Priority Items Requiring Kevin&apos;s Review
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  High-value custom scope changes or invoices with missing cost codes
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {kevinReviewCount > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Client Deals Awaiting Review
                  </span>
                  <div className="text-lg font-bold text-stone-900 dark:text-white">
                    {kevinReviewCount} Deal(s)
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Custom engineering or cantilever structural requests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToDeals}
                  className="btn-secondary btn-sm"
                >
                  Review deals
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {flaggedCostsCount > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Supplier Bills Needing Clarification
                  </span>
                  <div className="text-lg font-bold text-stone-900 dark:text-white">
                    {flaggedCostsCount} Invoice(s)
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Missing project reference or unbudgeted line item
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToInvoices}
                  className="btn-secondary btn-sm"
                >
                  Review bills
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Charts Row 1: Pipeline Velocity & 4-Phase Build Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveLineChart
          title="Sales Pipeline Growth & Revenue Velocity"
          subtitle="Cumulative deal volume vs risk-adjusted weighted closing probability"
          data={
            summary?.time_series?.map((item) => ({
              label: item.date,
              date: item.full_date,
              value: item.pipeline_value,
              secondaryValue: item.weighted_value,
            })) || [
              { label: "Oct 05", value: 3600000, secondaryValue: 720000 },
              { label: "Oct 12", value: 6550000, secondaryValue: 2195000 },
              { label: "Oct 19", value: 10650000, secondaryValue: 5475000 },
              { label: "Oct 26", value: 14100000, secondaryValue: 8925000 },
              { label: "Nov 02", value: 14100000, secondaryValue: 8925000 },
            ]
          }
          primaryLabel="Total Pipeline"
          secondaryLabel="Weighted Risk-Adjusted"
          strokeColor="#f59e0b"
          secondaryStrokeColor="#10b981"
          formatValue={(v) => formatCompactCurrency(v)}
        />

        <InteractiveDonutChart
          title="Active Luxury Builds by Phase"
          subtitle="Contract budget portfolio across the 4 delivery phases"
          data={
            (summary?.projects_by_phase || []).map((p, idx) => {
              const phaseColorMap: Record<string, string> = {
                "Pre-Construction": "#f59e0b",
                Construction: "#3b82f6",
                Closeout: "#8b5cf6",
                Warranty: "#10b981",
              };
              const fallbackColors = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899"];
              return {
                label: p.phase,
                value: parseFloat(p.total_budget) || 1,
                color: phaseColorMap[p.phase] || fallbackColors[idx % fallbackColors.length],
                count: p.count,
              };
            })
          }
          centerLabel="Active Portfolio"
          formatValue={(v) => formatCompactCurrency(v)}
        />
      </div>

      {/* Interactive Charts Row 2: Stage Conversion & Invoicing Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveBarChart
          title="Pipeline Stage Conversion & Deal Values"
          subtitle="Total deal value and win probabilities across active qualification stages"
          data={
            (summary?.stages_breakdown || []).map((st) => ({
              label: st.stage.replace(/^\d+\.\s*/, ""),
              value: parseFloat(st.total_value) || 0,
              secondaryValue: parseFloat(st.weighted_value || "0") || 0,
              color: "#f59e0b",
              subtext: `${st.count} deal(s) • ${st.probability_percent || 20}% prob`,
            }))
          }
          primaryLabel="Estimated Value"
          secondaryLabel="Weighted Value"
          formatValue={(v) => formatCompactCurrency(v)}
        />

        <InteractiveBarChart
          title="Automated Invoice Ingestion & Cost Auditing"
          subtitle="Real-time financial status of ingested supplier bills and subcontractor invoices"
          data={
            (summary?.costs_breakdown || [
              {
                status: "Verified & Paid",
                amount: parseFloat(kpis?.paid_costs_total || "0") || 78700,
                count: 2,
                color: "#10b981",
              },
              {
                status: "Pending Payment",
                amount: parseFloat(kpis?.unpaid_costs_total || "0") || 222302,
                count: 15,
                color: "#f59e0b",
              },
              {
                status: "Flagged Review",
                amount: 99352,
                count: flaggedCostsCount,
                color: "#f43f5e",
              },
            ]).map((c) => ({
              label: c.status,
              value: c.amount,
              secondaryValue: c.count,
              color: c.color,
              subtext: `${c.count} invoice records`,
            }))
          }
          primaryLabel="Total Invoiced"
          secondaryLabel="Record Count"
          formatValue={(v) => formatCompactCurrency(v)}
        />
      </div>

      {/* Pipeline Stage Distribution */}
      <div className="card p-6 space-y-4">
        <SectionIntro
          title="Sales Pipeline Overview"
          description="Status of high-touch custom residential inquiries across active stages"
          action={
            <button
              type="button"
              onClick={onNavigateToDeals}
              className="btn-ghost btn-sm"
            >
              View all deals
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(summary?.stages_breakdown || []).map((st) => (
            <button
              type="button"
              key={st.stage}
              onClick={() => onSelectPipelineStage(st.stage)}
              aria-label={`View ${st.stage} deals`}
              className="flex cursor-pointer flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 text-left transition outline-none hover:border-amber-400/60 hover:bg-stone-100/50 focus-visible:ring-4 focus-visible:ring-amber-200 dark:border-stone-800 dark:bg-stone-950/40 dark:hover:bg-stone-900/50 dark:focus-visible:ring-amber-900"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <span>{st.stage}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {st.probability_percent ?? 20}% Prob
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-white font-mono">
                    {formatCurrency(st.total_value)}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {st.count} deal(s)
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span>Risk-Adjusted:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                  {formatCompactCurrency(st.weighted_value || "0")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4-Phase Build Distribution */}
      <div className="card p-6 space-y-4">
        <SectionIntro
          title="Active Builds by Construction Phase"
          description="Current distribution of projects across the 4 delivery phases"
          action={
            <button
              type="button"
              onClick={onNavigateToBuilds}
              className="btn-ghost btn-sm"
            >
              View job sites
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(summary?.projects_by_phase || []).map((p) => (
            <div
              key={p.phase}
              className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 p-4"
            >
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {p.phase}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                  {formatCurrency(p.total_budget)}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {p.count} build(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
