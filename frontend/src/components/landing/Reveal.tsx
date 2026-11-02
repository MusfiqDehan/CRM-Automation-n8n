"use client";

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "./hooks";

type RevealDirection = "up" | "left" | "right" | "scale";

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: RevealDirection;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-reveal={direction}
      data-visible={inView}
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p
        className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] ${
          dark ? "text-amber-400" : "text-amber-700 dark:text-amber-400"
        }`}
      >
        <span className="h-px w-6 bg-current" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-balance text-3xl font-black tracking-tight sm:text-4xl lg:text-[3.25rem] lg:leading-[1.05] ${
          dark ? "text-white" : "text-stone-950 dark:text-white"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-pretty text-base leading-7 sm:text-lg ${
            dark ? "text-stone-300" : "text-stone-600 dark:text-stone-300"
          }`}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
