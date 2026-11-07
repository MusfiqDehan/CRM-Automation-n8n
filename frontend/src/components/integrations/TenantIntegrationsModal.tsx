"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Blocks,
  Bot,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { Badge } from "@/components/ui/primitives";
import {
  InlineAlert,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTabs,
  Switch,
} from "@/components/ui/overlay";
import { SchemaFormRenderer } from "@/components/integrations/SchemaFormRenderer";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type {
  IntegrationCategory,
  IntegrationExecutionLog,
  PaymentTransaction,
  TenantIntegrationItem,
} from "@/lib/types";

type HubTab =
  | "all"
  | "identity"
  | "workspace"
  | "payments"
  | "communication"
  | "ai_automation"
  | "logs";

interface TenantIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProviderKey?: string | null;
  onIntegrationsUpdated?: () => void;
}

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  identity: "Identity & SSO",
  workspace: "Workspace OS",
  payments: "Payment Gateway",
  communication: "Communication",
  ai_automation: "AI & Automation",
};

export function renderProviderIcon(iconName: string, className = "h-5 w-5") {
  switch (iconName) {
    case "KeyRound":
      return <KeyRound className={className} />;
    case "Database":
      return <Database className={className} />;
    case "Mail":
      return <Mail className={className} />;
    case "CreditCard":
      return <CreditCard className={className} />;
    case "Wallet":
      return <Wallet className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Bot":
      return <Bot className={className} />;
    case "Cpu":
      return <Cpu className={className} />;
    case "Workflow":
      return <Workflow className={className} />;
    default:
      return <Blocks className={className} />;
  }
}

export function TenantIntegrationsModal({
  isOpen,
  onClose,
  initialProviderKey = null,
  onIntegrationsUpdated,
}: TenantIntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("all");
  const [providers, setProviders] = useState<TenantIntegrationItem[]>([]);
  const [logs, setLogs] = useState<IntegrationExecutionLog[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [orgName, setOrgName] = useState<string>("");
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Selected provider for detailed configuration
  const [selectedKey, setSelectedKey] = useState<string | null>(initialProviderKey);
  const [isEnabled, setIsEnabled] = useState(true);
  const [useCustomCreds, setUseCustomCreds] = useState(true);
  const [credValues, setCredValues] = useState<Record<string, unknown>>({});
  const [cfgValues, setCfgValues] = useState<Record<string, unknown>>({});

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, logsRes] = await Promise.all([
        apiClient.get<{
          organization_name: string;
          organization_slug: string;
          results: TenantIntegrationItem[];
        }>("/integrations/tenant/providers/"),
        apiClient.get<{
          logs: IntegrationExecutionLog[];
          transactions: PaymentTransaction[];
        }>("/integrations/logs/"),
      ]);
      const items = provRes.results || [];
      setProviders(items);
      setOrgName(provRes.organization_name || "Organization");
      setOrgSlug(provRes.organization_slug || "");
      setLogs(logsRes.logs || []);
      setTransactions(logsRes.transactions || []);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to load tenant integrations.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setSelectedKey(initialProviderKey);
    loadData();
  }, [isOpen, initialProviderKey, loadData]);

  const selectedProvider = providers.find((p) => p.provider_key === selectedKey) || null;

  useEffect(() => {
    if (!selectedProvider) return;
    setIsEnabled(Boolean(selectedProvider.is_enabled));
    setUseCustomCreds(Boolean(selectedProvider.use_custom_credentials));
    setCredValues({ ...(selectedProvider.credentials || {}) });
    setCfgValues({ ...(selectedProvider.config || {}) });
  }, [selectedProvider]);

  if (!isOpen) return null;

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiClient.patch<TenantIntegrationItem>(
        `/integrations/tenant/providers/${selectedProvider.provider_key}/`,
        {
          is_enabled: isEnabled,
          use_custom_credentials: useCustomCreds,
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
        message: res.message || `${selectedProvider.name} settings saved!`,
      });
      if (onIntegrationsUpdated) onIntegrationsUpdated();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to save integration configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setTesting(true);
    setFeedback(null);
    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        duration_ms: number;
        provider: TenantIntegrationItem;
      }>(`/integrations/tenant/providers/${selectedProvider.provider_key}/test/`, {
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
      loadData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExecuteAction = async (actionKey: string) => {
    if (!selectedProvider) return;
    setRunningAction(actionKey);
    setFeedback(null);
    try {
      const res = await apiClient.post<{
        success: boolean;
        action: string;
        duration_ms: number;
        provider?: TenantIntegrationItem;
      }>(`/integrations/tenant/providers/${selectedProvider.provider_key}/action/`, {
        action: actionKey,
      });
      if (res.data?.provider) {
        setProviders((prev) =>
          prev.map((item) =>
            item.provider_key === selectedProvider.provider_key
              ? res.data.provider!
              : item
          )
        );
      }
      setFeedback({
        type: "success",
        message: res.message || `Action '${actionKey}' completed!`,
      });
      if (onIntegrationsUpdated) onIntegrationsUpdated();
      loadData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : `Failed to run ${actionKey}.`,
      });
    } finally {
      setRunningAction(null);
    }
  };

  const handleSimulatePaymentCheckout = async () => {
    if (!selectedProvider) return;
    setRunningAction("payment_checkout");
    setFeedback(null);
    try {
      const res = await apiClient.post<PaymentTransaction>(
        "/integrations/payments/checkout/",
        {
          provider_key: selectedProvider.provider_key,
          scope: "TENANT_INVOICE",
          amount: "1250.00",
          currency: String(cfgValues.default_currency || "USD"),
          description: `${selectedProvider.name} Verification Checkout (${orgName})`,
        }
      );
      setFeedback({
        type: "success",
        message: `${selectedProvider.name} checkout succeeded! Transaction ID: ${res.data.external_transaction_id} (${res.data.amount} ${res.data.currency})`,
      });
      loadData();
      if (onIntegrationsUpdated) onIntegrationsUpdated();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to initiate payment checkout.",
      });
    } finally {
      setRunningAction(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (activeTab === "all" || activeTab === "logs") return true;
    return p.category === activeTab;
  });

  const tabs: Array<{ id: HubTab; label: string; icon: React.ElementType; count?: number }> = [
    { id: "all", label: "All plugins", icon: Blocks, count: providers.length },
    { id: "identity", label: "Identity & SSO", icon: KeyRound },
    { id: "workspace", label: "Workspace", icon: Database },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "communication", label: "Email & Comms", icon: Mail },
    { id: "ai_automation", label: "AI & Automation", icon: Sparkles },
    { id: "logs", label: "Logs & Ledger", icon: Activity, count: logs.length },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title={
          selectedProvider
            ? `Configure ${selectedProvider.name}`
            : "Integrations & Plugins Marketplace"
        }
        icon={<BeamLineMark className="size-10" title="BeamLine Integrations" />}
        onClose={onClose}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-1.5">
            <span>{orgName || "Tenant Workspace"}</span>
            {orgSlug && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-xs">{orgSlug}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>Two-Tier Encrypted Plugin Engine</span>
          </span>
        }
      />

      {!selectedProvider && (
        <ModalTabs<HubTab>
          ariaLabel="Integration categories"
          value={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setFeedback(null);
          }}
          tabs={tabs}
        />
      )}

      <ModalBody className="space-y-5">
        {feedback && (
          <InlineAlert tone={feedback.type} onDismiss={() => setFeedback(null)}>
            {feedback.message}
          </InlineAlert>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            Loading third-party integrations catalog...
          </div>
        ) : selectedProvider ? (
          <form id="tenant-integration-form" onSubmit={handleSaveProvider} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedKey(null);
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to all integrations
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gray">{CATEGORY_LABELS[selectedProvider.category]}</Badge>
                {selectedProvider.active_source === "tenant" ? (
                  <Badge tone="green">Active · Custom Tenant Credentials</Badge>
                ) : selectedProvider.active_source === "platform" ? (
                  <Badge tone="blue">Active · Platform Shared Fallback</Badge>
                ) : (
                  <Badge tone="amber">Pending Credentials</Badge>
                )}
                {selectedProvider.docs_url && (
                  <a
                    href={selectedProvider.docs_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                  >
                    Provider docs
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-300">
              {selectedProvider.description}
            </p>

            {!selectedProvider.is_entitled ? (
              <InlineAlert tone="warning" title="Restricted by Platform Admin">
                This integration is currently not enabled for your organization&apos;s subscription tier.
                Contact your Platform Administrator to request access.
              </InlineAlert>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                    <Switch
                      label="Enable integration for workspace"
                      description="Activate this service for your organization's users and workflows."
                      checked={isEnabled}
                      onChange={setIsEnabled}
                    />
                  </div>

                  {selectedProvider.allow_platform_credentials_fallback &&
                    selectedProvider.allow_tenant_custom_credentials && (
                      <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                        <Switch
                          label="Bring Your Own Credentials (BYOC)"
                          description="Override Platform shared credentials with your own dedicated API keys."
                          checked={useCustomCreds}
                          onChange={setUseCustomCreds}
                        />
                      </div>
                    )}
                </div>

                {useCustomCreds || !selectedProvider.allow_platform_credentials_fallback ? (
                  <div className="rounded-2xl border border-stone-200/80 p-4 dark:border-stone-800">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Encrypted Credentials Vault (AES/HMAC-SHA256)
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
                ) : (
                  <InlineAlert tone="info" title="Using Platform Shared Credentials">
                    Your workspace is currently inheriting verified credentials managed by the
                    BeamLine Platform Superadmin. Toggle <strong>Bring Your Own Credentials (BYOC)</strong> above
                    if you want to connect your own merchant or developer account.
                  </InlineAlert>
                )}

                {selectedProvider.config_schema.length > 0 && (
                  <div className="rounded-2xl border border-stone-200/80 p-4 dark:border-stone-800">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Provider Configuration & Parameters
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

                {/* Provider Actions & Payment Checkout Simulator */}
                {(selectedProvider.supported_actions.length > 0 ||
                  selectedProvider.category === "payments") && (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Live Actions & Verification
                    </h4>
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      {selectedProvider.supported_actions.map((act) => (
                        <button
                          key={act.action}
                          type="button"
                          disabled={runningAction !== null}
                          onClick={() => handleExecuteAction(act.action)}
                          className="btn-secondary text-xs"
                        >
                          {runningAction === act.action ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 text-amber-600" />
                          )}
                          {act.label}
                        </button>
                      ))}

                      {selectedProvider.category === "payments" && (
                        <button
                          type="button"
                          disabled={runningAction !== null}
                          onClick={handleSimulatePaymentCheckout}
                          className="btn-secondary text-xs"
                        >
                          {runningAction === "payment_checkout" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          Run Test Checkout Session
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </form>
        ) : activeTab === "logs" ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Recent Payment Gateway Transactions ({transactions.length})
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Checkout sessions and webhook settlements across Stripe, bKash, and SSLCommerz.
              </p>
              <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-stone-200/80 dark:border-stone-800">
                {transactions.length === 0 ? (
                  <p className="p-4 text-center text-xs text-stone-500">
                    No payment transactions recorded yet.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase text-stone-500 dark:border-stone-800 dark:bg-stone-900">
                      <tr>
                        <th className="px-3 py-2">Gateway</th>
                        <th className="px-3 py-2">Scope</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 font-semibold uppercase">
                            {tx.provider_key}
                          </td>
                          <td className="px-3 py-2">{tx.scope}</td>
                          <td className="px-3 py-2 font-mono font-semibold">
                            {tx.amount} {tx.currency}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px]">
                            {tx.external_transaction_id}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              tone={
                                tx.status === "SUCCEEDED"
                                  ? "green"
                                  : tx.status === "PENDING"
                                    ? "amber"
                                    : "red"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-stone-500">
                            {formatDateTimeWithSeconds(tx.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Integration Execution & Sync Audit Logs ({logs.length})
              </h3>
              <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-stone-200/80 dark:border-stone-800">
                {logs.length === 0 ? (
                  <p className="p-4 text-center text-xs text-stone-500">
                    No integration logs recorded yet.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase text-stone-500 dark:border-stone-800 dark:bg-stone-900">
                      <tr>
                        <th className="px-3 py-2">Plugin</th>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Summary</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800">
                      {logs.map((l) => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 font-mono font-medium">
                            {l.provider_key}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px]">{l.action}</td>
                          <td className="px-3 py-2">{l.credential_source}</td>
                          <td className="max-w-xs truncate px-3 py-2 text-stone-600 dark:text-stone-300">
                            {l.summary}
                          </td>
                          <td className="px-3 py-2">
                            <Badge tone={l.status === "SUCCESS" ? "green" : "red"}>
                              {l.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filteredProviders.map((prov) => {
              const isConnected =
                prov.active_source === "tenant" || prov.active_source === "platform";
              return (
                <div
                  key={prov.provider_key}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4 transition hover:border-amber-400/70 dark:border-stone-800 dark:bg-stone-900/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                          {renderProviderIcon(prov.icon_name)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {prov.name}
                          </h3>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            {CATEGORY_LABELS[prov.category]}
                          </span>
                        </div>
                      </div>

                      {!prov.is_entitled ? (
                        <Badge tone="red">Restricted</Badge>
                      ) : prov.active_source === "tenant" ? (
                        <Badge tone="green">Custom BYOC</Badge>
                      ) : prov.active_source === "platform" ? (
                        <Badge tone="blue">Platform Shared</Badge>
                      ) : (
                        <Badge tone="gray">Not Connected</Badge>
                      )}
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs text-stone-600 dark:text-stone-400">
                      {prov.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800/80">
                    <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Ready
                        </>
                      ) : (
                        "Setup available"
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(prov.provider_key);
                        setFeedback(null);
                      }}
                      className="btn-secondary py-1.5 text-xs"
                    >
                      Configure & Test
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>

      <ModalFooter
        hint={
          selectedProvider
            ? "Credentials are encrypted at rest before saving to PostgreSQL."
            : "Platform Superadmin controls plugin entitlements; Tenant Admins manage workspace credentials."
        }
      >
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>

        {selectedProvider && selectedProvider.is_entitled && (
          <>
            <button
              type="button"
              disabled={testing || saving}
              onClick={handleTestConnection}
              className="btn-secondary"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button
              type="submit"
              form="tenant-integration-form"
              disabled={saving || testing}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Integration"}
            </button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
