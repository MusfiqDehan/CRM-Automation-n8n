"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Plus,
  Power,
  Save,
  Send,
  Sliders,
  UserPlus,
  X,
} from "lucide-react";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { apiClient } from "@/lib/api-client";
import type { FeatureFlags, Organization, PlatformSettings } from "@/lib/types";

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
  const [activeTab, setActiveTab] = useState<
    "organizations" | "platform_settings" | "invite_client"
  >("organizations");

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
    }
  };

  // Toggle Granular Feature Flag
  const handleToggleFeature = async (flagKey: string, currentValue: boolean) => {
    if (!selectedOrgForFeatures) return;
    const nextFlags = {
      ...selectedOrgForFeatures.feature_flags,
      [flagKey]: !currentValue,
    };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-2xl border border-amber-200 bg-white shadow-2xl dark:border-amber-900/60 dark:bg-stone-900 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <BeamLineMark className="size-10" />
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                BeamLine Platform Superadmin Console
              </h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Global Client Governance, Dynamic OAuth & Feature Matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 rounded-xl p-3 text-xs ${
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("organizations")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "organizations"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Client Directory ({organizations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("platform_settings")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "platform_settings"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Platform OAuth & Domain
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invite_client")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "invite_client"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Invite Client Organization
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-stone-400">
              Loading superadmin state...
            </div>
          ) : activeTab === "organizations" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Manage all tenant organizations, suspend/activate client accounts,
                  and configure granular feature entitlements per client.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("invite_client")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Invite Client
                </button>
              </div>

              {/* Clients Table */}
              <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Client Name & Slug</th>
                      <th className="py-2.5 px-3 font-semibold">Domains</th>
                      <th className="py-2.5 px-3 font-semibold">Review Thresholds</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {organizations.map((o) => (
                      <tr
                        key={o.id}
                        className={`transition hover:bg-stone-50/50 dark:hover:bg-stone-800/30 ${
                          !o.is_active ? "opacity-60 bg-red-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <p className="font-bold text-stone-900 dark:text-white">
                            {o.name}
                          </p>
                          <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                            slug: {o.slug}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-mono text-[11px] text-stone-600 dark:text-stone-300">
                            {o.subdomain_host}
                          </p>
                          {o.custom_domain && (
                            <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                              {o.custom_domain}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-stone-500">
                          <div>Deals ≥ ${Number(o.deal_review_threshold).toLocaleString()}</div>
                          <div>Invoices ≥ ${Number(o.invoice_review_threshold).toLocaleString()}</div>
                        </td>

                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleClientActive(o)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                              o.is_active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            <Power className="h-3 w-3" />
                            {o.is_active ? "Active" : "Suspended"}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrgForFeatures(o)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                          >
                            <Sliders className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Features</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Granular Feature Entitlements Drawer */}
              {selectedOrgForFeatures && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-amber-900/40">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                        Granular Feature Matrix: {selectedOrgForFeatures.name}
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Enable or disable individual pages, workflows, and sub-features for this specific client.
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedOrgForFeatures(null)}
                      className="rounded-lg p-1 text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {/* Top Level Pages */}
                    <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs dark:border-stone-800 dark:bg-stone-800/80">
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Top-Level Navigation Tabs
                      </h4>
                      <div className="space-y-2">
                        {[
                          { key: "page_landing", label: "Client Landing Page", defaultEnabled: false },
                          { key: "page_overview", label: "Executive Overview", defaultEnabled: true },
                          { key: "page_crm", label: "Sales CRM Pipeline", defaultEnabled: true },
                          { key: "page_projects", label: "4-Phase Projects", defaultEnabled: true },
                          { key: "page_automation", label: "Invoices & Automation", defaultEnabled: true },
                        ].map((item) => {
                          const isEnabled = Boolean(
                            selectedOrgForFeatures.feature_flags[item.key] ?? item.defaultEnabled
                          );
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                {item.label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleFeature(item.key, isEnabled)
                                }
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isEnabled
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400"
                                }`}
                              >
                                {isEnabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CRM & Projects Sub-Features */}
                    <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs dark:border-stone-800 dark:bg-stone-800/80">
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        CRM & Field Modules
                      </h4>
                      <div className="space-y-2">
                        {[
                          { key: "sub_crm_deals", label: "High-Value Deals" },
                          { key: "sub_crm_contacts", label: "Contacts & Leads" },
                          { key: "sub_crm_activities", label: "Follow-up Touchpoints" },
                          { key: "sub_projects_board", label: "Lifecycle Phases" },
                          { key: "sub_projects_tasks", label: "Task Checklists" },
                          { key: "sub_projects_materials", label: "Material Orders" },
                        ].map((item) => {
                          const isEnabled = Boolean(
                            selectedOrgForFeatures.feature_flags[item.key] ?? true
                          );
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                {item.label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleFeature(item.key, isEnabled)
                                }
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isEnabled
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400"
                                }`}
                              >
                                {isEnabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Automation & White-Label */}
                    <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs dark:border-stone-800 dark:bg-stone-800/80">
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        White-Label & Governance
                      </h4>
                      <div className="space-y-2">
                        {[
                          { key: "sub_automation_invoices", label: "AI Invoice Ingestion" },
                          { key: "sub_automation_simulator", label: "Test Scenario Simulator" },
                          { key: "sub_custom_domain", label: "Custom Domain Attachment" },
                          { key: "sub_custom_google_oauth", label: "Client Custom OAuth" },
                          { key: "sub_executive_triage", label: "Executive Threshold Triage" },
                          { key: "sub_team_invitations", label: "Team Member Invites" },
                        ].map((item) => {
                          const isEnabled = Boolean(
                            selectedOrgForFeatures.feature_flags[item.key] ?? true
                          );
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                {item.label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleFeature(item.key, isEnabled)
                                }
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isEnabled
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400"
                                }`}
                              >
                                {isEnabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "platform_settings" ? (
            <form onSubmit={handleSavePlatformSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Platform Name
                </label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Platform Base Domain
                </label>
                <input
                  type="text"
                  required
                  value={baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Subscribers receive subdomains formatted as:{" "}
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    &lt;slug&gt;.{baseDomain}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                    Platform-Wide Google OAuth Sign-In
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Fallback Google OAuth app for all clients who have not provided
                    their own credentials.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={googleEnabled}
                    onChange={(e) => setGoogleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-stone-200 peer-focus:outline-hidden peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all dark:bg-stone-700" />
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Platform Google OAuth Client ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104829104-platform.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Platform Google OAuth Client Secret
                </label>
                <input
                  type="password"
                  placeholder={
                    platformSettings?.has_google_secret
                      ? "•••••••••••• (Leave blank to keep existing secret)"
                      : "Enter Google Client Secret"
                  }
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPlatform}
                  className="btn-primary bg-amber-600 hover:bg-amber-700 py-2 px-4 text-xs"
                >
                  <Save className="h-4 w-4" />
                  {savingPlatform ? "Saving..." : "Save Platform Configuration"}
                </button>
              </div>
            </form>
          ) : (
            /* Invite Client Organization Tab */
            <div className="max-w-xl space-y-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Superadmin invites a new custom home builder client. This
                automatically provisions their organization tenant, assigns their
                subdomain, and generates a one-click onboarding URL.
              </p>

              <form onSubmit={handleInviteClient} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Client Owner Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@apexbuilds.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="Sarah Miller"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Organization Name
                  </label>
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
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Subdomain Slug
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="apex"
                      value={inviteOrgSlug}
                      onChange={(e) => setInviteOrgSlug(e.target.value.toLowerCase())}
                      className="w-full rounded-l-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    />
                    <span className="rounded-r-xl border border-l-0 border-stone-200 bg-stone-100 py-2 px-3 text-xs font-mono text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
                      .{baseDomain}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={invitingClient}
                    className="btn-primary bg-amber-600 hover:bg-amber-700 py-2.5 px-4 text-xs"
                  >
                    <Send className="h-4 w-4" />
                    {invitingClient ? "Generating..." : "Generate Client Invitation"}
                  </button>
                </div>
              </form>

              {generatedInviteUrl && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Onboarding Link Generated:
                  </p>
                  <p className="mt-1 font-mono text-xs break-all text-emerald-900 dark:text-emerald-200 select-all">
                    {generatedInviteUrl}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
