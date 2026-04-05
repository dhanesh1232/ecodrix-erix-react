"use client";
// src/components/analytics/StatCard.tsx
import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number; // percentage change e.g. 12.5 or -4.2
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
  color?: "default" | "emerald" | "blue" | "violet" | "amber";
}

const colorMap = {
  default: "from-white/5 to-white/0 border-border",
  emerald: "from-emerald-500/10 to-emerald-500/0 border-emerald-500/20",
  blue: "from-blue-500/10 to-blue-500/0 border-blue-500/20",
  violet: "from-violet-500/10 to-violet-500/0 border-violet-500/20",
  amber: "from-amber-500/10 to-amber-500/0 border-amber-500/20",
};

const iconBg = {
  default: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-violet-500/15 text-violet-400",
  amber: "bg-amber-500/15 text-amber-400",
};

export function StatCard({ label, value, sub, trend, icon, className, loading, color = "default" }: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-shadow hover:shadow-lg hover:shadow-black/20",
        colorMap[color],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          )}
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {icon && (
          <div className={cn("shrink-0 rounded-xl p-2.5", iconBg[color])}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            trendPositive && "bg-emerald-500/15 text-emerald-400",
            trendNegative && "bg-red-500/15 text-red-400",
            !trendPositive && !trendNegative && "bg-muted text-muted-foreground",
          )}
        >
          <TrendIcon className="size-3" />
          {trendPositive && "+"}
          {trend.toFixed(1)}%
          <span className="ml-0.5 text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
