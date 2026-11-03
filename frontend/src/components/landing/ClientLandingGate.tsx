"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";
import { apiClient } from "@/lib/api-client";
import type { OAuthPublicConfig } from "@/lib/types";
import { ClientLandingPage } from "./ClientLandingPage";
import { LandingPage } from "./LandingPage";
import { PlatformIntro, shouldPlayPlatformIntro } from "./PlatformIntro";

/**
 * Checks whether the current request is visiting the platform apex
 * (e.g. localhost:3017 or beamline.musfiqdehan.com) rather than a tenant workspace.
 */
function isPlatformApexHost(): boolean {
  if (typeof window === "undefined") return true;

  // Explicit ?tenant= query parameter means specifically inspecting a tenant workspace
  const params = new URLSearchParams(window.location.search);
  if (params.get("tenant")?.trim()) return false;

  const host = window.location.hostname.toLowerCase();

  // Platform apex hosts
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "beamline.musfiqdehan.com" ||
    host === "musfiqdehan.com" ||
    host === "www.beamline.musfiqdehan.com"
  ) {
    return true;
  }

  // Tenant subdomain check: e.g. kevin.localhost or kevin.beamline.musfiqdehan.com
  if (host.includes(".beamline.musfiqdehan.com") || host.includes(".localhost")) {
    const sub = host.split(".")[0];
    if (sub && sub !== "www" && sub !== "app" && sub !== "api" && sub !== "beamline") {
      return false;
    }
    return true;
  }

  // Any other external domain is a tenant custom domain (e.g. kevinbuild.com)
  return false;
}

export function ClientLandingGate() {
  const router = useRouter();
  const [config, setConfig] = useState<OAuthPublicConfig | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isPlatform, setIsPlatform] = useState(true);
  // Opening intro runs on the initial page load only; it also covers tenant discovery.
  const [introActive, setIntroActive] = useState(shouldPlayPlatformIntro);
  const [introRevealed, setIntroRevealed] = useState(false);

  useEffect(() => {
    let isActive = true;
    const isApex = isPlatformApexHost();
    setIsPlatform(isApex);

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const tenantParam = searchParams?.get("tenant")?.trim();
    const endpoint = tenantParam
      ? `/auth/oauth-config/?tenant=${encodeURIComponent(tenantParam)}`
      : "/auth/oauth-config/";

    apiClient
      .get<OAuthPublicConfig>(endpoint)
      .then((cfg) => {
        if (!isActive) return;

        // Platform landing page should always stay on localhost:3017 or beamline.musfiqdehan.com.
        // For tenant sites (subdomains, custom domains, or ?tenant=), check if client landing page is enabled.
        if (!isApex && cfg.tenant) {
          const isClientLandingDisabled = cfg.tenant.feature_flags.page_landing !== true;
          if (isClientLandingDisabled) {
            router.replace("/admin");
            return;
          }
        }

        setConfig(cfg);
        setIsChecking(false);
      })
      .catch(() => {
        if (!isActive) return;
        // Keep the platform marketing site available if tenant discovery is unavailable.
        setConfig(null);
        setIsChecking(false);
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  const intro = introActive ? (
    <PlatformIntro
      ready={!isChecking}
      exitStyle={!isPlatform && config?.tenant ? "fade" : "split"}
      onReveal={() => setIntroRevealed(true)}
      onDone={() => setIntroActive(false)}
    />
  ) : null;

  // Platform landing page (always stays on localhost:3017 or beamline.musfiqdehan.com)
  if (isPlatform) {
    return (
      <>
        <LandingPage introState={introActive && !introRevealed ? "hold" : "play"} />
        {intro}
      </>
    );
  }

  // Tenant workspace: wait for tenant configuration discovery
  if (isChecking) {
    if (intro) return intro;
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-center text-stone-50">
        <div className="flex flex-col items-center gap-5">
          <BeamLineLogo
            href="/"
            tone="amber"
            markClassName="size-14"
            wordmarkClassName="text-xl text-white"
            accentClassName="text-amber-400"
          />
          <p className="text-sm font-semibold text-stone-400">
            Opening your BeamLine workspace...
          </p>
        </div>
      </main>
    );
  }

  // Tenant landing page (rendered when accessing a tenant and page_landing is enabled)
  if (config?.tenant) {
    return (
      <>
        <ClientLandingPage tenant={config.tenant} />
        {intro}
      </>
    );
  }

  return (
    <>
      <LandingPage introState={introActive && !introRevealed ? "hold" : "play"} />
      {intro}
    </>
  );
}
