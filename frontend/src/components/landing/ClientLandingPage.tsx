"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { OAuthPublicConfig } from "@/lib/types";

type ClientTenant = NonNullable<OAuthPublicConfig["tenant"]>;

const heroImage =
  "https://images.unsplash.com/photo-1757359056339-22968344cce6?auto=format&fit=crop&w=1800&q=85";

const capabilities = [
  {
    icon: MessageSquareText,
    title: "One clear conversation",
    description:
      "Keep selections, updates, decisions, and project communication connected from the first meeting onward.",
  },
  {
    icon: ClipboardCheck,
    title: "Visible milestones",
    description:
      "Follow each phase of the build with a shared view of priorities, progress, and what comes next.",
  },
  {
    icon: FileCheck2,
    title: "Documents in one place",
    description:
      "Access agreements, project details, and financial records from one secure client workspace.",
  },
];

const journey = [
  ["01", "Discover", "Align on your vision, site, priorities, and the way you want to live."],
  ["02", "Plan", "Turn the brief into a coordinated scope, schedule, and decision roadmap."],
  ["03", "Build", "Stay connected to progress while the project team manages every detail."],
  ["04", "Welcome home", "Move into a finished home with the records and support you need."],
];

function ClientBrand({ tenant, inverse = false }: { tenant: ClientTenant; inverse?: boolean }) {
  if (tenant.logo_url) {
    return (
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-white/10">
          <Image
            src={tenant.logo_url}
            alt=""
            fill
            unoptimized
            sizes="44px"
            className="object-contain p-1.5"
          />
        </span>
        <span
          className={`truncate text-base font-black tracking-tight ${
            inverse ? "text-white" : "text-stone-950 dark:text-white"
          }`}
        >
          {tenant.name}
        </span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20">
        {tenant.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()}
      </span>
      <span
        className={`truncate text-base font-black tracking-tight ${
          inverse ? "text-white" : "text-stone-950 dark:text-white"
        }`}
      >
        {tenant.name}
      </span>
    </span>
  );
}

export function ClientLandingPage({ tenant }: { tenant: ClientTenant }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-stone-50 text-stone-950 selection:bg-amber-300 dark:bg-stone-950 dark:text-stone-50">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2.5 shadow-lg shadow-stone-950/5 backdrop-blur-xl sm:px-4 dark:border-white/10 dark:bg-stone-950/85">
          <Link href="/" aria-label={`${tenant.name} home`} className="min-w-0 rounded-xl">
            <ClientBrand tenant={tenant} />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle variant="compact" />
            <Link
              href="/admin"
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-3.5 text-sm font-black text-white shadow-lg transition hover:bg-stone-800 sm:px-5 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300"
            >
              <LockKeyhole className="size-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Client login</span>
              <span className="sm:hidden">Login</span>
              <ArrowRight className="hidden size-4 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-dvh items-end overflow-hidden pb-14 pt-28 text-white sm:pb-20 sm:pt-36 lg:items-center lg:pb-24">
          <Image
            src={heroImage}
            alt="Contemporary custom home illuminated at dusk"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/35" />

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-stone-100 backdrop-blur-md">
                <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
                Thoughtful homes. Clearer building journeys.
              </div>
              <h1 className="mt-6 text-balance text-4xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">
                Building the place where your story unfolds.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-stone-200 sm:text-xl sm:leading-8">
                {tenant.name} brings design, craft, and communication together to make an exceptional
                custom home feel considered from the first conversation to move-in day.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-black text-stone-950 shadow-xl shadow-amber-950/20 transition hover:bg-amber-300"
                >
                  Enter your client portal
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="#experience"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  Explore our approach
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-stone-200">
                {["Private client access", "Live project visibility", "Secure documents"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-amber-300" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="bg-white py-20 sm:py-28 dark:bg-stone-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  The client experience
                </p>
                <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-stone-950 sm:text-5xl dark:text-white">
                  Confidence at every stage.
                </h2>
              </div>
              <p className="max-w-2xl text-pretty text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-300">
                Great construction is more than what happens on site. It is also the quality of every
                decision, update, and handoff along the way.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-3xl border border-stone-200 bg-stone-50 p-6 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-stone-950/5 sm:p-8 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-amber-500/50"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition group-hover:bg-amber-400 group-hover:text-stone-950 dark:bg-amber-400/15 dark:text-amber-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-8 text-xl font-black text-stone-950 dark:text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-stone-100 py-20 sm:py-28 dark:bg-stone-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                From possibility to place
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">
                A building journey designed around you.
              </h2>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map(([number, title, description]) => (
                <li
                  key={number}
                  className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <span className="font-mono text-sm font-black text-amber-700 dark:text-amber-400">{number}</span>
                  <h3 className="mt-8 text-xl font-black text-stone-950 dark:text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{description}</p>
                  <span className="absolute -bottom-8 -right-6 text-8xl font-black text-stone-950/5 dark:text-white/5">
                    {number}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-stone-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-stone-900 p-6 sm:p-10 lg:p-14">
              <div className="absolute -right-24 -top-24 size-72 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
              <div className="relative grid gap-10 lg:flex lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                  </span>
                  <h2 className="mt-6 text-balance text-3xl font-black tracking-tight sm:text-5xl">
                    Your project, always within reach.
                  </h2>
                  <p className="mt-4 text-pretty text-base leading-7 text-stone-300 sm:text-lg">
                    Sign in to your private portal for project updates, important records, and a clear
                    view of your build.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-black text-stone-950 transition hover:bg-amber-300 lg:min-w-52"
                >
                  Open client portal
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-8 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <ClientBrand tenant={tenant} />
          <div className="flex flex-col gap-2 text-sm text-stone-500 sm:items-end dark:text-stone-400">
            <span className="flex items-center gap-2">
              <Building2 className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Built with care. Managed with clarity.
            </span>
            <span className="flex items-center gap-2">
              Powered by <BeamLineLogo markClassName="size-5" wordmarkClassName="text-xs text-stone-700 dark:text-stone-200" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
