import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Hammer,
  HardHat,
  Layers3,
  Ruler,
  ShieldCheck,
  Truck,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Integrations", href: "#integrations" },
  { label: "Multi-tenant", href: "#tenants" },
  { label: "Process", href: "#process" },
  { label: "Growth", href: "#growth" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export const rotatingWords = ["digital HQ.", "sharper pipeline.", "calmer job site.", "healthier margin."];

export const tapeItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Lead capture", icon: UsersRound },
  { label: "Design agreements", icon: Ruler },
  { label: "Permits & engineering", icon: ClipboardCheck },
  { label: "Framing & rough MEP", icon: Hammer },
  { label: "Material deliveries", icon: Truck },
  { label: "Invoice automation", icon: Workflow },
  { label: "Duplicate protection", icon: ShieldCheck },
  { label: "Executive dashboards", icon: BarChart3 },
  { label: "Closeout & warranty", icon: FileCheck2 },
  { label: "Field-ready teams", icon: HardHat },
];

export const stats = [
  { value: 12, suffix: " hrs", label: "Admin time returned to each manager weekly" },
  { value: 3, suffix: "×", label: "Faster vendor invoice turnaround" },
  { value: 100, suffix: "%", label: "Of invoices checked for duplicates" },
  { value: 14, suffix: " days", label: "From kickoff to a live workspace" },
];

export type ExplorerTab = {
  id: "sales" | "projects" | "invoices" | "insights";
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
};

export const explorerTabs: ExplorerTab[] = [
  {
    id: "sales",
    label: "Sales pipeline",
    icon: UsersRound,
    title: "Every referral, tracked to a signed contract.",
    description: "Architect referrals, past clients, and new enquiries move through clear stages with the next action always visible.",
    points: ["Qualification → design → construction agreement", "Founder review flags for high-stakes deals", "One-click logging for calls and site visits"],
  },
  {
    id: "projects",
    label: "Project delivery",
    icon: Layers3,
    title: "Four phases. Zero guesswork on site.",
    description: "Standard checklists keep managers, trades, and inspectors aligned while every custom home keeps its character.",
    points: ["Pre-construction, build, closeout, warranty", "Milestones, materials, and inspections in one view", "At-risk tasks surface before they slip"],
  },
  {
    id: "invoices",
    label: "Invoice automation",
    icon: Workflow,
    title: "Vendor invoices that process themselves.",
    description: "Emails and PDFs are read, matched to the right project, checked for duplicates, and routed for review when needed.",
    points: ["PDF and email field extraction", "Supplier + reference duplicate protection", "Clarification requests routed automatically"],
  },
  {
    id: "insights",
    label: "Executive insight",
    icon: BarChart3,
    title: "The whole business on one calm screen.",
    description: "Pipeline value, active builds, cost exposure, and the decisions waiting on you — without chasing anyone for updates.",
    points: ["Live pipeline and backlog value", "Cost-to-date versus budget", "A single queue for leadership decisions"],
  },
];

export type TenantTheme = {
  id: string;
  name: string;
  initials: string;
  slug: string;
  specialty: string;
  accent: { solid: string; soft: string; text: string; ring: string; bar: string };
  metrics: Array<[string, string]>;
};

export const tenants: TenantTheme[] = [
  {
    id: "northstar",
    name: "Northstar Custom Homes",
    initials: "N",
    slug: "northstar",
    specialty: "Luxury custom residences",
    accent: {
      solid: "bg-amber-400 text-stone-950",
      soft: "bg-amber-400/15",
      text: "text-amber-300",
      ring: "ring-amber-400",
      bar: "bg-amber-400",
    },
    metrics: [["$8.4M", "Pipeline"], ["7", "Live builds"], ["96%", "On-time tasks"]],
  },
  {
    id: "ridgeline",
    name: "Ridgeline Design-Build",
    initials: "R",
    slug: "ridgeline",
    specialty: "Design-build studio",
    accent: {
      solid: "bg-emerald-400 text-stone-950",
      soft: "bg-emerald-400/15",
      text: "text-emerald-300",
      ring: "ring-emerald-400",
      bar: "bg-emerald-400",
    },
    metrics: [["$5.1M", "Pipeline"], ["11", "Live builds"], ["92%", "On-time tasks"]],
  },
  {
    id: "harbor",
    name: "Harbor & Pine Renovation",
    initials: "H",
    slug: "harborpine",
    specialty: "High-end renovation",
    accent: {
      solid: "bg-sky-400 text-stone-950",
      soft: "bg-sky-400/15",
      text: "text-sky-300",
      ring: "ring-sky-400",
      bar: "bg-sky-400",
    },
    metrics: [["$2.7M", "Pipeline"], ["18", "Live builds"], ["98%", "On-time tasks"]],
  },
];

export const phases = [
  {
    step: "01",
    title: "Capture",
    description: "Enquiries and referrals land in one pipeline with owners, values, and next actions.",
    icon: UsersRound,
  },
  {
    step: "02",
    title: "Plan",
    description: "Signed work becomes a structured project with phases, budgets, permits, and milestones.",
    icon: Ruler,
  },
  {
    step: "03",
    title: "Build",
    description: "Tasks, materials, inspections, and invoices flow through one shared operating rhythm.",
    icon: Hammer,
  },
  {
    step: "04",
    title: "Grow",
    description: "Clean delivery data sharpens forecasting, protects margin, and frees capacity for more work.",
    icon: Zap,
  },
];

export const plans = [
  {
    name: "Foundation",
    monthly: 299,
    description: "For small builders replacing spreadsheets and generic CRMs.",
    features: ["Branded subdomain", "Up to 5 team members", "CRM + project workflows", "Core dashboards", "Email support"],
  },
  {
    name: "Builder",
    monthly: 699,
    description: "For growing teams that want automation and executive oversight.",
    features: ["Custom domain + subdomain", "Up to 20 team members", "Invoice intake automation", "Executive review queues", "Priority onboarding"],
    featured: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    description: "For multi-division builders with tailored workflows and integrations.",
    features: ["Multiple business units", "Unlimited team members", "Custom workflows", "Integration support", "Dedicated success lead"],
  },
];

export const faqs = [
  {
    question: "Who is BeamLine built for?",
    answer:
      "Custom home builders, design-build firms, and high-end renovation companies that run complex, high-value projects and want one system for sales, delivery, and cost control.",
  },
  {
    question: "What does multi-tenant mean for my company?",
    answer:
      "Your company gets its own isolated workspace — users, records, branding, and settings are separate from every other business on the platform.",
  },
  {
    question: "How does the custom subdomain work?",
    answer:
      "Each workspace launches at an address like yourcompany.beamline.app. Builder and Enterprise plans can also connect a domain you already own.",
  },
  {
    question: "Can we bring our existing data?",
    answer:
      "Yes. Onboarding includes structured imports from spreadsheets and common CRM exports, plus a review so active opportunities and projects are ready on day one.",
  },
  {
    question: "Does my field team need training?",
    answer:
      "Very little. BeamLine is organized around familiar construction stages and clear next actions, so a short role-based walkthrough is usually enough.",
  },
  {
    question: "Can we cancel or change plans?",
    answer:
      "Plans can be upgraded at any time. Monthly plans can be cancelled at the end of a billing period, and annual plans renew yearly.",
  },
];
