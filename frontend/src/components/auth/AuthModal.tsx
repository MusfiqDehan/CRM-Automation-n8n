"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { BeamLineMark } from "@/components/brand/BeamLineLogo";
import { apiClient } from "@/lib/api-client";
import type { AuthTokens, AuthUser, OAuthPublicConfig } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  currentRole: string;
  onAuthSuccess: (user: AuthUser, role: string, tokens: AuthTokens, orgSlug?: string) => void;
  onLogout: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  onAuthSuccess,
  onLogout,
}: AuthModalProps) {
  const [oauthConfig, setOauthConfig] = useState<OAuthPublicConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingConfig(true);
    apiClient
      .get<OAuthPublicConfig>("/auth/oauth-config/")
      .then((res) => {
        setOauthConfig(res);
      })
      .catch((err) => {
        console.warn("Could not load OAuth config", err);
      })
      .finally(() => setLoadingConfig(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setErrorMsg("Please enter email/username and password.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{
        tokens: AuthTokens;
        user: AuthUser;
        role: string;
        organization?: { slug: string; name: string };
      }>("/auth/login/", {
        username_or_email: loginId.trim(),
        password,
      });

      apiClient.setAuthToken(res.data.tokens.access_token);
      if (res.data.organization?.slug) {
        apiClient.setTenantSlug(res.data.organization.slug);
      }
      setSuccessMsg(`Welcome back, ${res.data.user.username}!`);
      setTimeout(() => {
        onAuthSuccess(
          res.data.user,
          res.data.role,
          res.data.tokens,
          res.data.organization?.slug
        );
        onClose();
      }, 500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockGoogleLogin = async (email: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{
        tokens: AuthTokens;
        user: AuthUser;
        role: string;
        organization?: { slug: string; name: string };
      }>("/auth/google/", {
        id_token: `test_google_token_${email}`,
      });

      apiClient.setAuthToken(res.data.tokens.access_token);
      if (res.data.organization?.slug) {
        apiClient.setTenantSlug(res.data.organization.slug);
      }
      setSuccessMsg(`Google login verified as ${email}`);
      setTimeout(() => {
        onAuthSuccess(
          res.data.user,
          res.data.role,
          res.data.tokens,
          res.data.organization?.slug
        );
        onClose();
      }, 500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeTenant = oauthConfig?.tenant;
  const googleConfig = oauthConfig?.google_oauth;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex items-center gap-3">
          <BeamLineMark className="size-11" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentUser ? "Authentication & Profile" : "Sign In to BeamLine"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTenant?.name
                ? `${activeTenant.name} (${activeTenant.subdomain_host})`
                : "Multi-Tenant Construction CRM Platform"}
            </p>
          </div>
        </div>

        {/* Dynamic Tenant & OAuth Banner */}
        {activeTenant && (
          <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                Workspace: {activeTenant.slug}
              </span>
              {googleConfig?.source === "client" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> Client Custom OAuth
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300">
                  Platform OAuth
                </span>
              )}
            </div>
            {activeTenant.custom_domain && (
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                Custom Domain:{" "}
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {activeTenant.custom_domain}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Logged in state */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-600 font-bold dark:bg-indigo-400/20 dark:text-indigo-400">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentUser.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {currentRole}
                    </span>
                    {currentUser.is_superuser && (
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        Platform Superadmin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          /* Sign In Form */
          <div>
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="mb-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleMockGoogleLogin("kevin@kevinbuild.com")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">
                  Or password login
                </span>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="kevin or kevin@kevinbuild.com"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {submitting ? "Authenticating..." : "Sign In with Password"}
              </button>
            </form>

            {/* Quick Login Presets for Pair Programming / Demonstration */}
            <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Dev Presets:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginId("kevin");
                    setPassword("kevinpass2026");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Kevin (Client Owner)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId("admin");
                    setPassword("adminpass2026");
                  }}
                  className="flex-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  Platform Superadmin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
