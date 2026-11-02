"use client";

import Image from "next/image";
import { useState } from "react";
import { Globe2, KeyRound, LockKeyhole, Palette, ShieldCheck } from "lucide-react";
import { tenants } from "../data";
import { Reveal, SectionHeading } from "../Reveal";

const homeImage =
  "https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?auto=format&fit=crop&w=1400&q=85";

const guarantees = [
  { icon: LockKeyhole, label: "Isolated data", text: "Records never cross tenant boundaries." },
  { icon: Globe2, label: "Your address", text: "Subdomain or your own custom domain." },
  { icon: Palette, label: "Your brand", text: "Name, colours, and logo throughout." },
  { icon: KeyRound, label: "Your team", text: "Role-based access for every member." },
];

export function TenantShowcase() {
  const [selected, setSelected] = useState(tenants[0].id);
  const tenant = tenants.find((item) => item.id === selected) ?? tenants[0];

  return (
    <section id="tenants" className="relative overflow-hidden bg-stone-50 py-24 sm:py-32 dark:bg-stone-950">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Multi-tenant by design"
            title="One platform. Every builder gets their own HQ."
            description="Each company runs in a private, branded workspace at its own address. Pick a builder below to see how their workspace changes."
          />

          <Reveal delay={100}>
            <div role="radiogroup" aria-label="Sample builder workspaces" className="mt-8 grid gap-3">
              {tenants.map((item) => {
                const isSelected = item.id === selected;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelected(item.id)}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition duration-300 ${
                      isSelected
                        ? "border-stone-950 bg-white shadow-xl shadow-stone-950/5 dark:border-amber-400/50 dark:bg-stone-900"
                        : "border-stone-200 bg-white/60 hover:border-stone-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-black transition-transform group-hover:scale-105 ${item.accent.solid}`}>
                      {item.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-stone-950 dark:text-white">{item.name}</span>
                      <span className="block truncate font-mono text-xs text-stone-500">{item.slug}.beamline.app</span>
                    </span>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? "border-stone-950 dark:border-amber-400" : "border-stone-300 dark:border-stone-600"
                      }`}
                      aria-hidden="true"
                    >
                      <span className={`size-2.5 rounded-full bg-stone-950 transition-transform dark:bg-amber-400 ${isSelected ? "scale-100" : "scale-0"}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
              {guarantees.map(({ icon: Icon, label, text }) => (
                <div key={label}>
                  <dt className="flex items-center gap-2 text-sm font-black text-stone-950 dark:text-white">
                    <Icon className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">{text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal direction="right">
          <div className="relative">
            <div aria-hidden="true" className={`absolute -inset-6 rounded-[3rem] opacity-60 blur-3xl transition-colors duration-700 ${tenant.accent.soft}`} />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <div className="ml-3 flex flex-1 items-center gap-2 truncate rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs text-stone-300">
                  <ShieldCheck className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span key={tenant.slug} className="animate-word-in truncate">
                    https://<span className="text-white">{tenant.slug}</span>.beamline.app
                  </span>
                </div>
              </div>

              <div key={tenant.id} className="animate-panel-in p-4 sm:p-6">
                <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
                  <Image src={homeImage} alt="Modern custom home featured in the builder's workspace" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <span className={`flex size-11 items-center justify-center rounded-xl text-lg font-black ${tenant.accent.solid}`}>{tenant.initials}</span>
                    <div>
                      <p className="font-black text-white">{tenant.name}</p>
                      <p className={`text-xs font-semibold ${tenant.accent.text}`}>{tenant.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {tenant.metrics.map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-white/5 p-3 sm:p-4">
                      <p className="text-lg font-black text-white sm:text-2xl">{value}</p>
                      <p className="mt-0.5 text-[0.7rem] text-stone-400 sm:text-xs">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
                    <span>Active build progress</span>
                    <span className={tenant.accent.text}>This month</span>
                  </div>
                  <div className="mt-3 flex h-16 items-end gap-1.5">
                    {[35, 52, 44, 68, 58, 76, 64, 88, 72, 94].map((height, index) => (
                      <span
                        key={index}
                        className={`animate-panel-in flex-1 rounded-t-md ${tenant.accent.bar}`}
                        style={{ height: `${height}%`, animationDelay: `${index * 40}ms` }}
                      />
                    ))}
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
