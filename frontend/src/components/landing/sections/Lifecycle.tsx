"use client";

import { phases } from "../data";
import { useScrollProgress } from "../hooks";
import { SectionHeading } from "../Reveal";

export function Lifecycle() {
  const { ref, progress } = useScrollProgress<HTMLOListElement>();

  return (
    <section id="process" className="relative border-y border-stone-200 bg-white py-24 sm:py-32 dark:border-white/10 dark:bg-stone-900">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            eyebrow="How it works"
            title="From first enquiry to repeatable growth."
            description="BeamLine follows the life of the work, so context never gets lost between sales, the job site, and the books."
          />
          <div className="mt-8 hidden items-center gap-4 lg:flex">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
              <div className="h-full origin-left rounded-full bg-amber-400 transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <span className="w-12 text-right font-mono text-sm font-bold tabular-nums text-stone-500">{Math.round(progress * 100)}%</span>
          </div>
        </div>

        <ol ref={ref} className="relative space-y-6 pl-14 sm:pl-20">
          <span aria-hidden="true" className="absolute bottom-6 left-5 top-6 w-0.5 bg-stone-200 sm:left-8 dark:bg-white/10" />
          <span
            aria-hidden="true"
            className="absolute left-5 top-6 w-0.5 origin-top bg-amber-400 sm:left-8"
            style={{ height: "calc(100% - 3rem)", transform: `scaleY(${progress})` }}
          />
          {phases.map(({ step, title, description, icon: Icon }, index) => {
            const reached = progress >= (index + 0.35) / phases.length;
            return (
              <li key={step} className="relative">
                <span
                  className={`absolute -left-14 top-6 flex size-10 items-center justify-center rounded-full border-4 transition-all duration-500 sm:-left-20 sm:size-16 ${
                    reached
                      ? "scale-100 border-amber-200 bg-amber-400 text-stone-950 dark:border-amber-400/30"
                      : "scale-90 border-stone-100 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900"
                  }`}
                >
                  <Icon className="size-4 sm:size-6" aria-hidden="true" />
                </span>
                <article
                  className={`rounded-3xl border p-6 transition-all duration-700 sm:p-8 ${
                    reached
                      ? "translate-x-0 border-stone-200 bg-stone-50 opacity-100 shadow-xl shadow-stone-950/5 dark:border-white/10 dark:bg-stone-950"
                      : "translate-x-4 border-transparent bg-transparent opacity-40"
                  }`}
                >
                  <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">Phase {step}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-stone-950 sm:text-3xl dark:text-white">{title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-stone-600 dark:text-stone-300">{description}</p>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
