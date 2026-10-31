"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Layers,
  Link2,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";
import type { NavTab } from "../layout/Sidebar";
import { ActionItemsCenter } from "./ActionItemsCenter";

function formatCurrency(val: string | number | undefined): string {
  const num = Number(val || 0);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

interface LandingOverviewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenContactModal: () => void;
  onOpenOpportunityModal: () => void;
  onOpenProjectModal: () => void;
  onOpenCustomInvoiceModal: () => void;
  onSyncNotion: () => void;
  syncingNotion: boolean;
  apiBase: string;
}

export function LandingOverview({
  summary,
  loading,
  onNavigate,
  onOpenContactModal,
  onOpenOpportunityModal,
  onOpenProjectModal,
  onOpenCustomInvoiceModal,
  onSyncNotion,
  syncingNotion,
  apiBase,
}: LandingOverviewProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<number>(0);

  const notionCfg = summary?.notion_workspace;
  const hubUrl =
    notionCfg?.hub_page_url ||
    "https://app.notion.com/p/Kevin-s-Construction-OS-4098194ec3e8811ab5b1c1b79f62bce1";
  const salesDashboardUrl = notionCfg?.sales_dashboard_url;
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678";

  // Use cases list
  const useCases = [
    {
      id: "vip-client",
      title: "VIP Client Acquisition & Qualification",
      subtitle: "From architect referral to signed $3M+ construction agreement",
      icon: Users,
      badge: "Sales & Client Journey",
      color: "from-blue-600/20 to-indigo-600/20 border-blue-500/40 text-blue-300",
      steps: [
        {
          num: "01",
          name: "Inbound Referral Ingestion",
          detail:
            "Architect, realtor, or client referrals arrive via phone, email, or portal and are instantly logged into CRM with referral source attribution.",
        },
        {
          num: "02",
          name: "Owner Qualification Stage",
          detail:
            "Dedicated Sales Lead qualifies build budget ($3M+), site topography, zoning feasibility, and schedule expectations.",
        },
        {
          num: "03",
          name: "Design Agreement & Founder Review",
          detail:
            "Architectural design agreement signed. Custom architectural complexities or special scope automatically route to Kevin's Review Queue.",
        },
        {
          num: "04",
          name: "Construction Agreement & Ops Handoff",
          detail:
            "Upon execution, the deal converts seamlessly into a 4-phase project in Notion and PostgreSQL without duplicate data re-entry.",
        },
      ],
      ctaLabel: "Explore Sales Pipeline",
      ctaTab: "crm" as NavTab,
    },
    {
      id: "site-operations",
      title: "4-Phase Construction Management",
      subtitle: "Standardized milestone delivery from dirt to warranty walkthrough",
      icon: Layers,
      badge: "Project Operations",
      color: "from-emerald-600/20 to-teal-600/20 border-emerald-500/40 text-emerald-300",
      steps: [
        {
          num: "01",
          name: "Pre-Construction Checklist",
          detail:
            "Soils engineering, city permitting, architectural selections, and baseline Gantt scheduling locked in before breaking ground.",
        },
        {
          num: "02",
          name: "Active Construction Milestones",
          detail:
            "Foundation, structural steel framing, rough MEP, and city inspection sign-offs tracked with live progress percentage updates.",
        },
        {
          num: "03",
          name: "Closeout & Punchlist Walkthrough",
          detail:
            "Certificate of Occupancy inspection, punchlist completion with owner, and comprehensive systems orientation.",
        },
        {
          num: "04",
          name: "Warranty Service & Handover",
          detail:
            "Post-handover 30-day and 11-month builder walkthroughs logged directly in Notion warranty databases.",
        },
      ],
      ctaLabel: "Inspect Active Projects",
      ctaTab: "projects" as NavTab,
    },
    {
      id: "ai-invoicing",
      title: "Automated Invoice & Cost Control",
      subtitle: "AI email invoice extraction, project matching & margin protection",
      icon: Workflow,
      badge: "Financial Automation",
      color: "from-purple-600/20 to-pink-600/20 border-purple-500/40 text-purple-300",
      steps: [
        {
          num: "01",
          name: "Email & PDF Attachment Ingestion",
          detail:
            "Subcontractors and suppliers email invoices directly. Inbound webhooks trigger n8n orchestration automatically.",
        },
        {
          num: "02",
          name: "AI Extraction & Cost Code Match",
          detail:
            "Parses invoice number, total amount, supplier tax ID, line items, and matches the job code (e.g. PRJ-101 Oakridge).",
        },
        {
          num: "03",
          name: "Duplicate & Variance Guardrails",
          detail:
            "System checks for duplicate document references. If an invoice is re-sent, it prevents double-payment and updates status in-place.",
        },
        {
          num: "04",
          name: "Instant Notion Sync & Email Alert",
          detail:
            "Writes directly to Notion Project Costs database and dispatches a verified email confirmation with PDF link to stakeholders.",
        },
      ],
      ctaLabel: "Test Invoice Automation",
      ctaTab: "automation" as NavTab,
    },
    {
      id: "executive-oversight",
      title: "Founder Governance & Risk Control",
      subtitle: "Automated escalation flags for high-ticket variances and scope changes",
      icon: ShieldCheck,
      badge: "Governance & Review",
      color: "from-amber-600/20 to-orange-600/20 border-amber-500/40 text-amber-300",
      steps: [
        {
          num: "01",
          name: "Real-Time Pipeline Monitoring",
          detail:
            "Founder and clients view consolidated metrics: active pipeline value, deal velocity, and projected completion dates at a glance.",
        },
        {
          num: "02",
          name: "Kevin's Review Queue Escalation",
          detail:
            "Deals with non-standard contract clauses, budget variances, or architect revisions require founder review before progressing.",
        },
        {
          num: "03",
          name: "Cost Variance & Clarification Flags",
          detail:
            "Ambiguous vendor receipts or missing project references are automatically flagged for review rather than accepted blindly.",
        },
        {
          num: "04",
          name: "Audit Trail & Verification",
          detail:
            "Every status modification, Notion sync, and notification is logged with timestamps for complete operational transparency.",
        },
      ],
      ctaLabel: "View Review Queue",
      ctaTab: "crm" as NavTab,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>High-End Residential Operations Hub • $3M+ Builds</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            The Complete Operating System for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Luxury Custom Construction
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Welcome to Kevin&apos;s Construction OS — designed for high-touch luxury clients,
            superintendents, and executive teams. Replace disconnected spreadsheets with a unified
            system linking <strong>Sales Pipeline</strong>, <strong>4-Phase Project Execution</strong>,
            and <strong>AI-Powered Invoice Automation</strong> in real-time.
          </p>

          {/* Quick CTA Buttons Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("crm")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Explore Sales Pipeline</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("projects")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Inspect Active Builds</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("automation")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition cursor-pointer"
            >
              <Workflow className="w-4 h-4" />
              <span>Test Invoice Automation</span>
            </button>

            <a
              href={hubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800 transition"
            >
              <span>Notion OS Hub</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
          </div>
        </div>
      </section>

      {/* Real-time KPI Metric Summaries Strip */}
      <section aria-label="Executive Metrics Strip" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Live Executive Metrics &amp; Operational Pulse</span>
          <span>Updated in Real-Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* KPI 1 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Sales Pipeline</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {loading ? "..." : formatCurrency(summary?.kpis.total_pipeline_value)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary?.kpis.active_opportunities_count ?? 0} qualified $3M+ deals
            </p>
          </div>

          {/* KPI 2 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-500/70 transition shadow-sm">
            <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
              <span>Founder Review Queue</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {loading ? "..." : summary?.kpis.kevin_review_opportunities_count ?? 0}{" "}
              Deals
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Escalated for Kevin sign-off
            </p>
          </div>

          {/* KPI 3 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Construction Builds</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {loading ? "..." : summary?.kpis.active_projects_count ?? 0} Builds
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              4-Phase milestone discipline
            </p>
          </div>

          {/* KPI 4 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Contract Budgets Managed</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {loading
                ? "..."
                : formatCurrency(
                    (summary?.projects_by_phase || []).reduce(
                      (acc, p) => acc + Number(p.total_budget || 0),
                      0
                    )
                  )}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Live site budget tracking
            </p>
          </div>

          {/* KPI 5 */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>AI Invoices Processed</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-300 mt-1">
              {loading ? "..." : summary?.kpis.total_costs_records ?? 0} Invoices
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary?.kpis.email_notifications_count ?? 0} alerts dispatched
            </p>
          </div>
        </div>
      </section>

      {/* Priority Action Items & Quick Action Center */}
      <section aria-label="Action Items Center">
        <ActionItemsCenter
          summary={summary}
          loading={loading}
          onNavigate={onNavigate}
          onOpenContactModal={onOpenContactModal}
          onOpenOpportunityModal={onOpenOpportunityModal}
          onOpenProjectModal={onOpenProjectModal}
          onOpenCustomInvoiceModal={onOpenCustomInvoiceModal}
          onSyncNotion={onSyncNotion}
          syncingNotion={syncingNotion}
        />
      </section>

      {/* Core Platform Benefits Grid */}
      <section aria-label="Platform Benefits" className="space-y-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-white">
            Core Platform Benefits &amp; Architectural Highlights
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered to eliminate margin erosion, missed leads, and manual data-entry overhead
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Benefit 1 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                High-Touch Sales &amp; VIP Qualification
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralizes inquiries from high-end architect partners, client referrals, and VIP channels.
                Standardizes the 5-stage qualification pipeline before committing architectural resources.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Zero dropped inquiries</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Milestone-Driven 4-Phase Delivery
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standardized lifecycle from Pre-Construction (soils &amp; permits) to Framing/MEP Construction,
                Client Closeout, and 11-Month Warranty walkthroughs with reusable site checklists.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>100% Milestone Visibility</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Autonomous AI Cost &amp; Invoicing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inbound supplier PDF invoices are parsed instantly by n8n + AI, matched to active project
                cost codes, checked for duplicate submissions, and recorded with zero manual paperwork.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Saves 15+ hrs/week</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Executive Governance &amp; Review
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                High-ticket variations, complex architectural requests, and supplier cost discrepancies
                automatically escalate to Kevin&apos;s Review Queue for founder sign-off before commitment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Guaranteed Quality &amp; Margin</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Use Case Walkthroughs */}
      <section aria-label="Operational Use Cases" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">
              Operational Use Cases &amp; Real-World Workflows
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select a workflow below to inspect how the system orchestrates each client and site scenario
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Scenario {selectedUseCase + 1} of {useCases.length}
          </span>
        </div>

        {/* Use Case Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {useCases.map((uc, index) => {
            const Icon = uc.icon;
            const isSelected = selectedUseCase === index;
            return (
              <button
                key={uc.id}
                type="button"
                onClick={() => setSelectedUseCase(index)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{uc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Use Case Card */}
        {(() => {
          const activeUc = useCases[selectedUseCase];
          const Icon = activeUc.icon;
          return (
            <div
              className={`p-6 rounded-2xl bg-gradient-to-br ${activeUc.color} bg-slate-950/80 border space-y-6 shadow-xl`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {activeUc.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {activeUc.title}
                    </h3>
                    <p className="text-xs text-slate-300">{activeUc.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(activeUc.ctaTab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 transition shadow-md cursor-pointer shrink-0"
                >
                  <span>{activeUc.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Steps Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeUc.steps.map((st) => (
                  <div
                    key={st.num}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {st.num}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-white mt-1">
                        {st.name}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {st.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Essential Resource Hub & System Links Preview */}
      <section aria-label="System Links" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" />
            <span>Essential Workspaces &amp; System Integration Links</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("resources")}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Resource Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href={hubUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                Notion OS Hub Page
              </div>
              <div className="text-[11px] text-slate-400">
                Single source of truth workspace
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
          </a>

          {salesDashboardUrl && (
            <a
              href={salesDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Notion Sales Board
                </div>
                <div className="text-[11px] text-slate-400">
                  Visual Kanban stage pipeline
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
            </a>
          )}

          <a
            href={n8nUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                n8n Automation Flow
              </div>
              <div className="text-[11px] text-slate-400">
                Live email &amp; webhook workflow
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-400 shrink-0" />
          </a>

          <a
            href={`${apiBase}/docs/download/diagram/`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                Architecture Blueprint
              </div>
              <div className="text-[11px] text-slate-400">
                High-res end-to-end diagram
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
          </a>
        </div>
      </section>
    </div>
  );
}

