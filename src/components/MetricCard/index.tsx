import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export type MetricStatusColor =
  | "emerald"
  | "blue"
  | "indigo"
  | "amber"
  | "rose"
  | "purple"
  | "slate";

export interface MetricSegment {
  label: string;
  percentage: number;
  /** Tailwind background classes, e.g. "bg-blue-500 dark:bg-blue-400" */
  color: string;
  /** Optional text shown in the legend instead of "<percentage>%" */
  valueLabel?: string;
}

interface MetricCardProps {
  /**
   * Multi-segment progress bar with legend. When provided it replaces the
   * single `percentage` bar and disables threshold-based colors.
   * - "overlay": every segment is measured from 0 (later segments are drawn on top).
   * - "stacked": segments are placed one after another.
   */
  segments?: MetricSegment[];
  segmentsMode?: "overlay" | "stacked";
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  icon?: ReactNode;
  percentage?: number;
  percentageLabel?: string;
  colorScheme?: MetricStatusColor;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const COLOR_STYLES: Record<
  MetricStatusColor,
  {
    iconBg: string;
    iconText: string;
    borderAccent: string;
    progressBar: string;
  }
> = {
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
    borderAccent: "border-emerald-200/60 dark:border-emerald-800/60",
    progressBar: "bg-emerald-500 dark:bg-emerald-400",
  },
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconText: "text-blue-600 dark:text-blue-400",
    borderAccent: "border-blue-200/60 dark:border-blue-800/60",
    progressBar: "bg-blue-500 dark:bg-blue-400",
  },
  indigo: {
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconText: "text-indigo-600 dark:text-indigo-400",
    borderAccent: "border-indigo-200/60 dark:border-indigo-800/60",
    progressBar: "bg-indigo-500 dark:indigo-400",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconText: "text-amber-600 dark:text-amber-400",
    borderAccent: "border-amber-200/60 dark:border-amber-800/60",
    progressBar: "bg-amber-500 dark:bg-amber-400",
  },
  rose: {
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    iconText: "text-rose-600 dark:text-rose-400",
    borderAccent: "border-rose-200/60 dark:border-rose-800/60",
    progressBar: "bg-rose-500 dark:bg-rose-400",
  },
  purple: {
    iconBg: "bg-purple-50 dark:bg-purple-950/40",
    iconText: "text-purple-600 dark:text-purple-400",
    borderAccent: "border-purple-200/60 dark:border-purple-800/60",
    progressBar: "bg-purple-500 dark:bg-purple-400",
  },
  slate: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconText: "text-slate-600 dark:text-slate-300",
    borderAccent: "border-slate-200/60 dark:border-slate-700/60",
    progressBar: "bg-slate-600 dark:bg-slate-400",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  percentage,
  percentageLabel,
  segments,
  segmentsMode = "overlay",
  colorScheme = "emerald",
  size = "md",
  className = "",
  onClick,
}: MetricCardProps) {
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const hasSegments = !!segments && segments.length > 0;
  const styles = COLOR_STYLES[colorScheme] || COLOR_STYLES.emerald;
  const isDanger = percentage !== undefined && percentage >= 85;
  const isWarning = percentage !== undefined && !isDanger && percentage >= 70;

  const actualProgressColor = isDanger
    ? "bg-rose-500 dark:bg-rose-400"
    : isWarning
    ? "bg-amber-500 dark:bg-amber-400"
    : styles.progressBar;

  const isSmall = size === "sm";

  return (
    <Card
      onClick={onClick}
      className={`border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs ${
        isSmall ? "rounded-xl p-3.5" : "rounded-2xl p-5"
      } flex flex-col justify-between transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm" : ""
      } ${className}`}
    >
      <CardContent className={`p-0 ${isSmall ? "gap-2" : "gap-3"} h-full flex flex-col`}>
        {/* Header row: Label + Icon */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`${
              isSmall ? "text-[11px]" : "text-xs"
            } font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate`}
          >
            {title}
          </span>
          {icon && (
            <div
              className={`${
                isSmall ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl"
              } ${styles.iconBg} ${styles.iconText} flex items-center justify-center shrink-0 border ${styles.borderAccent}`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value row */}
        <div className="flex items-baseline justify-between gap-2">
          <div
            className={`${
              isSmall ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
            } font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono`}
          >
            {value}
          </div>
        </div>
        
        {/* Subtitle / Contextual metadata */}
        {subtitle && (
          <div
            className={`${
              isSmall ? "text-[11px]" : "text-xs"
            } text-slate-500 dark:text-slate-400 pt-0.5 leading-relaxed truncate`}
            title={typeof subtitle === "string" ? subtitle : undefined}
          >
            {subtitle}
          </div>
        )}
        <div className="mt-auto">
        {/* Multi-segment progress bar with legend */}
        {hasSegments && (
          <div className="flex flex-col gap-1.5">
            <div
              className={`${isSmall ? "h-1.5" : "h-2"} w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex`}
            >
              {segments!.map((seg, i) => {
                const width = clamp(seg.percentage);
                return segmentsMode === "overlay" ? (
                  <div
                    key={i}
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${seg.color}`}
                    style={{ width: `${width}%` }}
                  />
                ) : (
                  <div
                    key={i}
                    className={`h-full transition-all duration-500 ${seg.color}`}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {[...segments!].reverse().map((seg, i) => (
                <div
                  key={i}
                  className={`${isSmall ? "text-[11px]" : "text-xs"} flex items-center gap-1.5 text-slate-600 dark:text-slate-300`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${seg.color}`} />
                  <span>{seg.label}</span>
                  <span className="font-mono font-bold">{seg.valueLabel ?? `${seg.percentage}%`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Progress bar if percentage provided */}
        {!hasSegments && percentage !== undefined && (
          <div className="flex flex-col">
            <span
              className={`${
                isSmall ? "text-[11px]" : "text-xs"
              } font-bold font-mono ${
                isDanger
                  ? "text-rose-600 dark:text-rose-400"
                  : isWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-600 dark:text-slate-300"
              } self-end mb-1`}
            >
              {percentageLabel ?? `${percentage}% used`}
            </span>
            <div className={`${isSmall ? "h-1" : "h-1.5"} w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${actualProgressColor}`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricCard;
