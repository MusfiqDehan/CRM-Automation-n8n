"use client";

import React, { useState, useRef } from "react";
import { formatCompactCurrency } from "@/lib/format";

export interface LineChartPoint {
  label: string;
  date?: string;
  value: number;
  secondaryValue?: number;
}

export interface InteractiveLineChartProps {
  title: string;
  subtitle?: string;
  data: LineChartPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
  strokeColor?: string;
  secondaryStrokeColor?: string;
}

export function InteractiveLineChart({
  title,
  subtitle,
  data,
  primaryLabel = "Value",
  secondaryLabel,
  formatValue = (v) => formatCompactCurrency(v),
  height = 240,
  className = "",
  strokeColor = "#f59e0b", // Amber 500
  secondaryStrokeColor = "#10b981", // Emerald 500
}: InteractiveLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">{title}</h3>
        <p className="mt-8 text-center text-xs text-stone-400">No chart data for this period.</p>
      </div>
    );
  }

  // Calculate scales
  const allValues = data.flatMap((d) => [d.value, ...(d.secondaryValue !== undefined ? [d.secondaryValue] : [])]);
  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;
  const chartWidth = 560;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    return paddingTop + innerHeight - ((clamped - minValue) / valueRange) * innerHeight;
  };

  // Generate SVG polyline path strings
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(" ");
  const areaPath = `M ${getX(0)},${paddingTop + innerHeight} L ${data
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(" L ")} L ${getX(data.length - 1)},${paddingTop + innerHeight} Z`;

  const secondaryPoints = secondaryLabel
    ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue ?? 0)}`).join(" ")
    : null;

  // Y-axis grid ticks (4 intervals)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: minValue + pct * valueRange,
    y: paddingTop + innerHeight - pct * innerHeight,
  }));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * chartWidth;

    let closestIdx = 0;
    let closestDist = Infinity;
    data.forEach((_, idx) => {
      const dist = Math.abs(getX(idx) - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className={`card p-5 space-y-4 ${className}`} ref={containerRef}>
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: strokeColor }}
            />
            <span>{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: secondaryStrokeColor }}
              />
              <span>{secondaryLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

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

          {/* Area Fill Under Primary Line */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Secondary Line (if present) */}
          {secondaryPoints && (
            <polyline
              points={secondaryPoints}
              fill="none"
              stroke={secondaryStrokeColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Primary Line */}
          <polyline
            points={primaryPoints}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points Dots */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.value);
            const isHovered = hoverIndex === i;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={isHovered ? 5.5 : 3}
                fill={isHovered ? "#ffffff" : strokeColor}
                stroke={strokeColor}
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="transition-all duration-150"
              />
            );
          })}

          {/* X-Axis Labels */}
          {data.map((d, i) => {
            // Display label every 1 or 2 steps to avoid clutter
            const step = Math.ceil(data.length / 7);
            if (i % step !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={chartHeight - 8}
                textAnchor="middle"
                className="text-[10px] fill-stone-400 font-medium"
              >
                {d.label}
              </text>
            );
          })}

          {/* Vertical Crosshair Line on Hover */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + innerHeight}
              stroke="currentColor"
              className="text-amber-500/80 dark:text-amber-400/80"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {activePoint && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-stone-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95 text-xs transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(10, (getX(hoverIndex) / chartWidth) * 100),
                80
              )}%`,
              top: "10px",
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-bold text-stone-900 dark:text-white">
              {activePoint.date || activePoint.label}
            </p>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: strokeColor }} />
                <span className="text-stone-500 dark:text-stone-400">{primaryLabel}:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {formatValue(activePoint.value)}
                </span>
              </div>
              {secondaryLabel && activePoint.secondaryValue !== undefined && (
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: secondaryStrokeColor }}
                  />
                  <span className="text-stone-500 dark:text-stone-400">{secondaryLabel}:</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    {formatValue(activePoint.secondaryValue)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
