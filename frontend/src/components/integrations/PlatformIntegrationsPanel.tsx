"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Blocks,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Badge, DropdownSelect, Field } from "@/components/ui/primitives";
import { InlineAlert, Switch } from "@/components/ui/overlay";
import { SchemaFormRenderer } from "@/components/integrations/SchemaFormRenderer";
import { renderProviderIcon } from "@/components/integrations/TenantIntegrationsModal";
import type {
  IntegrationCategory,
  Organization,
  PlatformIntegrationItem,
} from "@/lib/types";

interface PlatformIntegrationsPanelProps {
  organizations: Organization[];
  onUpdated?: () => void;
}

const CATEGORY_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Categories" },
  { value: "identity", label: "Identity & SSO" },
  { value: "workspace", label: "Workspace OS" },
  { value: "payments", label: "Payment Gateways" },
  { value: "communication", label: "Communication" },
  { value: "ai_automation", label: "AI & Automation" },
];

const PLAN_TIERS = ["Starter", "Pro", "Enterprise"];

export function PlatformIntegrationsPanel({
  organizations,
  onUpdated,
}: PlatformIntegrationsPanelProps) {
  const [providers, setProviders] = useState<PlatformIntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string>("google_oauth");

  // Form state for currently selected provider
  const [availabilityMode, setAvailabilityMode] =
    useState<PlatformIntegrationItem["availability_mode"]>("ALL_TENANTS");
  const [allowedTiers, setAllowedTiers] = useState<string[]>([]);
  const [allowedOrgIds, setAllowedOrgIds] = useState<string[]>([]);
  const [allowFallback, setAllowFallback] = useState(true);
  const [allowByoc, setAllowByoc] = useState(true);
  const [credValues, setCredValues] = useState<Record<string, unknown>>({});
  const [cfgValues, setCfgValues] = useState<Record<string, unknown>>({});

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ results: PlatformIntegrationItem[] }>(
        "/integrations/superadmin/providers/"
      );
      const list = res.results || [];
      setProviders(list);
      if (list.length > 0 && !list.some((p) => p.provider_key === selectedKey)) {
        setSelectedKey(list[0].provider_key);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to load platform integration providers.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const selectedProvider =
    providers.find((p) => p.provider_key === selectedKey) || providers[0] || null;

  useEffect(() => {
    if (!selectedProvider) return;
    setAvailabilityMode(selectedProvider.availability_mode);
    setAllowedTiers(selectedProvider.allowed_plan_tiers || []);
    setAllowedOrgIds(selectedProvider.allowed_organization_ids || []);
    setAllowFallback(Boolean(selectedProvider.allow_platform_credentials_fallback));
    setAllowByoc(Boolean(selectedProvider.allow_tenant_custom_credentials));
    setCredValues({ ...(selectedProvider.credentials || {}) });
    setCfgValues({ ...(selectedProvider.config || {}) });
  }, [selectedProvider]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiClient.patch<PlatformIntegrationItem>(
        `/integrations/superadmin/providers/${selectedProvider.provider_key}/`,
        {
          is_enabled_globally: availabilityMode !== "DISABLED",
          availability_mode: availabilityMode,
          allowed_plan_tiers: allowedTiers,
          allowed_organization_ids: allowedOrgIds,
          allow_platform_credentials_fallback: allowFallback,
          allow_tenant_custom_credentials: allowByoc,
          credentials: credValues,
          config: cfgValues,
        }
      );
      setProviders((prev) =>
        prev.map((item) =>
          item.provider_key === selectedProvider.provider_key ? res.data : item
        )
      );
      setFeedback({
        type: "success",
        message:
          res.message || `${selectedProvider.name} platform governance and credentials saved.`,
      });
      if (onUpdated) onUpdated();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update platform integration config.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPlatformConnection = async () => {
    if (!selectedProvider) return;
    setTesting(true);
    setFeedback(null);
    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        duration_ms: number;
        provider: PlatformIntegrationItem;
      }>(`/integrations/superadmin/providers/${selectedProvider.provider_key}/test/`, {
        credentials: credValues,
        config: cfgValues,
      });
      if (res.data?.provider) {
        setProviders((prev) =>
          prev.map((item) =>
            item.provider_key === selectedProvider.provider_key
              ? res.data.provider
              : item
          )
        );
      }
      setFeedback({
        type: res.data?.success ? "success" : "error",
        message: `${res.data?.message || res.message} (${res.data?.duration_ms || 0}ms)`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Platform connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleTier = (tier: string) => {
    setAllowedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleOrg = (orgId: string) => {
    setAllowedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  const visibleProviders = providers.filter(
    (p) => categoryFilter === "all" || p.category === (categoryFilter as IntegrationCategory)
  );

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        Loading platform integration registry...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <InlineAlert tone={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </InlineAlert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Third-Party Integrations & Plugin Governance ({providers.length} Registered)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Control which services are enabled for All Tenants, Specific Tenants, or Subscription Tiers,
            and manage Platform-wide fallback credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {CATEGORY_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategoryFilter(opt.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === opt.value
                  ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Provider Catalog List */}
        <div className="space-y-2.5 lg:col-span-4">
          {visibleProviders.map((prov) => {
            const isSelected = prov.provider_key === selectedProvider?.provider_key;
            return (
              <button
                key={prov.provider_key}
                type="button"
                onClick={() => {
                  setSelectedKey(prov.provider_key);
                  setFeedback(null);
                }}
                className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                  isSelected
                    ? "border-amber-500 bg-amber-50/50 dark:border-amber-400 dark:bg-amber-950/25"
                    : "border-stone-200/80 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                    {renderProviderIcon(prov.icon_name, "h-4 w-4")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {prov.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                      {prov.availability_mode === "ALL_TENANTS"
                        ? "All Tenants"
                        : prov.availability_mode === "SPECIFIC_TENANTS"
                          ? `${prov.allowed_organization_ids.length} Specific Tenants`
                          : prov.availability_mode === "PLAN_TIERS"
                            ? `Plans: ${prov.allowed_plan_tiers.join(", ") || "None"}`
                            : "Disabled"}
                    </div>
                  </div>
                </div>

                <Badge
                  tone={
                    prov.availability_mode === "DISABLED"
                      ? "red"
                      : prov.allow_platform_credentials_fallback
                        ? "green"
                        : "amber"
                  }
                >
                  {prov.availability_mode === "DISABLED"
                    ? "Off"
                    : prov.allow_platform_credentials_fallback
                      ? "Shared + BYOC"
                      : "Strict BYOC"}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Right Column: Selected Provider Governance & Credentials Form */}
        <div className="lg:col-span-8">
          {selectedProvider ? (
            <form
              onSubmit={handleSave}
              className="space-y-5 rounded-2xl border border-stone-200/80 bg-white p-5 dark:border-stone-800 dark:bg-stone-900/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200/80 pb-4 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                    {renderProviderIcon(selectedProvider.icon_name, "h-5 w-5")}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      {selectedProvider.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {selectedProvider.description}
                    </p>
                  </div>
                </div>

                {selectedProvider.docs_url && (
                  <a
                    href={selectedProvider.docs_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                  >
                    Developer Docs
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Section 1: 3-Mode Tenant Availability Governance */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Tier 1 Governance · Tenant Availability & Credential Policy
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Tenant Availability Scope"
                    hint="Controls which client organizations can see and enable this integration."
                  >
                    <DropdownSelect
                      value={availabilityMode}
                      onChange={(val) =>
                        setAvailabilityMode(
                          val as PlatformIntegrationItem["availability_mode"]
                        )
                      }
                      ariaLabel="Tenant availability scope"
                      options={[
                        {
                          value: "ALL_TENANTS",
                          label: "Available to All Tenants (Recommended)",
                        },
                        {
                          value: "SPECIFIC_TENANTS",
                          label: "Specific Selected Tenants Only",
                        },
                        {
                          value: "PLAN_TIERS",
                          label: "Specific Subscription Plan Tiers",
                        },
                        {
                          value: "PLATFORM_ONLY",
                          label: "Platform Internal Only",
                        },
                        {
                          value: "DISABLED",
                          label: "Disabled Globally",
                        },
                      ]}
                    />
                  </Field>

                  <div className="space-y-2.5">
                    <Switch
                      label="Allow Platform Credentials Fallback"
                      description="Tenants without custom credentials inherit Platform credentials below."
                      checked={allowFallback}
                      onChange={setAllowFallback}
                    />
                    <Switch
                      label="Allow Tenant Custom Credentials (BYOC)"
                      description="Tenants can connect their own API keys / merchant accounts."
                      checked={allowByoc}
                      onChange={setAllowByoc}
                    />
                  </div>
                </div>

                {availabilityMode === "PLAN_TIERS" && (
                  <div className="mt-4 border-t border-stone-200/70 pt-3 dark:border-stone-800">
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Entitled Subscription Plan Tiers:
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PLAN_TIERS.map((tier) => {
                        const active = allowedTiers.includes(tier);
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => toggleTier(tier)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                : "border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
                            }`}
                          >
                            {active ? "✓ " : ""}
                            {tier} Plan
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availabilityMode === "SPECIFIC_TENANTS" && (
                  <div className="mt-4 border-t border-stone-200/70 pt-3 dark:border-stone-800">
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Entitled Client Organizations ({allowedOrgIds.length} selected):
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {organizations.map((org) => {
                        const active = allowedOrgIds.includes(org.id);
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => toggleOrg(org.id)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                : "border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
                            }`}
                          >
                            {active ? "✓ " : ""}
                            {org.name} ({org.slug})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Platform Default Credentials Vault */}
              <div className="rounded-2xl border border-stone-200/80 p-4 dark:border-stone-800">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Platform Default / Fallback Credentials Vault
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <Lock className="h-3 w-3" />
                    Encrypted at rest
                  </span>
                </div>
                <SchemaFormRenderer
                  fields={selectedProvider.credential_schema}
                  values={credValues}
                  hasSecrets={selectedProvider.has_secrets}
                  onChange={(key, val) =>
                    setCredValues((prev) => ({ ...prev, [key]: val }))
                  }
                />
              </div>

              {/* Section 3: Platform Default Config */}
              {selectedProvider.config_schema.length > 0 && (
                <div className="rounded-2xl border border-stone-200/80 p-4 dark:border-stone-800">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Platform Default Configuration
                  </h4>
                  <SchemaFormRenderer
                    fields={selectedProvider.config_schema}
                    values={cfgValues}
                    onChange={(key, val) =>
                      setCfgValues((prev) => ({ ...prev, [key]: val }))
                    }
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 pt-4 dark:border-stone-800">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  {selectedProvider.last_test_status === "HEALTHY" && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Last check healthy
                    </span>
                  )}
                  <span>
                    · {selectedProvider.connected_tenants_count} tenant(s) using custom
                    BYOC
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={testing || saving}
                    onClick={handleTestPlatformConnection}
                    className="btn-secondary"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {testing ? "Testing..." : "Test Platform Connection"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || testing}
                    className="btn-primary"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save Governance & Credentials"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-stone-300 text-sm text-stone-500">
              <Blocks className="mr-2 h-4 w-4" />
              Select a provider plugin on the left to configure governance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

