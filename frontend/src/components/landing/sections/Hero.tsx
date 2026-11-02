"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowRight, CheckCircle2, Globe2, Sparkles } from "lucide-react";
import { rotatingWords } from "../data";
import { usePrefersReducedMotion } from "../hooks";
import { HeroBlueprint } from "./HeroBlueprint";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

export function Hero() {
  const [company, setCompany] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setWordIndex((index) => (index + 1) % rotatingWords.length), 2800);
    return () => window.clearInterval(id);
  }, [reduced]);

  const slug = useMemo(() => toSlug(company) || "yourcompany", [company]);
  const workspaceName = company.trim() || "Your Company Homes";

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const node = sectionRef.current;
    if (!node || reduced) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--hero-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    node.style.setProperty("--hero-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="relative isolate overflow-hidden bg-stone-950 pb-24 pt-32 text-white sm:pb-32 sm:pt-40"
      style={{ "--hero-x": "70%", "--hero-y": "30%" } as CSSProperties}
    >
      {/* Blueprint grid */}
      <div
        aria-hidden="true"
        className="animate-blueprint-pan absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgb(251_191_36/0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(251_191_36/0.12)_1px,transparent_1px),linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:96px_96px,96px_96px,24px_24px,24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
      />
      {/* Pointer-following glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 transition-[background] duration-300 [background:radial-gradient(600px_circle_at_var(--hero-x)_var(--hero-y),rgb(251_191_36/0.16),transparent_60%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-stone-950 to-transparent" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3.5 py-1.5 text-xs font-bold text-amber-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            The multi-tenant operating system for builders
          </div>

          <h1 className="mt-7 text-balance text-[2.6rem] font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Every builder deserves a{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                key={wordIndex}
                className="animate-word-in inline-block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent"
              >
                {rotatingWords[wordIndex]}
              </span>
              <span aria-hidden="true" className="caution-tape absolute -bottom-2 left-0 h-1.5 w-full rounded-full opacity-80" />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-stone-300">
            BeamLine unites your CRM, project delivery, and invoice automation in a private, branded workspace — so your team builds more and chases less.
          </p>

          {/* Interactive subdomain preview */}
          <div className="mt-9 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-sm">
            <label htmlFor="company-name" className="sr-only">
              Company name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="company-name"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Type your company name"
                autoComplete="organization"
                className="min-w-0 flex-1 rounded-xl border border-transparent bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-stone-500 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
              <Link
                href="/admin"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
              >
                Claim workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
            <p className="flex items-center gap-2 px-3 pb-1.5 pt-3 font-mono text-sm text-stone-400" aria-live="polite">
              <Globe2 className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate">
                https://<span className="font-bold text-white">{slug}</span>.beamline.app
              </span>
            </p>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-stone-300">
            {["Ready to use on day one", "Isolated tenant data", "Your own branded domain"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-amber-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroBlueprint workspace={workspaceName} />
      </div>
    </section>
  );
}
