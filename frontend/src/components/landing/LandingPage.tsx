import { CapabilityTape } from "./sections/CapabilityTape";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { GrowthCalculator } from "./sections/GrowthCalculator";
import { Hero } from "./sections/Hero";
import { IntegrationsShowcase } from "./sections/IntegrationsShowcase";
import { Lifecycle } from "./sections/Lifecycle";
import { Navbar } from "./sections/Navbar";
import { Outcomes } from "./sections/Outcomes";
import { PlatformExplorer } from "./sections/PlatformExplorer";
import { Pricing } from "./sections/Pricing";
import { TenantShowcase } from "./sections/TenantShowcase";

export function LandingPage({ introState = "play" }: { introState?: "hold" | "play" }) {
  const holding = introState === "hold";
  return (
    <div
      data-intro-state={introState}
      // Keep focus out of the page while the opening intro covers it.
      inert={holding}
      aria-hidden={holding || undefined}
      className="min-h-screen overflow-x-clip bg-stone-50 text-stone-950 selection:bg-amber-300 selection:text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      {/* Keep scroll-reveal content visible when JavaScript is unavailable. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:font-bold focus:text-stone-950"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <CapabilityTape />
        <Outcomes />
        <PlatformExplorer />
        <IntegrationsShowcase />
        <TenantShowcase />
        <Lifecycle />
        <GrowthCalculator />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
