"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LayoutDashboard,
  Mail,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  ContactFormModal,
  DealFormModal,
  InvoiceFormModal,
  ProjectFormModal,
} from "@/components/admin/AdminForms";
import { SMTPSettingsModal } from "@/components/admin/SMTPSettingsModal";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { ExecutivePipelineOverview } from "@/components/dashboard/ExecutivePipelineOverview";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Badge,
  OpenLink,
  SectionIntro,
  StatCard,
  Tabs,
  statusTone,
} from "@/components/ui/primitives";
import { apiClient } from "@/lib/api-client";
import { formatCompactCurrency, formatCurrency, formatDate, formatDateTimeWithSeconds } from "@/lib/format";
import type {
  ConstructionProject,
  Contact,
  DashboardSummary,
  EmailCommunicationLog,
  MaterialOrder,
  Opportunity,
  ProjectCost,
  ProjectTask,
  SimulatorTriggerResponse,
} from "@/lib/types";

export type AdminTab = "overview" | "crm" | "projects" | "automation";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Sub-tab toggles
  const [crmSubTab, setCrmSubTab] = useState<"deals" | "contacts">("deals");
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>("");
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<string>("");
  const [projectSubTab, setProjectSubTab] = useState<
    "projects" | "tasks" | "materials"
  >("projects");
  const [invoiceSubTab, setInvoiceSubTab] = useState<"invoices" | "emails">(
    "invoices"
  );

  // Quick Create Dropdown state
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simulator state
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] =
    useState<SimulatorTriggerResponse | null>(null);

  // Modals state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDealOpen, setIsDealOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSmtpSettingsOpen, setIsSmtpSettingsOpen] = useState(false);
  const [dispatchingEmail, setDispatchingEmail] = useState<string | null>(null);

  const handleTriggerClientEmail = async (payload: {
    client_email: string;
    client_name: string;
    project_code: string;
    email_type: string;
    keyLabel: string;
  }) => {
    setDispatchingEmail(payload.keyLabel);
    try {
      const res = await apiClient.post<{ status: string; triggered_at: string }>(
        "/client-emails/trigger/",
        payload
      );
      showToast(
        `Email sent to ${payload.client_email} (${res.data?.status || "Sent via SMTP"}) at ${formatDateTimeWithSeconds(
          res.data?.triggered_at || new Date()
        )}!`,
        "success"
      );
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to dispatch client email.",
        "error"
      );
    } finally {
      setDispatchingEmail(null);
    }
  };

  // Toast
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
      setSummary(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load summary stats.",
        "error"
      );
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshCounter]);

  const handleRunScenario = async (scenarioKey: string) => {
    setRunningScenario(scenarioKey);
    try {
      const res = await apiClient.post<SimulatorTriggerResponse>(
        "/simulator/trigger/",
        { scenario: scenarioKey }
      );
      setLastSimulation(res.data);
      const timeStr = formatDateTimeWithSeconds(
        res.data.triggered_at || res.data.event_timestamp || new Date()
      );
      showToast(
        `Simulation recorded at ${timeStr}: ${res.data.scenario_label} (${res.data.action_taken})`,
        "success"
      );
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Simulation failed.",
        "error"
      );
    } finally {
      setRunningScenario(null);
    }
  };

  const kpis = summary?.kpis;
  const kevinReviewCount = kpis?.kevin_review_opportunities_count ?? 0;
  const flaggedCostsCount = kpis?.flagged_costs_count ?? 0;
  const activeProjectsCount = kpis?.active_projects_count ?? 0;

  const navItems: Array<{
    id: AdminTab;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeTone?: "amber" | "emerald" | "red";
  }> = [
    {
      id: "overview",
      label: "Dashboard",
      shortLabel: "Dashboard",
      description: "Business overview & alerts",
      icon: LayoutDashboard,
    },
    {
      id: "crm",
      label: "Sales & Clients",
      shortLabel: "Sales",
      description: "Deals, clients & inquiries",
      icon: Users,
      badgeCount: kevinReviewCount,
      badgeTone: "amber",
    },
    {
      id: "projects",
      label: "Active Builds",
      shortLabel: "Builds",
      description: "4-Phase site management",
      icon: Layers,
      badgeCount: activeProjectsCount,
      badgeTone: "emerald",
    },
    {
      id: "automation",
      label: "Invoices & Bills",
      shortLabel: "Invoices",
      description: "Subcontractors & margin shield",
      icon: Workflow,
      badgeCount: flaggedCostsCount,
      badgeTone: "red",
    },
  ];

  const pageMeta: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Executive Dashboard",
      subtitle: "High-level snapshot of pipeline, builds, and priority items",
    },
    crm: {
      title: "Sales & Client Management",
      subtitle: "Track custom home inquiries, agreements, and founder review queues",
    },
    projects: {
      title: "Active Construction Projects",
      subtitle: "4-Phase delivery milestones, tasks, and material procurement",
    },
    automation: {
      title: "Subcontractor Invoices & Costs",
      subtitle: "Automated email parsing, duplicate prevention, and budget variance tracking",
    },
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900 transition-colors duration-200 dark:bg-[#0b0f19] dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md transition-all ${
            toast.type === "error"
              ? "border-rose-300 bg-rose-50/95 text-rose-800 dark:border-rose-800 dark:bg-rose-950/95 dark:text-rose-200"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* DESKTOP SIDEBAR (FIXED LEFT NAVIGATION, VISIBLE ON LG+)      */}
      {/* ------------------------------------------------------------ */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-72 flex-col justify-between border-r border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-[#0f1523] transition-colors duration-200">
        <div className="flex flex-col">
          {/* Top Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-600/30 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Kevin&apos;s OS
                </span>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Luxury Residential Suite
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operations
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                      active
                        ? "bg-indigo-50 text-indigo-700 shadow-xs dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{item.label}</div>
                        <div className="text-[11px] opacity-70 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          item.badgeTone === "amber"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : item.badgeTone === "red"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Summary Snapshot */}
          <div className="mx-3 mt-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Portfolio Overview
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Pipeline</span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {formatCompactCurrency(kpis?.total_pipeline_value)}
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Builds</span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {kpis?.active_projects_count ?? 0} Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls: Theme Toggle & Public Site */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3">
          {/* Theme Selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Theme</span>
            </div>
            <ThemeToggle className="w-full justify-between" />
          </div>

          {/* Return to Public Website */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* MOBILE BOTTOM NAVBAR (FIXED BOTTOM FOR MOBILE & TABLET)      */}
      {/* ------------------------------------------------------------ */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0f1523]/95 shadow-xl transition-colors duration-200"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer relative ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                      {item.badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA                                            */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Bar - Full Width Responsive Workspace Alignment */}
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800/90 dark:bg-[#0f1523]/95 transition-colors duration-200">
          <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-10 py-3.5">
            {/* Left: Mobile Brand / Desktop Active Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile View Title & Brand */}
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {pageMeta[activeTab].title}
                  </h1>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Kevin&apos;s OS
                  </span>
                </div>
              </div>

              {/* Desktop View Title & Subtitle with Luxury Department Badge */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200/70 text-indigo-700 shadow-xs dark:from-indigo-950/60 dark:to-indigo-900/40 dark:border-indigo-800/60 dark:text-indigo-300 shrink-0">
                  {React.createElement(
                    navItems.find((n) => n.id === activeTab)?.icon || Building2,
                    { className: "h-5 w-5" }
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {pageMeta[activeTab].title}
                    </h2>
                    {activeTab === "crm" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        $14.1M Pipeline
                      </span>
                    )}
                    {activeTab === "crm" && kevinReviewCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {kevinReviewCount} Awaiting Kevin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pageMeta[activeTab].subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Improved Action Buttons & Controls Placement */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Theme Toggle Shortcut */}
              <div className="hidden lg:flex items-center">
                <ThemeToggle variant="compact" />
              </div>

              {/* Mobile Theme Toggle & Public Site Shortcut */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <ThemeToggle variant="compact" />
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
                  title="Return to Public Site"
                  aria-label="Return to Public Site"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>

              {/* Context-Aware Primary Action Button (Desktop & Tablet) */}
              {activeTab === "crm" && (
                <button
                  type="button"
                  onClick={() => setIsDealOpen(true)}
                  className="btn-primary py-2 px-3 text-xs hidden sm:inline-flex"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Deal</span>
                </button>
              )}

              {activeTab === "projects" && (
                <button
                  type="button"
                  onClick={() => setIsProjectOpen(true)}
                  className="btn-primary py-2 px-3 text-xs hidden sm:inline-flex"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </button>
              )}

              {activeTab === "automation" && (
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  className="btn-primary py-2 px-3 text-xs hidden sm:inline-flex"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ingest Bill</span>
                </button>
              )}

              {/* SMTP Settings Quick Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsSmtpSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                title="Configure Gmail SMTP credentials & live email triggers"
              >
                <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">SMTP Settings</span>
              </button>

              {/* Universal "+ Add Record" Dropdown (All Screens) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCreateDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  aria-expanded={isCreateDropdownOpen}
                  aria-label="Create new record"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Add Record</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {isCreateDropdownOpen && (
                  <div className="animate-fade-up absolute right-0 mt-2 w-56 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0f1523]/95 dark:shadow-black/60 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setIsContactOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Users className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-semibold">New Client Enquiry</div>
                        <div className="text-[10px] text-slate-400">Referral or prospective client</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setIsDealOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <div>
                        <div className="font-semibold">New Deal / Opportunity</div>
                        <div className="text-[10px] text-slate-400">Qualified $3M+ home build</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setIsProjectOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Layers className="h-4 w-4 text-indigo-500" />
                      <div>
                        <div className="font-semibold">New Construction Project</div>
                        <div className="text-[10px] text-slate-400">Initializes 4-phase build checklists</div>
                      </div>
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setIsInvoiceOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Workflow className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-semibold">Ingest Supplier Bill</div>
                        <div className="text-[10px] text-slate-400">PDF invoice or receipt</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body - Full Width Responsive Layout (Padding bottom pb-28 on mobile for bottom navbar) */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-8 space-y-8 pb-28 lg:pb-8">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW DASHBOARD                                 */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Top Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Pipeline Value"
                  value={formatCompactCurrency(kpis?.total_pipeline_value)}
                  hint={`${kpis?.active_opportunities_count ?? 0} active client deals`}
                  icon={DollarSign}
                  tone="indigo"
                  loading={loadingSummary}
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmSubTab("deals");
                  }}
                />
                <StatCard
                  label="Active Luxury Builds"
                  value={`${kpis?.active_projects_count ?? 0} Homes`}
                  hint="Under 4-phase construction"
                  icon={Layers}
                  tone="green"
                  loading={loadingSummary}
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectSubTab("projects");
                  }}
                />
                <StatCard
                  label="Bills & Invoices Ingested"
                  value={`${kpis?.total_costs_records ?? 0} Records`}
                  hint={`${formatCompactCurrency(kpis?.paid_costs_total)} paid • ${formatCompactCurrency(kpis?.unpaid_costs_total)} unpaid`}
                  icon={FileSpreadsheet}
                  tone="amber"
                  loading={loadingSummary}
                  onClick={() => {
                    setActiveTab("automation");
                    setInvoiceSubTab("invoices");
                  }}
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
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Client Deals Awaiting Review
                          </span>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {kevinReviewCount} Deal(s)
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Custom engineering or cantilever structural requests
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("crm");
                            setCrmSubTab("deals");
                          }}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Review Deals
                        </button>
                      </div>
                    )}

                    {flaggedCostsCount > 0 && (
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            Supplier Bills Needing Clarification
                          </span>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {flaggedCostsCount} Invoice(s)
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Missing project reference or unbudgeted line item
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("automation");
                            setInvoiceSubTab("invoices");
                          }}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Review Bills
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pipeline Stage Distribution */}
              <div className="card p-6 space-y-4">
                <SectionIntro
                  title="Sales Pipeline Overview"
                  description="Status of high-touch custom residential inquiries across active stages"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("crm");
                        setCrmSubTab("deals");
                      }}
                      className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      View All Deals →
                    </button>
                  }
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(summary?.stages_breakdown || []).map((st) => (
                    <div
                      key={st.stage}
                      onClick={() => {
                        setSelectedPipelineStage(st.stage);
                        setSelectedReviewFilter("");
                        setActiveTab("crm");
                        setCrmSubTab("deals");
                      }}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 flex flex-col justify-between hover:border-indigo-400/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          <span>{st.stage}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {st.probability_percent ?? 20}% Prob
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                            {formatCurrency(st.total_value)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {st.count} deal(s)
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Risk-Adjusted:</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">
                          {formatCompactCurrency(st.weighted_value || "0")}
                        </span>
                      </div>
                    </div>
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
                      onClick={() => {
                        setActiveTab("projects");
                        setProjectSubTab("projects");
                      }}
                      className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      View Job Sites →
                    </button>
                  }
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(summary?.projects_by_phase || []).map((p) => (
                    <div
                      key={p.phase}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4"
                    >
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {p.phase}
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {formatCurrency(p.total_budget)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {p.count} build(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SALES & CLIENTS                                    */}
          {/* ======================================================== */}
          {activeTab === "crm" && (
            <div className="space-y-6">
              {/* Executive Sales Pipeline Visual Overview & Funnel */}
              <ExecutivePipelineOverview
                summary={summary}
                onFilterStage={(stage) => {
                  setSelectedPipelineStage(stage);
                  setSelectedReviewFilter("");
                  setCrmSubTab("deals");
                }}
                onFilterReview={() => {
                  setSelectedReviewFilter("true");
                  setSelectedPipelineStage("");
                  setCrmSubTab("deals");
                }}
                onNewDealClick={() => setIsDealOpen(true)}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Sales Pipeline &amp; Client Inquiries
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Track high-touch referrals from initial qualification through design &amp; construction agreements
                  </p>
                </div>

                {/* Sub-tab switcher */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCrmSubTab("deals");
                      setSelectedPipelineStage("");
                      setSelectedReviewFilter("");
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      crmSubTab === "deals"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 dark:border-transparent dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Deals &amp; Opportunities
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrmSubTab("contacts")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      crmSubTab === "contacts"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 dark:border-transparent dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Contacts &amp; Inquiries
                  </button>
                </div>
              </div>

              {/* Sub-tab: Deals */}
              {crmSubTab === "deals" && (
                <CursorDataTable<Opportunity>
                  title="Deals & Opportunities"
                  endpoint="/opportunities/"
                  refreshTrigger={refreshCounter}
                  initialFilters={{
                    ...(selectedPipelineStage ? { stage: selectedPipelineStage } : {}),
                    ...(selectedReviewFilter ? { requires_kevin_review: selectedReviewFilter } : {}),
                  }}
                  onAddClick={() => setIsDealOpen(true)}
                  addButtonLabel="New Deal"
                  searchPlaceholder="Search deals, sales owners, clients..."
                  filters={[
                    {
                      key: "stage",
                      label: "Stage",
                      options: [
                        { label: "1. New Enquiry", value: "1. New Enquiry" },
                        { label: "2. Qualification", value: "2. Qualification" },
                        {
                          label: "3. Design Agreement",
                          value: "3. Design Agreement",
                        },
                        {
                          label: "4. Construction Agreement",
                          value: "4. Construction Agreement",
                        },
                        {
                          label: "5. Won",
                          value: "5. Won — Handed to Ops",
                        },
                      ],
                    },
                    {
                      key: "requires_kevin_review",
                      label: "Kevin Review",
                      options: [
                        { label: "Needs Kevin's Review", value: "true" },
                        { label: "Standard (No Review)", value: "false" },
                      ],
                    },
                  ]}
                  sortOptions={[
                    { label: "Newest First", value: "-created_at" },
                    { label: "Value (High to Low)", value: "-estimated_value" },
                    { label: "Next Follow-Up", value: "next_follow_up_date" },
                  ]}
                  columns={[
                    {
                      key: "name",
                      header: "Opportunity / Home",
                      render: (row) => (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Client: {row.contact_name || "Unassigned"} • Owner:{" "}
                            {row.sales_owner}
                          </div>
                          {row.project_code && (
                            <span className="inline-block mt-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                              Linked: {row.project_code}
                            </span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "stage",
                      header: "Stage & Agreement",
                      render: (row) => (
                        <div className="space-y-1">
                          <Badge tone={statusTone(row.stage)}>{row.stage}</Badge>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Build: {row.construction_agreement_status}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "value",
                      header: "Estimated Value & Schedule",
                      render: (row) => (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(row.estimated_value)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Follow-up: {formatDate(row.next_follow_up_date)}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            Logged: {formatDateTimeWithSeconds(row.created_at)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "review",
                      header: "Review Status",
                      render: (row) => (
                        <div>
                          {row.requires_kevin_review ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700">
                              <AlertTriangle className="h-3 w-3" />
                              Needs Founder Review
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Managed by Sales Lead
                            </span>
                          )}
                          {row.kevin_review_notes && (
                            <p className="mt-1 max-w-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {row.kevin_review_notes}
                            </p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "notion",
                      header: "",
                      className: "w-8 text-right",
                      render: (row) => (
                        <OpenLink href={row.notion_url} label="Open in Notion" />
                      ),
                    },
                  ]}
                />
              )}

              {/* Sub-tab: Contacts */}
              {crmSubTab === "contacts" && (
                <CursorDataTable<Contact>
                  title="Contacts & Client Inquiries"
                  endpoint="/contacts/"
                  refreshTrigger={refreshCounter}
                  onAddClick={() => setIsContactOpen(true)}
                  addButtonLabel="New Contact / Enquiry"
                  searchPlaceholder="Search contacts by name, email, referral..."
                  filters={[
                    {
                      key: "contact_type",
                      label: "Type",
                      options: [
                        {
                          label: "Prospective Client",
                          value: "Prospective Client",
                        },
                        { label: "Active Client", value: "Active Client" },
                        {
                          label: "Referral Partner",
                          value: "Referral Partner / Architect",
                        },
                      ],
                    },
                  ]}
                  columns={[
                    {
                      key: "name",
                      header: "Client & Household",
                      render: (row) => (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {row.company_or_household || row.contact_type}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "comms",
                      header: "Contact Info",
                      render: (row) => (
                        <div className="text-xs space-y-0.5">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {row.email}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {row.phone || "No phone"} • Prefers:{" "}
                            {row.preferred_channel}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            Added: {formatDateTimeWithSeconds(row.created_at)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "referral",
                      header: "Referral & Project Scope",
                      render: (row) => (
                        <div className="max-w-xl text-xs">
                          <span className="font-medium text-indigo-700 dark:text-indigo-400">
                            Source: {row.referral_source || "Direct"}
                          </span>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-300 line-clamp-2">
                            {row.enquiry_summary || "No notes"}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: "notion",
                      header: "",
                      className: "w-8 text-right",
                      render: (row) => (
                        <OpenLink href={row.notion_url} label="Open in Notion" />
                      ),
                    },
                  ]}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ACTIVE PROJECTS                                    */}
          {/* ======================================================== */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Active Construction Projects &amp; Job Sites
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Standardized 4-phase checklists: Pre-Construction, Active Construction, Closeout, and Warranty
                  </p>
                </div>

                {/* Sub-tab switcher */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-transparent dark:border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setProjectSubTab("projects")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      projectSubTab === "projects"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Job Sites (Projects)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectSubTab("tasks")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      projectSubTab === "tasks"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Tasks &amp; Milestones
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectSubTab("materials")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      projectSubTab === "materials"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Material Orders
                  </button>
                </div>
              </div>

              {/* Sub-tab: Projects */}
              {projectSubTab === "projects" && (
                <div className="space-y-6">
                  {/* 4-Phase Lifecycle Strip */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        phase: "Pre-Construction",
                        desc: "Permits, soil tests & baseline schedule",
                      },
                      {
                        phase: "Construction",
                        desc: "Grading, framing, rough MEP & inspections",
                      },
                      {
                        phase: "Closeout",
                        desc: "Punchlists, Certificate of Occupancy",
                      },
                      {
                        phase: "Warranty",
                        desc: "30-day & 11-month post-handover care",
                      },
                    ].map((item, i) => (
                      <div
                        key={item.phase}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                      >
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Phase {i + 1}: {item.phase}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <CursorDataTable<ConstructionProject>
                    title="Construction Projects (Reusable 4-Phase Template)"
                    endpoint="/projects/"
                    refreshTrigger={refreshCounter}
                    onAddClick={() => setIsProjectOpen(true)}
                    addButtonLabel="New Project"
                    searchPlaceholder="Search by code (PRJ-101), name, PM..."
                    filters={[
                      {
                        key: "phase",
                        label: "Phase",
                        options: [
                          { label: "Pre-Construction", value: "Pre-Construction" },
                          { label: "Construction", value: "Construction" },
                          { label: "Closeout", value: "Closeout" },
                          { label: "Warranty", value: "Warranty" },
                        ],
                      },
                      {
                        key: "status",
                        label: "Status",
                        options: [
                          { label: "On Track", value: "On Track" },
                          { label: "At Risk", value: "At Risk" },
                          { label: "Delayed", value: "Delayed" },
                          { label: "Completed", value: "Completed" },
                        ],
                      },
                    ]}
                    columns={[
                      {
                        key: "name",
                        header: "Project Code & Name",
                        render: (row) => (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">
                                {row.code}
                              </span>
                              {row.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              PM: {row.project_manager} • {row.site_address}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "phase",
                        header: "Phase & Status",
                        render: (row) => (
                          <div className="space-y-1">
                            <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                              {row.phase} ({row.progress_percent}%)
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "budget",
                        header: "Budget & Progress",
                        render: (row) => (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(row.contract_budget)}
                            </div>
                            <div className="h-1.5 w-28 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${row.progress_percent}%` }}
                              />
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "dates",
                        header: "Schedule & Tasks",
                        render: (row) => (
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                            <div>Target: {formatDate(row.target_completion_date)}</div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {row.tasks_count} tasks • {row.costs_count} costs
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              Created: {formatDateTimeWithSeconds(row.created_at)}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "notion",
                        header: "",
                        className: "w-8 text-right",
                        render: (row) => (
                          <OpenLink href={row.notion_url} label="Open in Notion" />
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {/* Sub-tab: Tasks */}
              {projectSubTab === "tasks" && (
                <CursorDataTable<ProjectTask>
                  title="Tasks & Milestones"
                  endpoint="/tasks/"
                  refreshTrigger={refreshCounter}
                  searchPlaceholder="Search tasks, project codes, assigned PM..."
                  columns={[
                    {
                      key: "title",
                      header: "Milestone Task",
                      render: (row) => (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {row.project_code} • {row.project_name}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "phase",
                      header: "Phase & Assigned",
                      render: (row) => (
                        <div className="text-xs">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            {row.phase}
                          </span>
                          <div className="text-slate-500 dark:text-slate-400">{row.assigned_to}</div>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status & Priority",
                      render: (row) => (
                        <div className="space-y-1">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {row.priority} Priority
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            Logged: {formatDateTimeWithSeconds(row.created_at)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "notion",
                      header: "",
                      className: "w-8 text-right",
                      render: (row) => (
                        <OpenLink href={row.notion_url} label="Open in Notion" />
                      ),
                    },
                  ]}
                />
              )}

              {/* Sub-tab: Materials */}
              {projectSubTab === "materials" && (
                <CursorDataTable<MaterialOrder>
                  title="Material Orders & Site Procurement"
                  endpoint="/material-orders/"
                  refreshTrigger={refreshCounter}
                  searchPlaceholder="Search materials, suppliers..."
                  columns={[
                    {
                      key: "item",
                      header: "Material / Supplier",
                      render: (row) => (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.item_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {row.supplier} • Ref: {row.order_reference}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "project",
                      header: "Project",
                      render: (row) => (
                        <div className="text-xs">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {row.project_code}
                          </span>
                          <div className="text-slate-500 dark:text-slate-400">{row.project_name}</div>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status & Cost",
                      render: (row) => (
                        <div>
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          <div className="mt-1 font-bold text-slate-900 dark:text-white text-xs">
                            {formatCurrency(row.unit_cost_total)}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            Ordered: {formatDateTimeWithSeconds(row.created_at)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "notion",
                      header: "",
                      className: "w-8 text-right",
                      render: (row) => (
                        <OpenLink href={row.notion_url} label="Open in Notion" />
                      ),
                    },
                  ]}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: INVOICE AUTOMATION                                 */}
          {/* ======================================================== */}
          {activeTab === "automation" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Subcontractor Invoices &amp; Margin Protection
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Automated email invoice parsing, duplicate rejection, and real-time cost tracking
                  </p>
                </div>

                {/* Sub-tab switcher */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-transparent dark:border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setInvoiceSubTab("invoices")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      invoiceSubTab === "invoices"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Subcontractor Invoices
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceSubTab("emails")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      invoiceSubTab === "emails"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Email Activity Logs
                  </button>
                </div>
              </div>

              {/* Sub-tab: Invoices */}
              {invoiceSubTab === "invoices" && (
                <div className="space-y-6">
                  {/* Simulator Test Bench Card */}
                  <div className="card p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white dark:border-indigo-950 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Live AI Invoice Processing Test Bench
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Click any test scenario to simulate an incoming subcontractor email with an invoice attachment
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsInvoiceOpen(true)}
                        className="btn-primary py-2 text-xs shrink-0 self-start sm:self-auto"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Send Custom Vendor Invoice</span>
                      </button>
                    </div>

                    {/* 5 One-Click Scenario Buttons */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                      {[
                        {
                          key: "1_unpaid_invoice",
                          title: "1. Unpaid Invoice",
                          desc: "Sierra HVAC • $18.5k Unpaid • PRJ-101",
                        },
                        {
                          key: "2_paid_receipt",
                          title: "2. Paid Receipt",
                          desc: "Cascade Millwork • $14.2k Paid • PRJ-102",
                        },
                        {
                          key: "3_duplicate_submission",
                          title: "3. Duplicate Resend",
                          desc: "Re-sends $18.5k bill • Blocks double pay",
                        },
                        {
                          key: "4_status_update_paid",
                          title: "4. Update to Paid",
                          desc: "Marks $18.5k as Paid in-place",
                        },
                        {
                          key: "5_flagged_clarification",
                          title: "5. Ambiguous Invoice",
                          desc: "Missing job code -> Flags for review",
                        },
                      ].map((sc) => (
                        <button
                          key={sc.key}
                          type="button"
                          disabled={runningScenario !== null}
                          onClick={() => handleRunScenario(sc.key)}
                          className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>{sc.title}</span>
                            <Play className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{sc.desc}</p>
                        </button>
                      ))}
                    </div>

                    {/* Execution Trace Result */}
                    {lastSimulation && (
                      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-bold text-emerald-950 dark:text-emerald-200">
                              {lastSimulation.scenario_label}: {lastSimulation.action_taken}
                            </span>
                          </div>
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">
                            Duplicate Prevented:{" "}
                            {lastSimulation.duplicate_prevented ? "YES" : "NO"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-2.5 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            Exact Trigger Timestamp:{" "}
                            <span className="font-bold">
                              {formatDateTimeWithSeconds(
                                lastSimulation.triggered_at ||
                                  lastSimulation.event_timestamp ||
                                  lastSimulation.cost_record?.created_at
                              )}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 sm:grid-cols-4">
                          <div>
                            <span className="text-slate-400">Supplier:</span>{" "}
                            {lastSimulation.cost_record.supplier}
                          </div>
                          <div>
                            <span className="text-slate-400">Doc Ref:</span>{" "}
                            {lastSimulation.cost_record.document_reference}
                          </div>
                          <div>
                            <span className="text-slate-400">Amount:</span> $
                            {lastSimulation.cost_record.amount}{" "}
                            {lastSimulation.cost_record.currency} (
                            {lastSimulation.cost_record.payment_status})
                          </div>
                          <div>
                            <span className="text-slate-400">Review Flag:</span>{" "}
                            {lastSimulation.needs_clarification
                              ? "Flagged for Review"
                              : "Clean"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <CursorDataTable<ProjectCost>
                    title="Project Costs & Invoices (Notion + n8n Synced)"
                    endpoint="/costs/"
                    refreshTrigger={refreshCounter}
                    onAddClick={() => setIsInvoiceOpen(true)}
                    addButtonLabel="Ingest Custom Vendor Invoice"
                    searchPlaceholder="Search supplier, invoice ref, project..."
                    filters={[
                      {
                        key: "payment_status",
                        label: "Status",
                        options: [
                          { label: "Unpaid", value: "Unpaid" },
                          { label: "Paid", value: "Paid" },
                          { label: "Partially Paid", value: "Partially Paid" },
                        ],
                      },
                      {
                        key: "needs_clarification",
                        label: "Review",
                        options: [
                          { label: "Needs Clarification", value: "true" },
                          { label: "Clean / Matched", value: "false" },
                        ],
                      },
                    ]}
                    columns={[
                      {
                        key: "supplier",
                        header: "Supplier & Ref #",
                        render: (row) => (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {row.supplier}
                            </div>
                            <div className="font-mono text-xs text-indigo-700 dark:text-indigo-400">
                              {row.document_reference}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {row.source_email}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "project",
                        header: "Linked Build",
                        render: (row) => (
                          <div className="text-xs">
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {row.project_code || "UNLINKED"}
                            </span>
                            <div className="text-slate-500 dark:text-slate-400">{row.project_name}</div>
                          </div>
                        ),
                      },
                      {
                        key: "amount",
                        header: "Amount & Status",
                        render: (row) => (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              ${row.amount} {row.currency}
                            </div>
                            <div className="mt-1">
                              <Badge tone={statusTone(row.payment_status)}>
                                {row.payment_status}
                              </Badge>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "event_timestamp",
                        header: "Recorded / Event Time",
                        render: (row) => (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                              <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span>{formatDateTimeWithSeconds(row.event_timestamp || row.created_at)}</span>
                            </div>
                            {row.invoice_date && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Invoice Date: {formatDate(row.invoice_date)}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "clarification",
                        header: "Clarification / Notes",
                        render: (row) => (
                          <div>
                            {row.needs_clarification ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800">
                                <AlertTriangle className="h-3 w-3" />
                                Needs Clarification
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">Clean</span>
                            )}
                            {row.clarification_notes && (
                              <p className="mt-1 max-w-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {row.clarification_notes}
                              </p>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "notion",
                        header: "",
                        className: "w-8 text-right",
                        render: (row) => (
                          <OpenLink href={row.notion_url} label="Open in Notion" />
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {/* Sub-tab: Emails */}
              {invoiceSubTab === "emails" && (
                <div className="space-y-6">
                  {/* Part 3 Assessment Live Email Automation Trigger Bar */}
                  <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <Mail className="h-4 w-4" />
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Live Part 3 Assessment Email Automation Test Bench
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Trigger real client communications and founder review alerts delivered via Gmail SMTP SSL (<span className="font-mono">smtp.gmail.com:465</span>).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSmtpSettingsOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer self-start sm:self-auto"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Configure SMTP Settings</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* Client 1 Trigger */}
                      <button
                        type="button"
                        disabled={dispatchingEmail !== null}
                        onClick={() =>
                          handleTriggerClientEmail({
                            client_email: "musfiq.works+client1@gmail.com",
                            client_name: "Arthur & Clara Henderson",
                            project_code: "PRJ-101",
                            email_type: "milestone_update",
                            keyLabel: "client1",
                          })
                        }
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3.5 text-left transition hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span>Arthur Henderson (PRJ-101)</span>
                          {dispatchingEmail === "client1" ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                          ) : (
                            <Play className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          musfiq.works+client1@gmail.com
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Milestone Update: Phase 2 Structural Framing Approved
                        </p>
                      </button>

                      {/* Client 2 Trigger */}
                      <button
                        type="button"
                        disabled={dispatchingEmail !== null}
                        onClick={() =>
                          handleTriggerClientEmail({
                            client_email: "musfiq.works+client2@gmail.com",
                            client_name: "Dr. Elena Rostova",
                            project_code: "PRJ-102",
                            email_type: "design_agreement",
                            keyLabel: "client2",
                          })
                        }
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3.5 text-left transition hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span>Dr. Elena Rostova (PRJ-102)</span>
                          {dispatchingEmail === "client2" ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                          ) : (
                            <Play className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          musfiq.works+client2@gmail.com
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Design Agreement Ready: $4.1M Coastal Villa
                        </p>
                      </button>

                      {/* Founder Review Alert Trigger */}
                      <button
                        type="button"
                        disabled={dispatchingEmail !== null}
                        onClick={() =>
                          handleTriggerClientEmail({
                            client_email: "musfiq.works@gmail.com",
                            client_name: "Dr. Elena Rostova",
                            project_code: "PRJ-102",
                            email_type: "review_alert",
                            keyLabel: "founder",
                          })
                        }
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
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
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
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
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.subject}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                            {row.body_preview}
                          </div>
                          {row.attachment_name && (
                            <span className="inline-block mt-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
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
                        <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
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
                          <div className="text-xs text-slate-500 dark:text-slate-400">{row.status}</div>
                        </div>
                      ),
                    },
                    {
                      key: "time",
                      header: "Exact Log Time",
                      render: (row) => (
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{formatDateTimeWithSeconds(row.created_at)}</span>
                        </div>
                      ),
                    },
                  ]}
                />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ContactFormModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        onSaved={(msg) => {
          showToast(msg, "success");
          setRefreshCounter((c) => c + 1);
        }}
      />
      <DealFormModal
        isOpen={isDealOpen}
        onClose={() => setIsDealOpen(false)}
        onSaved={(msg) => {
          showToast(msg, "success");
          setRefreshCounter((c) => c + 1);
        }}
      />
      <ProjectFormModal
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
        onSaved={(msg) => {
          showToast(msg, "success");
          setRefreshCounter((c) => c + 1);
        }}
      />
      <InvoiceFormModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        onSaved={(msg) => {
          showToast(msg, "success");
          setRefreshCounter((c) => c + 1);
        }}
        onProcessed={(res) => {
          setLastSimulation(res);
        }}
      />
      <SMTPSettingsModal
        isOpen={isSmtpSettingsOpen}
        onClose={() => setIsSmtpSettingsOpen(false)}
        onSuccessToast={(msg) => showToast(msg, "success")}
      />
    </div>
  );
}
