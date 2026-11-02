"use client";

import Image from "next/image";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Cloud,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  MailCheck,
  MapPin,
  Menu,
  Network,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  Workflow,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BeamLineLogo } from "@/components/brand/BeamLineLogo";

const heroImage =
  "https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?auto=format&fit=crop&w=1800&q=88";

const benefits = [
  {
    icon: TrendingUp,
    title: "Win more of the right work",
    description:
      "Qualify enquiries, protect follow-ups, and see every high-value opportunity from first contact to signed agreement.",
    metric: "Clearer pipeline",
  },
  {
    icon: ClipboardCheck,
    title: "Deliver every build consistently",
    description:
      "Standardize the repeatable work across pre-construction, build, handover, and warranty without flattening what makes each project unique.",
    metric: "Fewer missed handoffs",
  },
  {
    icon: CircleDollarSign,
    title: "Protect project margin",
    description:
      "Match invoices to projects, catch duplicates, surface exceptions, and give leadership a faster path to the numbers that matter.",
    metric: "Tighter cost control",
  },
];

const platformFeatures = [
  {
    icon: UsersRound,
    title: "Construction CRM",
    description: "Contacts, referrals, opportunities, activities, and next steps in one operating rhythm.",
  },
  {
    icon: Layers3,
    title: "Project delivery",
    description: "Phases, milestones, materials, tasks, and review queues built around residential construction.",
  },
  {
    icon: Workflow,
    title: "Invoice automation",
    description: "Structured intake, duplicate protection, project matching, and human review when context is missing.",
  },
  {
    icon: BarChart3,
    title: "Executive visibility",
    description: "See pipeline health, active work, cost exposure, and decisions waiting on leadership.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated tenant data",
    description: "Each construction business operates in its own workspace with its own team and settings.",
  },
  {
    icon: Cloud,
    title: "Ready from day one",
    description: "A guided operational structure replaces months of stitching together generic tools and spreadsheets.",
  },
];

const phases = [
  ["01", "Capture", "Enquiries, referrals, client details, and every follow-up enter one dependable pipeline."],
  ["02", "Plan", "Signed work becomes a structured project with phases, owners, milestones, and cost controls."],
  ["03", "Build", "Teams manage tasks, materials, field decisions, invoices, and leadership exceptions in real time."],
  ["04", "Grow", "Reliable delivery data improves forecasting, referrals, margin, and the capacity to take on more work."],
];

const plans = [
  {
    name: "Foundation",
    price: "$299",
    description: "For small builders replacing scattered spreadsheets and generic CRM tools.",
    features: ["1 branded subdomain", "Up to 5 team members", "CRM and project workflows", "Core dashboards", "Email support"],
  },
  {
    name: "Builder",
    price: "$699",
    description: "For growing teams that need automation, oversight, and a consistent client experience.",
    features: [
      "Custom subdomain and domain",
      "Up to 20 team members",
      "Invoice intake automation",
      "Executive review queues",
      "Priority onboarding",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-division builders and operators with tailored workflows or integrations.",
    features: ["Multiple business units", "Unlimited team members", "Custom workflows", "Integration support", "Dedicated success lead"],
  },
];

const faqs = [
  {
    question: "Is BeamLine only for custom home builders?",
    answer:
      "BeamLine is designed around the operating patterns of custom residential construction, but the same structure also fits design-build firms, renovation specialists, and boutique commercial contractors.",
  },
  {
    question: "What does multi-tenant mean for my company?",
    answer:
      "Your company receives an isolated workspace with its own users, records, branding, and configuration. Your team works independently from every other business on the platform.",
  },
  {
    question: "How does the custom subdomain work?",
    answer:
      "Your workspace can launch at a dedicated address such as northstar.beamline.app. Builder and Enterprise plans can also connect a company-owned domain for a fully branded experience.",
  },
  {
    question: "Can we migrate our existing contacts and projects?",
    answer:
      "Yes. Onboarding can include structured imports from spreadsheets and common CRM exports, followed by a review to make sure your active opportunities and projects are ready to use.",
  },
  {
    question: "Will my field team need technical training?",
    answer:
      "No. The interface is organized around familiar construction workflows and clear next actions. Most users can begin with a short role-based onboarding session.",
  },
  {
    question: "Can the workflow be customized?",
    answer:
      "Yes. Phase labels, review rules, notifications, and integrations can be adapted to the way your company sells and delivers work, especially on Enterprise plans.",
  },
];

function Heading({
  as,
  className,
  children,
}: {
  as: "h1" | "h2" | "h3";
  className: string;
  children: ReactNode;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

function IconBadge({ icon: Icon }: { icon: ElementType }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-amber-400 text-stone-950 shadow-sm">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">{eyebrow}</p>
      <Heading
        as="h2"
        className="mt-3 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl lg:text-5xl dark:text-white"
      >
        {title}
      </Heading>
      <p className="mt-4 text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-300">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-stone-50 text-stone-950 selection:bg-amber-300 dark:bg-stone-950 dark:text-stone-50">
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="BeamLine home">
            <BeamLineLogo
              subtitle={<span className="hidden font-bold uppercase tracking-[0.18em] sm:inline">Construction OS</span>}
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {[
              ["Benefits", "#benefits"],
              ["Platform", "#platform"],
              ["How it works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-stone-600 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="compact" />
            <Link href="/admin" className="btn-primary bg-stone-950 px-3 py-2 text-xs hover:bg-stone-800 sm:px-4 sm:text-sm dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300">
              <span className="hidden sm:inline">Open workspace</span>
              <span className="sm:hidden">Open</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <span className="flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 lg:hidden dark:border-stone-800 dark:text-stone-200">
              <Menu className="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-stone-200 bg-stone-950 text-white dark:border-stone-800">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgb(245_158_11/0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgb(245_158_11/0.2)_1px,transparent_1px)] [background-size:3rem_3rem]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Built for the business behind every build
              </div>
              <Heading as="h1" className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Run a stronger construction business, from lead to handover.
              </Heading>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300 sm:text-xl">
                BeamLine gives custom builders a ready-to-use CRM, project operating system, and automation layer—inside a private, branded workspace your team can call its own.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-black text-stone-950 transition hover:bg-amber-300">
                  Explore the workspace
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-900 px-6 py-3.5 text-sm font-bold text-white transition hover:border-stone-500">
                  View plans
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-300">
                {["Launch-ready workflows", "Private tenant data", "Your branded subdomain"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-amber-400" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-stone-900 p-2 shadow-2xl shadow-black/40">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={heroImage}
                    alt="A completed modern custom home at sunset"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Project pulse</p>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-lg font-black sm:text-xl">Hillside Modern Residence</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-300">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          Phase 3 · Interior finishes
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                        On track
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-stone-200 bg-white p-4 text-stone-950 shadow-xl sm:-left-8 dark:border-stone-700 dark:bg-stone-900 dark:text-white">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400">This week</p>
                <p className="mt-1 text-xl font-black">12 hours saved</p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Across admin and invoice review</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-stone-200 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8 dark:divide-stone-800">
            {[
              ["One workspace", "Sales to warranty"],
              ["4 phases", "Repeatable delivery"],
              ["24/7 clarity", "Executive visibility"],
              ["Your domain", "A branded experience"],
            ].map(([value, label]) => (
              <div key={value} className="px-4 py-6 text-center sm:px-6">
                <p className="text-xl font-black text-stone-950 sm:text-2xl dark:text-white">{value}</p>
                <p className="mt-1 text-xs font-semibold text-stone-500 sm:text-sm dark:text-stone-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="benefits" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Built for profitable growth"
              title="Less operational drag. More capacity to build."
              description="Give every person a clear next action while leadership keeps sight of sales, delivery, and margin."
              align="center"
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description, metric }) => (
                <article key={title} className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-8 dark:border-stone-800 dark:bg-stone-900">
                  <IconBadge icon={Icon} />
                  <Heading as="h3" className="mt-6 text-2xl font-black tracking-tight">{title}</Heading>
                  <p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">{description}</p>
                  <div className="mt-7 border-t border-stone-200 pt-5 dark:border-stone-800">
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">{metric}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="bg-stone-900 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">One connected platform</p>
                <Heading as="h2" className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  Your operating system, not another disconnected app.
                </Heading>
                <p className="mt-5 text-lg leading-8 text-stone-300">
                  BeamLine connects the commercial, operational, and financial work that generic software leaves fragmented.
                </p>
                <Link href="/admin" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-amber-400 transition hover:text-amber-300">
                  See the live workspace
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {platformFeatures.map(({ icon: Icon, title, description }) => (
                  <article key={title} className="rounded-2xl border border-stone-700 bg-stone-800/70 p-6">
                    <Icon className="size-6 text-amber-400" aria-hidden="true" />
                    <Heading as="h3" className="mt-5 text-xl font-black">{title}</Heading>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
              <div className="grid lg:grid-cols-2">
                <div className="p-7 sm:p-10 lg:p-14">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
                    <Network className="size-3.5" aria-hidden="true" />
                    Multi-tenant by design
                  </span>
                  <Heading as="h2" className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    A private digital headquarters for every builder.
                  </Heading>
                  <p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">
                    Your team, clients, records, and workflows live inside an isolated workspace—branded for your business and accessible from a dedicated address.
                  </p>
                  <div className="mt-7 space-y-4">
                    {[
                      [LockKeyhole, "Tenant-isolated records and team access"],
                      [Globe2, "Your own subdomain or connected custom domain"],
                      [Wrench, "Workflows configured to the way your company builds"],
                      [KeyRound, "Secure role-based access for leadership and staff"],
                    ].map(([Icon, text]) => {
                      const ItemIcon = Icon as ElementType;
                      return (
                        <div key={text as string} className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-amber-400">
                            <ItemIcon className="size-4" aria-hidden="true" />
                          </span>
                          <p className="font-semibold">{text as string}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="relative min-h-96 bg-stone-950 p-6 sm:p-10">
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgb(245_158_11)_1px,transparent_1px)] [background-size:1.5rem_1.5rem]" />
                  <div className="relative mx-auto max-w-md">
                    <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4 shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-stone-700 pb-3">
                        <span className="size-2.5 rounded-full bg-red-400" />
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        <span className="size-2.5 rounded-full bg-emerald-400" />
                        <div className="ml-2 flex-1 rounded-lg bg-stone-800 px-3 py-1.5 text-center text-xs text-stone-300">
                          northstar.beamline.app
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl bg-stone-800 p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 font-black text-stone-950">N</span>
                          <div>
                            <p className="font-black text-white">Northstar Custom Homes</p>
                            <p className="text-xs text-stone-400">Private operations workspace</p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          {[
                            ["$8.4M", "Active pipeline"],
                            ["7", "Live projects"],
                            ["4", "Items to review"],
                            ["96%", "On-time tasks"],
                          ].map(([value, label]) => (
                            <div key={label} className="rounded-xl bg-stone-900 p-3">
                              <p className="text-lg font-black text-white">{value}</p>
                              <p className="mt-1 text-xs text-stone-400">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Workspace isolated and secure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-stone-200 bg-white py-20 sm:py-28 dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="A complete operating rhythm"
              title="From first enquiry to repeatable growth."
              description="BeamLine follows the life of the work, so your business never loses context between sales, project delivery, and finance."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {phases.map(([number, title, description]) => (
                <article key={number} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-950">
                  <p className="text-4xl font-black text-amber-400">{number}</p>
                  <Heading as="h3" className="mt-5 text-xl font-black">{title}</Heading>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Simple plans"
              title="Start with structure. Scale with confidence."
              description="Choose the operating foundation that fits your team today. Every plan includes a private company workspace and guided setup."
              align="center"
            />
            <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border p-7 sm:p-8 ${
                    plan.featured
                      ? "border-amber-400 bg-stone-950 text-white shadow-2xl shadow-amber-900/10"
                      : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-950">
                      Most popular
                    </span>
                  )}
                  <p className={`text-sm font-black ${plan.featured ? "text-amber-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {plan.name}
                  </p>
                  <p className="mt-4 text-4xl font-black tracking-tight">
                    {plan.price}
                    {plan.price.startsWith("$") && <span className="text-base font-semibold text-stone-400"> / month</span>}
                  </p>
                  <p className={`mt-4 min-h-20 leading-6 ${plan.featured ? "text-stone-300" : "text-stone-600 dark:text-stone-300"}`}>
                    {plan.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm font-semibold">
                        <Check className={`mt-0.5 size-4 shrink-0 ${plan.featured ? "text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/admin"
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                      plan.featured
                        ? "bg-amber-400 text-stone-950 hover:bg-amber-300"
                        : "bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                    }`}
                  >
                    {plan.name === "Enterprise" ? "Talk to our team" : "Explore this plan"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
              Pricing shown in USD. Onboarding scope depends on migration and customization needs.
            </p>
          </div>
        </section>

        <section id="faq" className="border-y border-stone-200 bg-white py-20 sm:py-28 dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Questions, answered</p>
              <Heading as="h2" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Know what you’re building on.
              </Heading>
              <p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">
                A practical platform should be clear before your team ever logs in.
              </p>
              <div className="mt-7 rounded-2xl bg-stone-100 p-5 dark:bg-stone-800">
                <MailCheck className="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <p className="mt-3 font-black">Have a workflow question?</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">We’ll map your current process and show where BeamLine fits.</p>
              </div>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-stone-200 bg-stone-50 p-5 open:bg-white dark:border-stone-700 dark:bg-stone-950 dark:open:bg-stone-950">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
                    {faq.question}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-700 transition group-open:rotate-45 dark:bg-stone-800 dark:text-stone-200">
                      <ChevronRight className="size-4 rotate-45" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl pr-10 text-sm leading-7 text-stone-600 dark:text-stone-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-amber-400 py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-700">Ready to operate differently?</p>
              <Heading as="h2" className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-stone-950 sm:text-5xl">
                Build the company with the same care you build the work.
              </Heading>
            </div>
            <Link href="/admin" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-stone-800">
              Open BeamLine
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-stone-950 text-stone-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
          <BeamLineLogo
            tone="amber"
            markClassName="size-11"
            wordmarkClassName="text-lg text-white"
            accentClassName="text-amber-400"
            subtitle="Construction OS for builders ready to grow."
            subtitleClassName="text-stone-500"
          />
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
            <Link href="#benefits" className="text-sm font-semibold transition hover:text-amber-400">Benefits</Link>
            <Link href="#platform" className="text-sm font-semibold transition hover:text-amber-400">Platform</Link>
            <Link href="#pricing" className="text-sm font-semibold transition hover:text-amber-400">Pricing</Link>
            <Link href="#faq" className="text-sm font-semibold transition hover:text-amber-400">FAQ</Link>
          </div>
        </div>
        <div className="border-t border-stone-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 BeamLine. Construction operations, connected.</p>
            <p className="flex items-center gap-2">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Ready for the next project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
