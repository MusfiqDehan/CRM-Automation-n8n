"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";
import { apiClient } from "@/lib/api-client";
import type { OAuthPublicConfig } from "@/lib/types";
import { ClientLandingPage } from "./ClientLandingPage";
import { LandingPage } from "./LandingPage";
import { PlatformIntro, shouldPlayPlatformIntro } from "./PlatformIntro";

export function ClientLandingGate() {
  const router = useRouter();
  const [config, setConfig] = useState<OAuthPublicConfig | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  // Opening intro runs on the initial page load only; it also covers tenant discovery.
  const [introActive, setIntroActive] = useState(shouldPlayPlatformIntro);
  const [introRevealed, setIntroRevealed] = useState(false);

  useEffect(() => {
    let isActive = true;

    apiClient
      .get<OAuthPublicConfig>("/auth/oauth-config/")
      .then((config) => {
        if (!isActive) return;

        const isClientLandingDisabled =
          Boolean(config.tenant) && config.tenant?.feature_flags.page_landing !== true;

        if (isClientLandingDisabled) {
          router.replace("/admin");
          return;
        }

        setConfig(config);
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
      exitStyle={config?.tenant ? "fade" : "split"}
      onReveal={() => setIntroRevealed(true)}
      onDone={() => setIntroActive(false)}
    />
  ) : null;

  if (isChecking) {
    if (intro) return intro;
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-center text-stone-50">
        <div className="flex flex-col items-center gap-5">
          <BeamLineLogo
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
