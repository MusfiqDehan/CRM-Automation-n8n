"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  Globe,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Megaphone,
  Plus,
  Power,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { BeamLineLogo, BeamLineMark } from "@/components/brand/BeamLineLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { DateRangeFilter, type DateRangePreset } from "@/components/charts/DateRangeFilter";
import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";
import { InteractiveBarChart } from "@/components/charts/InteractiveBarChart";
import { InteractiveDonutChart } from "@/components/charts/InteractiveDonutChart";
import {
  InlineAlert,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Switch,
} from "@/components/ui/overlay";
import { Badge, Field, StatCard } from "@/components/ui/primitives";
import {
  ClientDataTable,
  TableSearchBar,
  TableFilterBar,
  TablePagination,
  TableEmptyState,
  type ClientTableColumn,
} from "@/components/common/table";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatCompactCurrency, formatDate, formatDateTimeWithSeconds } from "@/lib/format";
import type {
  AuthUser,
  ClientSubscription,
  ClientSupportTicket,
  Organization,
  PlatformNotification,
  PlatformSettings,
  PlatformUser,
  SuperadminDashboardStats,
} from "@/lib/types";

export type SuperadminTab =
  | "overview"
  | "clients"
  | "users"
  | "subscriptions"
  | "support"
  | "notifications"
  | "settings";

const FEATURE_GROUPS: Array<{
  title: string;
  description: string;
  items: Array<{ key: string; label: string; defaultEnabled?: boolean }>;
}> = [
  {
    title: "Workspace Pages",
    description: "Top-level views available to the client organization.",
    items: [
      { key: "page_landing", label: "Client landing page", defaultEnabled: false },
      { key: "page_overview", label: "Executive overview" },
      { key: "page_crm", label: "Sales CRM pipeline" },
      { key: "page_projects", label: "4-phase projects" },
      { key: "page_automation", label: "Invoices & automation" },
    ],
  },
  {
    title: "CRM & Field Modules",
    description: "Sub-views inside Sales and Active Builds.",
    items: [
      { key: "sub_crm_deals", label: "High-value deals" },
      { key: "sub_crm_contacts", label: "Contacts & leads" },
      { key: "sub_crm_activities", label: "Follow-up touchpoints" },
      { key: "sub_projects_board", label: "Lifecycle phases" },
      { key: "sub_projects_tasks", label: "Task checklists" },
      { key: "sub_projects_materials", label: "Material orders" },
    ],
  },
  {
    title: "White-label & Governance",
    description: "Branding, integrations, and review thresholds.",
    items: [
      { key: "sub_automation_invoices", label: "AI invoice ingestion" },
      { key: "sub_automation_simulator", label: "Test scenario simulator" },
      { key: "sub_custom_domain", label: "Custom domain attachment" },
      { key: "sub_custom_google_oauth", label: "Client custom OAuth" },
      { key: "sub_executive_triage", label: "Executive threshold triage" },
      { key: "sub_team_invitations", label: "Team member invites" },
    ],
  },
];

interface PlatformSuperAdminPortalProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onInspectOrg: (org: Organization) => void;
}

export function PlatformSuperAdminPortal({
  currentUser,
  onLogout,
  onInspectOrg,
}: PlatformSuperAdminPortalProps) {
  const [activeTab, setActiveTab] = useState<SuperadminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Platform Telemetry State
  const [stats, setStats] = useState<SuperadminDashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [tickets, setTickets] = useState<ClientSupportTicket[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Modals & Action State
  const [selectedOrgForFeatures, setSelectedOrgForFeatures] = useState<Organization | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ClientSupportTicket | null>(null);
  const [selectedSub, setSelectedSub] = useState<ClientSubscription | null>(null);

  // Invite Client Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [inviteOrgSlug, setInviteOrgSlug] = useState("");
  const [invitingClient, setInvitingClient] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState<"info" | "warning" | "critical" | "success">("info");
  const [broadcastTarget, setBroadcastTarget] = useState<string>("");
  const [savingBroadcast, setSavingBroadcast] = useState(false);

  // Ticket Resolution
  const [ticketStatus, setTicketStatus] = useState<string>("In Progress");
  const [ticketNotes, setTicketNotes] = useState("");
  const [savingTicket, setSavingTicket] = useState(false);

  // Platform Settings Form
  const [platformName, setPlatformName] = useState("BeamLine");
  const [baseDomain, setBaseDomain] = useState("beamline.musfiqdehan.com");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);

  // Filter & Pagination States
  const [userOrgFilter, setUserOrgFilter] = useState<string>("all");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>("all");
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [ticketPage, setTicketPage] = useState<number>(1);
  const [ticketPageSize, setTicketPageSize] = useState<number>(6);

  const [notificationSearch, setNotificationSearch] = useState<string>("");
  const [notificationSeverityFilter, setNotificationSeverityFilter] = useState<string>("all");
  const [notificationPage, setNotificationPage] = useState<number>(1);
  const [notificationPageSize, setNotificationPageSize] = useState<number>(6);

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const loadAllData = useCallback(async (preset = dateRange, start = customStart, end = customEnd) => {
    setLoading(true);
    setFeedback(null);
    try {
      let statsUrl = `/superadmin/dashboard-stats/?range=${preset}`;
      if (preset === "custom" && start && end) {
        statsUrl += `&start_date=${start}&end_date=${end}`;
      }
      const [statsRes, orgsRes, usersRes, subsRes, ticketsRes, notesRes, platRes] = await Promise.all([
        apiClient.get<SuperadminDashboardStats>(statsUrl),
        apiClient.get<{ results: Organization[] }>("/superadmin/organizations/"),
        apiClient.get<{ results: PlatformUser[] }>("/superadmin/users/"),
        apiClient.get<{ results: ClientSubscription[] }>("/superadmin/subscriptions/"),
        apiClient.get<{ results: ClientSupportTicket[] }>("/superadmin/support-tickets/"),
        apiClient.get<{ results: PlatformNotification[] }>("/superadmin/notifications/"),
        apiClient.get<PlatformSettings>("/superadmin/platform-settings/"),
      ]);

      if (statsRes) setStats(statsRes);
      if (orgsRes?.results) setOrganizations(orgsRes.results);
      if (usersRes?.results) setUsers(usersRes.results);
      if (subsRes?.results) setSubscriptions(subsRes.results);
      if (ticketsRes?.results) setTickets(ticketsRes.results);
      if (notesRes?.results) setNotifications(notesRes.results);
      if (platRes) {
        setPlatformSettings(platRes);
        setPlatformName(platRes.platform_name || "BeamLine");
        setBaseDomain(platRes.base_domain || "beamline.musfiqdehan.com");
        setGoogleClientId(platRes.google_oauth_client_id || "");
        setGoogleEnabled(Boolean(platRes.google_oauth_enabled));
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load platform data.",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  const handleDateRangeChange = (preset: DateRangePreset, start?: string, end?: string) => {
    setDateRange(preset);
    if (start && end) {
      setCustomStart(start);
      setCustomEnd(end);
      loadAllData(preset, start, end);
    } else {
      loadAllData(preset);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Client Status Toggle
  const handleToggleOrgStatus = async (org: Organization) => {
    const nextState = !org.is_active;
    try {
      const res = await apiClient.patch<Organization>(`/superadmin/organizations/${org.id}/`, {
        is_active: nextState,
      });
      setOrganizations((prev) => prev.map((o) => (o.id === org.id ? res.data : o)));
      loadAllData();
      setFeedback({
        type: "success",
        message: `${org.name} is now ${nextState ? "active" : "suspended"}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update organization status.",
      });
    }
  };

  // Feature Flag Toggle
  const handleToggleFeature = async (featureKey: string, currentValue: boolean) => {
    if (!selectedOrgForFeatures) return;
    const nextValue = !currentValue;
    try {
      const updatedFlags = {
        ...(selectedOrgForFeatures.feature_flags || {}),
        [featureKey]: nextValue,
      };
      const res = await apiClient.patch<Organization>(
        `/superadmin/organizations/${selectedOrgForFeatures.id}/`,
        { feature_flags: updatedFlags }
      );
      const updatedOrg = res.data || {
        ...selectedOrgForFeatures,
        feature_flags: updatedFlags,
      };
      setSelectedOrgForFeatures(updatedOrg);
      setOrganizations((prev) => prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)));
      setFeedback({
        type: "success",
        message: `Updated entitlement "${featureKey}" for ${updatedOrg.name}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update feature entitlement.",
      });
    }
  };

  // User Status Toggle
  const handleToggleUserStatus = async (user: PlatformUser) => {
    const nextState = !user.is_active;
    try {
      await apiClient.patch("/superadmin/users/", {
        user_id: user.id,
        is_active: nextState,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: nextState } : u)));
      setFeedback({
        type: "success",
        message: `User ${user.username} is now ${nextState ? "active" : "suspended"}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update user status.",
      });
    }
  };

  // Invite Client Submission
  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInvitingClient(true);
    setFeedback(null);
    setGeneratedInviteUrl(null);
    try {
      const res = await apiClient.post<{ invitation: { token: string }; invite_url: string }>(
        "/superadmin/invitations/",
        {
          email: inviteEmail.trim(),
          invited_name: inviteName.trim(),
          organization_name: inviteOrgName.trim(),
          organization_slug: inviteOrgSlug.trim().toLowerCase(),
        }
      );
      setGeneratedInviteUrl(res.data.invite_url);
      setFeedback({
        type: "success",
        message: `Client onboarding invite generated for ${inviteEmail}!`,
      });
      setInviteEmail("");
      setInviteName("");
      setInviteOrgName("");
      setInviteOrgSlug("");
      loadAllData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to generate client invite.",
      });
    } finally {
      setInvitingClient(false);
    }
  };

  // Broadcast Announcement Submission
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSavingBroadcast(true);
    try {
      await apiClient.post("/superadmin/notifications/", {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity: broadcastSeverity,
        target_organization: broadcastTarget || null,
        is_active: true,
      });
      setFeedback({ type: "success", message: "Platform broadcast announcement published!" });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setIsBroadcastModalOpen(false);
      loadAllData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create broadcast announcement.",
      });
    } finally {
      setSavingBroadcast(false);
    }
  };

  // Delete Announcement
  const handleDeleteBroadcast = async (id: string) => {
    try {
      await apiClient.delete(`/superadmin/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setFeedback({ type: "success", message: "Announcement deleted." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete announcement.",
      });
    }
  };

  // Resolve Ticket
  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSavingTicket(true);
    try {
      const res = await apiClient.patch<ClientSupportTicket>(
        `/superadmin/support-tickets/${selectedTicket.id}/`,
        {
          status: ticketStatus,
          admin_notes: ticketNotes,
        }
      );
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? res.data : t)));
      setSelectedTicket(null);
      setFeedback({ type: "success", message: `Support ticket updated (${ticketStatus}).` });
      loadAllData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update support ticket.",
      });
    } finally {
      setSavingTicket(false);
    }
  };

  // Save Platform Settings
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlatform(true);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        platform_name: platformName.trim(),
        base_domain: baseDomain.trim(),
        google_oauth_client_id: googleClientId.trim(),
        google_oauth_enabled: googleEnabled,
      };
      if (googleClientSecret) {
        payload.google_oauth_client_secret = googleClientSecret;
      }
      const res = await apiClient.patch<PlatformSettings>("/superadmin/platform-settings/", payload);
      setPlatformSettings(res.data);
      setGoogleClientSecret("");
      setFeedback({
        type: "success",
        message: "Platform settings and fallback Google OAuth credentials saved!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save platform settings.",
      });
    } finally {
      setSavingPlatform(false);
    }
  };

  const navItems: Array<{
    id: SuperadminTab;
    label: string;
    description: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeTone?: "amber" | "emerald" | "red";
  }> = [
    {
      id: "overview",
      label: "Platform Overview",
      description: "KPIs, MRR & system health",
      icon: LayoutDashboard,
    },
    {
      id: "clients",
      label: "Client Organizations",
      description: "Manage tenants & feature flags",
      icon: Building2,
      badgeCount: organizations.length,
      badgeTone: "emerald",
    },
    {
      id: "users",
      label: "Platform Users",
      description: "Tenant members & permissions",
      icon: Users,
      badgeCount: users.length,
    },
    {
      id: "subscriptions",
      label: "Subscriptions & MRR",
      description: "Payment tiers & renewal billing",
      icon: CreditCard,
    },
    {
      id: "support",
      label: "Client Support & Inquiries",
      description: "Domain setups & client triage",
      icon: LifeBuoy,
      badgeCount: stats?.kpis.open_support_queries || 0,
      badgeTone: (stats?.kpis.open_support_queries || 0) > 0 ? "amber" : undefined,
    },
    {
      id: "notifications",
      label: "System Broadcasts",
      description: "Maintenance notices & alerts",
      icon: Megaphone,
      badgeCount: notifications.filter((n) => n.is_active).length,
      badgeTone: "emerald",
    },
    {
      id: "settings",
      label: "Platform & OAuth",
      description: "Base domain & fallback OAuth",
      icon: Sliders,
    },
  ];

  const pageMeta: Record<SuperadminTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Platform Overview & System Telemetry",
      subtitle: "Multi-tenant monitoring, revenue tracking, and infrastructure health",
    },
    clients: {
      title: "Client Builder Directory & Entitlements",
      subtitle: "Provision tenant organizations, configure module feature flags, and inspect workspaces",
    },
    users: {
      title: "Platform User Accounts & Roles",
      subtitle: "Manage client builder members, administrators, and security permissions across tenants",
    },
    subscriptions: {
      title: "Subscriptions & Payment Tracking",
      subtitle: "Monitor tenant subscription plans, Monthly Recurring Revenue (MRR), and payment renewals",
    },
    support: {
      title: "Client Query Support & Triage",
      subtitle: "Respond to builder inquiries, DNS verification requests, and technical assistance",
    },
    notifications: {
      title: "System Announcements & Broadcasts",
      subtitle: "Publish platform maintenance banners and targeted operational notices to clients",
    },
    settings: {
      title: "Platform Infrastructure & Sign-In",
      subtitle: "Configure platform base domain, Traefik edge routing, and global Google OAuth credentials",
    },
  };

  const orgColumns: ClientTableColumn<Organization>[] = [
    {
      key: "name",
      header: "Client Organization",
      render: (org) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-stone-900 dark:text-white">
              {org.name}
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Slug: {org.slug} · ID: {org.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "subdomain",
      header: "Subdomain & Custom Domain",
      render: (org) => (
        <div className="flex flex-col gap-0.5 font-mono">
          <span className="text-stone-800 dark:text-stone-200">
            {org.subdomain_host}
          </span>
          {org.custom_domain && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              <Globe className="size-3" />
              {org.custom_domain}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (org) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            org.is_active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              org.is_active ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {org.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (org) => {
        const isSelected = selectedOrgForFeatures?.id === org.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onInspectOrg(org)}
              className="btn-primary btn-xs"
              title={`Inspect ${org.name} workspace`}
            >
              <Eye className="size-3.5" />
              Inspect
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedOrgForFeatures(isSelected ? null : org)
              }
              className="btn-secondary btn-xs"
            >
              <Sliders className="size-3.5" />
              Feature Flags
            </button>
            <button
              type="button"
              onClick={() => handleToggleOrgStatus(org)}
              className={`${
                org.is_active ? "btn-danger" : "btn-secondary"
              } btn-xs`}
            >
              <Power className="size-3.5" />
              {org.is_active ? "Suspend" : "Activate"}
            </button>
          </div>
        );
      },
    },
  ];

  const userColumns: ClientTableColumn<PlatformUser>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            {u.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-stone-900 dark:text-white">
              {u.username}
            </span>
            <p className="text-[11px] text-stone-500 font-mono">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      render: (u) => (
        <span className="font-medium text-stone-700 dark:text-stone-300">
          {u.organization_name || "Platform Superadmin"}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Badge tone={u.is_superuser ? "amber" : "gray"}>
          {u.role}
        </Badge>
      ),
    },
    {
      key: "date_joined",
      header: "Date Joined",
      render: (u) => (
        <span className="text-stone-500 font-mono">
          {formatDate(u.date_joined)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            u.is_active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          }`}
        >
          {u.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end">
          {!u.is_superuser && (
            <button
              type="button"
              onClick={() => handleToggleUserStatus(u)}
              className={`btn-xs ${u.is_active ? "btn-secondary text-rose-600" : "btn-primary"}`}
            >
              {u.is_active ? <UserX className="size-3" /> : <UserCheck className="size-3" />}
              {u.is_active ? "Suspend" : "Activate"}
            </button>
          )}
        </div>
      ),
    },
  ];

  const subColumns: ClientTableColumn<ClientSubscription>[] = [
    {
      key: "organization",
      header: "Tenant Organization",
      render: (sub) => (
        <span className="font-semibold text-stone-900 dark:text-white">
          {sub.organization_name}
        </span>
      ),
    },
    {
      key: "plan_tier",
      header: "Plan Tier",
      render: (sub) => <Badge tone="indigo">{sub.plan_tier}</Badge>,
    },
    {
      key: "monthly_price",
      header: "Monthly Amount",
      render: (sub) => (
        <span className="font-bold text-stone-900 dark:text-white">
          {formatCurrency(sub.monthly_price)} / mo
        </span>
      ),
    },
    {
      key: "billing_cycle",
      header: "Billing Cycle",
      render: (sub) => (
        <span className="text-stone-500 font-medium">
          {sub.billing_cycle}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Payment Method",
      render: (sub) => (
        <span className="font-mono text-stone-600 dark:text-stone-400">
          {sub.payment_method}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (sub) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            sub.status === "Active"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          }`}
        >
          {sub.status}
        </span>
      ),
    },
    {
      key: "next_renewal",
      header: "Next Renewal",
      render: (sub) => (
        <span className="font-mono text-stone-500">
          {sub.next_billing_date ? formatDate(sub.next_billing_date) : "—"}
        </span>
      ),
    },
  ];

  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter !== "all" && t.status.toLowerCase() !== ticketStatusFilter.toLowerCase()) {
      return false;
    }
    if (ticketPriorityFilter !== "all" && t.priority.toLowerCase() !== ticketPriorityFilter.toLowerCase()) {
      return false;
    }
    if (ticketSearch.trim()) {
      const q = ticketSearch.trim().toLowerCase();
      const match =
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        t.organization_name.toLowerCase().includes(q) ||
        t.submitted_by_name.toLowerCase().includes(q) ||
        t.submitted_by_email.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const paginatedTickets = filteredTickets.slice(
    (ticketPage - 1) * ticketPageSize,
    ticketPage * ticketPageSize
  );

  const filteredNotifications = notifications.filter((note) => {
    if (notificationSeverityFilter !== "all" && note.severity.toLowerCase() !== notificationSeverityFilter.toLowerCase()) {
      return false;
    }
    if (notificationSearch.trim()) {
      const q = notificationSearch.trim().toLowerCase();
      const match =
        note.title.toLowerCase().includes(q) ||
        note.message.toLowerCase().includes(q) ||
        (note.target_organization_name || "Platform-wide").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const paginatedNotifications = filteredNotifications.slice(
    (notificationPage - 1) * notificationPageSize,
    notificationPage * notificationPageSize
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 flex flex-col lg:flex-row">
      {/* ------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA                                            */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-900/95">
          <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-white truncate">
                    {pageMeta[activeTab].title}
                  </h1>
                  <Badge tone="amber">Platform Control Plane</Badge>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate hidden sm:block">
                  {pageMeta[activeTab].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle variant="compact" />

              <button
                type="button"
                onClick={() => loadAllData()}
                disabled={loading}
                className="btn-secondary btn-sm"
                title="Refresh platform telemetry"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="btn-primary btn-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Provision Client</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="btn-secondary btn-sm"
              >
                <Megaphone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Broadcast</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 lg:pb-8">
          {feedback && (
            <InlineAlert tone={feedback.type} onDismiss={() => setFeedback(null)}>
              {feedback.message}
            </InlineAlert>
          )}

          {/* ========================================================== */}
          {/* TAB 1: OVERVIEW & MONITORING                               */}
          {/* ========================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Filter Bar with Presets & Date Pickers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                      Live Telemetry &amp; Revenue Overview
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Real-time cross-tenant governance, financial velocity, and infrastructure health
                    </p>
                  </div>
                </div>

                <DateRangeFilter
                  activePreset={dateRange}
                  startDate={customStart}
                  endDate={customEnd}
                  onChange={handleDateRangeChange}
                  loading={loading}
                />
              </div>

              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Client Organizations"
                  value={stats?.kpis.total_organizations ?? organizations.length}
                  hint={`${stats?.kpis.active_organizations ?? organizations.length} active, ${stats?.kpis.suspended_organizations ?? 0} suspended`}
                  icon={Building2}
                  tone="indigo"
                  onClick={() => setActiveTab("clients")}
                />
                <StatCard
                  label="Subscriptions & MRR"
                  value={formatCompactCurrency(stats?.kpis.mrr ?? 899)}
                  hint={`ARR: ${formatCompactCurrency(stats?.kpis.annual_run_rate ?? 10788)} / year`}
                  icon={CreditCard}
                  tone="amber"
                  onClick={() => setActiveTab("subscriptions")}
                />
                <StatCard
                  label="Client Support & Inquiries"
                  value={stats?.kpis.open_support_queries ?? 0}
                  hint="Builder queries requiring platform response"
                  icon={LifeBuoy}
                  tone={(stats?.kpis.open_support_queries ?? 0) > 0 ? "amber" : "green"}
                  onClick={() => setActiveTab("support")}
                />
                <StatCard
                  label="System Broadcasts"
                  value={stats?.kpis.active_system_broadcasts ?? 0}
                  hint="Live maintenance alerts displayed to tenants"
                  icon={Megaphone}
                  tone="indigo"
                  onClick={() => setActiveTab("notifications")}
                />
              </div>

              {/* Interactive Telemetry Charts Row 1: MRR Velocity & Plan Tiers */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <InteractiveLineChart
                  title="Monthly Recurring Revenue (MRR) Trajectory"
                  subtitle="Track billing renewals and ARR growth across builder client subscriptions"
                  data={
                    stats?.mrr_timeline?.map((item) => ({
                      label: item.date,
                      value: item.mrr,
                      secondaryValue: Math.round(item.arr / 12),
                    })) || [
                      { label: "Jun", value: 399, secondaryValue: 399 },
                      { label: "Jul", value: 599, secondaryValue: 599 },
                      { label: "Aug", value: 699, secondaryValue: 699 },
                      { label: "Sep", value: 799, secondaryValue: 799 },
                      { label: "Oct", value: 899, secondaryValue: 899 },
                      { label: "Nov", value: 899, secondaryValue: 899 },
                    ]
                  }
                  primaryLabel="MRR ($/mo)"
                  secondaryLabel="ARR / 12"
                  strokeColor="#f59e0b"
                  secondaryStrokeColor="#10b981"
                  formatValue={(v) => formatCurrency(v)}
                />

                <InteractiveDonutChart
                  title="Client Subscription Plans Distribution"
                  subtitle="Breakdown of tenant builder memberships by SaaS tier"
                  data={
                    stats?.plan_distribution?.map((p) => ({
                      label: p.plan,
                      value: p.mrr || p.price,
                      color: p.color,
                      count: p.count,
                    })) || [
                      { label: "Builder Starter", value: 299, color: "#f59e0b", count: 1 },
                      { label: "Professional Builder", value: 599, color: "#10b981", count: 1 },
                      { label: "Enterprise Custom", value: 899, color: "#8b5cf6", count: 1 },
                    ]
                  }
                  centerLabel="Total MRR"
                  formatValue={(v) => formatCurrency(v)}
                />
              </div>

              {/* Interactive Telemetry Charts Row 2: Support Health & Tenant Scale */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <InteractiveBarChart
                  title="Client Support Queries by Priority"
                  subtitle="Open vs resolved requests across tenant builders"
                  data={
                    stats?.tickets_by_priority?.map((t) => ({
                      label: t.priority,
                      value: t.count,
                      secondaryValue: t.open,
                      color: t.color,
                      subtext: `${t.open} active unresolved queries`,
                    })) || [
                      { label: "Urgent", value: 1, secondaryValue: 1, color: "#f43f5e" },
                      { label: "High", value: 2, secondaryValue: 1, color: "#fb923c" },
                      { label: "Medium", value: 4, secondaryValue: 2, color: "#f59e0b" },
                      { label: "Low", value: 2, secondaryValue: 0, color: "#10b981" },
                    ]
                  }
                  primaryLabel="Total Tickets"
                  secondaryLabel="Open Tickets"
                  formatValue={(v) => `${v} ticket(s)`}
                />

                <InteractiveBarChart
                  title="Tenant Activity & Scaling Density"
                  subtitle="User count and active construction build volume per builder organization"
                  data={
                    stats?.tenant_scale?.map((t) => ({
                      label: t.name,
                      value: t.users,
                      secondaryValue: t.projects,
                      color: "#f59e0b",
                      subtext: `${t.projects} active luxury builds • ${formatCurrency(t.mrr)}/mo`,
                    })) || [
                      { label: "Kevin's Homes", value: 3, secondaryValue: 4, color: "#f59e0b" },
                      { label: "Apex Builds", value: 2, secondaryValue: 2, color: "#10b981" },
                      { label: "Cascade Timber", value: 1, secondaryValue: 1, color: "#3b82f6" },
                    ]
                  }
                  primaryLabel="Active Members"
                  secondaryLabel="Projects"
                  formatValue={(v) => `${v} users`}
                />
              </div>

              {/* Infrastructure & Multi-Tenancy Telemetry */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-stone-900 dark:text-white">
                        Platform Infrastructure &amp; Security Health
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Live edge routing, database row-level security, and authentication telemetry.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      All Systems Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-950/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <Globe className="h-4 w-4 text-amber-500" />
                        <span>Traefik Wildcard Routing</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-stone-900 dark:text-stone-100">
                        *.{platformSettings?.base_domain || "beamline.musfiqdehan.com"}
                      </p>
                      <span className="mt-1 inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ SSL Certificates Managed Automatically
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-950/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Data Isolation &amp; RBAC</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-900 dark:text-stone-100">
                        Strict Tenant FK Scoping &amp; Row-Level Security
                      </p>
                      <span className="mt-1 inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Zero cross-tenant data leakage verified
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-950/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <KeyRound className="h-4 w-4 text-indigo-500" />
                        <span>Two-Tier Google OAuth</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-900 dark:text-stone-100">
                        {platformSettings?.google_oauth_enabled ? "Global Fallback Active" : "Custom Tenants Only"}
                      </p>
                      <span className="mt-1 inline-block text-[10px] text-stone-500 dark:text-stone-400">
                        Client custom OAuth overrides platform fallback
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-950/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        <span>Billing Engine</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-900 dark:text-stone-100">
                        Automated Monthly Billing &amp; Invoicing
                      </p>
                      <span className="mt-1 inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Stripe integration active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Platform Audit Timeline */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Platform Audit Stream
                  </h2>
                  <div className="space-y-3">
                    {stats?.recent_activity?.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 text-xs">
                        <div className="mt-0.5 size-2 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-stone-900 dark:text-stone-100">{act.title}</p>
                          <p className="text-stone-500 dark:text-stone-400 text-[11px]">{act.description}</p>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {formatDateTimeWithSeconds(act.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: CLIENT ORGANIZATIONS & FEATURE ENTITLEMENTS         */}
          {/* ========================================================== */}
          {activeTab === "clients" && (
            <div className="space-y-6">
              <ClientDataTable<Organization>
                title={`Tenant Client Organizations (${organizations.length})`}
                description="Oversee home builder accounts, configure granular feature flags, and inspect tenant workspaces."
                items={organizations}
                columns={orgColumns}
                searchKeys={[
                  (org) => org.name,
                  (org) => org.slug,
                  (org) => org.subdomain_host,
                  (org) => org.custom_domain || "",
                ]}
                searchPlaceholder="Search organizations by name, slug, domain..."
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "Active", value: "active" },
                      { label: "Suspended", value: "suspended" },
                    ],
                  },
                ]}
                filterMatcher={(org, key, val) => {
                  if (key === "status") {
                    return val === "active" ? org.is_active : !org.is_active;
                  }
                  return true;
                }}
                sortOptions={[
                  { label: "Name (A-Z)", value: "name_asc" },
                  { label: "Name (Z-A)", value: "name_desc" },
                ]}
                sortComparator={(a, b, sortKey) => {
                  if (sortKey === "name_asc") return a.name.localeCompare(b.name);
                  if (sortKey === "name_desc") return b.name.localeCompare(a.name);
                  return 0;
                }}
                rowClassName={(org) =>
                  selectedOrgForFeatures?.id === org.id
                    ? "bg-amber-50/50 dark:bg-amber-950/20"
                    : ""
                }
                defaultPageSize={10}
                itemLabel="organizations"
                actions={
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="btn-primary btn-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Provision New Tenant
                  </button>
                }
              />

              {/* Feature Entitlements Drawer */}
              {selectedOrgForFeatures && (
                <section
                  aria-label={`Feature entitlements for ${selectedOrgForFeatures.name}`}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-950/40 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        Feature Entitlements Matrix · {selectedOrgForFeatures.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Changes apply immediately and enforce module visibility for all members of this tenant.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrgForFeatures(null)}
                      className="btn-ghost btn-icon"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {FEATURE_GROUPS.map((group) => (
                      <div key={group.title} className="card p-4 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {group.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {group.description}
                          </p>
                        </div>
                        <div className="space-y-3 pt-1">
                          {group.items.map((item) => {
                            const isEnabled = Boolean(
                              selectedOrgForFeatures.feature_flags[item.key] ??
                                item.defaultEnabled ??
                                true
                            );
                            return (
                              <Switch
                                key={item.key}
                                label={item.label}
                                checked={isEnabled}
                                onChange={() => handleToggleFeature(item.key, isEnabled)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: PLATFORM USERS                                      */}
          {/* ========================================================== */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <ClientDataTable<PlatformUser>
                title={`Platform User Accounts (${users.length})`}
                description="Monitor users, RBAC roles, and login activity across all client builder organizations."
                items={users}
                columns={userColumns}
                searchKeys={[
                  (u) => u.username,
                  (u) => u.email,
                  (u) => u.first_name || "",
                  (u) => u.last_name || "",
                  (u) => u.organization_name || "",
                  (u) => u.role,
                ]}
                searchPlaceholder="Search users by username, email, role..."
                filters={[
                  {
                    key: "organization",
                    label: "Organization",
                    options: organizations.map((o) => ({
                      label: o.name,
                      value: o.name,
                    })),
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "Active", value: "active" },
                      { label: "Suspended", value: "suspended" },
                    ],
                  },
                ]}
                filterMatcher={(u, key, val) => {
                  if (key === "organization") {
                    return (u.organization_name || "Platform Superadmin") === val;
                  }
                  if (key === "status") {
                    return val === "active" ? u.is_active : !u.is_active;
                  }
                  return true;
                }}
                sortOptions={[
                  { label: "Username (A-Z)", value: "user_asc" },
                  { label: "Username (Z-A)", value: "user_desc" },
                ]}
                sortComparator={(a, b, sortKey) => {
                  if (sortKey === "user_asc") return a.username.localeCompare(b.username);
                  if (sortKey === "user_desc") return b.username.localeCompare(a.username);
                  return 0;
                }}
                defaultPageSize={10}
                itemLabel="users"
              />
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: SUBSCRIPTIONS & BILLING (MRR)                       */}
          {/* ========================================================== */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <ClientDataTable<ClientSubscription>
                title={`Tenant Subscriptions & MRR Billing (${subscriptions.length})`}
                description="Track recurring subscription payments, plan tiers, and renewal dates across builder tenants."
                items={subscriptions}
                columns={subColumns}
                searchKeys={[
                  (sub) => sub.organization_name,
                  (sub) => sub.plan_tier,
                  (sub) => sub.payment_method,
                  (sub) => sub.status,
                ]}
                searchPlaceholder="Search subscriptions by tenant, plan, or method..."
                filters={[
                  {
                    key: "plan_tier",
                    label: "Plan Tier",
                    options: [
                      { label: "Starter", value: "Starter" },
                      { label: "Pro", value: "Pro" },
                      { label: "Enterprise", value: "Enterprise" },
                    ],
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "Active", value: "Active" },
                      { label: "Past Due", value: "Past Due" },
                      { label: "Canceled", value: "Canceled" },
                      { label: "Trialing", value: "Trialing" },
                    ],
                  },
                ]}
                filterMatcher={(sub, key, val) => {
                  if (key === "plan_tier") return sub.plan_tier === val;
                  if (key === "status") return sub.status === val;
                  return true;
                }}
                sortOptions={[
                  { label: "Monthly Amount (High to Low)", value: "price_desc" },
                  { label: "Monthly Amount (Low to High)", value: "price_asc" },
                ]}
                sortComparator={(a, b, sortKey) => {
                  const pA = Number(a.monthly_price) || 0;
                  const pB = Number(b.monthly_price) || 0;
                  if (sortKey === "price_desc") return pB - pA;
                  if (sortKey === "price_asc") return pA - pB;
                  return 0;
                }}
                defaultPageSize={10}
                itemLabel="subscriptions"
                actions={
                  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    MRR: {formatCurrency(stats?.kpis.mrr ?? 899)}
                  </span>
                }
              />
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: CLIENT SUPPORT & INQUIRIES                          */}
          {/* ========================================================== */}
          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Client Support &amp; Technical Queries ({tickets.length})
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Triage incoming DNS verification inquiries, OAuth questions, and technical support requests.
                  </p>
                </div>
              </div>

              {/* Toolbar: Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <TableSearchBar
                  value={ticketSearch}
                  onChange={(val) => {
                    setTicketSearch(val);
                    setTicketPage(1);
                  }}
                  placeholder="Search tickets by subject, message, organization..."
                  className="sm:w-80"
                />
                <TableFilterBar
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        { label: "Open", value: "open" },
                        { label: "In Progress", value: "in progress" },
                        { label: "Resolved", value: "resolved" },
                      ],
                    },
                    {
                      key: "priority",
                      label: "Priority",
                      options: [
                        { label: "Critical", value: "critical" },
                        { label: "High", value: "high" },
                        { label: "Medium", value: "medium" },
                        { label: "Low", value: "low" },
                      ],
                    },
                  ]}
                  activeFilters={{
                    status: ticketStatusFilter === "all" ? "" : ticketStatusFilter,
                    priority: ticketPriorityFilter === "all" ? "" : ticketPriorityFilter,
                  }}
                  onFilterChange={(k, v) => {
                    if (k === "status") setTicketStatusFilter(v || "all");
                    if (k === "priority") setTicketPriorityFilter(v || "all");
                    setTicketPage(1);
                  }}
                  onClearFilters={() => {
                    setTicketStatusFilter("all");
                    setTicketPriorityFilter("all");
                    setTicketSearch("");
                    setTicketPage(1);
                  }}
                />
              </div>

              {paginatedTickets.length === 0 ? (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <TableEmptyState
                    title="No Support Queries Found"
                    message="There are no tickets matching your current search query or filter selection."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paginatedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Badge
                            tone={
                              ticket.priority === "Critical" || ticket.priority === "High"
                                ? "amber"
                                : "gray"
                            }
                          >
                            {ticket.priority} Priority
                          </Badge>
                          <Badge tone="indigo">{ticket.category}</Badge>
                          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                            {ticket.organization_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              ticket.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {ticket.status}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {formatDateTimeWithSeconds(ticket.created_at)}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                        {ticket.subject}
                      </h3>

                      <p className="text-xs text-stone-600 dark:text-stone-300 rounded-xl bg-stone-50 p-3 dark:bg-stone-950/40">
                        {ticket.message}
                      </p>

                      {ticket.admin_notes && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-300 rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30 flex items-start gap-2">
                          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[11px] uppercase font-bold tracking-wider">
                              Superadmin Resolution Notes:
                            </strong>
                            <span>{ticket.admin_notes}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[11px] text-stone-400 font-mono">
                          Submitted by: {ticket.submitted_by_name} ({ticket.submitted_by_email})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setTicketStatus(ticket.status);
                            setTicketNotes(ticket.admin_notes || "");
                          }}
                          className="btn-secondary btn-xs"
                        >
                          <LifeBuoy className="size-3.5" />
                          Respond / Resolve Ticket
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredTickets.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <TablePagination
                    pageSize={ticketPageSize}
                    pageSizeOptions={[3, 6, 12, 24]}
                    onPageSizeChange={(sz) => {
                      setTicketPageSize(sz);
                      setTicketPage(1);
                    }}
                    currentPage={ticketPage}
                    totalPages={Math.ceil(filteredTickets.length / ticketPageSize) || 1}
                    totalCount={filteredTickets.length}
                    currentCount={paginatedTickets.length}
                    hasPrevious={ticketPage > 1}
                    hasNext={ticketPage < Math.ceil(filteredTickets.length / ticketPageSize)}
                    onPrevious={() => setTicketPage((p) => Math.max(1, p - 1))}
                    onNext={() => setTicketPage((p) => p + 1)}
                    itemLabel="tickets"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 6: SYSTEM NOTIFICATIONS & BROADCASTS                   */}
          {/* ========================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Platform System Broadcasts &amp; Notices ({notifications.length})
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Publish system alerts and maintenance announcements shown to client tenants.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="btn-primary btn-sm self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  New Broadcast
                </button>
              </div>

              {/* Toolbar: Search and Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <TableSearchBar
                  value={notificationSearch}
                  onChange={(val) => {
                    setNotificationSearch(val);
                    setNotificationPage(1);
                  }}
                  placeholder="Search broadcasts by title, message, target..."
                  className="sm:w-80"
                />
                <TableFilterBar
                  filters={[
                    {
                      key: "severity",
                      label: "Severity",
                      options: [
                        { label: "Critical", value: "critical" },
                        { label: "Warning", value: "warning" },
                        { label: "Info", value: "info" },
                        { label: "Success", value: "success" },
                      ],
                    },
                  ]}
                  activeFilters={{
                    severity: notificationSeverityFilter === "all" ? "" : notificationSeverityFilter,
                  }}
                  onFilterChange={(k, v) => {
                    if (k === "severity") setNotificationSeverityFilter(v || "all");
                    setNotificationPage(1);
                  }}
                  onClearFilters={() => {
                    setNotificationSeverityFilter("all");
                    setNotificationSearch("");
                    setNotificationPage(1);
                  }}
                />
              </div>

              {paginatedNotifications.length === 0 ? (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <TableEmptyState
                    title="No Broadcasts Found"
                    message="There are no system notifications matching your filter criteria."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paginatedNotifications.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              note.severity === "critical"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : note.severity === "warning"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {note.severity}
                          </span>
                          <Badge tone="gray">
                            Target: {note.target_organization_name || "All Clients (Platform-wide)"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400 font-mono">
                            {formatDateTimeWithSeconds(note.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(note.id)}
                            className="btn-ghost btn-icon text-rose-600 dark:text-rose-400"
                            title="Delete notification"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">{note.title}</h3>
                      <p className="text-xs text-stone-600 dark:text-stone-300">{note.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {filteredNotifications.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <TablePagination
                    pageSize={notificationPageSize}
                    pageSizeOptions={[3, 6, 12, 24]}
                    onPageSizeChange={(sz) => {
                      setNotificationPageSize(sz);
                      setNotificationPage(1);
                    }}
                    currentPage={notificationPage}
                    totalPages={Math.ceil(filteredNotifications.length / notificationPageSize) || 1}
                    totalCount={filteredNotifications.length}
                    currentCount={paginatedNotifications.length}
                    hasPrevious={notificationPage > 1}
                    hasNext={notificationPage < Math.ceil(filteredNotifications.length / notificationPageSize)}
                    onPrevious={() => setNotificationPage((p) => Math.max(1, p - 1))}
                    onNext={() => setNotificationPage((p) => p + 1)}
                    itemLabel="broadcasts"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 7: PLATFORM SETTINGS & DOMAINS                         */}
          {/* ========================================================== */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <form onSubmit={handleSavePlatformSettings} className="space-y-5">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Platform Host &amp; Base Domain
                  </h2>
                  <Field label="Platform Name" required>
                    <input
                      type="text"
                      required
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Platform Base Domain"
                    required
                    hint="Tenant builder workspaces resolve at <slug>.your-base-domain.com"
                  >
                    <input
                      type="text"
                      required
                      value={baseDomain}
                      onChange={(e) => setBaseDomain(e.target.value)}
                      className="input font-mono"
                    />
                  </Field>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Platform Google OAuth Fallback (Two-Tier Sign-In)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Provides global fallback Google sign-in credentials for all client tenants that have not attached custom client credentials.
                  </p>

                  <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                    <Switch
                      label="Enable Platform Google OAuth Fallback"
                      checked={googleEnabled}
                      onChange={setGoogleEnabled}
                    />
                  </div>

                  <Field label="Google OAuth Client ID">
                    <input
                      type="text"
                      placeholder="e.g. 104829104-platform.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="input font-mono"
                    />
                  </Field>

                  <Field
                    label="Google OAuth Client Secret"
                    hint={
                      platformSettings?.has_google_secret
                        ? "A secret is stored securely. Leave blank to preserve it."
                        : undefined
                    }
                  >
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder={
                        platformSettings?.has_google_secret
                          ? "••••••••••••"
                          : "Enter client secret"
                      }
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      className="font-mono"
                    />
                  </Field>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPlatform || loading}
                      className="btn-primary"
                    >
                      {savingPlatform ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {savingPlatform ? "Saving..." : "Save Platform Settings"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* DESKTOP SIDEBAR NAVIGATION (FIXED LEFT NAVIGATION)           */}
      {/* ------------------------------------------------------------ */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-72 flex-col justify-between border-r border-stone-200/90 bg-white dark:border-stone-800/90 dark:bg-stone-900">
        <div className="flex flex-col">
          {/* Top Brand Header */}
          <div className="flex items-center gap-3 border-b border-stone-200/80 px-5 py-4 dark:border-stone-800/80">
            <BeamLineLogo
              href="/"
              wordmarkClassName="text-sm text-stone-900 dark:text-white"
              badge={
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  Platform Owner
                </span>
              }
              subtitle="Platform Control Plane • SaaS Owner"
              subtitleClassName="font-mono text-stone-500 dark:text-stone-400"
            />
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Platform Governance
            </span>
            <nav aria-label="Superadmin sections" className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setFeedback(null);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                      active
                        ? "bg-amber-50 text-amber-800 shadow-xs dark:bg-amber-950/60 dark:text-amber-300"
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
                        <div className="text-[11px] opacity-70 truncate">{item.description}</div>
                      </div>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          item.badgeTone === "amber"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
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

          {/* Platform Telemetry Quick Snapshot */}
          <div className="mx-3 mt-1 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Live MRR &amp; Hosting
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-500 dark:text-stone-400">MRR</span>
                <div className="font-bold text-stone-900 dark:text-white">
                  {formatCurrency(stats?.kpis.mrr || 899)}
                </div>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400">Active Orgs</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {stats?.kpis.active_organizations || organizations.length} Live
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 border-t border-stone-200/80 p-4 dark:border-stone-800/80">
          <ThemeToggle className="w-full justify-between" />
          <button
            type="button"
            onClick={onLogout}
            className="btn-secondary btn-sm w-full justify-center text-rose-600 dark:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out (Superadmin)
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* MOBILE NAVBAR                                                */}
      {/* ------------------------------------------------------------ */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95"
      >
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 transition cursor-pointer ${
                  active
                    ? "text-amber-600 font-bold dark:text-amber-400"
                    : "text-stone-500 dark:text-stone-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] tracking-tight">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ------------------------------------------------------------ */}
      {/* MODAL 1: PROVISION CLIENT MODAL                              */}
      {/* ------------------------------------------------------------ */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} size="md">
        <ModalHeader
          title="Provision Client Builder Organization"
          subtitle="Reserves the subdomain and generates an onboarding link for the owner."
          icon={<Building2 className="size-6 text-amber-600" />}
          onClose={() => setIsInviteModalOpen(false)}
        />
        <ModalBody>
          <form id="invite-form" onSubmit={handleInviteClient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Owner Email" required>
                <input
                  type="email"
                  required
                  placeholder="builder@customhomes.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Owner Name">
                <input
                  type="text"
                  placeholder="John Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Organization Name" required>
              <input
                type="text"
                required
                placeholder="Apex Custom Homes"
                value={inviteOrgName}
                onChange={(e) => {
                  setInviteOrgName(e.target.value);
                  if (!inviteOrgSlug) {
                    setInviteOrgSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "-")
                        .replace(/-+/g, "-")
                    );
                  }
                }}
                className="input"
              />
            </Field>

            <Field label="Reserved Subdomain" required>
              <div className="flex items-stretch">
                <input
                  type="text"
                  required
                  placeholder="apex"
                  value={inviteOrgSlug}
                  onChange={(e) => setInviteOrgSlug(e.target.value.toLowerCase())}
                  className="input min-w-0 rounded-r-none font-mono"
                />
                <span className="flex items-center rounded-r-xl border border-l-0 border-stone-200 bg-stone-100 px-3 font-mono text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
                  .{baseDomain}
                </span>
              </div>
            </Field>

            {generatedInviteUrl && (
              <InlineAlert tone="success" title="Onboarding Link Generated!">
                <div className="mt-2 flex flex-col gap-2">
                  <code className="select-all break-all rounded-lg bg-white/70 px-2.5 py-1.5 font-mono text-xs dark:bg-stone-950/60">
                    {generatedInviteUrl}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedInviteUrl);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2000);
                    }}
                    className="btn-secondary btn-xs self-start"
                  >
                    {copiedInvite ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiedInvite ? "Copied" : "Copy Onboarding Link"}
                  </button>
                </div>
              </InlineAlert>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(false)}
            className="btn-secondary"
          >
            Close
          </button>
          <button
            type="submit"
            form="invite-form"
            disabled={invitingClient}
            className="btn-primary"
          >
            {invitingClient ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {invitingClient ? "Generating..." : "Generate Link"}
          </button>
        </ModalFooter>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* MODAL 2: BROADCAST ANNOUNCEMENT MODAL                        */}
      {/* ------------------------------------------------------------ */}
      <Modal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} size="md">
        <ModalHeader
          title="Compose Platform Announcement"
          subtitle="Broadcast maintenance notices or system alerts across client portals."
          icon={<Megaphone className="size-6 text-amber-600" />}
          onClose={() => setIsBroadcastModalOpen(false)}
        />
        <ModalBody>
          <form id="broadcast-form" onSubmit={handleCreateBroadcast} className="space-y-4">
            <Field label="Announcement Title" required>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled Traefik Edge Router Maintenance"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Severity" required>
              <select
                value={broadcastSeverity}
                onChange={(e) =>
                  setBroadcastSeverity(e.target.value as "info" | "warning" | "critical" | "success")
                }
                className="input"
              >
                <option value="info">Info (Blue Notice)</option>
                <option value="warning">Warning (Amber Alert)</option>
                <option value="critical">Critical (Rose High-Priority)</option>
                <option value="success">Success (Operational)</option>
              </select>
            </Field>

            <Field label="Target Client Organization">
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="input"
              >
                <option value="">All Clients (Platform-wide)</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.slug})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Message Body" required>
              <textarea
                required
                rows={4}
                placeholder="Provide detailed information regarding the maintenance window or platform update..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="input"
              />
            </Field>
          </form>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="broadcast-form"
            disabled={savingBroadcast}
            className="btn-primary"
          >
            {savingBroadcast ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Megaphone className="size-4" />
            )}
            Publish Broadcast
          </button>
        </ModalFooter>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* MODAL 3: RESPOND & RESOLVE SUPPORT TICKET                    */}
      {/* ------------------------------------------------------------ */}
      {selectedTicket && (
        <Modal isOpen={true} onClose={() => setSelectedTicket(null)} size="md">
          <ModalHeader
            title="Triage Client Query"
            subtitle={`${selectedTicket.organization_name} · ${selectedTicket.category}`}
            icon={<LifeBuoy className="size-6 text-amber-600" />}
            onClose={() => setSelectedTicket(null)}
          />
          <ModalBody>
            <form id="ticket-form" onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Client Subject
                </span>
                <p className="mt-0.5 text-sm font-semibold text-stone-900 dark:text-white">
                  {selectedTicket.subject}
                </p>
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300">
                  {selectedTicket.message}
                </p>
              </div>

              <Field label="Update Ticket Status" required>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="input"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting on Client">Waiting on Client</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </Field>

              <Field label="Resolution Notes / Internal Feedback">
                <textarea
                  rows={3}
                  placeholder="Notes on resolution (e.g., Traefik SSL certificate verified, DNS CNAME confirmed)..."
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  className="input"
                />
              </Field>
            </form>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="ticket-form"
              disabled={savingTicket}
              className="btn-primary"
            >
              {savingTicket ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save Ticket Status
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
