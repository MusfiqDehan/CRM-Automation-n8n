"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";
import { apiClient } from "@/lib/api-client";
import type { OAuthPublicConfig } from "@/lib/types";
import { LandingPage } from "./LandingPage";

export function ClientLandingGate() {
  const router = useRouter();
  const [canShowLanding, setCanShowLanding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

        setCanShowLanding(true);
        setIsChecking(false);
      })
      .catch(() => {
        if (!isActive) return;
        // Keep the platform marketing site available if tenant discovery is unavailable.
        setCanShowLanding(true);
        setIsChecking(false);
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  if (isChecking || !canShowLanding) {
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

  return <LandingPage />;
}
