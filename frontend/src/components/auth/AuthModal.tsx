"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { AuthTokens, AuthUser, OAuthPublicConfig, Organization } from "@/lib/types";

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
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [oauthConfig, setOauthConfig] = useState<OAuthPublicConfig | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration form state
  const [regOrgName, setRegOrgName] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    apiClient
      .get<OAuthPublicConfig>("/auth/oauth-config/")
      .then((res) => {
        setOauthConfig(res);
      })
      .catch((err) => {
        console.warn("Could not load OAuth config", err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickLogin = async (username: string, pass: string) => {
    setLoginId(username);
    setPassword(pass);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{
        tokens: AuthTokens;
        user: AuthUser;
        role: string;
        organization?: { slug: string; name: string };
      }>("/auth/login/", {
        username_or_email: username,
        password: pass,
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
      }, 300);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      setErrorMsg("Please enter an email and password.");
      return;
    }
    if (regPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
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
      }>("/auth/register/", {
        email: regEmail.trim(),
        password: regPassword,
        full_name: regFullName.trim(),
        organization_name: regOrgName.trim(),
      });

      apiClient.setAuthToken(res.data.tokens.access_token);
      if (res.data.organization?.slug) {
        apiClient.setTenantSlug(res.data.organization.slug);
      }
      setSuccessMsg(`Workspace created! Welcome, ${res.data.user.username}!`);
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
      setErrorMsg(err instanceof Error ? err.message : "Registration failed.");
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentUser ? "Authentication & Profile" : "Sign In to Beamline"}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          /* Unauthenticated Modal Content */
          <div>
            {/* Tab switch between Sign In and Register */}
            <div className="mb-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "register"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Register Workspace
              </button>
            </div>

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

            {activeTab === "login" ? (
              <div>
                {/* Google Sign In Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleMockGoogleLogin("kevin@kevinbuild.com")}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer"
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
                    className="btn-primary w-full justify-center py-2.5 mt-2 cursor-pointer"
                  >
                    {submitting ? "Authenticating..." : "Sign In with Password"}
                  </button>
                </form>

                {/* Quick Dev Presets */}
                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Dev Presets:
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("kevin", "kevinpass2026")}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                    >
                      Kevin (Client Owner)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin", "adminpass2026")}
                      className="flex-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 cursor-pointer"
                    >
                      Platform Superadmin
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Workspace / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Custom Homes"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Builder"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="jane@apexhomes.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center py-2.5 mt-3 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{submitting ? "Provisioning Workspace..." : "Create Workspace & Enter"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * AuthGate: Full-Screen Barrier rendered at `/admin` when no user is authenticated.
 * Blocks superadmin or client from viewing the admin dashboard without registration or login.
 */
interface AuthGateProps {
  oauthConfig: OAuthPublicConfig | null;
  onAuthSuccess: (user: AuthUser, role: string, tokens: AuthTokens, orgSlug?: string) => void;
}

export function AuthGate({ oauthConfig, onAuthSuccess }: AuthGateProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // Registration state
  const [regOrgName, setRegOrgName] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeTenant = oauthConfig?.tenant;
  const googleConfig = oauthConfig?.google_oauth;

  const handleQuickLogin = async (username: string, pass: string) => {
    setLoginId(username);
    setPassword(pass);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{
        tokens: AuthTokens;
        user: AuthUser;
        role: string;
        organization?: { slug: string; name: string };
      }>("/auth/login/", {
        username_or_email: username,
        password: pass,
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
      }, 300);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

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
      }, 400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      setErrorMsg("Please enter an email and password.");
      return;
    }
    if (regPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
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
      }>("/auth/register/", {
        email: regEmail.trim(),
        password: regPassword,
        full_name: regFullName.trim(),
        organization_name: regOrgName.trim(),
      });

      apiClient.setAuthToken(res.data.tokens.access_token);
      if (res.data.organization?.slug) {
        apiClient.setTenantSlug(res.data.organization.slug);
      }
      setSuccessMsg(`Workspace created! Welcome, ${res.data.user.username}!`);
      setTimeout(() => {
        onAuthSuccess(
          res.data.user,
          res.data.role,
          res.data.tokens,
          res.data.organization?.slug
        );
      }, 400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Registration failed.");
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
      }, 400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900 transition-colors duration-200 dark:bg-[#0b0f19] dark:text-slate-100 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0f1523]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Beamline
              </span>
              <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                Operations Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication & Registration Barrier */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 mb-4">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Beamline Operations Console
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Authentication required. Sign in or register to access workspace.
            </p>
          </div>

          {/* Active Tenant / Domain Badge */}
          {activeTenant && (
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                  {activeTenant.name}
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[11px] text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {activeTenant.subdomain_host}
                </span>
              </div>
              {activeTenant.custom_domain && (
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-indigo-500" />
                  <span>Custom Domain: <strong className="font-mono text-slate-700 dark:text-slate-300">{activeTenant.custom_domain}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Authentication Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Tab switch between Sign In and Register */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  activeTab === "register"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Register Workspace
              </button>
            </div>

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

            {activeTab === "login" ? (
              <div>
                {/* Google Sign In Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleMockGoogleLogin("kevin@kevinbuild.com")}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer"
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
                    <span>Sign in with Google</span>
                  </button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">
                      Or credentials login
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    className="btn-primary w-full justify-center py-2.5 mt-2 cursor-pointer"
                  >
                    {submitting ? "Authenticating..." : "Sign In to Operations Console"}
                  </button>
                </form>

                {/* Quick Presets */}
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Dev Presets:
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("kevin", "kevinpass2026")}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer text-center"
                    >
                      Kevin (Client Owner)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin", "adminpass2026")}
                      className="flex-1 rounded-lg border border-purple-200 bg-purple-50 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 cursor-pointer text-center"
                    >
                      Platform Superadmin
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Workspace / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Custom Homes"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Builder"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="jane@apexhomes.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center py-2.5 mt-4 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{submitting ? "Provisioning Workspace..." : "Create Workspace & Enter Admin Panel"}</span>
                </button>

                {/* Quick Register Demo Preset */}
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setRegOrgName("Apex Custom Builds");
                      setRegFullName("Alex Rivera");
                      setRegEmail("alex@apexbuilds.com");
                      setRegPassword("alexpass2026");
                    }}
                    className="w-full rounded-lg border border-indigo-200 bg-indigo-50/70 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 cursor-pointer"
                  >
                    Auto-Fill Demo Client Registration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-4 text-center text-xs text-slate-400 dark:border-slate-800/80">
        Beamline &copy; 2026 • Autonomous Operations &amp; Construction CRM SaaS
      </footer>
    </div>
  );
}
