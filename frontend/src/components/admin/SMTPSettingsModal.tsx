"use client";

import React, { useEffect, useState } from "react";
import { Clock, Loader2, Mail, Save, Send } from "lucide-react";
import { Badge, Field } from "@/components/ui/primitives";
import {
  IconTile,
  InlineAlert,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/overlay";
import { apiClient } from "@/lib/api-client";
import { formatDateTimeWithSeconds } from "@/lib/format";
import type { SMTPSettings } from "@/lib/types";

interface SMTPSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export function SMTPSettingsModal({
  isOpen,
  onClose,
  onSuccessToast,
}: SMTPSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form State
  const [host, setHost] = useState("");
  const [port, setPort] = useState(465);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [useSsl, setUseSsl] = useState(true);
  const [useTls, setUseTls] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [kevinEmail, setKevinEmail] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test Connection State
  const [testRecipient, setTestRecipient] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
    timestamp?: string;
  } | null>(null);

  // Fetch settings on open
  useEffect(() => {
    if (!isOpen) return;
    setTestResult(null);
    setLoadError(null);
    setSaveError(null);
    setLoading(true);
    apiClient
      .get<SMTPSettings>("/settings/smtp/")
      .then((d) => {
        if (d) {
          setHost(d.host || "smtp.gmail.com");
          setPort(d.port || 465);
          setUsername(d.username || "");
          setPassword(""); // Clear password from state; never render actual secret
          setHasPassword(Boolean(d.has_password));
          setUseSsl(d.use_ssl ?? true);
          setUseTls(d.use_tls ?? false);
          setFromEmail(d.default_from_email || "");
          setKevinEmail(d.kevin_email || "");
          if (d.kevin_email || d.username) {
            setTestRecipient(d.kevin_email || d.username || "");
          }
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Could not load the current SMTP settings.");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {
        host: host.trim(),
        port: Number(port),
        username: username.trim(),
        use_ssl: useSsl,
        use_tls: useTls,
        default_from_email: fromEmail.trim(),
        kevin_email: kevinEmail.trim(),
      };
      if (password.trim()) {
        payload.password = password.replace(/\s+/g, "");
      }
      await apiClient.post("/settings/smtp/", payload);
      setHasPassword(true);
      setPassword("");
      if (onSuccessToast) {
        onSuccessToast("SMTP settings saved successfully! Future email triggers will use these credentials.");
      }
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save SMTP configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testRecipient) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.post<{
        recipient: string;
        status: string;
        smtp_host: string;
        created_at: string;
      }>("/settings/smtp/test/", {
        recipient: testRecipient.trim(),
        subject: "Kevin Construction OS — Live SMTP Verification",
        body: `Live SMTP verification dispatched from Kevin's Construction OS at ${new Date().toISOString()}. All Part 3 email automations are fully active.`,
      });
      setTestResult({
        success: true,
        message: res.message || `Test email dispatched to ${testRecipient}.`,
        status: res.data?.status || "Sent via SMTP",
        timestamp: res.data?.created_at || new Date().toISOString(),
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to transmit test email via SMTP.",
      });
    } finally {
      setTesting(false);
    }
  };

  const securityOptions = [
    { id: "ssl", label: "SSL", detail: "Port 465 · recommended for Gmail", active: useSsl && !useTls, ssl: true, port: 465 },
    { id: "tls", label: "STARTTLS", detail: "Port 587", active: useTls && !useSsl, ssl: false, port: 587 },
  ];

  const quickTargets = [
    kevinEmail ? { email: kevinEmail, label: "Founder" } : null,
    username && username !== kevinEmail ? { email: username, label: "SMTP user" } : null,
  ].filter((t): t is { email: string; label: string } => t !== null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title="Email delivery (SMTP)"
        subtitle="Credentials used for client notifications and founder review alerts."
        icon={<IconTile icon={Mail} />}
        onClose={onClose}
      />

      <ModalBody className="space-y-6">
        {loadError && <InlineAlert tone="error">{loadError}</InlineAlert>}
        {saveError && (
          <InlineAlert tone="error" onDismiss={() => setSaveError(null)}>
            {saveError}
          </InlineAlert>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            Loading current SMTP settings...
          </div>
        ) : (
          <form id="smtp-form" onSubmit={handleSave} className="space-y-4">
            <InlineAlert tone="info" title="Passwords are write-only">
              Defaults load from server environment variables
              {username ? (
                <>
                  {" "}
                  (<span className="font-mono">{username}</span>)
                </>
              ) : null}
              . Stored app passwords are never shown.
            </InlineAlert>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="SMTP host" required className="sm:col-span-2">
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                  placeholder="smtp.gmail.com"
                  className="input font-mono"
                />
              </Field>
              <Field label="Port" required>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  required
                  placeholder="465"
                  className="input font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Username / email">
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@gmail.com"
                  className="input font-mono"
                />
              </Field>
              <Field
                label="App password"
                hint={hasPassword ? "A password is stored. Leave blank to keep it." : "16-character Google app password."}
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasPassword ? "••••••••••••••••" : "Enter app password"}
                  className="input font-mono"
                />
              </Field>
            </div>

            <fieldset>
              <legend className="mb-1.5 flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                Connection security
                <Badge tone={hasPassword ? "green" : "amber"}>{hasPassword ? "Password set" : "No password"}</Badge>
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {securityOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                      opt.active
                        ? "border-amber-400 bg-amber-50/60 dark:border-amber-500 dark:bg-amber-950/30"
                        : "border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="security"
                      checked={opt.active}
                      onChange={() => {
                        setUseSsl(opt.ssl);
                        setUseTls(!opt.ssl);
                        setPort(opt.port);
                      }}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-stone-800 dark:text-stone-100">{opt.label}</span>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">{opt.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Default “From” sender">
                <input
                  type="text"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="BeamLine Ops <ops@example.com>"
                  className="input"
                />
              </Field>
              <Field label="Founder alert recipient">
                <input
                  type="email"
                  value={kevinEmail}
                  onChange={(e) => setKevinEmail(e.target.value)}
                  placeholder="founder@example.com"
                  className="input font-mono"
                />
              </Field>
            </div>
          </form>
        )}

        <section className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Send a test email</h3>
            <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
              via {host || "—"}:{port}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Uses the saved credentials. Save changes first if you edited them above.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="recipient@example.com"
              aria-label="Test recipient email"
              className="input flex-1 py-2 font-mono"
            />
            <button
              type="button"
              disabled={testing || !testRecipient}
              onClick={handleTestConnection}
              className="btn-secondary btn-sm"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {testing ? "Sending..." : "Send test"}
            </button>
          </div>

          {quickTargets.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-500 dark:text-stone-400">Quick fill:</span>
              {quickTargets.map((t) => (
                <button
                  key={t.email}
                  type="button"
                  onClick={() => setTestRecipient(t.email)}
                  className="btn-ghost btn-xs font-mono"
                >
                  {t.email} <span className="font-sans text-stone-400">({t.label})</span>
                </button>
              ))}
            </div>
          )}

          {testResult && (
            <InlineAlert tone={testResult.success ? "success" : "error"} title={testResult.message} className="mt-3">
              {testResult.timestamp && (
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDateTimeWithSeconds(testResult.timestamp)}
                  {testResult.status ? ` · ${testResult.status}` : ""}
                </span>
              )}
            </InlineAlert>
          )}
        </section>
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" form="smtp-form" disabled={saving || loading} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
