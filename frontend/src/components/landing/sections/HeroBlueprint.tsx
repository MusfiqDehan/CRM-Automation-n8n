import type { CSSProperties } from "react";
import { BadgeCheck, ShieldCheck, TrendingUp } from "lucide-react";

const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

const linePaths = [
  { d: "M20 370H540", t: 0.1, strong: false },
  { d: "M70 370V240H330V370", t: 0.35, strong: true },
  { d: "M140 240V140H450V240H140", t: 0.65, strong: true },
  { d: "M120 140H470", t: 0.9, strong: true },
  { d: "M420 240V370", t: 1.05, strong: true },
  { d: "M100 270H205V340H100Z", t: 1.2, strong: false },
  { d: "M240 290H290V370", t: 1.3, strong: false },
  { d: "M170 170H420V210H170Z", t: 1.4, strong: false },
  { d: "M253 170V210M336 170V210M152 270V340", t: 1.55, strong: false },
];

const dimensionPaths = [
  { d: "M70 395H330M70 388V402M330 388V402", t: 1.8 },
  { d: "M495 140V370M488 140H502M488 370H502", t: 1.95 },
];

/** Self-drawing blueprint of a cantilevered home with floating live-data cards. */
export function HeroBlueprint({ workspace }: { workspace: string }) {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900/60 p-4 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stone-400">
          <span>Sheet A-201 · Elevation</span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-emerald-400" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>

        <svg viewBox="0 0 560 420" className="mt-2 w-full" role="img" aria-label="Blueprint elevation of a modern cantilevered home with a tower crane">
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M100 270H205V340H100Z M170 170H420V210H170Z" className="bp-fade fill-amber-400/10" style={delay(2.1)} />
            {linePaths.map((path) => (
              <path
                key={path.d}
                d={path.d}
                pathLength={1}
                className={`bp-draw ${path.strong ? "stroke-amber-400" : "stroke-stone-400"}`}
                strokeWidth={path.strong ? 2.5 : 1.5}
                style={delay(path.t)}
              />
            ))}
            {dimensionPaths.map((path) => (
              <path key={path.d} d={path.d} pathLength={1} className="bp-draw stroke-stone-500" strokeWidth={1} style={delay(path.t)} />
            ))}
            {/* Tower crane carrying a steel I-beam */}
            <path d="M530 370V48M366 48H548M530 48L470 20M470 20L380 48" pathLength={1} className="bp-draw stroke-stone-500" strokeWidth={1.5} style={delay(0.5)} />
            <g className="bp-fade" style={delay(2.3)}>
              <g className="animate-sway">
                <path d="M396 48V96" className="stroke-stone-400" strokeWidth={1.2} />
                <path d="M366 96H426V102H400V112H426V118H366V112H392V102H366Z" className="fill-amber-400" />
              </g>
            </g>
          </g>
          <g className="bp-fade fill-stone-400 font-mono text-[11px]" style={delay(2.2)}>
            <text x="178" y="416">12.40 M</text>
            <text x="505" y="260">7.20 M</text>
          </g>
        </svg>
      </div>

      <div className="animate-float absolute -left-3 top-16 w-48 rounded-2xl border border-white/10 bg-stone-900/90 p-3.5 shadow-2xl backdrop-blur-md sm:-left-10 sm:w-56" style={delay(0)}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone-400">Pipeline</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-2xl font-black text-white">$8.4M</p>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            12%
          </span>
        </div>
        <div className="mt-3 flex h-8 items-end gap-1">
          {[40, 55, 45, 70, 62, 85, 100].map((height, index) => (
            <span key={index} className="flex-1 rounded-sm bg-amber-400/80" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>

      <div className="animate-float absolute -right-2 top-1/2 w-52 rounded-2xl border border-white/10 bg-stone-900/90 p-3.5 shadow-2xl backdrop-blur-md sm:-right-8 sm:w-60" style={delay(1.6)}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-rose-400/15 text-rose-300">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Duplicate blocked</p>
            <p className="truncate text-xs text-stone-400">INV-2041 · Summit Lumber</p>
          </div>
        </div>
      </div>

      <div className="animate-float absolute -bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-white p-3.5 text-stone-950 shadow-2xl sm:left-12 sm:right-auto sm:w-72" style={delay(0.8)}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{workspace}</p>
            <p className="text-xs text-stone-500">Phase 3 · Interior finishes</p>
          </div>
          <BadgeCheck className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
          <div className="animate-shimmer h-full w-[72%] rounded-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400" />
        </div>
        <p className="mt-1.5 text-right text-[0.65rem] font-bold text-stone-500">72% complete</p>
      </div>
    </div>
  );
}
