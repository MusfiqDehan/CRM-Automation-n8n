"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Layers,
  Plus,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";
import { formatCompactCurrency, formatCurrency, formatDateTimeWithSeconds } from "@/lib/format";

interface ExecutivePipelineOverviewProps {
  summary: DashboardSummary | null;
  onFilterStage?: (stage: string) => void;
  onFilterReview?: () => void;
  onNewDealClick?: () => void;
  onReviewDeal?: (deal: { id: string; name: string }) => void;
}

export function ExecutivePipelineOverview({
  summary,
  onFilterStage,
  onFilterReview,
  onNewDealClick,
  onReviewDeal,
}: ExecutivePipelineOverviewProps) {
  const kpis = summary?.kpis;
  const stages = summary?.stages_breakdown || [];
  const reviewDeals = summary?.kevin_review_deals || [];
  const notionDashboardUrl = summary?.notion_workspace?.sales_dashboard_url;
  const reviewCount = kpis?.kevin_review_opportunities_count ?? 0;
  const totalPipeline = Number(kpis?.total_pipeline_value || 0);
  const weightedPipeline = Number(kpis?.weighted_pipeline_value || 0);
  const realizationPercent = totalPipeline > 0 ? Math.round((weightedPipeline / totalPipeline) * 100) : 0;
  const reviewClientNames = Array.from(new Set(reviewDeals.map((d) => d.client_name).filter(Boolean)));

  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const handleStageClick = (stageName: string) => {
    if (selectedStage === stageName) {
      setSelectedStage(null);
      if (onFilterStage) onFilterStage("");
    } else {
      setSelectedStage(stageName);
      if (onFilterStage) onFilterStage(stageName);
    }
  };

  return (
    <section className="space-y-6">
      {/* ------------------------------------------------------------ */}
      {/* Header Banner & Notion Quick Link (Executive Light & Dark)   */}
      {/* ------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-white via-amber-50/40 to-stone-50/70 border border-stone-200/90 shadow-xs dark:from-amber-950/40 dark:via-stone-900/60 dark:to-stone-900 dark:border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 shadow-2xs dark:bg-amber-600/20 dark:text-amber-400 dark:border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
              Sales Dashboard &amp; Executive Pipeline Overview
            </h2>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/90 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
              $3M+ Luxury Portfolio
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              {kpis?.active_projects_count ?? 0} active builds
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
            Real-time pipeline valuation, probability-weighted revenue, and high-priority founder decision queues for Kevin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {notionDashboardUrl && (
            <a
              href={notionDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm"
              title="Open full Executive Sales Dashboard in Notion"
            >
              <span>Notion Sales Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </a>
          )}
          {onNewDealClick && (
            <button
              type="button"
              onClick={onNewDealClick}
              className="btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" />
              New deal
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 1. Executive Top KPI Ribbon (The 4 Essential Numbers)         */}
      {/* ------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pipeline Value */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Total Active Pipeline</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white font-mono">
            {formatCompactCurrency(kpis?.total_pipeline_value)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>{kpis?.active_opportunities_count ?? 0} active deals</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Avg {formatCompactCurrency(kpis?.average_deal_size || "0")}
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-500" />
        </div>

        {/* Card 2: Weighted Revenue Forecast */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Weighted Revenue (Risk-Adjusted)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {formatCompactCurrency(kpis?.weighted_pipeline_value || "0")}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Stage Probability Factored</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ~{realizationPercent}% realization
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-500" />
        </div>

        {/* Card 3: Kevin's Review Queue */}
        <button
          type="button"
          onClick={onFilterReview}
          disabled={!onFilterReview}
          className="p-4 text-left rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden group hover:border-amber-500/60 transition cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-amber-200 dark:focus-visible:ring-amber-900 disabled:cursor-default"
        >
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Requires Kevin&apos;s Review</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-500 dark:border-transparent">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
            <span>{reviewCount} priority deals</span>
            {reviewCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="truncate">{reviewClientNames.slice(0, 2).join(" & ") || "Queue clear"}</span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-700 group-hover:underline dark:text-amber-400">
              Review queue <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
        </button>

        {/* Card 4: Sales Lead Accountability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Jordan Blake (Sales Lead)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            100% On-Time
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>&lt; 2hr Referral SLA</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              0 Overdue
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 2. Visual Interactive Conversion Funnel (4 Stages)           */}
      {/* ------------------------------------------------------------ */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Luxury Home Sales Conversion Funnel</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Click any stage card to filter deals below • Stage probabilities reflect custom residential close rates
            </p>
          </div>
          {selectedStage && (
            <button
              type="button"
              onClick={() => handleStageClick(selectedStage)}
              className="btn-ghost btn-xs self-start sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear stage filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((st) => {
            const prob = st.probability_percent ?? (
              st.stage.includes("Qualification") ? 20 :
              st.stage.includes("Design") ? 50 :
              st.stage.includes("Construction") ? 80 :
              st.stage.includes("Won") ? 100 : 10
            );
            const isSelected = selectedStage === st.stage;

            return (
              <div
                key={st.stage}
                onClick={() => handleStageClick(st.stage)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500"
                    : "bg-stone-50/50 dark:bg-stone-950/40 border-stone-200/80 dark:border-stone-800 hover:border-amber-400/50 hover:bg-stone-50 dark:hover:bg-stone-900/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {st.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {prob}% Prob
                    </span>
                  </div>

                  <div className="text-xl font-extrabold text-stone-900 dark:text-white font-mono mt-1">
                    {formatCurrency(st.total_value)}
                  </div>

                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {st.count} custom build{st.count === 1 ? "" : "s"} • Weighted:{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {st.weighted_value ? formatCompactCurrency(st.weighted_value) : formatCompactCurrency(Number(st.total_value) * (prob / 100))}
                    </span>
                  </div>
                </div>

                {/* Conversion Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-600 dark:bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                    <span>Funnel Gate</span>
                    <span className="font-mono">{prob}% close velocity</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 3. High-Priority Founder Review Queue (Action Items)          */}
      {/* ------------------------------------------------------------ */}
      {reviewDeals.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Immediate Founder Decisions Required ({reviewDeals.length} Deals)
              </h3>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Awaiting Kevin&apos;s Review Before Client Signing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {reviewDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-stone-900 dark:text-white">
                      {deal.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {deal.stage}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono mb-1.5">
                    {formatCurrency(deal.estimated_value)}
                  </div>

                  <div className="text-xs text-stone-600 dark:text-stone-300 bg-amber-50/50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Decision Note: </span>
                    {deal.kevin_review_notes}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Logged: {formatDateTimeWithSeconds(deal.created_at || deal.next_follow_up_date)}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>Client: {deal.client_name}</span>
                  <div className="flex items-center gap-2">
                    {onFilterReview && (
                      <button
                        type="button"
                        onClick={onFilterReview}
                        className="btn-ghost btn-xs"
                      >
                        Filter table
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (onReviewDeal) {
                          onReviewDeal(deal);
                        } else if (onFilterReview) {
                          onFilterReview();
                        }
                      }}
                      className="btn-primary btn-xs"
                    >
                      Review deal
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

