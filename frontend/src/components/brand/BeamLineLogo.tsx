import type { ReactNode } from "react";

type MarkTone = "dark" | "amber";

/**
 * BeamLine mark: a cantilevered steel I-beam whose web is split by a rising
 * diagonal line — the "beam" and the "line" of the name, pointing up and forward.
 */
export function BeamLineMark({
  className = "size-10",
  tone = "dark",
  title,
}: {
  className?: string;
  tone?: MarkTone;
  title?: string;
}) {
  const tile = tone === "dark" ? "fill-stone-950 dark:fill-amber-400" : "fill-amber-400";
  const beam = tone === "dark" ? "fill-amber-400 dark:fill-stone-950" : "fill-stone-950";
  const cut = tone === "dark" ? "stroke-stone-950 dark:stroke-amber-400" : "stroke-amber-400";

  return (
    <svg
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="15" className={tile} />
      <path d="M11 13H53V22H37V40H43V49H15V40H27V22H11Z" className={beam} />
      <path d="M26 38.5 38 23.5" className={cut} strokeWidth="3.5" strokeLinecap="butt" fill="none" />
    </svg>
  );
}

export function BeamLineLogo({
  markClassName = "size-10",
  tone = "dark",
  wordmarkClassName = "text-base text-stone-950 dark:text-white",
  accentClassName = "text-amber-600 dark:text-amber-400",
  subtitle,
  subtitleClassName = "text-stone-500 dark:text-stone-400",
  badge,
}: {
  markClassName?: string;
  tone?: MarkTone;
  wordmarkClassName?: string;
  accentClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  badge?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <BeamLineMark className={markClassName} tone={tone} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`font-black leading-tight tracking-tight ${wordmarkClassName}`}>
            Beam<span className={accentClassName}>Line</span>
          </span>
          {badge}
        </span>
        {subtitle && <span className={`block truncate text-[0.68rem] leading-snug ${subtitleClassName}`}>{subtitle}</span>}
      </span>
    </span>
  );
}
