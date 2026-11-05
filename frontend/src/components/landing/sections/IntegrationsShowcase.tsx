"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Database,
  ExternalLink,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { trackSpotlight } from "../hooks";
import { Reveal, SectionHeading } from "../Reveal";

type IntegrationCategory = "all" | "payments" | "ai" | "workspace";

interface IntegrationItem {
  id: string;
  name: string;
  category: "payments" | "ai" | "workspace";
  providerType: string;
  tag: string;
  icon: LucideIcon;
  badgeTone: {
    bg: string;
    text: string;
    border: string;
    glow: string;
  };
  headline: string;
  description: string;
  impactMetrics: {
    stat: string;
    label: string;
  };
  features: string[];
  byocSupported: boolean;
}

const integrationsList: IntegrationItem[] = [
  {
    id: "stripe",
    name: "Stripe Invoicing & Draws",
    category: "payments",
    providerType: "Payment Gateway",
    tag: "Global Rails",
    icon: CreditCard,
    badgeTone: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/30",
      glow: "hover:shadow-indigo-500/10",
    },
    headline: "Turn 21-day draw delays into 48-hour direct deposits.",
    description:
      "Send digital milestone invoices directly to clients with credit card and automated ACH debit options. Approved change orders settle immediately into your bank account.",
    impactMetrics: {
      stat: "4.2× Faster",
      label: "Milestone payment clearance",
    },
    features: [
      "Credit cards, Apple Pay & ACH direct debit",
      "Instant webhook receipt & ledger reconciliation",
      "Bring Your Own Stripe account for zero fees",
    ],
    byocSupported: true,
  },
  {
    id: "bkash",
    name: "bKash Merchant MFS",
    category: "payments",
    providerType: "Mobile Banking",
    tag: "Regional MFS",
    icon: Coins,
    badgeTone: {
      bg: "bg-pink-500/10 dark:bg-pink-500/20",
      text: "text-pink-600 dark:text-pink-400",
      border: "border-pink-500/30",
      glow: "hover:shadow-pink-500/10",
    },
    headline: "Instant emergency site funds and rapid contractor draws.",
    description:
      "Facilitate instant tokenized mobile transactions for regional teams, emergency material pickups, and swift trade reimbursements without branch visits.",
    impactMetrics: {
      stat: "Sub-Second",
      label: "Tokenized checkout & IPN confirmation",
    },
    features: [
      "Direct tokenized checkout with customer PIN",
      "Automated IPN payment verification webhooks",
      "Independent merchant credential vaulting",
    ],
    byocSupported: true,
  },
  {
    id: "sslcommerz",
    name: "SSLCommerz Multi-Bank",
    category: "payments",
    providerType: "Multi-Rail Gateway",
    tag: "Multi-Currency",
    icon: ShieldCheck,
    badgeTone: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      glow: "hover:shadow-blue-500/10",
    },
    headline: "30+ bank rails with automatic failover and EMI support.",
    description:
      "Give high-value custom home buyers the choice of major regional card issuers, internet banking, and EMI arrangements with institutional-grade compliance.",
    impactMetrics: {
      stat: "99.95%",
      label: "Gateway transaction uptime",
    },
    features: [
      "Visa, Mastercard, Amex, and 30+ regional banks",
      "Real-time IPN webhook validation & status sync",
      "Store-level custom credentials per builder",
    ],
    byocSupported: true,
  },
  {
    id: "gemini",
    name: "Google Gemini 2.5 Flash",
    category: "ai",
    providerType: "Multimodal AI",
    tag: "Vision OCR",
    icon: Sparkles,
    badgeTone: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
      glow: "hover:shadow-amber-500/10",
    },
    headline: "Automate invoice intake with 99.8% field extraction precision.",
    description:
      "Drop trade PDFs and crumpled mobile photos of supplier receipts into BeamLine. Gemini reads supplier details, line-item totals, and tax breakdowns in under two seconds.",
    impactMetrics: {
      stat: "100%",
      label: "Autonomous duplicate bill detection",
    },
    features: [
      "Processes scanned PDFs, tables, and photos",
      "Matches invoices to projects & cost codes automatically",
      "Configurable via tenant or platform AI pool",
    ],
    byocSupported: true,
  },
  {
    id: "claude",
    name: "Anthropic Claude 3.5 Sonnet",
    category: "ai",
    providerType: "Reasoning AI",
    tag: "Contract Audit",
    icon: Brain,
    badgeTone: {
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/30",
      glow: "hover:shadow-orange-500/10",
    },
    headline: "Catch out-of-scope markups before payments leave the account.",
    description:
      "Claude cross-references subcontractor change order claims against the original signed scope of work, flagging discrepancies and preparing founder review briefs.",
    impactMetrics: {
      stat: "$18K+",
      label: "Average scope leakage avoided per build",
    },
    features: [
      "In-depth construction agreement comparison",
      "Flagging of unauthorized trade markups",
      "Deterministic structured JSON responses",
    ],
    byocSupported: true,
  },
  {
    id: "notion",
    name: "Notion Workspace Hub",
    category: "workspace",
    providerType: "Knowledge Sync",
    tag: "2-Way Mirror",
    icon: Database,
    badgeTone: {
      bg: "bg-stone-500/10 dark:bg-stone-500/20",
      text: "text-stone-700 dark:text-stone-300",
      border: "border-stone-500/30",
      glow: "hover:shadow-stone-500/10",
    },
    headline: "Sync opportunities, build logs, and tasks with zero re-keying.",
    description:
      "Give project architects, trades, and site leads a live, branded workspace in Notion that stays synchronized with BeamLine's central relational database.",
    impactMetrics: {
      stat: "10+ Hours",
      label: "Admin time saved weekly per project manager",
    },
    features: [
      "Automated database provisioning and schema mapping",
      "Bidirectional sync for tasks and delivery schedules",
      "Bring your own private Notion integration token",
    ],
    byocSupported: true,
  },
  {
    id: "n8n",
    name: "n8n Workflow Automation",
    category: "workspace",
    providerType: "Event Automations",
    tag: "400+ Apps",
    icon: Workflow,
    badgeTone: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      glow: "hover:shadow-emerald-500/10",
    },
    headline: "Trigger actions across QuickBooks, Slack, and Google Drive.",
    description:
      "Dispatch event webhooks when trade contracts are signed, permits are approved, or invoices require founder approval — linking 400+ external apps with zero custom code.",
    impactMetrics: {
      stat: "Instant",
      label: "Real-time webhook pipeline dispatch",
    },
    features: [
      "Custom payload signatures and HMAC authentication",
      "Automated invoice and cost intake webhooks",
      "Extensible with visual node workflows",
    ],
    byocSupported: true,
  },
  {
    id: "google-sso",
    name: "Google OAuth 2.0 & SMTP",
    category: "workspace",
    providerType: "Federated Auth & Mail",
    tag: "Enterprise Auth",
    icon: Mail,
    badgeTone: {
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      text: "text-teal-600 dark:text-teal-400",
      border: "border-teal-500/30",
      glow: "hover:shadow-teal-500/10",
    },
    headline: "White-labeled transactional mail and 1-click corporate SSO.",
    description:
      "Send draw reminders and estimate approvals from your own verified company domain name, while giving staff safe single sign-on with corporate Google accounts.",
    impactMetrics: {
      stat: "100%",
      label: "SPF / DKIM / DMARC domain alignment",
    },
    features: [
      "Google OAuth 2.0 PKCE federated login",
      "Audited email logs with fallback queue",
      "Custom SMTP host, port & TLS encryption credentials",
    ],
    byocSupported: true,
  },
];

const impactStories = [
  {
    id: "cash-flow",
    title: "Payment Rails & Cash Flow Velocity",
    subtitle: "Stripe, bKash & SSLCommerz Integration",
    statNumber: "4.2×",
    statBadge: "Faster Draw Collection",
    statDescription: "Average milestone collection timeline cut from 21 days to under 48 hours.",
    bullets: [
      "Eliminates paper checks, postal lag, and manual bank wire confirmation calls.",
      "Homeowners receive branded milestone draw notifications and pay securely with 1 tap.",
      "Dual-scope support allows builders to connect their own merchant account (BYOC) for zero escrow holding.",
    ],
    mockBadge: "Direct Milestone Settlement",
    mockAmount: "$48,500.00",
    mockMilestone: "Milestone 03: Framing & Structural Inspection",
    mockProject: "Oakridge Estate Residence",
    mockStatus: "Cleared via Stripe ACH • 1.2s",
  },
  {
    id: "invoice-ai",
    title: "Autonomous Invoice Deduplication",
    subtitle: "Gemini 2.5 Flash & Claude 3.5 Sonnet Integration",
    statNumber: "99.8%",
    statBadge: "Extraction Accuracy",
    statDescription: "Over 12 hours saved weekly per manager with automated duplicate bill detection.",
    bullets: [
      "Subcontractors and trades email invoices directly to your project intake mailbox.",
      "AI vision instantly parses complex vendor tables, tax items, and reference numbers.",
      "Cross-checks previous disbursements to ensure no vendor bill is ever paid twice.",
    ],
    mockBadge: "Autonomous Document AI",
    mockAmount: "$12,450.00",
    mockMilestone: "Invoice #INV-9821 • Allied Concrete Suppliers",
    mockProject: "Lakeview Custom Residence",
    mockStatus: "Verified • 0 Duplicates Detected • Auto-routed",
  },
  {
    id: "workspace-sync",
    title: "Unified Team Sync & Field Operations",
    subtitle: "Notion & n8n Real-Time Automation",
    statNumber: "10+ hrs",
    statBadge: "Weekly Overhead Returned",
    statDescription: "Zero manual data re-keying between job sites, accounting, and leadership.",
    bullets: [
      "Field superintendents work in visual Notion boards while financial data stays locked in BeamLine.",
      "Webhook events trigger real-time alerts in Slack or Microsoft Teams when trades finish stages.",
      "Complete historical audit trails maintained for every third-party API transaction.",
    ],
    mockBadge: "Bidirectional Sync Engine",
    mockAmount: "14 Active Tasks",
    mockMilestone: "Permits, Plumbing Rough-in & City Inspections",
    mockProject: "Mercer Hillside Build",
    mockStatus: "Notion Database Synchronized • 380ms",
  },
];

export function IntegrationsShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory>("all");
  const [activeStory, setActiveStory] = useState(0);

  const filtered =
    selectedCategory === "all"
      ? integrationsList
      : integrationsList.filter((item) => item.category === selectedCategory);

  const currentStory = impactStories[activeStory];

  return (
    <section
      id="integrations"
      aria-label="Third-party integrations and payment rails"
      className="relative overflow-hidden bg-white py-24 sm:py-32 dark:bg-stone-900"
    >
      {/* Background architectural grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading
            eyebrow="Ecosystem & Third-Party Integrations"
            title="Bring your own payments, AI models, and tools. Zero code required."
            description="BeamLine adapts to your existing business stack. Connect leading global and regional payment gateways, multi-provider AI engines, and productivity hubs with enterprise AES-256 hardware encryption."
          />

          {/* Quick Metrics Pillar */}
          <Reveal delay={150}>
            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-6 sm:grid-cols-3 dark:border-white/10 dark:bg-stone-950/60">
              <div className="border-l-2 border-amber-500 pl-3">
                <p className="text-2xl font-black text-stone-950 sm:text-3xl dark:text-white">
                  3<span className="text-amber-500">+</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Payment Rails (Stripe, bKash, SSLCommerz)
                </p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-2xl font-black text-stone-950 sm:text-3xl dark:text-white">
                  100<span className="text-emerald-500">%</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                  BYOC Credential Sovereignty
                </p>
              </div>
              <div className="col-span-2 border-l-2 border-sky-500 pl-3 sm:col-span-1">
                <p className="text-2xl font-black text-stone-950 sm:text-3xl dark:text-white">
                  4.2<span className="text-sky-500">×</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Faster Client Draw Clearance
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Impact in Action: Interactive Showcase Card */}
        <div className="mt-16">
          <Reveal delay={100}>
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-950 p-6 text-white shadow-2xl sm:p-10 dark:border-white/15 dark:bg-stone-950">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-inset ring-amber-400/30">
                    <TrendingUp className="size-3.5" aria-hidden="true" />
                    Operational & Financial Impact
                  </span>
                  <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                    How connected integrations transform your job site
                  </h3>
                </div>

                {/* Impact Tab Buttons */}
                <div
                  role="tablist"
                  aria-label="Integration impact stories"
                  className="flex rounded-2xl bg-white/5 p-1 text-xs font-bold sm:text-sm"
                >
                  {impactStories.map((story, idx) => (
                    <button
                      key={story.id}
                      type="button"
                      role="tab"
                      aria-selected={activeStory === idx}
                      onClick={() => setActiveStory(idx)}
                      className={`rounded-xl px-3 py-2 transition duration-200 sm:px-4 ${
                        activeStory === idx
                          ? "bg-amber-400 text-stone-950 shadow-md"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {idx === 0 ? "Payment Velocity" : idx === 1 ? "AI Invoice Autopilot" : "Team & Notion Sync"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Story Content */}
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    {currentStory.subtitle}
                  </p>
                  <h4 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    {currentStory.title}
                  </h4>
                  <p className="mt-3 text-sm leading-relaxed text-stone-300 sm:text-base">
                    {currentStory.statDescription}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {currentStory.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-stone-300">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                          <Check className="size-3.5" />
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
                      <span className="text-2xl font-black text-amber-400 sm:text-3xl">
                        {currentStory.statNumber}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                        {currentStory.statBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <span>Zero middleman holding • Bank-direct settlement</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Live Payment / Automation Feed */}
                <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-stone-900 to-stone-950 p-6 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 animate-pulse rounded-full bg-emerald-400" />
                      <span className="font-mono text-xs font-bold text-stone-300">
                        {currentStory.mockBadge}
                      </span>
                    </div>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-amber-300">
                      LIVE EVENT
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-stone-400">{currentStory.mockProject}</p>
                      <p className="mt-1 text-sm font-bold text-white">{currentStory.mockMilestone}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Authorized Amount
                      </p>
                      <p className="mt-1 font-mono text-2xl font-black text-amber-400 sm:text-3xl">
                        {currentStory.mockAmount}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4" />
                        {currentStory.mockStatus}
                      </span>
                      <span className="font-mono text-[0.65rem] opacity-75">TLS 1.3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">
              Built-in & Third-Party Provider Catalog
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Configure each integration globally for your platform, or grant custom BYOC access to individual builder workspaces.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter integrations by category"
            className="flex rounded-2xl border border-stone-200 bg-stone-100 p-1 text-xs font-bold dark:border-white/10 dark:bg-stone-800"
          >
            {(
              [
                ["all", "All Services"],
                ["payments", "Payment Gateways"],
                ["ai", "AI Document Models"],
                ["workspace", "Workspaces & SSO"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selectedCategory === key}
                onClick={() => setSelectedCategory(key)}
                className={`rounded-xl px-3 py-2 transition duration-200 sm:px-4 ${
                  selectedCategory === key
                    ? "bg-white text-stone-950 shadow-sm dark:bg-amber-400 dark:text-stone-950"
                    : "text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.id} delay={index * 60}>
                <article
                  onPointerMove={trackSpotlight}
                  className={`spotlight-card group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-stone-200 bg-stone-50/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-white hover:shadow-xl dark:border-white/10 dark:bg-stone-950/40 dark:hover:border-amber-400/40 dark:hover:bg-stone-900 ${item.badgeTone.glow}`}
                >
                  <div>
                    {/* Header: Icon + Category Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex size-12 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${item.badgeTone.bg} ${item.badgeTone.text} ${item.badgeTone.border}`}
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                        {item.tag}
                      </span>
                    </div>

                    {/* Titles */}
                    <h4 className="mt-5 text-lg font-black tracking-tight text-stone-950 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {item.providerType}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-stone-600 dark:text-stone-400">
                      {item.description}
                    </p>

                    {/* Features list */}
                    <ul className="mt-4 space-y-1.5 border-t border-stone-200/80 pt-4 dark:border-white/10">
                      {item.features.map((feature, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start gap-2 text-[0.7rem] text-stone-700 dark:text-stone-300"
                        >
                          <Check className="mt-0.5 size-3 text-amber-600 dark:text-amber-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact footer pill */}
                  <div className="mt-6 border-t border-stone-200 pt-4 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Key Impact
                        </p>
                        <p className="font-mono text-sm font-black text-stone-900 dark:text-white">
                          {item.impactMetrics.stat}
                        </p>
                      </div>

                      {item.byocSupported && (
                        <span
                          title="Bring Your Own Credentials supported"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        >
                          <Lock className="size-2.5" />
                          BYOC Vault
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Bring Your Own Credentials (BYOC) Trust & Governance Banner */}
        <Reveal delay={200} className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 p-8 text-white shadow-xl dark:border-white/15">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                  <ShieldCheck className="size-4" />
                  <span>Enterprise Security & Data Sovereignty</span>
                </div>
                <h4 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  Bring Your Own Credentials (BYOC) with AES-256 Vault Encryption
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  No builder should ever be locked into a platform merchant fee or a shared AI quota.
                  BeamLine gives each workspace its own encrypted credential vault. Connect your own
                  Stripe keys, custom bKash merchant IDs, Notion tokens, or Gemini AI API keys.
                  Payouts settle directly into your bank, and API tokens never leave your private tenant boundary.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                    <Lock className="size-3.5 text-amber-400" />
                    AES-256-GCM At Rest
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Instant Connection Handshake Test
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                    <Layers className="size-3.5 text-sky-400" />
                    Zero Tenant Cross-Contamination
                  </span>
                </div>
              </div>

              {/* Step Flow Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  3-Step Builder Activation
                </p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-mono text-xs font-black text-stone-950">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">Choose Provider</p>
                      <p className="text-[0.7rem] text-stone-400">
                        Select Stripe, bKash, SSLCommerz, Notion, or Gemini in your admin portal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-mono text-xs font-black text-stone-950">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">Enter Your Keys</p>
                      <p className="text-[0.7rem] text-stone-400">
                        Paste private API tokens into the encrypted vault or toggle platform-managed fallback.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-mono text-xs font-black text-stone-950">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">Test & Go Live</p>
                      <p className="text-[0.7rem] text-stone-400">
                        Run the 1-click connection diagnostic test and start processing draws immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
