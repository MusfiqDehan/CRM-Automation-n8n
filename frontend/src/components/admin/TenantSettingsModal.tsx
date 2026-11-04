"use client";

import React, { useEffect, useState } from "react";
import { Blocks, Globe, Loader2, Save, Send, Sliders, Sparkles, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { Badge, DropdownSelect, Field } from "@/components/ui/primitives";
import { ClientDataTable, type ClientTableColumn } from "@/components/common/table";
import { MediaAssetUploader } from "@/components/common/MediaAssetUploader";
import {
  InlineAlert,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTabs,
} from "@/components/ui/overlay";
import type { Organization, OrganizationMember } from "@/lib/types";

type SettingsTab = "domains" | "thresholds" | "team";

interface TenantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (updated: Organization) => void;
  onOpenIntegrations?: () => void;
}

export function TenantSettingsModal({
  isOpen,
  onClose,
  onSettingsUpdated,
  onOpenIntegrations,
}: TenantSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("domains");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [socialCoverUrl, setSocialCoverUrl] = useState("");
  const [dealThreshold, setDealThreshold] = useState("1000000.00");
  const [invoiceThreshold, setInvoiceThreshold] = useState("5000.00");
  const [execEmail, setExecEmail] = useState("");
  const [currency, setCurrency] = useState("USD");

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
        setSiteTitle(o.site_title || "");
        setSiteDescription(o.site_description || "");
        setLogoUrl(o.logo_url || "");
        setSocialCoverUrl(o.social_cover_url || "");
        setDealThreshold(o.deal_review_threshold || "1000000.00");
        setInvoiceThreshold(o.invoice_review_threshold || "5000.00");
        setExecEmail(o.executive_recipient_email || "");
        setCurrency(o.currency || "USD");
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
        site_title: siteTitle.trim() || null,
        site_description: siteDescription.trim() || null,
        logo_url: logoUrl.trim() || null,
        social_cover_url: socialCoverUrl.trim() || null,
        deal_review_threshold: dealThreshold,
        invoice_review_threshold: invoiceThreshold,
        executive_recipient_email: execEmail.trim(),
        currency,
      };

      const res = await apiClient.patch<Organization>(
        "/tenant/settings/",
        payload
      );
      setOrg(res.data);
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
  const canInviteTeam = flags.sub_team_invitations !== false;

  const memberColumns: ClientTableColumn<OrganizationMember>[] = [
    {
      key: "username",
      header: "User",
      render: (m) => (
        <span className="font-medium text-stone-900 dark:text-stone-100">{m.username}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (m) => (
        <span className="text-stone-500 dark:text-stone-400">{m.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (m) => <Badge tone="amber">{m.role}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: () => <Badge tone="green">Active</Badge>,
    },
  ];

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType; count?: number }> = [
    { id: "domains", label: canUseCustomDomain ? "Domain & branding" : "Organization", icon: Globe },
    { id: "thresholds", label: "Review thresholds", icon: Sliders },
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
          <form id="tenant-settings-form" onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Globe className="size-4 text-amber-500" />
                Domain &amp; Routing
              </h3>

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
                  <Field label="Custom domain" hint="Map your builder domain or vanity subdomain to this workspace.">
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
            </div>

            <div className="border-t border-stone-200/80 pt-6 dark:border-stone-800/80 space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                SEO, Branding &amp; Social Covers
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Site Title (Browser Tab & SEO)"
                  hint="Custom title shown in browser tab and search engines."
                >
                  <input
                    type="text"
                    placeholder={`${name || "Builder"} — Private Client Portal`}
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field
                  label="Site Description"
                  hint="Meta description used for search indexing and social cards."
                >
                  <input
                    type="text"
                    placeholder="Luxury custom residential construction and client project management."
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-2">
                <MediaAssetUploader
                  label="Organization Logo"
                  category="branding"
                  scopeId={org?.slug || "tenant"}
                  value={logoUrl}
                  onChange={setLogoUrl}
                  previewType="logo"
                  hint="Square or horizontal transparent PNG / SVG recommended for navigation and favicon."
                />

                <MediaAssetUploader
                  label="Custom Social Share Cover (OpenGraph & Twitter)"
                  category="social"
                  scopeId={org?.slug || "tenant"}
                  value={socialCoverUrl}
                  onChange={setSocialCoverUrl}
                  previewType="social-card"
                  defaultPreviewUrl={`/api/og?type=tenant&name=${encodeURIComponent(name || org?.name || "Builder")}&tenant=${org?.slug || "tenant"}`}
                  socialCardInfo={{
                    brandName: name || org?.name || "Custom Builder",
                    title: siteTitle || `${name || org?.name || "Custom Builder"} — Private Client Portal`,
                    description:
                      siteDescription ||
                      "Follow every milestone, agreement, and site update from discovery to move-in day.",
                    host: customDomain || org?.subdomain_host || "tenant.beamline.musfiqdehan.com",
                  }}
                  hint="Uploaded directly to Cloudflare R2 bucket root under beamline/social/. If empty, the dynamic branded cover is automatically generated."
                />
              </div>
            </div>
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
              <ClientDataTable<OrganizationMember>
                title={`Team members (${members.length})`}
                description="Active team members with delegated access to this workspace."
                items={members}
                columns={memberColumns}
                searchKeys={[(m) => m.username, (m) => m.email, (m) => m.role]}
                searchPlaceholder="Search team members..."
                filters={[
                  {
                    key: "role",
                    label: "Role",
                    options: [
                      { label: "Admin", value: "admin" },
                      { label: "Project Manager", value: "project_manager" },
                      { label: "Estimator", value: "estimator" },
                      { label: "Viewer", value: "viewer" },
                    ],
                  },
                ]}
                filterMatcher={(m, key, val) => {
                  if (key === "role") return m.role.toLowerCase() === val.toLowerCase();
                  return true;
                }}
                defaultPageSize={5}
                pageSizeOptions={[5, 10, 20]}
                emptyMessage="No team members yet. Invitations you send will appear here once accepted."
                itemLabel="members"
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter hint={isSettingsForm ? "Saving applies changes from every settings tab." : undefined}>
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>
        {onOpenIntegrations && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenIntegrations();
            }}
            className="btn-secondary"
          >
            <Blocks className="h-4 w-4 text-amber-600" />
            Integrations & Plugins
          </button>
        )}
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
