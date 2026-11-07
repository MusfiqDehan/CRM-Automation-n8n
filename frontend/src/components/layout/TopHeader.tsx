"use client";

import React from "react";
import {
  Building2,
  ExternalLink,
  Menu,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";
import type { NavTab } from "./Sidebar";

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobile: () => void;
  summary: DashboardSummary | null;
  onOpenContactModal: () => void;
  onOpenOpportunityModal: () => void;
  onOpenProjectModal: () => void;
  onOpenCustomInvoiceModal: () => void;
  syncingNotion: boolean;
  onSyncNotion: () => void;
}

export function TopHeader({
  activeTab,
  onOpenMobile,
  summary,
  onOpenContactModal,
  onOpenOpportunityModal,
  onOpenProjectModal,
  onOpenCustomInvoiceModal,
  syncingNotion,
  onSyncNotion,
}: TopHeaderProps) {
  const notionCfg = summary?.notion_workspace;
  const hubUrl =
    notionCfg?.hub_page_url ||
    "https://app.notion.com/p/Kevin-s-Construction-OS-4098194ec3e8811ab5b1c1b79f62bce1";
  const salesDbUrl = notionCfg?.sales_dashboard_url;
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678";

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Executive Summary & Platform Benefits",
      subtitle:
        "High-touch client acquisition, 4-phase build execution, and automated financial controls",
    },
    crm: {
      title: "Sales Pipeline & Client Management",
      subtitle:
        "Tracking architect referrals, qualification stages, and founder review sign-offs",
    },
    projects: {
      title: "Active Construction Projects & Site Operations",
      subtitle:
        "Milestones, 4-phase checklists, site progress, and material procurement",
    },
    automation: {
      title: "Automated Invoices & Cost Management",
      subtitle:
        "AI email invoice extraction, project cost code matching, and duplicate prevention",
    },
    resources: {
      title: "Resource Hub & System Integrations",
      subtitle:
        "Direct access to Notion OS Hub, live workflows, architectural diagrams, and exports",
    },
  };

  const { title, subtitle } = tabTitles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Mobile Toggle + Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 border border-stone-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-stone-400 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Essential Links */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action Modal Triggers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenContactModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Lead</span>
            </button>

            <button
              type="button"
              onClick={onOpenOpportunityModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>

            <button
              type="button"
              onClick={onOpenProjectModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomInvoiceModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Ingest Invoice</span>
            </button>
          </div>

          <div className="h-4 w-px bg-stone-800 hidden md:block" />

          {/* External Essential Links */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={hubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 transition"
              title="Open Notion Construction OS Hub"
            >
              <span>Notion Hub</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>

            {salesDbUrl && (
              <a
                href={salesDbUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                title="Open Notion Sales Dashboard"
              >
                <span>Sales Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <a
              href={n8nUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
              title="Open n8n Automation Engine"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">n8n Engine</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

