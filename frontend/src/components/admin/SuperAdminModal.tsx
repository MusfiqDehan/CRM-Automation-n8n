"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Globe,
  KeyRound,
  Loader2,
  Power,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UserPlus,
  X,
} from "lucide-react";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { Badge, Field, StatCard } from "@/components/ui/primitives";
import { ClientDataTable, type ClientTableColumn } from "@/components/common/table";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  InlineAlert,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTabs,
  Switch,
} from "@/components/ui/overlay";
import { apiClient } from "@/lib/api-client";
import type { Organization, PlatformSettings } from "@/lib/types";

type ConsoleTab = "organizations" | "platform_settings" | "invite_client";

/** Feature entitlements grouped the way the client workspace is organised. */
const FEATURE_GROUPS: Array<{
  title: string;
  description: string;
  items: Array<{ key: string; label: string; defaultEnabled?: boolean }>;
}> = [
  {
    title: "Workspace pages",
    description: "Top-level navigation available to the client.",
    items: [
      { key: "page_landing", label: "Client landing page", defaultEnabled: false },
      { key: "page_overview", label: "Executive overview" },
      { key: "page_crm", label: "Sales CRM pipeline" },
      { key: "page_projects", label: "4-phase projects" },
      { key: "page_automation", label: "Invoices & automation" },
    ],
  },
  {
    title: "CRM & field modules",
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
    title: "White-label & governance",
    description: "Branding, integrations, and review controls.",
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

export interface SuperAdminControlPlaneProps {
  onClose?: () => void;
  onOrganizationsChanged?: () => void;
  onInspectWorkspace?: (org: Organization) => void;
  isEmbedded?: boolean;
}

export function SuperAdminControlPlane({
  onClose,
  onOrganizationsChanged,
  onInspectWorkspace,
  isEmbedded = false,
}: SuperAdminControlPlaneProps) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("organizations");

  const [loading, setLoading] = useState(false);
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgForFeatures, setSelectedOrgForFeatures] =
    useState<Organization | null>(null);

  // Platform form state
  const [platformName, setPlatformName] = useState("BeamLine");
  const [baseDomain, setBaseDomain] = useState("beamline.musfiqdehan.com");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);

  // Invite client form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [inviteOrgSlug, setInviteOrgSlug] = useState("");
  const [invitingClient, setInvitingClient] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(
    null
  );

  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);
  const [pendingFlag, setPendingFlag] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = () => {
    setLoading(true);
    setFeedback(null);
    Promise.all([
      apiClient.get<PlatformSettings>("/superadmin/platform-settings/"),
      apiClient.get<{ results: Organization[] }>("/superadmin/organizations/"),
    ])
      .then(([platRes, orgsRes]) => {
        const p = platRes;
        setPlatformSettings(p);
        setPlatformName(p.platform_name || "BeamLine");
        setBaseDomain(p.base_domain || "beamline.musfiqdehan.com");
        setGoogleClientId(p.google_oauth_client_id || "");
        setGoogleClientSecret("");
        setGoogleEnabled(Boolean(p.google_oauth_enabled));
        setOrganizations(orgsRes.results || []);
      })
      .catch((err) => {
        setFeedback({
          type: "error",
          message:
            err instanceof Error ? err.message : "Failed to load superadmin data.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle Client is_active
  const handleToggleClientActive = async (org: Organization) => {
    const nextState = !org.is_active;
    setPendingOrgId(org.id);
    setFeedback(null);
    try {
      const res = await apiClient.patch<Organization>(
        `/superadmin/organizations/${org.id}/`,
        { is_active: nextState }
      );
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? res.data : o))
      );
      if (selectedOrgForFeatures?.id === org.id) {
        setSelectedOrgForFeatures(res.data);
      }
      setFeedback({
        type: "success",
        message: `${org.name} is now ${nextState ? "active" : "suspended"}.`,
      });
      onOrganizationsChanged?.();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update client status.",
      });
    } finally {
      setPendingOrgId(null);
    }
  };

  // Toggle Feature Flag
  const handleToggleFeature = async (featureKey: string, currentValue: boolean) => {
    if (!selectedOrgForFeatures) return;
    const nextValue = !currentValue;
    setPendingFlag(featureKey);
    setFeedback(null);
    try {
      const updatedFlags = {
        ...selectedOrgForFeatures.feature_flags,
        [featureKey]: nextValue,
      };
      const res = await apiClient.patch<Organization>(
        `/superadmin/organizations/${selectedOrgForFeatures.id}/feature-flags/`,
        { feature_flags: updatedFlags }
      );
      setSelectedOrgForFeatures(res.data);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === res.data.id ? res.data : o))
      );
      setFeedback({
        type: "success",
        message: `Updated "${featureKey}" for ${res.data.name}.`,
      });
      onOrganizationsChanged?.();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update feature entitlement.",
      });
    } finally {
      setPendingFlag(null);
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
      const res = await apiClient.patch<PlatformSettings>(
        "/superadmin/platform-settings/",
        payload
      );
      setPlatformSettings(res.data);
      setGoogleClientSecret("");
      setFeedback({
        type: "success",
        message: "Platform settings and Google OAuth credentials saved!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to save platform settings.",
      });
    } finally {
      setSavingPlatform(false);
    }
  };

  // Invite Client
  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInvitingClient(true);
    setFeedback(null);
    setGeneratedInviteUrl(null);
    setCopiedInvite(false);
    try {
      const res = await apiClient.post<{
        invitation: { token: string };
        invite_url: string;
      }>("/superadmin/invitations/", {
        email: inviteEmail.trim(),
        invited_name: inviteName.trim(),
        organization_name: inviteOrgName.trim(),
        organization_slug: inviteOrgSlug.trim().toLowerCase(),
      });
      setGeneratedInviteUrl(res.data.invite_url);
      setFeedback({
        type: "success",
        message: `Client onboarding invite created for ${inviteEmail}!`,
      });
      setInviteEmail("");
      setInviteName("");
      setInviteOrgName("");
      setInviteOrgSlug("");
      loadData();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to generate client invite.",
      });
    } finally {
      setInvitingClient(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!generatedInviteUrl) return;
    try {
      await navigator.clipboard.writeText(generatedInviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      setFeedback({ type: "error", message: "Copy failed. Select the link and copy it manually." });
    }
  };

  const activeCount = organizations.filter((o) => o.is_active).length;

  const modalOrgColumns: ClientTableColumn<Organization>[] = [
    {
      key: "name",
      header: "Client Organization",
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-xs">
            {o.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-stone-900 dark:text-white">{o.name}</div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
              ID: {o.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "subdomain",
      header: "Subdomain & Domain",
      render: (o) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-stone-700 dark:text-stone-300">
            {o.subdomain_host}
          </span>
          {o.custom_domain && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-600 dark:text-amber-400">
              <Globe className="h-3 w-3" />
              {o.custom_domain}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            o.is_active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              o.is_active ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {o.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (o) => {
        const isSelected = selectedOrgForFeatures?.id === o.id;
        return (
          <div className="flex items-center justify-end gap-2">
            {onInspectWorkspace && (
              <button
                type="button"
                onClick={() => onInspectWorkspace(o)}
                className="btn-primary btn-xs"
                title={`Inspect ${o.name} workspace`}
              >
                <Eye className="h-3.5 w-3.5" />
                Inspect Workspace
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedOrgForFeatures(isSelected ? null : o)}
              aria-pressed={isSelected}
              className="btn-secondary btn-xs"
            >
              <Sliders className="h-3.5 w-3.5" />
              Feature Flags
            </button>
            <button
              type="button"
              onClick={() => handleToggleClientActive(o)}
              disabled={pendingOrgId === o.id}
              className={`${o.is_active ? "btn-danger" : "btn-secondary"} btn-xs`}
            >
              {pendingOrgId === o.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5" />
              )}
              {o.is_active ? "Suspend" : "Activate"}
            </button>
          </div>
        );
      },
    },
  ];

  const renderContent = () => (
    <div className="space-y-6">
      {feedback && (
        <InlineAlert tone={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </InlineAlert>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          Loading platform state &amp; client organizations...
        </div>
      ) : activeTab === "organizations" ? (
        <div className="space-y-6">
          <ClientDataTable<Organization>
            title={`Client Builder Directory (${organizations.length})`}
            description="Manage client organizations, configure feature toggles, and inspect workspaces."
            items={organizations}
            columns={modalOrgColumns}
            searchKeys={[(o) => o.name, (o) => o.slug, (o) => o.subdomain_host, (o) => o.custom_domain || ""]}
            searchPlaceholder="Search organizations..."
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
            filterMatcher={(o, key, val) => {
              if (key === "status") return val === "active" ? o.is_active : !o.is_active;
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
            rowClassName={(o) =>
              selectedOrgForFeatures?.id === o.id
                ? "bg-amber-50/50 dark:bg-amber-950/20"
                : ""
            }
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage="No client organizations provisioned yet. Use the Invite tab to onboard your first client."
            itemLabel="organizations"
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="btn-secondary btn-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invite_client")}
                  className="btn-primary btn-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite client
                </button>
              </div>
            }
          />

          {selectedOrgForFeatures && (
            <section
              aria-label={`Feature entitlements for ${selectedOrgForFeatures.name}`}
              className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    Feature Entitlements · {selectedOrgForFeatures.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    Changes save immediately and enforce row-level module gating for this client workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrgForFeatures(null)}
                  aria-label="Close feature entitlements"
                  className="btn-ghost btn-icon -mr-2 -mt-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title} className="card p-4">
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{group.title}</h4>
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{group.description}</p>
                    <div className="mt-3 space-y-3">
                      {group.items.map((item) => {
                        const isEnabled = Boolean(
                          selectedOrgForFeatures.feature_flags[item.key] ?? item.defaultEnabled ?? true
                        );
                        return (
                          <Switch
                            key={item.key}
                            label={item.label}
                            checked={isEnabled}
                            disabled={pendingFlag !== null}
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
      ) : activeTab === "platform_settings" ? (
        <form id="platform-settings-form" onSubmit={handleSavePlatformSettings} className="max-w-2xl space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Platform Domain &amp; Branding
            </h3>
            <Field label="Platform name" required>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="input"
              />
            </Field>

            <Field
              label="Platform base domain"
              required
              hint={`Client workspaces are served dynamically at <slug>.${baseDomain || "beamline.musfiqdehan.com"}`}
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
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Global Platform Google OAuth (Two-Tier Sign-in)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Provides fallback Google OAuth for all client tenants that have not set up their own Google Client ID/Secret.
            </p>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
              <Switch
                label="Enable Platform Google OAuth"
                description="When enabled, any tenant without custom OAuth uses this global app."
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
              hint={platformSettings?.has_google_secret ? "A secret is stored securely. Leave blank to preserve it." : undefined}
            >
              <PasswordInput
                autoComplete="new-password"
                placeholder={platformSettings?.has_google_secret ? "••••••••••••" : "Enter Google client secret"}
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
                {savingPlatform ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingPlatform ? "Saving Platform Settings..." : "Save Platform Settings"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="max-w-2xl space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Provision New Client Organization
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Provision a new home builder organization. BeamLine creates the isolated tenant workspace, reserves the subdomain, and generates a one-time onboarding link for the owner.
            </p>

            <form id="invite-client-form" onSubmit={handleInviteClient} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Owner Email" required>
                  <input
                    type="email"
                    required
                    placeholder="sarah@apexbuilds.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Owner Full Name">
                  <input
                    type="text"
                    placeholder="Sarah Miller"
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
                  placeholder="Apex Custom Builds"
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
                  <span className="flex max-w-[55%] items-center truncate rounded-r-xl border border-l-0 border-stone-200 bg-stone-100 px-3 font-mono text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
                    .{baseDomain}
                  </span>
                </div>
              </Field>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={invitingClient || loading}
                  className="btn-primary"
                >
                  {invitingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {invitingClient ? "Provisioning..." : "Generate Client Invitation Link"}
                </button>
              </div>
            </form>

            {generatedInviteUrl && (
              <InlineAlert tone="success" title="Onboarding link generated!">
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-white/70 px-2.5 py-1.5 font-mono text-xs dark:bg-stone-950/60">
                    {generatedInviteUrl}
                  </code>
                  <button type="button" onClick={handleCopyInvite} className="btn-secondary btn-xs">
                    {copiedInvite ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedInvite ? "Copied" : "Copy link"}
                  </button>
                </div>
              </InlineAlert>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // If embedded in AdminDashboard, render clean full-width control plane layout
  if (isEmbedded) {
    return (
      <div className="space-y-6">
        {/* Platform Control Plane Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs dark:border-stone-800/90 dark:bg-stone-900">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                  BeamLine Platform Control Plane
                </h2>
                <Badge tone="amber">Superadmin Mode</Badge>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Central governance plane for multi-tenant builder organizations, subdomain routing, and global OAuth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {activeCount} Active / {organizations.length} Clients
            </span>
          </div>
        </div>

        {/* Platform KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Client Organizations"
            value={organizations.length}
            hint={`${activeCount} active, ${organizations.length - activeCount} suspended`}
            icon={Building2}
            tone="indigo"
          />
          <StatCard
            label="Active Client Workspaces"
            value={activeCount}
            hint="Live production builder domains"
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            label="Platform Base Domain"
            value={baseDomain || "beamline.musfiqdehan.com"}
            hint="Wildcard tenant DNS resolution"
            icon={Globe}
            tone="amber"
          />
          <StatCard
            label="Global Platform OAuth"
            value={googleEnabled ? "Enabled" : "Disabled"}
            hint={googleClientId ? "Credentials configured" : "No client secret"}
            icon={KeyRound}
            tone={googleEnabled ? "green" : undefined}
          />
        </div>

        {/* Section Navigation Tabs */}
        <div className="border-b border-stone-200 dark:border-stone-800">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("organizations");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition cursor-pointer ${
                activeTab === "organizations"
                  ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                  : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Client Organizations ({organizations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("platform_settings");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition cursor-pointer ${
                activeTab === "platform_settings"
                  ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                  : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Platform Domain &amp; OAuth</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("invite_client");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition cursor-pointer ${
                activeTab === "invite_client"
                  ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                  : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Client Tenant</span>
            </button>
          </nav>
        </div>

        {/* Tab Body */}
        {renderContent()}
      </div>
    );
  }

  // Modal mode
  return (
    <Modal isOpen={true} onClose={onClose || (() => {})} size="xl">
      <ModalHeader
        title="Platform Console"
        subtitle="Govern client organizations, platform sign-in, and feature entitlements."
        icon={<BeamLineMark className="size-10" title="BeamLine" />}
        onClose={onClose || (() => {})}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="amber">Platform superadmin</Badge>
          {!loading && (
            <Badge tone="gray">
              {activeCount} of {organizations.length} clients active
            </Badge>
          )}
        </div>
      </ModalHeader>

      <ModalTabs<ConsoleTab>
        ariaLabel="Platform console sections"
        value={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setFeedback(null);
        }}
        tabs={[
          { id: "organizations", label: "Client directory", icon: Building2, count: organizations.length },
          { id: "platform_settings", label: "Domain & sign-in", icon: KeyRound },
          { id: "invite_client", label: "Invite client", icon: UserPlus },
        ]}
      />

      <ModalBody className="space-y-5">
        {renderContent()}
      </ModalBody>

      <ModalFooter
        hint={
          activeTab === "organizations"
            ? "Suspending a client blocks sign-in for every member."
            : activeTab === "platform_settings"
            ? "Applies to every client without custom OAuth."
            : undefined
        }
      >
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>
        {activeTab === "organizations" && (
          <button type="button" onClick={() => setActiveTab("invite_client")} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Invite client
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export function SuperAdminModal({
  isOpen,
  onClose,
  onOrganizationsChanged,
  onInspectWorkspace,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationsChanged?: () => void;
  onInspectWorkspace?: (org: Organization) => void;
}) {
  if (!isOpen) return null;
  return (
    <SuperAdminControlPlane
      onClose={onClose}
      onOrganizationsChanged={onOrganizationsChanged}
      onInspectWorkspace={onInspectWorkspace}
      isEmbedded={false}
    />
  );
}
