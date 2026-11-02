"use client";

import { CheckCircle2, CircleDollarSign, ClipboardCheck, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { stats } from "../data";
import { trackSpotlight, useCountUp, useInView } from "../hooks";
import { Reveal, SectionHeading } from "../Reveal";

function Stat({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const current = useCountUp(value, active);
  return (
    <div className="border-l-2 border-amber-400 pl-5">
      <p className="text-4xl font-black tabular-nums tracking-tight text-stone-950 sm:text-5xl dark:text-white">
        {Math.round(current)}
        <span className="text-amber-600 dark:text-amber-400">{suffix}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{label}</p>
    </div>
  );
}

function BentoCard({
  icon: Icon,
  title,
  description,
  children,
  className = "",
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <article
        onPointerMove={trackSpotlight}
        className="spotlight-card group relative flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 transition duration-500 hover:-translate-y-1 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-900/10 sm:p-8 dark:border-white/10 dark:bg-stone-900 dark:hover:border-amber-400/40"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-stone-950 text-amber-400 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 dark:bg-amber-400 dark:text-stone-950">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-2xl font-black tracking-tight text-stone-950 dark:text-white">{title}</h3>
        <p className="mt-2 leading-7 text-stone-600 dark:text-stone-300">{description}</p>
        {children && <div className="mt-auto pt-8">{children}</div>}
      </article>
    </Reveal>
  );
}

export function Outcomes() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <section id="outcomes" className="relative bg-stone-50 py-24 sm:py-32 dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Why builders switch"
            title="Less admin drag. More capacity to build."
            description="BeamLine gives every person a clear next action — and gives leadership the full picture of sales, delivery, and margin."
          />
          <div ref={ref} className="grid grid-cols-2 gap-x-6 gap-y-10">
            {stats.map((stat) => (
              <Stat key={stat.label} {...stat} active={inView} />
            ))}
          </div>
        </div>
        <p className="mt-6 text-right text-xs text-stone-500 dark:text-stone-500">Targets based on typical BeamLine workflows; results vary by team.</p>

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <BentoCard
            icon={TrendingUp}
            title="Win more of the right work"
            description="Qualified pipelines, protected follow-ups, and founder review for the deals that matter most."
            className="md:col-span-4"
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                ["Enquiry", "14", "w-full"],
                ["Qualified", "9", "w-4/5"],
                ["Design", "5", "w-3/5"],
                ["Signed", "3", "w-2/5"],
              ].map(([stage, count, width]) => (
                <div key={stage} className="rounded-2xl bg-stone-100 p-3 dark:bg-white/5">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-500">{stage}</p>
                  <p className="mt-1 text-2xl font-black text-stone-950 dark:text-white">{count}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-stone-200 dark:bg-white/10">
                    <div className={`h-full rounded-full bg-amber-400 transition-all duration-700 group-hover:bg-amber-500 ${width}`} />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            icon={ShieldCheck}
            title="Private by design"
            description="Each company works in an isolated tenant with its own users, records, and branding."
            className="md:col-span-2"
            delay={100}
          >
            <div className="flex -space-x-3">
              {["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-rose-400"].map((color, index) => (
                <span
                  key={color}
                  className={`flex size-11 items-center justify-center rounded-full border-4 border-white text-sm font-black text-stone-950 transition-transform duration-500 group-hover:translate-x-1 dark:border-stone-900 ${color}`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  {"NRHS"[index]}
                </span>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            icon={ClipboardCheck}
            title="Deliver every build consistently"
            description="Repeatable phase checklists keep trades, inspectors, and managers in lockstep."
            className="md:col-span-3"
            delay={150}
          >
            <ul className="space-y-2.5">
              {["Permits approved", "Framing inspection passed", "Rough MEP scheduled"].map((item, index) => (
                <li key={item} className="flex items-center gap-3 rounded-xl bg-stone-100 px-3.5 py-2.5 text-sm font-semibold text-stone-800 dark:bg-white/5 dark:text-stone-200">
                  <CheckCircle2 className={`size-4 ${index < 2 ? "text-emerald-500" : "text-stone-400"}`} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard
            icon={CircleDollarSign}
            title="Protect every dollar of margin"
            description="Invoices are matched to projects, checked for duplicates, and flagged before money leaves the business."
            className="md:col-span-3"
            delay={200}
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-stone-500">
                  <span>Cost to date</span>
                  <span>$1.28M / $1.6M</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                  <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" />
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">On budget</span>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
