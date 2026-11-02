"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Power,
  Save,
  Send,
  Sliders,
  UserPlus,
  X,
} from "lucide-react";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { Badge, Field } from "@/components/ui/primitives";
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

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationsChanged?: () => void;
}

export function SuperAdminModal({
  isOpen,
  onClose,
  onOrganizationsChanged,
}: SuperAdminModalProps) {
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
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Client is_active
  const handleToggleClientActive = async (org: Organization) => {
    const nextState = !org.is_active;
    if (
      !nextState &&
      !window.confirm(
        `Suspend ${org.name}? Their team will lose access to the workspace until it is reactivated.`
      )
    ) {
      return;
    }
    setPendingOrgId(org.id);
    try {
      await apiClient.patch(`/superadmin/organizations/${org.id}/`, {
        is_active: nextState,
      });
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, is_active: nextState } : o))
      );
      setFeedback({
        type: "success",
        message: `Client '${org.name}' has been ${
          nextState ? "activated" : "suspended"
        }.`,
      });
      if (onOrganizationsChanged) onOrganizationsChanged();
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

  // Toggle Granular Feature Flag
  const handleToggleFeature = async (flagKey: string, currentValue: boolean) => {
    if (!selectedOrgForFeatures) return;
    const nextFlags = {
      ...selectedOrgForFeatures.feature_flags,
      [flagKey]: !currentValue,
    };
    setPendingFlag(flagKey);
    try {
      const res = await apiClient.patch<Organization>(
        `/superadmin/organizations/${selectedOrgForFeatures.id}/`,
        {
          feature_flags: nextFlags,
        }
      );
      setSelectedOrgForFeatures(res.data);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === res.data.id ? res.data : o))
      );
      setFeedback({
        type: "success",
        message: `Feature '${flagKey}' updated for ${res.data.name}.`,
      });
      if (onOrganizationsChanged) onOrganizationsChanged();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update feature flag.",
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="Platform Console"
        subtitle="Govern client organizations, platform sign-in, and feature entitlements."
        icon={<BeamLineMark className="size-10" title="BeamLine" />}
        onClose={onClose}
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
        {feedback && (
          <InlineAlert tone={feedback.type} onDismiss={() => setFeedback(null)}>
            {feedback.message}
          </InlineAlert>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            Loading platform data...
          </div>
        ) : activeTab === "organizations" ? (
          <div className="space-y-5">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Suspend or reactivate client accounts and configure which modules each organization can use.
            </p>

            {organizations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
                No client organizations yet. Invite your first client to provision a workspace.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="bg-stone-50 text-xs text-stone-500 dark:bg-stone-950/50 dark:text-stone-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Domains</th>
                      <th className="px-4 py-3 font-medium">Review thresholds</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {organizations.map((o) => {
                      const isSelected = selectedOrgForFeatures?.id === o.id;
                      return (
                        <tr
                          key={o.id}
                          className={`transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/40 ${
                            isSelected ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-stone-900 dark:text-stone-100">{o.name}</p>
                            <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{o.slug}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            <p className="text-stone-600 dark:text-stone-300">{o.subdomain_host}</p>
                            {o.custom_domain && (
                              <p className="text-emerald-700 dark:text-emerald-400">{o.custom_domain}</p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-stone-500 dark:text-stone-400">
                            <div>Deals ≥ ${Number(o.deal_review_threshold).toLocaleString()}</div>
                            <div>Invoices ≥ ${Number(o.invoice_review_threshold).toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge tone={o.is_active ? "green" : "red"}>
                              {o.is_active ? "Active" : "Suspended"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrgForFeatures(isSelected ? null : o)}
                                aria-pressed={isSelected}
                                className="btn-secondary btn-xs"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                                Features
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedOrgForFeatures && (
              <section
                aria-label={`Feature entitlements for ${selectedOrgForFeatures.name}`}
                className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      Feature entitlements · {selectedOrgForFeatures.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                      Changes save immediately and apply on the client&apos;s next page load.
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
          <form id="platform-settings-form" onSubmit={handleSavePlatformSettings} className="max-w-xl space-y-4">
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
              hint={`Client workspaces are served at <slug>.${baseDomain || "your-domain.com"}`}
            >
              <input
                type="text"
                required
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                className="input font-mono"
              />
            </Field>

            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
              <Switch
                label="Platform-wide Google sign-in"
                description="Fallback Google OAuth app for clients that have not configured their own credentials."
                checked={googleEnabled}
                onChange={setGoogleEnabled}
              />
            </div>

            <Field label="Google OAuth client ID">
              <input
                type="text"
                placeholder="e.g. 104829104-platform.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                className="input font-mono"
              />
            </Field>

            <Field
              label="Google OAuth client secret"
              hint={platformSettings?.has_google_secret ? "A secret is stored. Leave blank to keep it." : undefined}
            >
              <input
                type="password"
                autoComplete="new-password"
                placeholder={platformSettings?.has_google_secret ? "••••••••••••" : "Enter Google client secret"}
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                className="input font-mono"
              />
            </Field>
          </form>
        ) : (
          <div className="max-w-xl space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Provision a new builder organization. BeamLine creates the tenant, reserves the subdomain, and
              generates a one-time onboarding link for the owner.
            </p>

            <form id="invite-client-form" onSubmit={handleInviteClient} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Owner email" required>
                  <input
                    type="email"
                    required
                    placeholder="sarah@apexbuilds.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Owner name">
                  <input
                    type="text"
                    placeholder="Sarah Miller"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Organization name" required>
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

              <Field label="Subdomain" required>
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
            </form>

            {generatedInviteUrl && (
              <InlineAlert tone="success" title="Onboarding link ready">
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
        )}
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
        {activeTab === "platform_settings" && (
          <button
            type="submit"
            form="platform-settings-form"
            disabled={savingPlatform || loading}
            className="btn-primary"
          >
            {savingPlatform ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingPlatform ? "Saving..." : "Save settings"}
          </button>
        )}
        {activeTab === "invite_client" && (
          <button
            type="submit"
            form="invite-client-form"
            disabled={invitingClient || loading}
            className="btn-primary"
          >
            {invitingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {invitingClient ? "Generating..." : "Generate invitation"}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
