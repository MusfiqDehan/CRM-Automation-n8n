"use client";

import React, { useState } from "react";
import { formatCompactCurrency } from "@/lib/format";

export interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  subtext?: string;
}

export interface InteractiveBarChartProps {
  title: string;
  subtitle?: string;
  data: BarChartItem[];
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
}

export function InteractiveBarChart({
  title,
  subtitle,
  data,
  primaryLabel = "Amount",
  secondaryLabel,
  formatValue = (v) => formatCompactCurrency(v),
  height = 240,
  className = "",
}: InteractiveBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">{title}</h3>
        <p className="mt-8 text-center text-xs text-stone-400">No chart data available.</p>
      </div>
    );
  }

  const defaultColors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.value, ...(d.secondaryValue !== undefined ? [d.secondaryValue] : [])]),
    1
  );

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = 560;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const numItems = data.length;
  const groupWidth = innerWidth / numItems;
  const barWidth = Math.min(36, groupWidth * 0.55);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: pct * maxValue,
    y: paddingTop + innerHeight - pct * innerHeight,
  }));

  const activeItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className={`card p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {activeItem && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <span>{activeItem.label}:</span>
            <span className="font-mono">{formatValue(activeItem.value)}</span>
          </div>
        )}
      </div>

      {/* Responsive Bar Chart SVG */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto cursor-pointer"
          role="img"
          aria-label={title}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y-Axis Grid Lines & Labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="currentColor"
                className="text-stone-200 dark:text-stone-800"
                strokeDasharray={i === 0 ? "none" : "3 3"}
                strokeWidth={i === 0 ? "1.5" : "1"}
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-stone-400 font-mono"
              >
                {formatValue(tick.val)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const isHovered = hoverIndex === i;
            const isAnyHovered = hoverIndex !== null;
            const barHeight = Math.max(4, (d.value / maxValue) * innerHeight);
            const xCenter = paddingLeft + i * groupWidth + groupWidth / 2;
            const barX = xCenter - barWidth / 2;
            const barY = paddingTop + innerHeight - barHeight;
            const color = d.color || defaultColors[i % defaultColors.length];

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                className="transition-opacity duration-200"
                opacity={isAnyHovered && !isHovered ? 0.4 : 1}
              >
                {/* Bar Background Hover Area */}
                <rect
                  x={xCenter - groupWidth / 2}
                  y={paddingTop}
                  width={groupWidth}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Visible Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={color}
                  className="transition-all duration-200"
                  filter={isHovered ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))" : undefined}
                />

                {/* Top Value on Bar (if enough height) */}
                {barHeight > 24 && (
                  <text
                    x={xCenter}
                    y={barY - 5}
                    textAnchor="middle"
                    className="text-[9px] fill-stone-700 dark:fill-stone-300 font-mono font-bold"
                  >
                    {formatValue(d.value)}
                  </text>
                )}

                {/* X-Axis Category Label */}
                <text
                  x={xCenter}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className={`text-[10px] transition-colors ${
                    isHovered
                      ? "fill-stone-900 dark:fill-white font-bold"
                      : "fill-stone-400 font-medium"
                  }`}
                >
                  {d.label.length > 12 ? `${d.label.slice(0, 10)}…` : d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {activeItem && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-stone-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95 text-xs transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(
                  15,
                  ((paddingLeft + hoverIndex * groupWidth + groupWidth / 2) / chartWidth) * 100
                ),
                80
              )}%`,
              top: "10px",
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-bold text-stone-900 dark:text-white">{activeItem.label}</p>
            {activeItem.subtext && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400">{activeItem.subtext}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    activeItem.color || defaultColors[hoverIndex % defaultColors.length],
                }}
              />
              <span className="text-stone-500 dark:text-stone-400">{primaryLabel}:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white">
                {formatValue(activeItem.value)}
              </span>
            </div>
            {secondaryLabel && activeItem.secondaryValue !== undefined && (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-stone-500 dark:text-stone-400">{secondaryLabel}:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">
                  {formatValue(activeItem.secondaryValue)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
