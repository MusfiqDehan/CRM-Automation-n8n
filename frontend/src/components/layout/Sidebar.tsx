"use client";

import React from "react";
import {
  AlertTriangle,
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
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";

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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-stone-950 border-r border-stone-800/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex flex-col">
          <div className="px-5 py-4 border-b border-stone-800/80 flex items-center justify-between">
            <BeamLineLogo
              tone="amber"
              markClassName="size-10"
              wordmarkClassName="text-sm text-white"
              accentClassName="text-amber-400"
              subtitle="Custom Residential OS"
              subtitleClassName="text-stone-400"
            />

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Systems Pill */}
          <div className="px-5 py-2.5 bg-stone-900/60 border-b border-stone-800/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-stone-300 font-medium">Notion &amp; n8n Active</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">v2.4 Live</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-stone-400 tracking-wider uppercase">
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
                      ? "bg-gradient-to-r from-amber-600/90 to-amber-600/90 text-white shadow-md shadow-amber-500/20 font-semibold"
                      : "text-stone-300 hover:text-white hover:bg-stone-900/80 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? "text-white"
                          : "text-stone-400 group-hover:text-amber-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive
                            ? "text-amber-100/80"
                            : "text-stone-400 group-hover:text-stone-300"
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
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
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
        <div className="p-3 border-t border-stone-800/80 space-y-2 bg-stone-950/90">
          {/* Quick Notion Sync Button */}
          <button
            type="button"
            onClick={onSyncNotion}
            disabled={syncingNotion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-amber-400 ${
                syncingNotion ? "animate-spin" : ""
              }`}
            />
            <span>
              {syncingNotion ? "Syncing Workspace..." : "Sync Notion Workspace"}
            </span>
          </button>

          {/* User/Workspace Card */}
          <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                KO
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Kevin Vance &amp; Team
                </div>
                <div className="text-[10px] text-stone-400 truncate">
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
