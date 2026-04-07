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
  default: "erix-from-white/5 to-white/0 border-border",
  emerald: "from-emerald-500/10 to-emerald-500/0 border-emerald-500/20",
  blue: "erix-from-blue-500/10 to-blue-500/0 border-blue-500/20",
  violet: "from-violet-500/10 to-violet-500/0 border-violet-500/20",
  amber: "from-amber-500/10 to-amber-500/0 border-amber-500/20",
};

const iconBg = {
  default: "erix-bg-muted text-muted-foreground",
  emerald: "erix-bg-emerald-500/15 text-emerald-400",
  blue: "erix-bg-blue-500/15 text-blue-400",
  violet: "erix-bg-violet-500/15 text-violet-400",
  amber: "erix-bg-amber-500/15 text-amber-400",
};

export function StatCard({ label, value, sub, trend, icon, className, loading, color = "default" }: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "erix-relative erix-overflow-hidden erix-rounded-2xl erix-border erix-bg-gradient-to-br erix-p-5 transition-shadow hover:erix-shadow-lg hover:erix-shadow-black/20",
        colorMap[color],
        className,
      )}
    >
      <div className="erix-flex erix-items-start erix-justify-between erix-gap-3">
        <div className="min-w-0">
          <p className="erix-text-xs font-medium erix-text-muted-foreground erix-uppercase erix-tracking-wider erix-truncate">{label}</p>
          {loading ? (
            <div className="mt-2 erix-h-8 erix-w-24 erix-animate-pulse erix-rounded erix-bg-muted" />
          ) : (
            <p className="mt-1 erix-text-3xl font-bold erix-tracking-tight erix-text-foreground">{value}</p>
          )}
          {sub && <p className="mt-1 erix-text-xs erix-text-muted-foreground">{sub}</p>}
        </div>
        {icon && (
          <div className={cn("erix-shrink-0 erix-rounded-xl erix-p-2.5", iconBg[color])}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div
          className={cn(
            "mt-3 erix-inline-flex erix-items-center erix-gap-1 erix-rounded-full px-2 py-0.5 erix-text-xs font-medium",
            trendPositive && "erix-bg-emerald-500/15 erix-text-emerald-400",
            trendNegative && "erix-bg-red-500/15 erix-text-red-400",
            !trendPositive && !trendNegative && "erix-bg-muted erix-text-muted-foreground",
          )}
        >
          <TrendIcon className="erix-size-3" />
          {trendPositive && "+"}
          {trend.toFixed(1)}%
          <span className="ml-0.5 erix-text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
