"use client";

import { useState } from "react";
import { MessageCircleQuestion, Plus } from "lucide-react";
import { faqs } from "../data";
import { Reveal, SectionHeading } from "../Reveal";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-y border-stone-200 bg-white py-24 sm:py-32 dark:border-white/10 dark:bg-stone-900">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Questions, answered"
            title="Know exactly what you're building on."
            description="Clear answers before your team ever logs in."
          />
          <Reveal delay={150}>
            <div className="mt-8 rounded-3xl bg-stone-950 p-6 text-white">
              <MessageCircleQuestion className="size-7 text-amber-400" aria-hidden="true" />
              <p className="mt-4 text-lg font-black">Still have a question?</p>
              <p className="mt-1 text-sm leading-6 text-stone-400">We&apos;ll map your current process and show exactly where BeamLine fits.</p>
            </div>
          </Reveal>
        </div>

        <div className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-white/10 dark:border-white/10">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <Reveal key={faq.question} delay={index * 60}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className={`text-lg font-black transition-colors ${open ? "text-stone-950 dark:text-white" : "text-stone-700 group-hover:text-stone-950 dark:text-stone-300 dark:group-hover:text-white"}`}>
                      {faq.question}
                    </span>
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        open ? "rotate-45 bg-amber-400 text-stone-950" : "bg-stone-100 text-stone-600 group-hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300"
                      }`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-6 pr-12 leading-7 text-stone-600 dark:text-stone-400">{faq.answer}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
