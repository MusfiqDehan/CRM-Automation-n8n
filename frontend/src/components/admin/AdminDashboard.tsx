"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Mail,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { BeamLineLogo, BeamLineMark } from "@/components/brand/BeamLineLogo";
import { AuthModal, AuthGate } from "@/components/auth/AuthModal";
import { SuperAdminModal } from "@/components/admin/SuperAdminModal";
import { TenantSettingsModal } from "@/components/admin/TenantSettingsModal";
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
import { ActionMenu, type ActionMenuSection } from "@/components/ui/overlay";
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
  AuthTokens,
  AuthUser,
  ConstructionProject,
  Contact,
  DashboardSummary,
  EmailCommunicationLog,
  MaterialOrder,
  OAuthPublicConfig,
  Opportunity,
  Organization,
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

  // Multi-Tenant & Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [oauthConfig, setOAuthConfig] = useState<OAuthPublicConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("Owner");
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<
    Array<{ id: string; name: string; slug: string; role: string; is_active: boolean }>
  >([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTenantSettingsOpen, setIsTenantSettingsOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);

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

  // Simulator state
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] =
    useState<SimulatorTriggerResponse | null>(null);

  // Modals state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDealOpen, setIsDealOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Opportunity | null>(null);
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

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const fetchAuthAndTenant = useCallback(async () => {
    try {
      const [meRes, configRes] = await Promise.all([
        apiClient.get<{
          is_authenticated: boolean;
          user?: AuthUser;
          active_role?: string;
          active_organization?: Organization;
          organizations?: Array<{
            id: string;
            name: string;
            slug: string;
            role: string;
            is_active: boolean;
          }>;
        }>("/auth/me/"),
        apiClient.get<OAuthPublicConfig>("/auth/oauth-config/"),
      ]);

      if (configRes) {
        setOAuthConfig(configRes);
        if (configRes.tenant) {
          setActiveOrg(configRes.tenant as unknown as Organization);
        }
      }

      if (meRes?.is_authenticated && meRes.user) {
        setCurrentUser(meRes.user);
        setCurrentRole(meRes.active_role || "Owner");
        setUserOrgs(meRes.organizations || []);
      } else {
        setCurrentUser(null);
        setCurrentRole("Guest");
      }
    } catch (err) {
      console.warn("Could not load auth/me", err);
      setCurrentUser(null);
      setCurrentRole("Guest");
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchAuthAndTenant();
  }, [fetchAuthAndTenant, refreshCounter]);

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
    if (currentUser) {
      fetchSummary();
    }
  }, [fetchSummary, currentUser, refreshCounter]);

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

  const navBadgeClasses: Record<"amber" | "emerald" | "red", string> = {
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    red: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!activeOrg?.feature_flags) return true;
    if (item.id === "overview") return activeOrg.feature_flags.page_overview !== false;
    if (item.id === "crm") return activeOrg.feature_flags.page_crm !== false;
    if (item.id === "projects") return activeOrg.feature_flags.page_projects !== false;
    if (item.id === "automation") return activeOrg.feature_flags.page_automation !== false;
    return true;
  });

  useEffect(() => {
    if (filteredNavItems.length > 0 && !filteredNavItems.some((n) => n.id === activeTab)) {
      setActiveTab(filteredNavItems[0].id);
    }
  }, [filteredNavItems, activeTab]);

  // Sub-module entitlements managed from the platform console. Missing flags
  // default to enabled so existing tenants keep their current experience.
  const isFeatureEnabled = (key: string) => activeOrg?.feature_flags?.[key] !== false;
  const isPageEnabled = (tab: AdminTab) => filteredNavItems.some((n) => n.id === tab);
  const isSuperadmin = Boolean(currentUser?.is_superuser || currentRole === "Superadmin");
  const showPublicSite = activeOrg?.feature_flags?.page_landing === true;

  const crmTabs = [
    ...(isFeatureEnabled("sub_crm_deals") ? [{ id: "deals" as const, label: "Deals & opportunities" }] : []),
    ...(isFeatureEnabled("sub_crm_contacts") ? [{ id: "contacts" as const, label: "Contacts & inquiries" }] : []),
  ];
  const projectTabs = [
    { id: "projects" as const, label: "Job sites" },
    ...(isFeatureEnabled("sub_projects_tasks") ? [{ id: "tasks" as const, label: "Tasks & milestones" }] : []),
    ...(isFeatureEnabled("sub_projects_materials") ? [{ id: "materials" as const, label: "Material orders" }] : []),
  ];
  const invoiceTabs = [
    ...(isFeatureEnabled("sub_automation_invoices") ? [{ id: "invoices" as const, label: "Supplier invoices" }] : []),
    ...(isFeatureEnabled("sub_automation_emails") ? [{ id: "emails" as const, label: "Email activity" }] : []),
  ];
  const activeCrmSubTab = crmTabs.some((t) => t.id === crmSubTab) ? crmSubTab : crmTabs[0]?.id;
  const activeProjectSubTab = projectTabs.some((t) => t.id === projectSubTab) ? projectSubTab : "projects";
  const activeInvoiceSubTab = invoiceTabs.some((t) => t.id === invoiceSubTab) ? invoiceSubTab : invoiceTabs[0]?.id;

  const createMenuSections: ActionMenuSection[] = [
    {
      label: "Sales",
      items: isPageEnabled("crm")
        ? [
            ...(isFeatureEnabled("sub_crm_contacts")
              ? [
                  {
                    id: "contact",
                    label: "New contact",
                    description: "Inquiry, referral, or partner",
                    icon: Users,
                    onSelect: () => setIsContactOpen(true),
                  },
                ]
              : []),
            ...(isFeatureEnabled("sub_crm_deals")
              ? [
                  {
                    id: "deal",
                    label: "New deal",
                    description: "Qualified custom home opportunity",
                    icon: DollarSign,
                    onSelect: () => {
                      setEditingDeal(null);
                      setIsDealOpen(true);
                    },
                  },
                ]
              : []),
          ]
        : [],
    },
    {
      label: "Builds",
      items: isPageEnabled("projects")
        ? [
            {
              id: "project",
              label: "New project",
              description: "Sets up 4-phase build checklists",
              icon: Layers,
              onSelect: () => setIsProjectOpen(true),
            },
          ]
        : [],
    },
    {
      label: "Invoices",
      items:
        isPageEnabled("automation") && isFeatureEnabled("sub_automation_invoices")
          ? [
              {
                id: "invoice",
                label: "Ingest invoice",
                description: "Supplier PDF invoice or receipt",
                icon: Workflow,
                onSelect: () => setIsInvoiceOpen(true),
              },
            ]
          : [],
    },
  ];
  const hasCreateActions = createMenuSections.some((section) => section.items.length > 0);

  const settingsMenuSections: ActionMenuSection[] = [
    {
      label: "Workspace",
      items: [
        {
          id: "org",
          label: "Organization settings",
          description: "Domain, thresholds, sign-in, and team",
          icon: Sliders,
          onSelect: () => setIsTenantSettingsOpen(true),
        },
        {
          id: "smtp",
          label: "Email delivery",
          description: "SMTP credentials and test sends",
          icon: Mail,
          onSelect: () => setIsSmtpSettingsOpen(true),
        },
      ],
    },
    {
      label: "Platform",
      items: isSuperadmin
        ? [
            {
              id: "platform",
              label: "Platform console",
              description: "Clients, sign-in, and feature entitlements",
              icon: ShieldCheck,
              onSelect: () => setIsSuperAdminOpen(true),
            },
          ]
        : [],
    },
    {
      // The desktop sidebar already exposes the public site link.
      className: "lg:hidden",
      items: showPublicSite
        ? [
            {
              id: "public",
              label: "View public site",
              description: "Open your client-facing landing page",
              icon: ArrowLeft,
              onSelect: () => {
                window.location.href = "/";
              },
            },
          ]
        : [],
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

  // 1. Initial Authentication Check Loading State
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
        <BeamLineMark className="size-12 animate-pulse mb-4" title="BeamLine" />
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Verifying Beamline Credentials &amp; Workspace...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Barrier: Superadmin or client cannot access admin panel without registration or login!
  if (!currentUser) {
    return (
      <AuthGate
        oauthConfig={oauthConfig}
        onAuthSuccess={(user, role, tokens, orgSlug) => {
          setCurrentUser(user);
          setCurrentRole(role);
          setRefreshCounter((c) => c + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 flex flex-col lg:flex-row">
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
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-72 flex-col justify-between border-r border-stone-200/90 bg-white dark:border-stone-800/90 dark:bg-stone-900 transition-colors duration-200">
        <div className="flex flex-col">
          {/* Top Brand Header */}
          <div
            className="flex items-center gap-3 border-b border-stone-200/80 dark:border-stone-800/80 px-5 py-4"
            title={activeOrg?.custom_domain || activeOrg?.subdomain_host || "kevin.beamline.musfiqdehan.com"}
          >
            <BeamLineLogo
              wordmarkClassName="text-sm text-stone-900 dark:text-white"
              badge={
                <span className="rounded-md bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {currentRole}
                </span>
              }
              subtitle={activeOrg?.custom_domain || activeOrg?.subdomain_host || "kevin.beamline.musfiqdehan.com"}
              subtitleClassName="max-w-[170px] font-mono text-stone-500 dark:text-stone-400"
            />
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Operations
            </span>
            <nav aria-label="Workspace sections" className="mt-2 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                      active
                        ? "bg-amber-50 text-amber-700 shadow-xs dark:bg-amber-950/60 dark:text-amber-300"
                        : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          active
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300"
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
                          navBadgeClasses[item.badgeTone ?? "emerald"]
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
          <div className="mx-3 mt-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Portfolio Overview
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-500 dark:text-stone-400">Pipeline</span>
                <div className="font-bold text-stone-900 dark:text-white">
                  {formatCompactCurrency(kpis?.total_pipeline_value)}
                </div>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Builds</span>
                <div className="font-bold text-stone-900 dark:text-white">
                  {kpis?.active_projects_count ?? 0} Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar footer: appearance and secondary destinations */}
        <div className="space-y-3 border-t border-stone-200/80 p-4 dark:border-stone-800/80">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Theme
            </div>
            <ThemeToggle className="w-full justify-between" />
          </div>

          {(isSuperadmin || showPublicSite) && (
            <div className="grid gap-2">
              {isSuperadmin && (
                <button type="button" onClick={() => setIsSuperAdminOpen(true)} className="btn-secondary btn-sm w-full">
                  <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Platform console
                </button>
              )}
              {showPublicSite && (
                <Link href="/" className="btn-ghost btn-sm w-full">
                  <ArrowLeft className="h-4 w-4" />
                  View public site
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* MOBILE BOTTOM NAVBAR (FIXED BOTTOM FOR MOBILE & TABLET)      */}
      {/* ------------------------------------------------------------ */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-stone-200/90 bg-white/95 backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-900/95 shadow-xl transition-colors duration-200"
      >
        <div
          className={`mx-auto grid h-16 max-w-lg px-2 ${
            ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"][Math.max(0, filteredNavItems.length - 1)]
          }`}
        >
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer relative ${
                  active
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        navBadgeClasses[item.badgeTone ?? "emerald"]
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{item.shortLabel}</span>
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
        <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-stone-800/90 dark:bg-stone-900/95 transition-colors duration-200">
          <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5 lg:px-8 2xl:px-10">
            {/* Left: Mobile Brand / Desktop Active Title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Mobile View Title & Brand */}
              <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
                <BeamLineMark className="size-8" title="BeamLine" />
                <div className="min-w-0">
                  <p className="max-w-36 truncate text-sm font-semibold leading-tight text-stone-900 sm:max-w-xs dark:text-white">
                    {pageMeta[activeTab].title}
                  </p>
                  <span className="block max-w-36 truncate text-[11px] text-stone-500 sm:max-w-xs dark:text-stone-400">
                    {activeOrg?.name || "BeamLine"}
                  </span>
                </div>
              </div>

              {/* Desktop View Title & Subtitle with Luxury Department Badge */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300">
                  {React.createElement(
                    navItems.find((n) => n.id === activeTab)?.icon || Building2,
                    { className: "h-5 w-5" }
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                      {pageMeta[activeTab].title}
                    </h1>
                    {activeTab === "crm" && kpis && (
                      <Badge tone="green">{formatCompactCurrency(kpis.total_pipeline_value)} pipeline</Badge>
                    )}
                    {activeTab === "crm" && kevinReviewCount > 0 && (
                      <Badge tone="amber">{kevinReviewCount} awaiting review</Badge>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {pageMeta[activeTab].subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: one consistent action cluster on every page and breakpoint */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* The desktop sidebar carries the full theme control. */}
              <ThemeToggle variant="compact" className="size-9 lg:hidden" />

              <ActionMenu
                ariaLabel="Workspace settings"
                triggerClassName="btn-secondary btn-sm h-9 w-9 px-0 sm:w-auto sm:px-3"
                triggerContent={
                  <>
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </>
                }
                sections={settingsMenuSections}
              />

              {hasCreateActions && (
                <ActionMenu
                  ariaLabel="Create new record"
                  triggerClassName="btn-primary btn-sm h-9 w-9 px-0 sm:w-auto sm:px-3"
                  triggerContent={
                    <>
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Create</span>
                    </>
                  }
                  sections={createMenuSections}
                />
              )}

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-secondary btn-sm h-9 gap-2 pl-1.5 pr-1.5 md:pr-3"
                title={`Signed in as ${currentUser.username} (${currentRole})`}
                aria-label={`Account: ${currentUser.username}`}
              >
                <span className="flex size-6 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate md:inline">{currentUser.username}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body - Full Width Responsive Layout (Padding bottom pb-28 on mobile for bottom navbar) */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-8 space-y-8 pb-28 lg:pb-8">
          {activeOrg && !activeOrg.is_active && !currentUser?.is_superuser ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/40 dark:bg-rose-950/20 sm:p-12">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
                Workspace suspended
              </h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-md">
                Workspace <strong>{activeOrg.name}</strong> ({activeOrg.subdomain_host}) has been deactivated by the platform administrator.
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Contact your BeamLine administrator to restore access.
              </p>
              <button type="button" onClick={() => setIsAuthModalOpen(true)} className="btn-secondary mt-6">
                Switch account
              </button>
            </div>
          ) : (
            <>
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
                          onClick={() => {
                            setActiveTab("crm");
                            setCrmSubTab("deals");
                          }}
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
                          onClick={() => {
                            setActiveTab("automation");
                            setInvoiceSubTab("invoices");
                          }}
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
                      onClick={() => {
                        setSelectedPipelineStage(st.stage);
                        setSelectedReviewFilter("");
                        setActiveTab("crm");
                        setCrmSubTab("deals");
                      }}
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
                      onClick={() => {
                        setActiveTab("projects");
                        setProjectSubTab("projects");
                      }}
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
          )}

          {/* ======================================================== */}
          {/* TAB 2: SALES & CLIENTS                                    */}
          {/* ======================================================== */}
          {activeTab === "crm" && (
            <div className="space-y-6">
              {/* Executive Sales Pipeline Visual Overview & Funnel */}
              {isFeatureEnabled("sub_crm_deals") && (
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
                onReviewDeal={async (dealSummary) => {
                  try {
                    const opp = await apiClient.get<Opportunity>(
                      `/opportunities/${dealSummary.id}/`
                    );
                    setEditingDeal(opp);
                    setIsDealOpen(true);
                  } catch (err) {
                    showToast(
                      err instanceof Error
                        ? err.message
                        : "Failed to load deal details.",
                      "error"
                    );
                  }
                }}
              />
              )}

              <SectionIntro
                title="Sales pipeline & client inquiries"
                description="Track referrals from first qualification through design and construction agreements."
                action={
                  crmTabs.length > 1 ? (
                    <Tabs
                      size="sm"
                      ariaLabel="Sales views"
                      tabs={crmTabs}
                      value={activeCrmSubTab ?? "deals"}
                      onChange={(id) => {
                        setCrmSubTab(id);
                        if (id === "deals") {
                          setSelectedPipelineStage("");
                          setSelectedReviewFilter("");
                        }
                      }}
                    />
                  ) : undefined
                }
              />

              {crmTabs.length === 0 && (
                <div className="card px-6 py-12 text-center text-sm text-stone-500 dark:text-stone-400">
                  Sales modules are not enabled for this workspace.
                </div>
              )}

              {/* Sub-tab: Deals */}
              {activeCrmSubTab === "deals" && (
                <CursorDataTable<Opportunity>
                  title="Deals & Opportunities"
                  endpoint="/opportunities/"
                  refreshTrigger={refreshCounter}
                  initialFilters={{
                    ...(selectedPipelineStage ? { stage: selectedPipelineStage } : {}),
                    ...(selectedReviewFilter ? { requires_kevin_review: selectedReviewFilter } : {}),
                  }}
                  onAddClick={() => {
                    setEditingDeal(null);
                    setIsDealOpen(true);
                  }}
                  addButtonLabel="New deal"
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
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
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
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
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
                          <div className="font-bold text-stone-900 dark:text-white">
                            {formatCurrency(row.estimated_value)}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            Follow-up: {formatDate(row.next_follow_up_date)}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
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
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              Managed by Sales Lead
                            </span>
                          )}
                          {row.kevin_review_notes && (
                            <p className="mt-1 max-w-xl text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                              {row.kevin_review_notes}
                            </p>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      className: "w-36 text-right",
                      render: (row) => (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeal(row);
                              setIsDealOpen(true);
                            }}
                            className={`${row.requires_kevin_review ? "btn-primary" : "btn-secondary"} btn-xs`}
                            aria-label={`${row.requires_kevin_review ? "Review" : "Edit"} ${row.name}`}
                          >
                            {row.requires_kevin_review ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Edit2 className="h-3.5 w-3.5" />
                            )}
                            {row.requires_kevin_review ? "Review" : "Edit"}
                          </button>
                          <OpenLink href={row.notion_url} label="Open in Notion" />
                        </div>
                      ),
                    },
                  ]}
                />
              )}

              {/* Sub-tab: Contacts */}
              {activeCrmSubTab === "contacts" && (
                <CursorDataTable<Contact>
                  title="Contacts & Client Inquiries"
                  endpoint="/contacts/"
                  refreshTrigger={refreshCounter}
                  onAddClick={() => setIsContactOpen(true)}
                  addButtonLabel="New contact"
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
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
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
                          <div className="text-stone-800 dark:text-stone-200 font-medium">
                            {row.email}
                          </div>
                          <div className="text-stone-500 dark:text-stone-400">
                            {row.phone || "No phone"} • Prefers:{" "}
                            {row.preferred_channel}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
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
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            Source: {row.referral_source || "Direct"}
                          </span>
                          <p className="mt-0.5 text-stone-600 dark:text-stone-300 line-clamp-2">
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
              <SectionIntro
                title="Construction projects & job sites"
                description="Standard 4-phase checklists: pre-construction, construction, closeout, and warranty."
                action={
                  projectTabs.length > 1 ? (
                    <Tabs
                      size="sm"
                      ariaLabel="Build views"
                      tabs={projectTabs}
                      value={activeProjectSubTab}
                      onChange={setProjectSubTab}
                    />
                  ) : undefined
                }
              />

              {/* Sub-tab: Projects */}
              {activeProjectSubTab === "projects" && (
                <div className="space-y-6">
                  {/* 4-Phase Lifecycle Strip */}
                  {isFeatureEnabled("sub_projects_board") && (
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
                        className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
                      >
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Phase {i + 1}: {item.phase}
                        </div>
                        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  )}

                  <CursorDataTable<ConstructionProject>
                    title="Construction projects"
                    endpoint="/projects/"
                    refreshTrigger={refreshCounter}
                    onAddClick={() => setIsProjectOpen(true)}
                    addButtonLabel="New project"
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
                            <div className="font-semibold text-stone-900 dark:text-white">
                              <span className="font-mono text-amber-600 dark:text-amber-400 mr-1.5">
                                {row.code}
                              </span>
                              {row.name}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
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
                            <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
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
                            <div className="font-bold text-stone-900 dark:text-white">
                              {formatCurrency(row.contract_budget)}
                            </div>
                            <div className="h-1.5 w-28 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-1.5">
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
                          <div className="text-xs text-stone-500 dark:text-stone-400 space-y-0.5">
                            <div>Target: {formatDate(row.target_completion_date)}</div>
                            <div className="font-medium text-stone-700 dark:text-stone-300">
                              {row.tasks_count} tasks • {row.costs_count} costs
                            </div>
                            <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
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
              {activeProjectSubTab === "tasks" && (
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
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {row.title}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
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
                          <div className="text-stone-500 dark:text-stone-400">{row.assigned_to}</div>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status & Priority",
                      render: (row) => (
                        <div className="space-y-1">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            {row.priority} Priority
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
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
              {activeProjectSubTab === "materials" && (
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
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {row.item_name}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
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
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {row.project_code}
                          </span>
                          <div className="text-stone-500 dark:text-stone-400">{row.project_name}</div>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status & Cost",
                      render: (row) => (
                        <div>
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          <div className="mt-1 font-bold text-stone-900 dark:text-white text-xs">
                            {formatCurrency(row.unit_cost_total)}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
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
              <SectionIntro
                title="Supplier invoices & margin protection"
                description="Automated email invoice parsing, duplicate rejection, and real-time cost tracking."
                action={
                  invoiceTabs.length > 1 ? (
                    <Tabs
                      size="sm"
                      ariaLabel="Invoice views"
                      tabs={invoiceTabs}
                      value={activeInvoiceSubTab ?? "invoices"}
                      onChange={setInvoiceSubTab}
                    />
                  ) : undefined
                }
              />

              {invoiceTabs.length === 0 && (
                <div className="card px-6 py-12 text-center text-sm text-stone-500 dark:text-stone-400">
                  Invoice modules are not enabled for this workspace.
                </div>
              )}

              {/* Sub-tab: Invoices */}
              {activeInvoiceSubTab === "invoices" && (
                <div className="space-y-6">
                  {/* Simulator Test Bench Card */}
                  {(isFeatureEnabled("sub_automation_simulator") || lastSimulation) && (
                  <div className="card p-6 border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-white dark:border-amber-950 dark:from-amber-950/20 dark:via-stone-900 dark:to-stone-900 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <h3 className="text-base font-bold text-stone-900 dark:text-white">
                            Live AI Invoice Processing Test Bench
                          </h3>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                          Run a scenario to simulate an incoming subcontractor email with an invoice attachment.
                        </p>
                      </div>

                    </div>

                    {/* One-Click Scenario Buttons */}
                    {isFeatureEnabled("sub_automation_simulator") && (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
                        {
                          key: "6_field_employee_asif",
                          title: "6. Asif -> Kevin",
                          desc: "Asif • $27.5k Framing • musfiq.works+pc1",
                        },
                      ].map((sc) => (
                        <button
                          key={sc.key}
                          type="button"
                          disabled={runningScenario !== null}
                          onClick={() => handleRunScenario(sc.key)}
                          aria-busy={runningScenario === sc.key}
                          className="rounded-2xl border border-stone-200/90 bg-white p-3.5 text-left transition outline-none hover:border-amber-400 hover:shadow-xs focus-visible:ring-4 focus-visible:ring-amber-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-500 dark:focus-visible:ring-amber-900"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-bold text-stone-900 dark:text-white">
                            <span>{sc.title}</span>
                            {runningScenario === sc.key ? (
                              <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Play className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">{sc.desc}</p>
                        </button>
                      ))}
                    </div>
                    )}

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
                        <div className="grid grid-cols-2 gap-2 text-stone-700 dark:text-stone-300 sm:grid-cols-4">
                          <div>
                            <span className="text-stone-400">Supplier:</span>{" "}
                            {lastSimulation.cost_record.supplier}
                          </div>
                          <div>
                            <span className="text-stone-400">Doc Ref:</span>{" "}
                            {lastSimulation.cost_record.document_reference}
                          </div>
                          <div>
                            <span className="text-stone-400">Amount:</span> $
                            {lastSimulation.cost_record.amount}{" "}
                            {lastSimulation.cost_record.currency} (
                            {lastSimulation.cost_record.payment_status})
                          </div>
                          <div>
                            <span className="text-stone-400">Review Flag:</span>{" "}
                            {lastSimulation.needs_clarification
                              ? "Flagged for Review"
                              : "Clean"}
                          </div>
                        </div>
                        {lastSimulation.cost_record.supporting_document_url && (
                          <div className="mt-3 flex flex-wrap items-center gap-3 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-800/70 text-xs">
                            <a
                              href={lastSimulation.cost_record.supporting_document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary btn-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Rendered PDF ({lastSimulation.cost_record.document_reference}.pdf)
                              <ExternalLink className="h-3 w-3 opacity-80" />
                            </a>
                            <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 break-all">
                              {lastSimulation.cost_record.supporting_document_url}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  <CursorDataTable<ProjectCost>
                    title="Project costs & invoices"
                    endpoint="/costs/"
                    refreshTrigger={refreshCounter}
                    onAddClick={() => setIsInvoiceOpen(true)}
                    addButtonLabel="Ingest invoice"
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
                            <div className="font-semibold text-stone-900 dark:text-white">
                              {row.supplier}
                            </div>
                            <div className="font-mono text-xs text-amber-700 dark:text-amber-400">
                              {row.document_reference}
                            </div>
                            <div className="text-[11px] text-stone-400 dark:text-stone-500">
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
                            <div className="text-stone-500 dark:text-stone-400">{row.project_name}</div>
                          </div>
                        ),
                      },
                      {
                        key: "amount",
                        header: "Amount & Status",
                        render: (row) => (
                          <div>
                            <div className="font-bold text-stone-900 dark:text-white">
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
                            <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5 text-xs">
                              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{formatDateTimeWithSeconds(row.event_timestamp || row.created_at)}</span>
                            </div>
                            {row.invoice_date && (
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
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
                              <span className="text-xs text-stone-400 dark:text-stone-500">Clean</span>
                            )}
                            {row.clarification_notes && (
                              <p className="mt-1 max-w-2xl text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                {row.clarification_notes}
                              </p>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "notion",
                        header: "Actions",
                        className: "w-28 text-right",
                        render: (row) => (
                          <div className="flex items-center justify-end gap-2">
                            {row.supporting_document_url ? (
                              <a
                                href={row.supporting_document_url}
                                target="_blank"
                                rel="noreferrer"
                                title="View rendered PDF invoice"
                                aria-label={`View PDF for ${row.document_reference}`}
                                className="btn-secondary btn-xs"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            ) : null}
                            <OpenLink href={row.notion_url} label="Open in Notion" />
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {/* Sub-tab: Emails */}
              {activeInvoiceSubTab === "emails" && (
                <div className="space-y-6">
                  {/* Part 3 Assessment Live Email Automation Trigger Bar */}
                  <div className="card space-y-4 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                            <Mail className="h-4 w-4" />
                          </span>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                            Live Part 3 Assessment Email Automation Test Bench
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                          Trigger real client communications and founder review alerts delivered via Gmail SMTP SSL (<span className="font-mono">smtp.gmail.com:465</span>).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSmtpSettingsOpen(true)}
                        className="btn-secondary btn-sm self-start sm:self-auto"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Email settings
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
                        className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                          <span>Arthur Henderson (PRJ-101)</span>
                          {dispatchingEmail === "client1" ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                          ) : (
                            <Play className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                          musfiq.works+client1@gmail.com
                        </div>
                        <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
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
                        className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                          <span>Dr. Elena Rostova (PRJ-102)</span>
                          {dispatchingEmail === "client2" ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                          ) : (
                            <Play className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                          musfiq.works+client2@gmail.com
                        </div>
                        <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
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
                        className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-3.5 text-left transition hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
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
                        <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
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
                          <div className="font-semibold text-stone-900 dark:text-white">
                            {row.subject}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate max-w-xl">
                            {row.body_preview}
                          </div>
                          {row.attachment_name && (
                            <span className="inline-block mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
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
                        <div className="text-xs space-y-0.5 text-stone-600 dark:text-stone-400">
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
                          <div className="text-xs text-stone-500 dark:text-stone-400">{row.status}</div>
                        </div>
                      ),
                    },
                    {
                      key: "time",
                      header: "Exact Log Time",
                      render: (row) => (
                        <div className="text-xs text-stone-700 dark:text-stone-300 font-mono flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-stone-400 shrink-0" />
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
          </>
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
        deal={editingDeal}
        onClose={() => {
          setIsDealOpen(false);
          setEditingDeal(null);
        }}
        onSaved={(msg) => {
          showToast(msg, "success");
          setRefreshCounter((c) => c + 1);
          setEditingDeal(null);
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        onAuthSuccess={(user, role, tokens, orgSlug) => {
          setCurrentUser(user);
          setCurrentRole(role);
          setRefreshCounter((c) => c + 1);
        }}
        onLogout={() => {
          apiClient.clearAuth();
          setCurrentUser(null);
          setCurrentRole("Guest");
          setRefreshCounter((c) => c + 1);
        }}
      />
      <TenantSettingsModal
        isOpen={isTenantSettingsOpen}
        onClose={() => setIsTenantSettingsOpen(false)}
        onSettingsUpdated={(updated) => {
          setActiveOrg(updated);
          setRefreshCounter((c) => c + 1);
        }}
      />
      <SuperAdminModal
        isOpen={isSuperAdminOpen}
        onClose={() => setIsSuperAdminOpen(false)}
        onOrganizationsChanged={() => {
          setRefreshCounter((c) => c + 1);
        }}
      />
    </div>
  );
}
