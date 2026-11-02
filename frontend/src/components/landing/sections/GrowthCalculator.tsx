"use client";

import { useId, useState } from "react";
import { Clock3, Hammer, TrendingUp } from "lucide-react";
import { Reveal, SectionHeading } from "../Reveal";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("en-US");

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-bold text-stone-300">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-lg font-black tabular-nums text-white">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-amber-400"
        style={{ background: `linear-gradient(90deg, var(--color-amber-400) ${percent}%, rgb(255 255 255 / 0.1) ${percent}%)` }}
      />
    </div>
  );
}

export function GrowthCalculator() {
  const [team, setTeam] = useState(8);
  const [projects, setProjects] = useState(12);
  const [projectValue, setProjectValue] = useState(1.8);

  // Simple planning model: ~6 admin hours saved per person each week, and
  // reclaimed capacity converting to ~15% more projects per year.
  const hoursSaved = team * 6 * 48;
  const extraProjects = Math.max(1, Math.round(projects * 0.15 * 10) / 10);
  const revenuePotential = extraProjects * projectValue * 1_000_000;

  const results = [
    { icon: Clock3, value: number.format(hoursSaved), unit: "hrs / year", label: "Admin time returned to your team" },
    { icon: Hammer, value: `+${extraProjects}`, unit: "projects", label: "Extra annual build capacity" },
    { icon: TrendingUp, value: currency.format(revenuePotential), unit: "/ year", label: "Additional revenue potential" },
  ];

  return (
    <section id="growth" className="relative overflow-hidden bg-stone-950 py-24 text-white sm:py-32">
      <div aria-hidden="true" className="absolute -right-40 top-20 size-[36rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Grow with confidence"
          title="See what calmer operations could mean for your business."
          description="Adjust the sliders to estimate the time and capacity BeamLine can unlock for a company like yours."
        />

        <Reveal direction="scale" className="mt-12">
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] lg:grid-cols-2">
            <div className="space-y-8 p-6 sm:p-10">
              <Slider label="Team members" value={team} min={2} max={40} step={1} format={(v) => `${v}`} onChange={setTeam} />
              <Slider label="Projects per year" value={projects} min={2} max={60} step={1} format={(v) => `${v}`} onChange={setProjects} />
              <Slider
                label="Average project value"
                value={projectValue}
                min={0.2}
                max={6}
                step={0.1}
                format={(v) => `$${v.toFixed(1)}M`}
                onChange={setProjectValue}
              />
              <p className="text-xs leading-5 text-stone-500">
                Illustrative planning estimate based on typical admin savings and capacity gains. Actual results depend on your team and processes.
              </p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
              {results.map(({ icon: Icon, value, unit, label }) => (
                <div key={label} className="flex items-center gap-5 bg-stone-950 p-6 sm:flex-col sm:items-start lg:flex-row lg:items-center lg:p-8">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div aria-live="polite">
                    <p className="text-3xl font-black tabular-nums tracking-tight sm:text-4xl">
                      {value} <span className="text-base font-bold text-amber-400">{unit}</span>
                    </p>
                    <p className="mt-1 text-sm text-stone-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
