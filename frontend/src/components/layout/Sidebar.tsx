"use client";

import React from "react";
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  FileCheck2,
  Layers,
  LayoutDashboard,
  Link2,
  RefreshCw,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/types";

export type NavTab =
  | "overview"
  | "crm"
  | "projects"
  | "automation"
  | "resources";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  summary: DashboardSummary | null;
  syncingNotion: boolean;
  onSyncNotion: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  summary,
  syncingNotion,
  onSyncNotion,
}: SidebarProps) {
  const kevinReviewCount =
    summary?.kpis?.kevin_review_opportunities_count ?? 0;
  const activeProjectsCount = summary?.kpis?.active_projects_count ?? 0;
  const flaggedCostsCount = summary?.kpis?.flagged_costs_count ?? 0;

  const navItems: Array<{
    id: NavTab;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: {
      text: string | number;
      type: "amber" | "blue" | "emerald" | "purple";
    };
  }> = [
    {
      id: "overview",
      label: "Overview & Benefits",
      description: "Platform summary & use cases",
      icon: LayoutDashboard,
    },
    {
      id: "crm",
      label: "Sales & Pipeline",
      description: "VIP clients & high-ticket deals",
      icon: Users,
      badge:
        kevinReviewCount > 0
          ? { text: `${kevinReviewCount} Review`, type: "amber" }
          : undefined,
    },
    {
      id: "projects",
      label: "Active Projects",
      description: "4-Phase build management",
      icon: Layers,
      badge:
        activeProjectsCount > 0
          ? { text: activeProjectsCount, type: "emerald" }
          : undefined,
    },
    {
      id: "automation",
      label: "Invoice Automation",
      description: "AI extraction & cost tracking",
      icon: Workflow,
      badge:
        flaggedCostsCount > 0
          ? { text: `${flaggedCostsCount} Flagged`, type: "purple" }
          : undefined,
    },
    {
      id: "resources",
      label: "Resource Hub & Links",
      description: "Notion hub, n8n & exports",
      icon: Link2,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close mobile menu backdrop"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onCloseMobile();
          }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Kevin&apos;s OS
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    $3M+
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  Custom Residential OS
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Systems Pill */}
          <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Notion &amp; n8n Active</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v2.4 Live</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Client &amp; Ops Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-500/20 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/80 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive
                            ? "text-blue-100/80"
                            : "text-slate-400 group-hover:text-slate-300"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.badge.type === "amber"
                          ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse"
                          : item.badge.type === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Action & Profile Card */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/90">
          {/* Quick Notion Sync Button */}
          <button
            type="button"
            onClick={onSyncNotion}
            disabled={syncingNotion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-400 ${
                syncingNotion ? "animate-spin" : ""
              }`}
            />
            <span>
              {syncingNotion ? "Syncing Workspace..." : "Sync Notion Workspace"}
            </span>
          </button>

          {/* User/Workspace Card */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                KO
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Kevin Vance &amp; Team
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Executive Client Portal
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

