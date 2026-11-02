"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileCheck2,
  Layers,
  Lock,
  Mail,
  Play,
  Plus,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingPage() {
  const [activeFeatureTab, setActiveFeatureTab] = useState<
    "sales" | "projects" | "invoices"
  >("sales");

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900 transition-colors duration-200 dark:bg-[#0b0f19] dark:text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* ------------------------------------------------------------ */}
      {/* Sticky Navigation Bar                                         */}
      {/* ------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0f1523]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Beamline
              </span>
              <span className="ml-2 hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70 sm:inline-block dark:bg-indigo-950/70 dark:text-indigo-300 dark:ring-indigo-800">
                Multi-Tenant Construction OS
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Key Features
            </a>
            <a
              href="#lifecycle"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              4-Phase System
            </a>
            <a
              href="#comparison"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Why Construction OS
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle variant="compact" />
            <Link
              href="/admin"
              className="btn-primary py-2 px-3 sm:px-4 text-xs sm:text-sm"
            >
              <span>Admin Panel</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Hero Section                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/20" />

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white px-3.5 py-1.5 shadow-xs dark:border-indigo-900/60 dark:bg-slate-900">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              White-Labeled Subdomains • Custom Domains • Two-Tier Google OAuth
            </span>
          </div>

          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:leading-[1.12]">
            Autonomous Operations & CRM for{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Custom Home Builders
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 sm:leading-relaxed">
            From pre-construction design agreements to closeout and automated accounts payable.
            Purpose-built for luxury residential builders with dedicated client subdomains,
            custom domains, and executive review queues.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/admin"
              className="btn-primary w-full px-7 py-3 text-base sm:w-auto"
            >
              <span>Launch Admin Panel</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="btn-secondary w-full px-7 py-3 text-base sm:w-auto"
            >
              <span>Explore How It Works</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </a>
          </div>

          {/* Trust Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-6">
            <div className="card p-4 text-left">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                $14.1M+
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active deal pipeline</p>
            </div>
            <div className="card p-4 text-left">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                4 Phases
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Standardized delivery</p>
            </div>
            <div className="card p-4 text-left">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                100% Audited
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Duplicate invoice protection</p>
            </div>
            <div className="card p-4 text-left">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                15+ Hours
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saved weekly per founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Product Interactive Spotlight                                 */}
      {/* ------------------------------------------------------------ */}
      <section
        id="features"
        className="py-16 sm:py-24 border-t border-slate-200/80 bg-white transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0f1523]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Three Simple Pillars
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Traditional enterprise software is confusing and cluttered with technical jargon.
              Kevin&apos;s OS was designed so anyone on your team can understand it in two minutes.
            </p>
          </div>

          {/* Pill Selector */}
          <div className="mt-10 flex justify-center overflow-x-auto pb-1">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-transparent dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("sales")}
                className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeFeatureTab === "sales"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Sales &amp; Deals</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFeatureTab("projects")}
                className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeFeatureTab === "projects"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>4-Phase Job Sites</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFeatureTab("invoices")}
                className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeFeatureTab === "invoices"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Workflow className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Automated Invoices</span>
              </button>
            </div>
          </div>

          {/* Interactive Feature Display */}
          <div className="mt-8 rounded-3xl border border-slate-200/80 bg-[#fafaf9] p-6 sm:p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            {activeFeatureTab === "sales" && (
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    High-Touch Client Relationship Management
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    Never let a high-value referral slip through the cracks
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    When high-net-worth clients reach out through architect partners or past clients,
                    track them cleanly from first inquiry to signed building agreement.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Clear stages: Qualification → Design Agreement → Construction Agreement</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>&ldquo;Requires Kevin&apos;s Review&rdquo; flag brings critical custom requests directly to founder</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>One-click contact logging for calls, meetings, and architectural site visits</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Link href="/admin" className="btn-primary">
                      <span>View Sales Pipeline in Admin</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Simulated UI Card */}
                <div className="card space-y-3.5 p-6 shadow-md dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Live Deal Highlight
                    </span>
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800">
                      Design Agreement
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      Mercer Modern Hillside Residence
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Client: Alexandra &amp; David Mercer • Owner: Jordan Blake
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Estimated Value</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white">$3,250,000</div>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Next Action</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Soils report review</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Founder Review:</strong> Cantilever engineering requires structural sign-off.
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "projects" && (
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <span className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    4-Phase Standardized Delivery
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    Standardized checklists across every custom home
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Every luxury build is unique, but the operational rhythm doesn&apos;t have to be.
                    Keep project managers, city inspectors, and trades completely aligned.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Phase 1 (Pre-Construction): Permits, engineering, baseline schedules</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Phase 2 (Construction): Framing, rough MEP, milestone inspections</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Phase 3 (Closeout): Certificate of Occupancy &amp; client walkthroughs</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Phase 4 (Warranty): 30-day &amp; 11-month post-handover care</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Link href="/admin" className="btn-primary">
                      <span>View Active Builds in Admin</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Simulated Project Card */}
                <div className="card space-y-4 p-6 shadow-md dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      PRJ-101
                    </span>
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800">
                      On Track
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      Oakridge Estate Custom Residence
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      PM: Marcus Vance • 1288 Oakridge Rd, Woodside
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>Phase 2: Active Construction</span>
                      <span>65% Complete</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                      <span className="text-slate-400 dark:text-slate-500">Contract Budget</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">$4,250,000</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                      <span className="text-slate-400 dark:text-slate-500">Target Completion</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Nov 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "invoices" && (
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <span className="inline-block rounded-full bg-purple-50 dark:bg-purple-950/70 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                    Automated Invoices &amp; Margin Protection
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    Stop margin bleed before payments go out
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Subcontractor bills and supplier receipts sent by email are automatically parsed.
                    Amounts are matched to the right job, duplicates are rejected, and budget variances alert you instantly.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Zero manual data entry: forwards invoice PDFs directly from email</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Instant duplicate protection prevents paying the same bill twice</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>In-place status updates mark bills &ldquo;Paid&rdquo; when receipts arrive</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Link href="/admin" className="btn-primary">
                      <span>Test Invoice Ingestion in Admin</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Simulated Invoice Card */}
                <div className="card space-y-3.5 p-6 shadow-md dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                      INV-2026-501
                    </span>
                    <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
                      Unpaid
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Sierra Valley HVAC Solutions
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Linked to PRJ-101 Oakridge Estate • Rough-in ductwork package
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Invoice Amount</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">$18,500.00</div>
                    </div>
                    <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Matched to Budget Code 15-HVAC
                    </span>
                  </div>
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Audited &amp; committed to financial ledger.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 4-Phase Lifecycle Strip                                       */}
      {/* ------------------------------------------------------------ */}
      <section id="lifecycle" className="py-16 sm:py-24 bg-[#f7f7f5] transition-colors duration-200 dark:bg-[#0b0f19]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              The Building Rhythm
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              From Soil to Keys to 1-Year Warranty
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A standardized sequence that keeps everyone honest, calm, and on schedule.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-6 border-t-4 border-t-indigo-500">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Phase 1
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Pre-Construction
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Permits, architectural revisions, engineering sign-offs, and baseline budget schedules.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-emerald-500">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Phase 2
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Active Building
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Excavation, concrete foundations, structural timber &amp; steel, rough trades, and inspections.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-amber-500">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Phase 3
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Handover &amp; Closeout
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Punchlist completion, final inspections, Certificate of Occupancy, and owner orientation.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-purple-500">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Phase 4
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                12-Month Warranty
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Scheduled 30-day and 11-month walkthroughs with dedicated service tracking for the client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Simple Before vs After Comparison                             */}
      {/* ------------------------------------------------------------ */}
      <section
        id="comparison"
        className="py-16 sm:py-24 border-t border-slate-200/80 bg-white transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0f1523]"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              The Real Difference
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Why builders switch from spreadsheets
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* The Old Way */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="inline-flex rounded-full bg-rose-100 dark:bg-rose-900/60 px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-300">
                The Old Chaotic Way
              </div>
              <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Invoices buried in messy email threads and glove boxes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Duplicate payments made to subcontractors by mistake</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Surprise budget overruns discovered only at job closeout</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Founder spends 15+ weekend hours on manual paperwork</span>
                </li>
              </ul>
            </div>

            {/* The OS Way */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                With Construction OS
              </div>
              <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>Subcontractor invoices automatically parsed and logged</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>Duplicate bills blocked before checks are written</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>Real-time budget tracking on every phase and trade code</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>Founder has total clarity to focus on craft and client relationships</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Bottom Call to Action                                        */}
      {/* ------------------------------------------------------------ */}
      <section className="py-16 sm:py-20 bg-indigo-900 dark:bg-indigo-950 text-white border-t border-indigo-800 dark:border-indigo-900">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Ready to streamline your luxury residential operations?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-200 dark:text-indigo-300 text-sm sm:text-base">
            Access the clean admin panel to manage deals, monitor live build milestones,
            and process invoices instantly.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-indigo-900 shadow-lg transition hover:bg-indigo-50 cursor-pointer"
            >
              <span>Enter Admin Panel</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Footer                                                       */}
      {/* ------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white py-8 transition-colors duration-200 dark:border-slate-800 dark:bg-[#0f1523]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Kevin&apos;s Construction OS
            </span>
            <span>• Luxury Residential Management</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Admin Panel
            </Link>
            <span>•</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
