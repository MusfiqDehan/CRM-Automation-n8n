"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  RefreshCw,
  Send,
  Server,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(465);
  const [username, setUsername] = useState("musfiq.works@gmail.com");
  const [password, setPassword] = useState("***REMOVED***");
  const [useSsl, setUseSsl] = useState(true);
  const [useTls, setUseTls] = useState(false);
  const [fromEmail, setFromEmail] = useState("Kevin's Construction OS <musfiq.works@gmail.com>");
  const [kevinEmail, setKevinEmail] = useState("musfiq.works@gmail.com");

  // Test Connection State
  const [testRecipient, setTestRecipient] = useState("musfiq.works@gmail.com");
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
    setLoading(true);
    apiClient
      .get<SMTPSettings>("/settings/smtp/")
      .then((d) => {
        if (d) {
          setHost(d.host || "smtp.gmail.com");
          setPort(d.port || 465);
          setUsername(d.username || "musfiq.works@gmail.com");
          setPassword(d.password || "***REMOVED***");
          setUseSsl(d.use_ssl ?? true);
          setUseTls(d.use_tls ?? false);
          setFromEmail(d.default_from_email || "Kevin's Construction OS <musfiq.works@gmail.com>");
          setKevinEmail(d.kevin_email || "musfiq.works@gmail.com");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch SMTP settings:", err);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/settings/smtp/", {
        host: host.trim(),
        port: Number(port),
        username: username.trim(),
        password: password.replace(/\s+/g, ""),
        use_ssl: useSsl,
        use_tls: useTls,
        default_from_email: fromEmail.trim(),
        kevin_email: kevinEmail.trim(),
      });
      if (onSuccessToast) {
        onSuccessToast("SMTP settings saved successfully! Future email triggers will use these credentials.");
      }
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save SMTP configuration.");
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SMTP Email &amp; Automation Credentials
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure live Gmail SMTP for Part 3 notifications and client triggers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
              <span>Loading current SMTP credentials...</span>
            </div>
          ) : (
            <form id="smtp-form" onSubmit={handleSave} className="space-y-4">
              {/* Active Credentials Callout */}
              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Google Gmail SMTP Integration Active</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Default credentials are set to <span className="font-mono font-semibold">musfiq.works@gmail.com</span> using an app password. You can edit any parameter below or test live sending with real client emails.
                </p>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-slate-400" />
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    required
                    placeholder="smtp.gmail.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    required
                    placeholder="465"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Username & App Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Username / Email
                  </label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="musfiq.works@gmail.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      App Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="16-character Google App Password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Security Protocol Selection */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-indigo-500" />
                  Connection Security Protocol
                </span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="security"
                      checked={useSsl && !useTls}
                      onChange={() => {
                        setUseSsl(true);
                        setUseTls(false);
                        setPort(465);
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      SSL (Port 465) — <span className="text-slate-400">Recommended for Gmail</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="security"
                      checked={useTls && !useSsl}
                      onChange={() => {
                        setUseTls(true);
                        setUseSsl(false);
                        setPort(587);
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      STARTTLS (Port 587)
                    </span>
                  </label>
                </div>
              </div>

              {/* Sender & Founder Alert Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Default &quot;From&quot; Sender
                  </label>
                  <input
                    type="text"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    required
                    placeholder="Kevin's Construction OS <musfiq.works@gmail.com>"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Kevin / Founder Alert Recipient
                  </label>
                  <input
                    type="email"
                    value={kevinEmail}
                    onChange={(e) => setKevinEmail(e.target.value)}
                    required
                    placeholder="musfiq.works@gmail.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </form>
          )}

          {/* Test Connection Live Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-indigo-500" />
                Live SMTP Dispatch Test Bench
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Transmits real email over {host}:{port}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="musfiq.works@gmail.com"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                disabled={testing || !testRecipient}
                onClick={handleTestConnection}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{testing ? "Dispatching..." : "Send Verification Email"}</span>
              </button>
            </div>

            {/* Quick Test Recipient Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Quick Test Targets:</span>
              <button
                type="button"
                onClick={() => setTestRecipient("musfiq.works@gmail.com")}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
              >
                musfiq.works@gmail.com (Founder)
              </button>
              <button
                type="button"
                onClick={() => setTestRecipient("musfiq.works+client1@gmail.com")}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
              >
                +client1 (Arthur Henderson PRJ-101)
              </button>
              <button
                type="button"
                onClick={() => setTestRecipient("musfiq.works+client2@gmail.com")}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
              >
                +client2 (Elena Rostova PRJ-102)
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`rounded-xl p-3 border text-xs space-y-1 ${
                  testResult.success
                    ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{testResult.message}</span>
                </div>
                {testResult.timestamp && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                    <Clock className="h-3 w-3" />
                    <span>Exact Delivery Timestamp: {formatDateTimeWithSeconds(testResult.timestamp)}</span>
                    <span className="font-semibold">({testResult.status})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="smtp-form"
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>{saving ? "Saving Changes..." : "Save SMTP Credentials"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
