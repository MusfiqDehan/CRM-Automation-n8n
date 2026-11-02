"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Layers,
  LayoutDashboard,
  Mail,
  Plus,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Sliders,
  Users,
  Workflow,
} from "lucide-react";
import { BeamLineLogo, BeamLineMark } from "@/components/brand/BeamLineLogo";
import { AuthModal, AuthGate } from "@/components/auth/AuthModal";
import { PlatformSuperAdminPortal } from "@/components/admin/PlatformSuperAdminPortal";
import { SuperAdminModal } from "@/components/admin/SuperAdminModal";
import { TenantSettingsModal } from "@/components/admin/TenantSettingsModal";
import {
  ContactFormModal,
  DealFormModal,
  InvoiceFormModal,
  ProjectFormModal,
} from "@/components/admin/AdminForms";
import { SMTPSettingsModal } from "@/components/admin/SMTPSettingsModal";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { type DateRangePreset } from "@/components/charts/DateRangeFilter";
import { ActionMenu, type ActionMenuSection } from "@/components/ui/overlay";
import { Badge, SectionIntro, Tabs } from "@/components/ui/primitives";
import { apiClient } from "@/lib/api-client";
import { formatCompactCurrency, formatDateTimeWithSeconds } from "@/lib/format";
import type {
  AuthUser,
  DashboardSummary,
  OAuthPublicConfig,
  Opportunity,
  Organization,
  SimulatorTriggerResponse,
} from "@/lib/types";

// Modular Views
import { OverviewView } from "@/components/admin/views/OverviewView";
import { DealsView } from "@/components/admin/views/DealsView";
import { ContactsView } from "@/components/admin/views/ContactsView";
import { JobSitesView } from "@/components/admin/views/JobSitesView";
import { TasksView } from "@/components/admin/views/TasksView";
import { MaterialsView } from "@/components/admin/views/MaterialsView";
import { InvoicesView } from "@/components/admin/views/InvoicesView";
import { SimulatorView } from "@/components/admin/views/SimulatorView";
import { EmailActivityView } from "@/components/admin/views/EmailActivityView";

export type AdminTab = "overview" | "crm" | "projects" | "automation";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Multi-Tenant & Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [oauthConfig, setOAuthConfig] = useState<OAuthPublicConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("Owner");
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [inspectingOrg, setInspectingOrg] = useState<Organization | null>(null);
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
  const [projectSubTab, setProjectSubTab] = useState<"projects" | "tasks" | "materials">("projects");
  const [invoiceSubTab, setInvoiceSubTab] = useState<"invoices" | "simulator" | "emails">("invoices");

  // Simulator state
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] = useState<SimulatorTriggerResponse | null>(null);

  // Modals state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDealOpen, setIsDealOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Opportunity | null>(null);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSmtpSettingsOpen, setIsSmtpSettingsOpen] = useState(false);
  const [dispatchingEmail, setDispatchingEmail] = useState<string | null>(null);

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
        if (meRes.active_organization) {
          setActiveOrg(meRes.active_organization);
        }
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

  const fetchSummary = useCallback(
    async (preset = dateRange, start = customStart, end = customEnd) => {
      setLoadingSummary(true);
      try {
        let url = `/dashboard/summary/?range=${preset}`;
        if (preset === "custom" && start && end) {
          url += `&start_date=${start}&end_date=${end}`;
        }
        const data = await apiClient.get<DashboardSummary>(url);
        setSummary(data);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to load summary stats.",
          "error"
        );
      } finally {
        setLoadingSummary(false);
      }
    },
    [dateRange, customStart, customEnd]
  );

  const handleDateRangeChange = (preset: DateRangePreset, start?: string, end?: string) => {
    setDateRange(preset);
    if (start && end) {
      setCustomStart(start);
      setCustomEnd(end);
      fetchSummary(preset, start, end);
    } else {
      fetchSummary(preset);
    }
  };

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

  const handleReviewDeal = async (dealSummary: { id: string; name: string }) => {
    try {
      const opp = await apiClient.get<Opportunity>(
        `/opportunities/${dealSummary.id}/`
      );
      setEditingDeal(opp);
      setIsDealOpen(true);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load deal details.",
        "error"
      );
    }
  };

  const kpis = summary?.kpis;
  const kevinReviewCount = kpis?.kevin_review_opportunities_count ?? 0;
  const flaggedCostsCount = kpis?.flagged_costs_count ?? 0;
  const activeProjectsCount = kpis?.active_projects_count ?? 0;

  const isSuperadmin = Boolean(currentUser?.is_superuser || currentRole === "Superadmin");
  const showPublicSite = activeOrg?.feature_flags?.page_landing === true;
  const tenantHomeUrl = activeOrg?.custom_domain
    ? `https://${activeOrg.custom_domain}`
    : activeOrg?.slug
    ? `/?tenant=${activeOrg.slug}`
    : "/";

  // Feature flag helpers
  const isFeatureEnabled = (key: string) => activeOrg?.feature_flags?.[key] !== false;

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
    ...(isFeatureEnabled("sub_automation_simulator") ? [{ id: "simulator" as const, label: "Margin shield simulator" }] : []),
    ...(isFeatureEnabled("sub_automation_emails") ? [{ id: "emails" as const, label: "Email activity" }] : []),
  ];

  const activeCrmSubTab = crmTabs.some((t) => t.id === crmSubTab) ? crmSubTab : crmTabs[0]?.id;
  const activeProjectSubTab = projectTabs.some((t) => t.id === projectSubTab) ? projectSubTab : "projects";
  const activeInvoiceSubTab = invoiceTabs.some((t) => t.id === invoiceSubTab) ? invoiceSubTab : invoiceTabs[0]?.id;

  const navItems: Array<{
    id: AdminTab;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeTone?: "amber" | "emerald" | "red";
    children?: Array<{
      id: string;
      label: string;
      active: boolean;
      onClick: () => void;
      badgeCount?: number;
    }>;
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
      children: [
        ...(isFeatureEnabled("sub_crm_deals")
          ? [
              {
                id: "deals",
                label: "Deals & Pipeline",
                active: activeTab === "crm" && activeCrmSubTab === "deals",
                onClick: () => {
                  setActiveTab("crm");
                  setCrmSubTab("deals");
                },
                badgeCount: kevinReviewCount > 0 ? kevinReviewCount : undefined,
              },
            ]
          : []),
        ...(isFeatureEnabled("sub_crm_contacts")
          ? [
              {
                id: "contacts",
                label: "Contacts & Inquiries",
                active: activeTab === "crm" && activeCrmSubTab === "contacts",
                onClick: () => {
                  setActiveTab("crm");
                  setCrmSubTab("contacts");
                },
              },
            ]
          : []),
      ],
    },
    {
      id: "projects",
      label: "Active Builds",
      shortLabel: "Builds",
      description: "4-Phase site management",
      icon: Layers,
      badgeCount: activeProjectsCount,
      badgeTone: "emerald",
      children: [
        {
          id: "projects",
          label: "Job Sites",
          active: activeTab === "projects" && activeProjectSubTab === "projects",
          onClick: () => {
            setActiveTab("projects");
            setProjectSubTab("projects");
          },
        },
        ...(isFeatureEnabled("sub_projects_tasks")
          ? [
              {
                id: "tasks",
                label: "Tasks & Milestones",
                active: activeTab === "projects" && activeProjectSubTab === "tasks",
                onClick: () => {
                  setActiveTab("projects");
                  setProjectSubTab("tasks");
                },
              },
            ]
          : []),
        ...(isFeatureEnabled("sub_projects_materials")
          ? [
              {
                id: "materials",
                label: "Material Orders",
                active: activeTab === "projects" && activeProjectSubTab === "materials",
                onClick: () => {
                  setActiveTab("projects");
                  setProjectSubTab("materials");
                },
              },
            ]
          : []),
      ],
    },
    {
      id: "automation",
      label: "Invoices & Bills",
      shortLabel: "Invoices",
      description: "Subcontractors & margin shield",
      icon: Workflow,
      badgeCount: flaggedCostsCount,
      badgeTone: "red",
      children: [
        ...(isFeatureEnabled("sub_automation_invoices")
          ? [
              {
                id: "invoices",
                label: "Supplier Invoices",
                active: activeTab === "automation" && activeInvoiceSubTab === "invoices",
                onClick: () => {
                  setActiveTab("automation");
                  setInvoiceSubTab("invoices");
                },
                badgeCount: flaggedCostsCount > 0 ? flaggedCostsCount : undefined,
              },
            ]
          : []),
        ...(isFeatureEnabled("sub_automation_simulator")
          ? [
              {
                id: "simulator",
                label: "Cost Shield Simulator",
                active: activeTab === "automation" && activeInvoiceSubTab === "simulator",
                onClick: () => {
                  setActiveTab("automation");
                  setInvoiceSubTab("simulator");
                },
              },
            ]
          : []),
        ...(isFeatureEnabled("sub_automation_emails")
          ? [
              {
                id: "emails",
                label: "Email Activity",
                active: activeTab === "automation" && activeInvoiceSubTab === "emails",
                onClick: () => {
                  setActiveTab("automation");
                  setInvoiceSubTab("emails");
                },
              },
            ]
          : []),
      ],
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

  const isPageEnabled = (tab: AdminTab) => filteredNavItems.some((n) => n.id === tab);

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
      className: "lg:hidden",
      items: showPublicSite
        ? [
            {
              id: "public",
              label: "View public site",
              description: "Open your client-facing landing page",
              icon: ArrowLeft,
              onSelect: () => {
                window.location.href = tenantHomeUrl;
              },
            },
          ]
        : [],
    },
  ];

  const pageMeta: Record<AdminTab, { title: string; subtitle: string; subLabel?: string }> = {
    overview: {
      title: "Executive Dashboard",
      subtitle: "High-level snapshot of pipeline, builds, and priority items",
    },
    crm: {
      title: "Sales & Client Management",
      subtitle:
        activeCrmSubTab === "contacts"
          ? "Directory of prospective clients, active homeowners, and architectural partners"
          : "Live deals pipeline, qualification stages, and founder review triage",
      subLabel: activeCrmSubTab === "contacts" ? "Contacts & Inquiries" : "Pipeline Funnel",
    },
    projects: {
      title: "Active Construction Projects",
      subtitle:
        activeProjectSubTab === "tasks"
          ? "Site task board, trade dependencies, and milestone tracking"
          : activeProjectSubTab === "materials"
          ? "Procurement tracking, supplier purchase orders, and delivery timelines"
          : "4-Phase delivery milestones, contract budgets, and project managers",
      subLabel:
        activeProjectSubTab === "tasks"
          ? "Tasks & Milestones"
          : activeProjectSubTab === "materials"
          ? "Material Orders"
          : "Job Sites",
    },
    automation: {
      title: "Subcontractor Invoices & Costs",
      subtitle:
        activeInvoiceSubTab === "simulator"
          ? "Part 3 Live AI margin shield test bench & inbound email simulation"
          : activeInvoiceSubTab === "emails"
          ? "Live SMTP communication test bench and chronological audit logs"
          : "Automated email parsing, duplicate prevention, and budget variance tracking",
      subLabel:
        activeInvoiceSubTab === "simulator"
          ? "Margin Shield Simulator"
          : activeInvoiceSubTab === "emails"
          ? "Email Activity"
          : "Supplier Invoices",
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
        onAuthSuccess={(user, role) => {
          setCurrentUser(user);
          setCurrentRole(role);
          setRefreshCounter((c) => c + 1);
        }}
      />
    );
  }

  // 3. Platform Superadmin Portal:
  if (isSuperadmin && !inspectingOrg) {
    return (
      <PlatformSuperAdminPortal
        currentUser={currentUser}
        onLogout={() => {
          apiClient.clearAuth();
          setCurrentUser(null);
          setCurrentRole("Guest");
          setRefreshCounter((c) => c + 1);
        }}
        onInspectOrg={(org) => {
          setActiveOrg(org);
          setInspectingOrg(org);
          setActiveTab("overview");
          showToast(`Now inspecting workspace for ${org.name}`);
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 flex flex-col lg:flex-row ${
        isSuperadmin && inspectingOrg ? "pt-10" : ""
      }`}
    >
      {/* Platform Superadmin Inspection Exit Banner */}
      {isSuperadmin && inspectingOrg && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-amber-300 bg-amber-500 px-4 py-2 text-stone-950 font-medium text-xs shadow-md">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Platform Superadmin Support Mode: Inspecting <strong>{inspectingOrg.name}</strong> ({inspectingOrg.subdomain_host}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setInspectingOrg(null);
              setActiveOrg(null);
            }}
            className="rounded-lg bg-stone-900 px-3 py-1 text-white hover:bg-stone-800 transition text-[11px] font-bold shrink-0 cursor-pointer"
          >
            Exit Inspection &amp; Return to Platform Superadmin Portal
          </button>
        </div>
      )}

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
      {/* MAIN CONTENT AREA                                            */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-stone-800/90 dark:bg-stone-900/95 transition-colors duration-200">
          <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5 lg:px-8 2xl:px-10">
            {/* Left: Mobile Brand / Desktop Active Title with Contextual Breadcrumbs */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Mobile View Title & Brand */}
              <Link
                href={tenantHomeUrl}
                aria-label={`${activeOrg?.name || "Workspace"} home`}
                className="flex min-w-0 items-center gap-2.5 lg:hidden group transition-opacity hover:opacity-85"
              >
                <BeamLineMark className="size-8" title="BeamLine" />
                <div className="min-w-0">
                  <h1 className="max-w-36 truncate text-sm font-semibold leading-tight text-stone-900 sm:max-w-xs dark:text-white">
                    {pageMeta[activeTab].title}
                  </h1>
                  <span className="block max-w-36 truncate text-[11px] text-stone-500 sm:max-w-xs dark:text-stone-400">
                    {activeOrg?.name || "BeamLine"}
                  </span>
                </div>
              </Link>

              {/* Desktop View Title & Breadcrumbs */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300">
                  {React.createElement(
                    navItems.find((n) => n.id === activeTab)?.icon || Building2,
                    { className: "h-5 w-5" }
                  )}
                </div>
                <div>
                  {/* Contextual Breadcrumb Navigation */}
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 font-medium mb-0.5">
                    <span>Operations</span>
                    <ChevronRight className="size-3 text-stone-400 dark:text-stone-600" />
                    <span>{navItems.find((n) => n.id === activeTab)?.label}</span>
                    {pageMeta[activeTab].subLabel && (
                      <>
                        <ChevronRight className="size-3 text-stone-400 dark:text-stone-600" />
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {pageMeta[activeTab].subLabel}
                        </span>
                      </>
                    )}
                  </div>

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

            {/* Right: Actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ThemeToggle variant="compact" className="size-9" />

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

        {/* Content Body */}
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
                <OverviewView
                  summary={summary}
                  loadingSummary={loadingSummary}
                  dateRange={dateRange}
                  customStart={customStart}
                  customEnd={customEnd}
                  onDateRangeChange={handleDateRangeChange}
                  onNavigateToDeals={() => {
                    setActiveTab("crm");
                    setCrmSubTab("deals");
                  }}
                  onNavigateToBuilds={() => {
                    setActiveTab("projects");
                    setProjectSubTab("projects");
                  }}
                  onNavigateToInvoices={() => {
                    setActiveTab("automation");
                    setInvoiceSubTab("invoices");
                  }}
                  onSelectPipelineStage={(stage) => {
                    setSelectedPipelineStage(stage);
                    setSelectedReviewFilter("");
                    setActiveTab("crm");
                    setCrmSubTab("deals");
                  }}
                />
              )}

              {/* ======================================================== */}
              {/* TAB 2: SALES & CLIENTS                                    */}
              {/* ======================================================== */}
              {activeTab === "crm" && (
                <div className="space-y-6">
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

                  {crmTabs.length === 0 ? (
                    <div className="card px-6 py-12 text-center text-sm text-stone-500 dark:text-stone-400">
                      Sales modules are not enabled for this workspace.
                    </div>
                  ) : activeCrmSubTab === "contacts" ? (
                    <ContactsView
                      refreshCounter={refreshCounter}
                      onOpenNewContact={() => setIsContactOpen(true)}
                    />
                  ) : (
                    <DealsView
                      summary={summary}
                      refreshCounter={refreshCounter}
                      selectedPipelineStage={selectedPipelineStage}
                      selectedReviewFilter={selectedReviewFilter}
                      onFilterStage={(stage) => {
                        setSelectedPipelineStage(stage);
                        setSelectedReviewFilter("");
                      }}
                      onFilterReview={() => {
                        setSelectedReviewFilter("true");
                        setSelectedPipelineStage("");
                      }}
                      onClearFilters={() => {
                        setSelectedPipelineStage("");
                        setSelectedReviewFilter("");
                      }}
                      onOpenNewDeal={() => {
                        setEditingDeal(null);
                        setIsDealOpen(true);
                      }}
                      onEditDeal={(deal) => {
                        setEditingDeal(deal);
                        setIsDealOpen(true);
                      }}
                      onReviewDeal={handleReviewDeal}
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

                  {activeProjectSubTab === "tasks" ? (
                    <TasksView refreshCounter={refreshCounter} />
                  ) : activeProjectSubTab === "materials" ? (
                    <MaterialsView refreshCounter={refreshCounter} />
                  ) : (
                    <JobSitesView
                      refreshCounter={refreshCounter}
                      onOpenNewProject={() => setIsProjectOpen(true)}
                      isBoardFeatureEnabled={isFeatureEnabled("sub_projects_board")}
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

                  {invoiceTabs.length === 0 ? (
                    <div className="card px-6 py-12 text-center text-sm text-stone-500 dark:text-stone-400">
                      Invoice modules are not enabled for this workspace.
                    </div>
                  ) : activeInvoiceSubTab === "simulator" ? (
                    <SimulatorView
                      runningScenario={runningScenario}
                      lastSimulation={lastSimulation}
                      onRunScenario={handleRunScenario}
                      onNavigateToInvoices={() => setInvoiceSubTab("invoices")}
                    />
                  ) : activeInvoiceSubTab === "emails" ? (
                    <EmailActivityView
                      refreshCounter={refreshCounter}
                      dispatchingEmail={dispatchingEmail}
                      onTriggerEmail={handleTriggerClientEmail}
                      onOpenSmtpSettings={() => setIsSmtpSettingsOpen(true)}
                    />
                  ) : (
                    <InvoicesView
                      refreshCounter={refreshCounter}
                      onOpenNewInvoice={() => setIsInvoiceOpen(true)}
                      onNavigateToSimulator={() => setInvoiceSubTab("simulator")}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* DESKTOP SIDEBAR (FIXED LEFT NAVIGATION, VISIBLE ON LG+)      */}
      {/* ------------------------------------------------------------ */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-72 flex-col justify-between border-r border-stone-200/90 bg-white dark:border-stone-800/90 dark:bg-stone-900 transition-colors duration-200">
        <div className="flex-1 overflow-y-auto">
          {/* Tenant Identity & Clickable Logo */}
          <div className="border-b border-stone-200/80 p-5 dark:border-stone-800/80">
            <BeamLineLogo
              href={tenantHomeUrl}
              wordmarkClassName="text-sm text-stone-900 dark:text-white"
              badge={
                <span className="rounded-md bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {isSuperadmin ? "Platform Owner" : currentRole === "Owner" ? "Client Admin" : currentRole}
                </span>
              }
              subtitle={
                activeOrg?.custom_domain
                  ? activeOrg.custom_domain
                  : activeOrg?.slug
                  ? `${activeOrg.slug}.beamline.musfiqdehan.com`
                  : "kevin.beamline.musfiqdehan.com"
              }
              subtitleClassName="max-w-[170px] font-mono text-stone-500 dark:text-stone-400"
            />
          </div>

          {/* Navigation Links with Indented Sub-Pages */}
          <div className="px-3 py-4">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Operations
            </span>
            <nav aria-label="Workspace sections" className="mt-2 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id === "crm" && !crmTabs.some((t) => t.id === crmSubTab)) {
                          setCrmSubTab("deals");
                        }
                        if (item.id === "projects" && !projectTabs.some((t) => t.id === projectSubTab)) {
                          setProjectSubTab("projects");
                        }
                        if (item.id === "automation" && !invoiceTabs.some((t) => t.id === invoiceSubTab)) {
                          setInvoiceSubTab("invoices");
                        }
                      }}
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

                    {/* Expandable Sub-items for Active Section */}
                    {active && item.children && item.children.length > 0 && (
                      <div className="ml-5 pl-3 border-l-2 border-amber-300 dark:border-amber-700/60 space-y-1 py-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={child.onClick}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                              child.active
                                ? "bg-amber-100/70 font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-200"
                            }`}
                          >
                            <span className="truncate">{child.label}</span>
                            {child.badgeCount !== undefined && child.badgeCount > 0 && (
                              <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                                {child.badgeCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                <Link
                  href={tenantHomeUrl}
                  className="btn-ghost btn-sm w-full"
                >
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
                <span className="text-[10px] sm:text-[11px] tracking-tight text-center truncate max-w-full px-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
        onAuthSuccess={(user, role) => {
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
        onInspectWorkspace={(org) => {
          setActiveOrg(org);
          setActiveTab("overview");
          setIsSuperAdminOpen(false);
          showToast(`Now inspecting workspace for ${org.name}`, "success");
        }}
        onOrganizationsChanged={() => {
          setRefreshCounter((c) => c + 1);
        }}
      />
    </div>
  );
}
