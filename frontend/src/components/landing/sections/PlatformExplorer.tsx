"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties, type JSX } from "react";
import { AlertTriangle, ArrowRight, Check, FileText, Mail, ScanLine, ShieldCheck } from "lucide-react";
import { explorerTabs, type ExplorerTab } from "../data";
import { useInView, usePrefersReducedMotion } from "../hooks";
import { Reveal, SectionHeading } from "../Reveal";

const ADVANCE_MS = 7000;

function SalesMock() {
  const columns = [
    { stage: "Qualified", deals: [["Mercer Hillside", "$3.25M"], ["Lakeview Retreat", "$1.9M"]] },
    { stage: "Design", deals: [["Oakridge Estate", "$4.1M"]] },
    { stage: "Signed", deals: [["Cedar Point", "$2.6M"]] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {columns.map((column, columnIndex) => (
        <div key={column.stage} className="rounded-2xl bg-white/5 p-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone-400">{column.stage}</p>
          <div className="mt-3 space-y-2">
            {column.deals.map(([name, value], index) => (
              <div
                key={name}
                className="animate-panel-in rounded-xl border border-white/10 bg-stone-900 p-3"
                style={{ animationDelay: `${(columnIndex * 2 + index) * 90}ms` }}
              >
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="mt-1 text-xs font-semibold text-amber-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsMock() {
  const rows = [
    ["Pre-construction", 100],
    ["Construction", 68],
    ["Closeout", 12],
    ["Warranty", 0],
  ] as const;
  return (
    <div className="space-y-4 rounded-2xl bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-amber-300">PRJ-101</p>
          <p className="text-lg font-black text-white">Oakridge Estate Residence</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">On track</span>
      </div>
      {rows.map(([phase, value], index) => (
        <div key={phase}>
          <div className="flex justify-between text-xs font-semibold text-stone-300">
            <span>{phase}</span>
            <span>{value}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="animate-progress h-full origin-left rounded-full bg-amber-400"
              style={{ width: `${value}%`, "--duration": "1.1s", animationDelay: `${index * 120}ms` } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoicesMock() {
  const steps = [
    { icon: Mail, label: "Email received", detail: "billing@summitlumber.com" },
    { icon: ScanLine, label: "Fields extracted", detail: "INV-2041 · $12,500 · PRJ-101" },
    { icon: ShieldCheck, label: "Duplicate check", detail: "No prior record found" },
    { icon: Check, label: "Recorded cleanly", detail: "Synced to project costs" },
  ];
  return (
    <ol className="relative space-y-3 rounded-2xl bg-white/5 p-5">
      {steps.map(({ icon: Icon, label, detail }, index) => (
        <li key={label} className="animate-panel-in flex items-center gap-3" style={{ animationDelay: `${index * 160}ms` }}>
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${index === steps.length - 1 ? "bg-emerald-400 text-stone-950" : "bg-amber-400/15 text-amber-300"}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-stone-900 px-3.5 py-2.5">
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="truncate font-mono text-xs text-stone-400">{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function InsightsMock() {
  const bars = [48, 62, 55, 74, 69, 88, 96];
  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl bg-white/5 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Backlog value</p>
        <p className="mt-1 text-3xl font-black text-white">$14.1M</p>
        <div className="mt-5 flex h-28 items-end gap-2">
          {bars.map((height, index) => (
            <span
              key={index}
              className="animate-panel-in flex-1 rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300"
              style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[
          [AlertTriangle, "3 decisions waiting", "text-amber-300"],
          [FileText, "2 invoices flagged", "text-rose-300"],
          [Check, "7 builds on track", "text-emerald-300"],
        ].map(([Icon, label, color], index) => {
          const ItemIcon = Icon as typeof Check;
          return (
            <div key={label as string} className="animate-panel-in flex items-center gap-3 rounded-2xl bg-white/5 p-4" style={{ animationDelay: `${index * 120}ms` }}>
              <ItemIcon className={`size-5 ${color as string}`} aria-hidden="true" />
              <p className="text-sm font-bold text-white">{label as string}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mocks: Record<ExplorerTab["id"], () => JSX.Element> = {
  sales: SalesMock,
  projects: ProjectsMock,
  invoices: InvoicesMock,
  insights: InsightsMock,
};

export function PlatformExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0.3 });
  const autoplay = inView && !paused && !reduced;

  const next = useCallback(() => setActiveIndex((index) => (index + 1) % explorerTabs.length), []);

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(next, ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, activeIndex, next]);

  const active = explorerTabs[activeIndex];
  const Mock = mocks[active.id];

  return (
    <section id="platform" className="relative overflow-hidden bg-stone-950 py-24 text-white sm:py-32">
      <div aria-hidden="true" className="absolute left-1/2 top-0 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tone="dark"
          align="center"
          eyebrow="One connected platform"
          title="Your whole operation, from first call to final invoice."
          description="Explore how BeamLine connects the commercial, operational, and financial sides of building."
        />

        <div ref={ref} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} className="mt-14">
          <div role="tablist" aria-label="Platform areas" className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
            {explorerTabs.map((tab, index) => {
              const selected = index === activeIndex;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="platform-panel"
                  onClick={() => setActiveIndex(index)}
                  className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition duration-300 ${
                    selected ? "border-amber-400/60 bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className={`size-5 ${selected ? "text-amber-400" : "text-stone-400"}`} aria-hidden="true" />
                  <span className={`mt-2 block text-sm font-bold ${selected ? "text-white" : "text-stone-300"}`}>{tab.label}</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5" aria-hidden="true">
                    {selected && (
                      <span
                        key={`${activeIndex}-${autoplay}`}
                        className={`block h-full origin-left bg-amber-400 ${autoplay ? "animate-progress" : ""}`}
                        style={{ "--duration": `${ADVANCE_MS}ms` } as CSSProperties}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <Reveal direction="scale" className="mt-8">
            <div
              id="platform-panel"
              role="tabpanel"
              aria-labelledby={`tab-${active.id}`}
              className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-2xl backdrop-blur-sm sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
            >
              <div key={active.id} className="animate-panel-in">
                <h3 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">{active.title}</h3>
                <p className="mt-4 leading-7 text-stone-300">{active.description}</p>
                <ul className="mt-6 space-y-3">
                  {active.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm font-semibold text-stone-200">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-stone-950">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href="/admin" className="group mt-8 inline-flex items-center gap-2 text-sm font-black text-amber-400 hover:text-amber-300">
                  See it in the live workspace
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
              <div key={`${active.id}-mock`} className="animate-panel-in rounded-3xl border border-white/10 bg-stone-950/70 p-3 sm:p-4">
                <Mock />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
