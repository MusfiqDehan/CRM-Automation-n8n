"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Globe,
  KeyRound,
  Mail,
  Plus,
  Save,
  Send,
  Shield,
  Sliders,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import type { Organization, OrganizationMember } from "@/lib/types";

interface TenantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (updated: Organization) => void;
}

export function TenantSettingsModal({
  isOpen,
  onClose,
  onSettingsUpdated,
}: TenantSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "domains" | "thresholds" | "google_oauth" | "team"
  >("domains");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [dealThreshold, setDealThreshold] = useState("1000000.00");
  const [invoiceThreshold, setInvoiceThreshold] = useState("5000.00");
  const [execEmail, setExecEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [useCustomGoogleOAuth, setUseCustomGoogleOAuth] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

  // Team invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("PM");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setLoading(true);

    Promise.all([
      apiClient.get<Organization>("/tenant/settings/"),
      apiClient.get<{ results: OrganizationMember[] }>("/tenant/members/"),
    ])
      .then(([orgRes, membersRes]) => {
        const o = orgRes;
        setOrg(o);
        setName(o.name || "");
        setCustomDomain(o.custom_domain || "");
        setDealThreshold(o.deal_review_threshold || "1000000.00");
        setInvoiceThreshold(o.invoice_review_threshold || "5000.00");
        setExecEmail(o.executive_recipient_email || "");
        setCurrency(o.currency || "USD");
        setUseCustomGoogleOAuth(Boolean(o.use_custom_google_oauth));
        setGoogleClientId(o.google_oauth_client_id || "");
        setGoogleClientSecret("");
        setMembers(membersRes.results || []);
      })
      .catch((err) => {
        setFeedback({
          type: "error",
          message:
            err instanceof Error ? err.message : "Failed to load tenant settings.",
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        name,
        custom_domain: customDomain.trim() || null,
        deal_review_threshold: dealThreshold,
        invoice_review_threshold: invoiceThreshold,
        executive_recipient_email: execEmail.trim(),
        currency,
        use_custom_google_oauth: useCustomGoogleOAuth,
        google_oauth_client_id: googleClientId.trim(),
      };
      if (googleClientSecret) {
        payload.google_oauth_client_secret = googleClientSecret;
      }

      const res = await apiClient.patch<Organization>(
        "/tenant/settings/",
        payload
      );
      setOrg(res.data);
      setGoogleClientSecret("");
      setFeedback({
        type: "success",
        message: "Organization settings and custom domain saved successfully!",
      });
      if (onSettingsUpdated) {
        onSettingsUpdated(res.data);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update organization settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setFeedback(null);
    try {
      await apiClient.post("/tenant/members/", {
        email: inviteEmail.trim(),
        role: inviteRole,
        invited_name: inviteName.trim(),
      });
      setFeedback({
        type: "success",
        message: `Invitation successfully sent to ${inviteEmail}!`,
      });
      setInviteEmail("");
      setInviteName("");
      // Refresh members
      const membersRes = await apiClient.get<{ results: OrganizationMember[] }>(
        "/tenant/members/"
      );
      setMembers(membersRes.results || []);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to send team invitation.",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <BeamLineMark className="size-10" title="BeamLine" />
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Client Organization Settings
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {org?.name} • Subdomain:{" "}
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  {org?.subdomain_host}
                </span>
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
            onClick={() => setActiveTab("domains")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "domains"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <Globe className="h-4 w-4" />
            Domains & Branding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("thresholds")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "thresholds"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Review Thresholds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("google_oauth")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "google_oauth"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Google OAuth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition ${
              activeTab === "team"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Team & Invites
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-stone-400">
              Loading organization settings...
            </div>
          ) : activeTab === "domains" ? (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Assigned Platform Subdomain
                </label>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 font-mono text-xs text-amber-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-amber-400">
                  https://{org?.subdomain_host}
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Every subscriber automatically has their own isolated subdomain.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Custom Domain Attachment
                </label>
                <input
                  type="text"
                  placeholder="e.g. kevinbuild.com or portal.kevinconstruction.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
                <div className="mt-2 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  <p className="font-semibold">DNS Configuration Instruction:</p>
                  <p className="mt-0.5 text-[11px]">
                    Create a CNAME record at your DNS registrar pointing{" "}
                    <span className="font-mono font-bold">
                      {customDomain || "yourdomain.com"}
                    </span>{" "}
                    to{" "}
                    <span className="font-mono font-bold">
                      cname.beamline.musfiqdehan.com
                    </span>
                    . Traefik automatically provisions a Let&apos;s Encrypt SSL
                    certificate.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Domain Settings"}
                </button>
              </div>
            </form>
          ) : activeTab === "thresholds" ? (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure threshold rules that automatically escalate items into the
                Executive Triage review queue.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    High-Value Deal Review Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dealThreshold}
                    onChange={(e) => setDealThreshold(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Deals with estimated value ≥ this amount trigger executive review.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Vendor Invoice Review Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceThreshold}
                    onChange={(e) => setInvoiceThreshold(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Subcontractor invoices ≥ this amount trigger executive review.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Executive Notification Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="kevin@kevinbuild.com"
                  value={execEmail}
                  onChange={(e) => setExecEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  High-value exceptions and clarification notices will be routed to
                  this address.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Thresholds"}
                </button>
              </div>
            </form>
          ) : activeTab === "google_oauth" ? (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                    Client Custom Google OAuth
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    When enabled, users logging into your custom domain see your
                    company&apos;s brand on Google&apos;s sign-in screen.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={useCustomGoogleOAuth}
                    onChange={(e) => setUseCustomGoogleOAuth(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-stone-200 peer-focus:outline-hidden peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all dark:bg-stone-700" />
                </label>
              </div>

              {useCustomGoogleOAuth && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Google OAuth Client ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Google OAuth Client Secret
                    </label>
                    <input
                      type="password"
                      placeholder={
                        org?.has_google_secret
                          ? "•••••••••••• (Leave blank to keep existing secret)"
                          : "Enter Google Client Secret"
                      }
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-mono focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save OAuth Credentials"}
                </button>
              </div>
            </form>
          ) : (
            /* Team & Invites Tab */
            <div className="space-y-6">
              {/* Send Invitation Form */}
              <form
                onSubmit={handleSendInvite}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/40"
              >
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Invite Team Member
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="colleague@build.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Marcus Vance"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="PM">Project Manager</option>
                      <option value="Sales">Sales Representative</option>
                      <option value="Field">Site Superintendent</option>
                      <option value="Accountant">Bookkeeper / Accountant</option>
                      <option value="Client">Client (Read-Only)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {inviting ? "Sending..." : "Dispatch Invitation"}
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Active Team Members ({members.length})
                </h4>
                <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">User</th>
                        <th className="py-2.5 px-3 font-semibold">Email</th>
                        <th className="py-2.5 px-3 font-semibold">Role</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white">
                            {m.username}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400">
                            {m.email}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              {m.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
