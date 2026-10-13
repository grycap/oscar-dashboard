import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface ExpandCardProps {
  title: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  setExpandedState?: (expanded: boolean) => void;
}

export function ExpandCard({
  title,
  subtitle,
  badge,
  className = "",
  children,
  defaultExpanded = false,
  setExpandedState,
}: ExpandCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (setExpandedState) setExpandedState(next);
  };

  return (
    <Card
      className={`border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-2xl overflow-hidden transition-all duration-200 ${className}`}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-5 py-4 flex items-center justify-between gap-3 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="grid sm:grid-cols-[1fr_auto] grid-cols-1 items-center"> 
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                {title}
              </div>
              <div>
                {badge}
              </div>
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-slate-400 dark:text-slate-500">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            {expanded ? "Collapse" : "Expand"}
          </span>
          <div
            className={`p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-transform duration-200 ${
              expanded ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
            }`}
          >
            <ChevronDown size={18} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in-50 duration-150">
          {children}
        </div>
      )}
    </Card>
  );
}

export default ExpandCard;