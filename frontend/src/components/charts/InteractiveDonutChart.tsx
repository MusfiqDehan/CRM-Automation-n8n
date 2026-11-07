"use client";

import React, { useState } from "react";
import { formatCompactCurrency } from "@/lib/format";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  count?: number;
  subtext?: string;
}

export interface InteractiveDonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutSlice[];
  formatValue?: (v: number) => string;
  centerLabel?: string;
  className?: string;
  size?: number;
}

export function InteractiveDonutChart({
  title,
  subtitle,
  data,
  formatValue = (v) => formatCompactCurrency(v),
  centerLabel = "Total",
  className = "",
  size = 180,
}: InteractiveDonutChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">{title}</h3>
        <p className="mt-8 text-center text-xs text-stone-400">No distribution data available.</p>
      </div>
    );
  }

  const totalValue = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2 - 16;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke-dasharray and stroke-dashoffset for each slice
  let accumulatedPercent = 0;
  const slicesWithOffsets = data.map((d, i) => {
    const percent = d.value / totalValue;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...d,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      index: i,
    };
  });

  const activeSlice = hoverIndex !== null ? slicesWithOffsets[hoverIndex] : null;

  return (
    <div className={`card p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Donut and Legend Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
        {/* SVG Donut Circle */}
        <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 cursor-pointer"
            role="img"
            aria-label={title}
          >
            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-stone-100 dark:text-stone-800"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slicesWithOffsets.map((slice, i) => {
              const isHovered = hoverIndex === i;
              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  opacity={hoverIndex !== null && !isHovered ? 0.45 : 1}
                />
              );
            })}
          </svg>

          {/* Center Text Summary */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {activeSlice ? activeSlice.label : centerLabel}
            </span>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white font-mono mt-0.5">
              {activeSlice ? formatValue(activeSlice.value) : formatValue(totalValue)}
            </span>
            {activeSlice && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {activeSlice.percent}% share
              </span>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2 min-w-0">
          {slicesWithOffsets.map((slice, i) => {
            const isHovered = hoverIndex === i;
            return (
              <button
                key={slice.label}
                type="button"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition cursor-pointer ${
                  isHovered
                    ? "bg-stone-100 dark:bg-stone-800 ring-1 ring-amber-400/50"
                    : "hover:bg-stone-50 dark:hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {slice.label}
                    </p>
                    {slice.count !== undefined && (
                      <span className="text-[10px] text-stone-400">
                        {slice.count} {slice.count === 1 ? "record" : "records"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {formatValue(slice.value)}
                  </div>
                  <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                    {slice.percent}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
