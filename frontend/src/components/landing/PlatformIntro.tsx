"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Phase = "assemble" | "complete" | "exit";

/** Minimum time the brand sequence plays before the doors may open. */
const ASSEMBLE_MS = 1850;
const COMPLETE_MS = 420;
const EXIT_MS = 1100;
const FONT_WAIT_MS = 1500;

/*
 * Module scope survives client-side navigation but resets on a full page
 * load, so the intro plays once per initial load of the site.
 */
let introHasPlayed = false;

export function shouldPlayPlatformIntro() {
  return !introHasPlayed;
}

const WORDMARK = "BeamLine";

function stageLabel(progress: number, waiting: boolean) {
  if (progress >= 1) return "Ready to build";
  if (waiting) return "Connecting workspace";
  if (progress < 0.35) return "Surveying the site";
  if (progress < 0.7) return "Raising the frame";
  return "Wiring operations";
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Full-screen opening sequence for the platform landing page. The BeamLine
 * mark is drafted like a blueprint, filled as steel, then the screen parts
 * along the progress beam to reveal the hero underneath.
 *
 * `ready` should become true once the page behind it is rendered. A `fade`
 * exit is used when the intro only served as a loader (e.g. tenant sites).
 */
export function PlatformIntro({
  ready,
  exitStyle = "split",
  onReveal,
  onDone,
}: {
  ready: boolean;
  exitStyle?: "split" | "fade";
  onReveal?: () => void;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("assemble");
  const [progress, setProgress] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const startRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const measureSeamRef = useRef<() => void>(() => {});
  const callbacks = useRef({ onReveal, onDone });
  const ids = useId();
  const clipId = `${ids}-tile`;

  useEffect(() => {
    callbacks.current = { onReveal, onDone };
  }, [onReveal, onDone]);

  // The doors split along the progress beam, wherever it lands on this screen.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    const measure = () => {
      if (root.dataset.phase === "exit") return;
      const rect = track.getBoundingClientRect();
      root.style.setProperty("--seam-y", `${Math.round(rect.top + rect.height / 2)}px`);
    };
    measureSeamRef.current = measure;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Hold the reveal until web fonts are in, so text never swaps mid-entrance.
  useEffect(() => {
    let alive = true;
    const markReady = () => {
      if (alive) setFontsReady(true);
    };
    const timeout = window.setTimeout(markReady, FONT_WAIT_MS);
    if (document.fonts?.ready) {
      document.fonts.ready.then(markReady, markReady);
    } else {
      markReady();
    }
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  // Keep the page still underneath the overlay.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // Assemble: animate progress and wait for the minimum time + readiness.
  useEffect(() => {
    if (phase !== "assemble") return;
    const reduce = prefersReducedMotion();
    const minMs = reduce || skipRequested ? 0 : ASSEMBLE_MS;
    if (startRef.current === null) startRef.current = performance.now();
    const start = startRef.current;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = minMs > 0 ? Math.min(1, elapsed / minMs) : 1;
      // Ease toward 92%; the final stretch completes once the page is ready.
      setProgress(0.92 * (1 - Math.pow(1 - t, 3)));
      if (ready && fontsReady && elapsed >= minMs) {
        setPhase("complete");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, ready, fontsReady, skipRequested]);

  // Complete → exit → done.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    if (phase === "complete") {
      setProgress(1);
      measureSeamRef.current();
      const id = window.setTimeout(() => {
        setPhase("exit");
        callbacks.current.onReveal?.();
      }, reduce || skipRequested ? 0 : COMPLETE_MS);
      return () => window.clearTimeout(id);
    }
    if (phase === "exit") {
      const id = window.setTimeout(() => {
        introHasPlayed = true;
        callbacks.current.onDone?.();
      }, reduce ? 150 : exitStyle === "fade" ? 420 : EXIT_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase, skipRequested, exitStyle]);

  // Escape skips the remaining sequence.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSkipRequested(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const percent = Math.round(progress * 100);
  const waiting = phase === "assemble" && progress >= 0.91 && !(ready && fontsReady);

  return (
    <div
      ref={rootRef}
      data-phase={phase}
      data-exit={exitStyle}
      className={`fixed inset-0 z-[70] overflow-hidden text-white ${phase === "exit" ? "pointer-events-none" : ""}`}
    >
      <p role="status" className="sr-only">
        {phase === "assemble" ? "Loading BeamLine" : "BeamLine loaded"}
      </p>

      {/* Doors that part along the progress beam */}
      <div
        aria-hidden="true"
        className={`intro-panel intro-panel-top absolute inset-x-0 top-0 h-[var(--seam-y,50%)] border-b bg-stone-950 ${
          phase === "exit" ? "border-amber-400/40" : "border-transparent"
        }`}
      />
      <div
        aria-hidden="true"
        className={`intro-panel intro-panel-bottom absolute inset-x-0 bottom-0 top-[var(--seam-y,50%)] border-t bg-stone-950 ${
          phase === "exit" ? "border-amber-400/40" : "border-transparent"
        }`}
      />

      {/* Blueprint grid + warm glow, matching the hero behind */}
      <div
        aria-hidden="true"
        className="intro-layer absolute inset-0 opacity-50 [background-image:linear-gradient(rgb(251_191_36/0.1)_1px,transparent_1px),linear-gradient(90deg,rgb(251_191_36/0.1)_1px,transparent_1px),linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:96px_96px,96px_96px,24px_24px,24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]"
      />
      <div aria-hidden="true" className="intro-layer absolute inset-0 flex items-center justify-center">
        <div className="intro-glow size-[min(95vw,44rem)] rounded-full [background:radial-gradient(circle,rgb(251_191_36/0.2),transparent_62%)]" />
      </div>

      {/* Seam the doors split along */}
      <div
        aria-hidden="true"
        className="intro-seam absolute inset-x-0 top-[var(--seam-y,50%)] h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_24px_4px_rgb(251_191_36/0.45)]"
      />

      {/* Brand sequence */}
      <div
        aria-hidden="true"
        className="intro-layer intro-content relative flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <svg
          viewBox="0 0 64 64"
          className="intro-mark size-20 overflow-visible sm:size-24 lg:size-28 [@media(max-height:30rem)]:size-14"
        >
          <defs>
            <clipPath id={clipId}>
              <rect width="64" height="64" rx="15" />
            </clipPath>
          </defs>
          <rect
            x="0.75"
            y="0.75"
            width="62.5"
            height="62.5"
            rx="14.5"
            pathLength={1}
            strokeWidth="1.5"
            className="intro-draw-fill fill-amber-400 stroke-amber-400"
            style={{ "--d": "0.05s", "--fd": "0.9s" } as CSSProperties}
          />
          <path
            d="M11 13H53V22H37V40H43V49H15V40H27V22H11Z"
            pathLength={1}
            strokeWidth="1.25"
            strokeLinejoin="round"
            className="intro-draw-fill fill-stone-950 stroke-stone-100"
            style={{ "--d": "0.25s", "--dur": "1s", "--fd": "1.05s", "--stroke-end": "0" } as CSSProperties}
          />
          <path
            d="M26 38.5 38 23.5"
            pathLength={1}
            strokeWidth="3.5"
            fill="none"
            className="intro-draw stroke-amber-400"
            style={{ "--d": "1.3s", "--dur": "0.4s" } as CSSProperties}
          />
          <g clipPath={`url(#${clipId})`}>
            <path d="M8 -4H22L4 68H-10Z" className="intro-glint fill-white/40" />
          </g>
        </svg>

        <p className="mt-6 flex overflow-hidden pb-1 text-4xl font-black tracking-tight sm:mt-8 sm:text-6xl lg:text-7xl [@media(max-height:30rem)]:mt-3 [@media(max-height:30rem)]:text-3xl">
          {WORDMARK.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              className={`intro-letter inline-block ${index >= 4 ? "text-amber-400" : "text-white"}`}
              style={{ "--i": index } as CSSProperties}
            >
              {char}
            </span>
          ))}
        </p>

        <p
          className="intro-fade mt-3 max-w-xs text-balance text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-stone-400 sm:max-w-none sm:text-xs [@media(max-height:30rem)]:mt-1"
          style={{ "--d": "1.05s" } as CSSProperties}
        >
          The operating system for custom home builders
        </p>

        <div
          className="intro-fade mt-10 w-[min(78vw,22rem)] sm:mt-12 [@media(max-height:30rem)]:mt-5"
          style={{ "--d": "0.35s" } as CSSProperties}
        >
          <div className="flex items-center justify-between font-mono text-[0.7rem] uppercase tracking-widest text-stone-500 tabular-nums">
            <span>{stageLabel(progress, waiting)}</span>
            <span className="text-amber-300">{String(percent).padStart(2, "0")}%</span>
          </div>
          <div ref={trackRef} className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full origin-left rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-200 transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      </div>

      {phase === "assemble" && !skipRequested && (
        <button
          type="button"
          onClick={() => setSkipRequested(true)}
          className="intro-fade btn-ghost btn-sm absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 text-stone-400 hover:bg-white/10 hover:text-white sm:right-6"
          style={{ "--d": "0.8s" } as CSSProperties}
        >
          Skip intro
        </button>
      )}
    </div>
  );
}
