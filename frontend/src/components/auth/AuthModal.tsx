"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { BeamLineLogo, BeamLineMark } from "@/components/brand/BeamLineLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Field } from "@/components/ui/primitives";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/overlay";
import { MediaAssetUploader } from "@/components/common/MediaAssetUploader";
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

  // Profile editing state
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileJobTitle, setProfileJobTitle] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setProfileFeedback(null);

    if (currentUser) {
      setProfileFirstName(currentUser.first_name || "");
      setProfileLastName(currentUser.last_name || "");
      setProfileAvatar(currentUser.avatar_url || "");
      setProfileBio(currentUser.bio || "");
      setProfileJobTitle(currentUser.job_title || "");
      setProfilePhone(currentUser.phone || "");

      // Fetch fresh profile details from /auth/me/
      apiClient
        .get<AuthUser>("/auth/me/")
        .then((user) => {
          if (user) {
            setProfileFirstName(user.first_name || "");
            setProfileLastName(user.last_name || "");
            setProfileAvatar(user.avatar_url || "");
            setProfileBio(user.bio || "");
            setProfileJobTitle(user.job_title || "");
            setProfilePhone(user.phone || "");
          }
        })
        .catch(() => {});
    }

    apiClient
      .get<OAuthPublicConfig>("/auth/oauth-config/")
      .then((res) => {
        setOauthConfig(res);
      })
      .catch((err) => {
        console.warn("Could not load OAuth config", err);
      });
  }, [isOpen, currentUser]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      const res = await apiClient.patch<AuthUser>("/auth/me/", {
        first_name: profileFirstName.trim(),
        last_name: profileLastName.trim(),
        avatar_url: profileAvatar.trim() || null,
        bio: profileBio.trim(),
        job_title: profileJobTitle.trim(),
        phone: profilePhone.trim(),
      });
      setProfileFeedback({
        type: "success",
        message: "Profile updated and synced successfully!",
      });
      const token = apiClient.getAuthToken() || "";
      onAuthSuccess(
        res.data,
        currentRole,
        {
          access_token: token,
          refresh_token: "",
          expires_in: 86400,
          token_type: "Bearer",
        },
        activeTenant?.slug
      );
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to save profile changes.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={currentUser ? "md" : "sm"}>
      <ModalHeader
        title={currentUser ? "User Profile & Account" : "Sign in to BeamLine"}
        subtitle={
          activeTenant?.name
            ? `${activeTenant.name} · ${activeTenant.subdomain_host}`
            : "Multi-tenant construction CRM platform"
        }
        icon={<BeamLineMark className="size-10" title="BeamLine" />}
        onClose={onClose}
      />
      <ModalBody>
        {/* Dynamic Tenant & OAuth Banner */}
        {activeTenant && (
          <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Workspace: {activeTenant.slug}
              </span>
              {googleConfig?.source === "client" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> Client Custom OAuth
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/70 dark:text-amber-300">
                  Platform OAuth
                </span>
              )}
            </div>
            {activeTenant.custom_domain && (
              <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                Custom Domain:{" "}
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  {activeTenant.custom_domain}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Logged in state */}
        {currentUser ? (
          <div className="space-y-5">
            {profileFeedback && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                  profileFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                }`}
              >
                {profileFeedback.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50">
              <div className="flex items-center gap-3">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={currentUser.username}
                    className="size-12 rounded-full object-cover border-2 border-amber-500/40 shadow-xs"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 text-amber-600 font-bold dark:bg-amber-400/20 dark:text-amber-400 text-lg">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-stone-900 dark:text-white">
                    {currentUser.username}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {currentUser.email}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      {currentRole}
                    </span>
                    {currentUser.is_superuser && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Platform Superadmin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Editing Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <MediaAssetUploader
                label="Profile Picture"
                category="avatar"
                scopeId={currentUser.id}
                value={profileAvatar}
                onChange={setProfileAvatar}
                previewType="avatar"
                hint="Upload a square photo. Synced to Cloudflare R2 bucket root under beamline/avatar/."
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name">
                  <input
                    type="text"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="input text-xs"
                    placeholder="Jane"
                  />
                </Field>
                <Field label="Last name">
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="input text-xs"
                    placeholder="Doe"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Job title / Specialty">
                  <input
                    type="text"
                    value={profileJobTitle}
                    onChange={(e) => setProfileJobTitle(e.target.value)}
                    className="input text-xs"
                    placeholder="Project Architect / General Contractor"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="input text-xs"
                    placeholder="+1 (555) 019-2834"
                  />
                </Field>
              </div>

              <Field label="Bio / Description about you" hint="Brief summary shown in team directory and project dossiers.">
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="input text-xs resize-none"
                  placeholder="Lead custom residential builder specializing in high-performance framing and passive home construction."
                />
              </Field>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary flex-1 text-xs"
                >
                  {savingProfile ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                </button>
              </div>
            </form>

            <div className="border-t border-stone-200/80 pt-4 dark:border-stone-800/80">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="btn-danger w-full text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated Modal Content */
          <div>
            {/* Tab switch between Sign In and Register */}
            <div className="mb-4 flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-amber-600 shadow-xs dark:bg-stone-900 dark:text-amber-400"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
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
                    ? "bg-white text-amber-600 shadow-xs dark:bg-stone-900 dark:text-amber-400"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                }`}
              >
                Register Workspace
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
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
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-2.5 px-4 text-sm font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition active:scale-[0.99] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
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
                    <div className="w-full border-t border-stone-200 dark:border-stone-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-stone-400 dark:bg-stone-900">
                      Or password login
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Username or Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="kevin or kevin@kevinbuild.com"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="input py-2 pl-9 pr-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Password
                    </label>
                    <PasswordInput
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="h-4 w-4" />}
                      className="py-2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center py-2.5 mt-2 cursor-pointer"
                  >
                    {submitting ? "Authenticating..." : "Sign In with Password"}
                  </button>
                </form>

                {/* Testing & Demo Credentials Cards */}
                <div className="mt-5 border-t border-stone-100 pt-3 dark:border-stone-800">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Test Credentials (Click to Sign In):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("kevin", "kevinpass2026")}
                      className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 text-left transition hover:border-stone-300 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-stone-700 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          Kevin (Client Admin)
                        </span>
                        <span className="rounded bg-stone-200/70 px-1 py-0.5 text-[10px] font-mono text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          Client Admin
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        <code>kevin</code> / <code>kevinpass2026</code>
                      </div>
                      <div className="mt-0.5 text-[10px] text-stone-400 dark:text-stone-500">
                        Admin of Kevin&apos;s Custom Homes workspace
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin", "adminpass2026")}
                      className="group flex flex-col items-start rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 text-left transition hover:border-amber-300 hover:bg-amber-100/60 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:border-amber-800 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                          Platform Superadmin
                        </span>
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-mono text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                          Platform Owner
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                        <code>admin</code> / <code>adminpass2026</code>
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-600/80 dark:text-amber-400/80">
                        Owner of BeamLine &amp; all client tenants
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Workspace / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Custom Homes"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Builder"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="jane@apexhomes.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Password (min. 8 characters)
                  </label>
                  <PasswordInput
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    className="py-2"
                  />
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
      </ModalBody>
    </Modal>
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
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <BeamLineLogo
            href={
              activeTenant?.feature_flags.page_landing === true
                ? activeTenant.custom_domain
                  ? `https://${activeTenant.custom_domain}`
                  : activeTenant.slug
                  ? `/?tenant=${activeTenant.slug}`
                  : "/"
                : activeTenant
                ? undefined
                : "/"
            }
            onClick={
              activeTenant && activeTenant.feature_flags.page_landing !== true
                ? () => window.location.reload()
                : undefined
            }
            markClassName="size-10"
            wordmarkClassName="text-base text-stone-900 dark:text-white"
            badge={
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
                Operations Console
              </span>
            }
          />

          <div className="flex items-center gap-3">
            <ThemeToggle variant="compact" />
            {activeTenant?.feature_flags.page_landing === true && (
              <Link
                href={
                  activeTenant?.custom_domain
                    ? `https://${activeTenant.custom_domain}`
                    : activeTenant?.slug
                    ? `/?tenant=${activeTenant.slug}`
                    : "/"
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Public Site</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Authentication & Registration Barrier */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <BeamLineMark className="mx-auto size-14 mb-4" title="BeamLine" />
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              Beamline Operations Console
            </h1>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              Authentication required. Sign in or register to access workspace.
            </p>
          </div>

          {/* Active Tenant / Domain Badge */}
          {activeTenant && (
            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-amber-900/50 dark:bg-stone-900">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-950 dark:text-amber-200">
                  {activeTenant.name}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[11px] text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                  {activeTenant.subdomain_host}
                </span>
              </div>
              {activeTenant.custom_domain && (
                <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-amber-500" />
                  <span>Custom Domain: <strong className="font-mono text-stone-700 dark:text-stone-300">{activeTenant.custom_domain}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Authentication Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900">
            {/* Tab switch between Sign In and Register */}
            <div className="mb-6 flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-amber-600 shadow-xs dark:bg-stone-900 dark:text-amber-400"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
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
                    ? "bg-white text-amber-600 shadow-xs dark:bg-stone-900 dark:text-amber-400"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                }`}
              >
                Register Workspace
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
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
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-2.5 px-4 text-sm font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition active:scale-[0.99] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
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
                    <div className="w-full border-t border-stone-200 dark:border-stone-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-stone-400 dark:bg-stone-900">
                      Or credentials login
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Username or Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="kevin or kevin@kevinbuild.com"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="input py-2 pl-9 pr-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Password
                    </label>
                    <PasswordInput
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="h-4 w-4" />}
                      className="py-2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center py-2.5 mt-2 cursor-pointer"
                  >
                    {submitting ? "Authenticating..." : "Sign In to Operations Console"}
                  </button>
                </form>

                {/* Testing & Demo Credentials Cards */}
                <div className="mt-6 border-t border-stone-100 pt-4 dark:border-stone-800">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Test Credentials (Click to Sign In):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("kevin", "kevinpass2026")}
                      className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-left transition hover:border-stone-300 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-stone-700 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          Kevin (Client Admin)
                        </span>
                        <span className="rounded bg-stone-200/70 px-1 py-0.5 text-[10px] font-mono text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          Client Admin
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                        <code>kevin</code> / <code>kevinpass2026</code>
                      </div>
                      <div className="mt-0.5 text-[10px] text-stone-400 dark:text-stone-500">
                        Admin of Kevin&apos;s Custom Homes workspace
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin", "adminpass2026")}
                      className="group flex flex-col items-start rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-left transition hover:border-amber-300 hover:bg-amber-100/60 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:border-amber-800 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                          Platform Superadmin
                        </span>
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-mono text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                          Platform Owner
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                        <code>admin</code> / <code>adminpass2026</code>
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-600/80 dark:text-amber-400/80">
                        Owner of BeamLine &amp; all client tenants
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Workspace / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Custom Homes"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Builder"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="jane@apexhomes.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="input py-2 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Password (min. 8 characters)
                  </label>
                  <PasswordInput
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    className="py-2"
                  />
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
                <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setRegOrgName("Apex Custom Builds");
                      setRegFullName("Alex Rivera");
                      setRegEmail("alex@apexbuilds.com");
                      setRegPassword("alexpass2026");
                    }}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/70 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
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
      <footer className="border-t border-stone-200/80 py-4 text-center text-xs text-stone-400 dark:border-stone-800/80">
        Beamline &copy; 2026 • Autonomous Operations &amp; Construction CRM SaaS
      </footer>
    </div>
  );
}
