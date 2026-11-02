"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { plans } from "../data";
import { trackSpotlight } from "../hooks";
import { Reveal, SectionHeading } from "../Reveal";

const ANNUAL_DISCOUNT = 0.15;

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative bg-stone-50 py-24 sm:py-32 dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Simple, transparent plans"
          title="Start with structure. Scale with confidence."
          description="Every plan includes a private company workspace, your own subdomain, and guided onboarding."
        />

        <Reveal delay={100} className="mt-10 flex justify-center">
          <div role="group" aria-label="Billing period" className="relative grid grid-cols-2 rounded-full border border-stone-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-stone-900">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-stone-950 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] dark:bg-amber-400 ${
                annual ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {[
              { label: "Monthly", value: false },
              { label: "Annual", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={annual === option.value}
                onClick={() => setAnnual(option.value)}
                className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  annual === option.value ? "text-white dark:text-stone-950" : "text-stone-600 dark:text-stone-300"
                }`}
              >
                {option.label}
                {option.value && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-black text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                    −15%
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const price = plan.monthly === null ? null : Math.round(plan.monthly * (annual ? 1 - ANNUAL_DISCOUNT : 1));
            return (
              <Reveal key={plan.name} delay={index * 120} className="h-full">
                <article
                  onPointerMove={trackSpotlight}
                  className={`spotlight-card relative flex h-full flex-col rounded-[1.75rem] p-px transition duration-500 hover:-translate-y-1.5 ${
                    plan.featured
                      ? "bg-gradient-to-b from-amber-300 via-amber-500 to-orange-500 shadow-2xl shadow-amber-600/20"
                      : "bg-stone-200 hover:shadow-xl dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`flex h-full flex-col rounded-[calc(1.75rem-1px)] p-7 sm:p-8 ${
                      plan.featured ? "bg-stone-950 text-white" : "bg-white dark:bg-stone-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-black ${plan.featured ? "text-amber-400" : "text-stone-950 dark:text-white"}`}>{plan.name}</h3>
                      {plan.featured && (
                        <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-950">Most popular</span>
                      )}
                    </div>
                    <p className={`mt-3 min-h-12 text-sm leading-6 ${plan.featured ? "text-stone-300" : "text-stone-600 dark:text-stone-400"}`}>
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      {price === null ? (
                        <span className="text-5xl font-black tracking-tight">Custom</span>
                      ) : (
                        <>
                          <span key={`${plan.name}-${annual}`} className="animate-word-in text-5xl font-black tabular-nums tracking-tight">
                            ${price}
                          </span>
                          <span className="text-sm font-semibold text-stone-500">/ month</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 h-5 text-xs text-stone-500">
                      {price !== null && (annual ? `Billed annually · $${(price * 12).toLocaleString()}` : "Billed monthly")}
                    </p>

                    <Link
                      href="/admin"
                      className={`group mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition ${
                        plan.featured
                          ? "bg-amber-400 text-stone-950 hover:bg-amber-300"
                          : "bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                      }`}
                    >
                      {price === null ? "Talk to our team" : "Start with " + plan.name}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>

                    <ul className={`mt-8 space-y-3.5 border-t pt-7 ${plan.featured ? "border-white/10" : "border-stone-200 dark:border-white/10"}`}>
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm font-semibold">
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                              plan.featured ? "bg-amber-400 text-stone-950" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                            }`}
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-stone-500">Prices in USD. Onboarding scope depends on data migration and customization needs.</p>
      </div>
    </section>
  );
}
