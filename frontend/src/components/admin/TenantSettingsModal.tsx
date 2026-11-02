"use client";

import React, { useEffect, useState } from "react";
import { Globe, KeyRound, Loader2, Save, Send, Sliders, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { Badge, DropdownSelect, Field } from "@/components/ui/primitives";
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
import type { Organization, OrganizationMember } from "@/lib/types";

type SettingsTab = "domains" | "thresholds" | "google_oauth" | "team";

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("domains");

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

  // Superadmin entitlements decide which settings this client may manage.
  const flags = org?.feature_flags ?? {};
  const canUseCustomDomain = flags.sub_custom_domain !== false;
  const canUseCustomOAuth = flags.sub_custom_google_oauth !== false;
  const canInviteTeam = flags.sub_team_invitations !== false;

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType; count?: number }> = [
    { id: "domains", label: canUseCustomDomain ? "Domain & branding" : "Organization", icon: Globe },
    { id: "thresholds", label: "Review thresholds", icon: Sliders },
    ...(canUseCustomOAuth ? [{ id: "google_oauth" as const, label: "Google sign-in", icon: KeyRound }] : []),
    ...(canInviteTeam ? [{ id: "team" as const, label: "Team", icon: Users, count: members.length }] : []),
  ];
  const currentTab: SettingsTab = tabs.some((t) => t.id === activeTab) ? activeTab : "domains";
  const isSettingsForm = currentTab !== "team";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title="Organization settings"
        icon={<BeamLineMark className="size-10" title="BeamLine" />}
        onClose={onClose}
        subtitle={
          org ? (
            <span className="flex flex-wrap items-center gap-x-1.5">
              <span>{org.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{org.subdomain_host}</span>
            </span>
          ) : (
            "Workspace configuration"
          )
        }
      />

      <ModalTabs<SettingsTab>
        ariaLabel="Organization settings sections"
        value={currentTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setFeedback(null);
        }}
        tabs={tabs}
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
            Loading organization settings...
          </div>
        ) : currentTab === "domains" ? (
          <form id="tenant-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
            <Field label="Organization name" required>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </Field>

            <Field label="Platform subdomain" hint="Every workspace has its own isolated subdomain.">
              <div className="input cursor-default bg-stone-50 font-mono text-stone-600 dark:bg-stone-900 dark:text-stone-300">
                https://{org?.subdomain_host}
              </div>
            </Field>

            {canUseCustomDomain && (
              <div className="space-y-3">
                <Field label="Custom domain">
                  <input
                    type="text"
                    placeholder="e.g. portal.yourbuilder.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="input font-mono"
                  />
                </Field>
                <InlineAlert tone="info" title="DNS setup">
                  Create a CNAME record pointing{" "}
                  <span className="font-mono font-semibold">{customDomain || "yourdomain.com"}</span> to{" "}
                  <span className="font-mono font-semibold">cname.beamline.musfiqdehan.com</span>. SSL is provisioned
                  automatically once DNS resolves.
                </InlineAlert>
              </div>
            )}
          </form>
        ) : currentTab === "thresholds" ? (
          <form id="tenant-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Items above these amounts are escalated to the executive review queue automatically.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Deal review threshold" required hint="Deals at or above this value need executive review.">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={dealThreshold}
                  onChange={(e) => setDealThreshold(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Invoice review threshold" required hint="Supplier invoices at or above this value are flagged.">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceThreshold}
                  onChange={(e) => setInvoiceThreshold(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Executive notification email" hint="Escalations and clarification notices are sent here.">
              <input
                type="email"
                placeholder="founder@yourbuilder.com"
                value={execEmail}
                onChange={(e) => setExecEmail(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Default currency">
              <DropdownSelect
                value={currency}
                onChange={(val) => setCurrency(String(val))}
                ariaLabel="Default currency"
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "CAD", label: "CAD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                ]}
              />
            </Field>
          </form>
        ) : currentTab === "google_oauth" ? (
          <form id="tenant-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
              <Switch
                label="Use your own Google OAuth app"
                description="People signing in on your domain see your company name on Google's consent screen."
                checked={useCustomGoogleOAuth}
                onChange={setUseCustomGoogleOAuth}
              />
            </div>

            {useCustomGoogleOAuth ? (
              <div className="space-y-4">
                <Field label="Google OAuth client ID">
                  <input
                    type="text"
                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="input font-mono"
                  />
                </Field>
                <Field
                  label="Google OAuth client secret"
                  hint={org?.has_google_secret ? "A secret is stored. Leave blank to keep it." : undefined}
                >
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={org?.has_google_secret ? "••••••••••••" : "Enter Google client secret"}
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    className="font-mono"
                  />
                </Field>
              </div>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Your workspace currently uses the BeamLine platform sign-in.
              </p>
            )}
          </form>
        ) : (
          <div className="space-y-6">
            <form
              id="team-invite-form"
              onSubmit={handleSendInvite}
              className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40"
            >
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Invite a team member</h3>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                They receive an email link to join this workspace with the selected role.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Email" required>
                  <input
                    type="email"
                    required
                    placeholder="colleague@build.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Full name">
                  <input
                    type="text"
                    placeholder="Marcus Vance"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Role">
                  <DropdownSelect
                    value={inviteRole}
                    onChange={(val) => setInviteRole(String(val))}
                    ariaLabel="Role"
                    options={[
                      { value: "Admin", label: "Admin" },
                      { value: "PM", label: "Project manager" },
                      { value: "Sales", label: "Sales representative" },
                      { value: "Field", label: "Site superintendent" },
                      { value: "Accountant", label: "Bookkeeper / accountant" },
                      { value: "Client", label: "Client (read-only)" },
                    ]}
                  />
                </Field>
              </div>
            </form>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                Team members ({members.length})
              </h3>
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
                  No team members yet. Invitations you send will appear here once accepted.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-stone-800">
                  <table className="w-full min-w-xl text-left text-sm">
                    <thead className="bg-stone-50 text-xs text-stone-500 dark:bg-stone-950/50 dark:text-stone-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {members.map((m) => (
                        <tr key={m.id} className="transition-colors hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                          <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{m.username}</td>
                          <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{m.email}</td>
                          <td className="px-4 py-3">
                            <Badge tone="amber">{m.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone="green">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter hint={isSettingsForm ? "Saving applies changes from every settings tab." : undefined}>
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>
        {isSettingsForm ? (
          <button type="submit" form="tenant-settings-form" disabled={saving || loading} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        ) : (
          <button type="submit" form="team-invite-form" disabled={inviting || loading} className="btn-primary">
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {inviting ? "Sending..." : "Send invitation"}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
