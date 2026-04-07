"use client";
// src/components/analytics/AnalyticsDashboard.tsx
import * as React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Wallet,
  Star,
  MessageSquare,
  Trophy,
  Funnel,
  Activity,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { useAnalyticsOverview, useAnalyticsFunnel, useAnalyticsSources, useAnalyticsTeam, useWhatsAppAnalytics } from "@/hooks/crm/useAnalytics";
import type { AnalyticsRange } from "@/types/platform";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "24h", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "60 days", value: "60d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "365d" },
];

const CHART_COLORS = ["#6366f1", "#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

export function AnalyticsDashboard({ pipelineId }: { pipelineId?: string }) {
  const [range, setRange] = React.useState<AnalyticsRange>("30d");

  const { data: overview, loading: ov } = useAnalyticsOverview({ range });
  const { data: funnel, loading: fv } = useAnalyticsFunnel(pipelineId ?? null);
  const { data: sources, loading: sv } = useAnalyticsSources({ range });
  const { data: team, loading: tv } = useAnalyticsTeam({ range });
  const { data: waAnalytics, loading: wv } = useWhatsAppAnalytics({ range });

  return (
    <div className="erix-flex erix-flex-col erix-gap-6 erix-p-6">
      {/* Header */}
      <div className="erix-flex erix-items-center erix-justify-between">
        <div>
          <h2 className="erix-text-2xl font-bold erix-tracking-tight erix-text-foreground">Analytics</h2>
          <p className="erix-text-sm erix-text-muted-foreground">Business intelligence across your pipeline</p>
        </div>
        {/* Range selector */}
        <div className="erix-flex erix-gap-1 erix-rounded-xl erix-border erix-border-border erix-bg-muted/40 erix-p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                range === r.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:erix-text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="erix-grid erix-grid-cols-2 erix-gap-4 lg:erix-grid-cols-4">
        <StatCard
          label="Total Leads"
          value={overview?.totalLeads ?? "—"}
          sub={overview?.newLeads ? `${overview.newLeads} new` : undefined}
          icon={<Users className="erix-size-5" />}
          color="blue"
          loading={ov}
        />
        <StatCard
          label="Conversion Rate"
          value={overview ? `${(overview.conversionRate * 100).toFixed(1)}%` : "—"}
          icon={<TrendingUp className="erix-size-5" />}
          color="emerald"
          loading={ov}
        />
        <StatCard
          label="Pipeline Value"
          value={overview ? `$${(overview.pipelineValue / 1000).toFixed(1)}k` : "—"}
          sub={overview ? `$${(overview.wonRevenue / 1000).toFixed(1)}k won` : undefined}
          icon={<Wallet className="erix-size-5" />}
          color="violet"
          loading={ov}
        />
        <StatCard
          label="Avg Score"
          value={overview ? overview.avgScore.toFixed(0) : "—"}
          icon={<Star className="erix-size-5" />}
          color="amber"
          loading={ov}
        />
      </div>

      {/* Row 2 — Funnel + Source Breakdown */}
      <div className="erix-grid erix-gap-4 lg:erix-grid-cols-2">
        {/* Funnel */}
        <div className="erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-5">
          <div className="mb-4 erix-flex erix-items-center erix-gap-2">
            <Funnel className="erix-size-4 erix-text-muted-foreground" />
            <h3 className="erix-text-sm font-semibold erix-text-foreground">Pipeline Funnel</h3>
          </div>
          {fv ? (
            <div className="erix-flex erix-h-48 erix-items-center erix-justify-center"><ErixSpinner /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel ?? []} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="stageName" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-5">
          <div className="mb-4 erix-flex erix-items-center erix-gap-2">
            <Activity className="erix-size-4 erix-text-muted-foreground" />
            <h3 className="erix-text-sm font-semibold erix-text-foreground">Lead Sources</h3>
          </div>
          {sv ? (
            <div className="erix-flex erix-h-48 erix-items-center erix-justify-center"><ErixSpinner /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sources ?? []}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, percent }) => `${source} ${(percent! * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(sources ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3 — WhatsApp volume + Team Leaderboard */}
      <div className="erix-grid erix-gap-4 lg:erix-grid-cols-2">
        {/* WA Volume Chart */}
        <div className="erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-5">
          <div className="mb-4 erix-flex erix-items-center erix-gap-2">
            <MessageSquare className="erix-size-4 erix-text-muted-foreground" />
            <h3 className="erix-text-sm font-semibold erix-text-foreground">WhatsApp Volume</h3>
            {waAnalytics && (
              <span className="ml-auto erix-text-xs erix-text-muted-foreground">
                {waAnalytics.totalSent} sent · {waAnalytics.read} read
              </span>
            )}
          </div>
          {wv ? (
            <div className="erix-flex erix-h-48 erix-items-center erix-justify-center"><ErixSpinner /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={waAnalytics?.dailyVolume ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Leaderboard */}
        <div className="erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-5">
          <div className="mb-4 erix-flex erix-items-center erix-gap-2">
            <Trophy className="erix-size-4 erix-text-muted-foreground" />
            <h3 className="erix-text-sm font-semibold erix-text-foreground">Team Leaderboard</h3>
          </div>
          {tv ? (
            <div className="erix-flex erix-h-48 erix-items-center erix-justify-center"><ErixSpinner /></div>
          ) : (
            <div className="space-y-3">
              {(team ?? []).slice(0, 5).map((member, i) => (
                <div key={member.name} className="erix-flex erix-items-center erix-gap-3">
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-zinc-500/20 text-zinc-400" :
                    i === 2 ? "bg-orange-700/20 text-orange-600" :
                    "erix-bg-muted text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div className="min-w-0 erix-flex-1">
                    <p className="erix-truncate erix-text-sm font-medium">{member.name}</p>
                    <div className="mt-0.5 erix-h-1.5 erix-w-full erix-overflow-hidden erix-rounded-full erix-bg-muted">
                      <div
                        className="erix-h-full erix-rounded-full erix-bg-primary transition-all"
                        style={{ width: `${Math.min((member.wonDeals / ((team?.[0]?.wonDeals ?? 1) || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="erix-text-right">
                    <p className="erix-text-sm font-semibold">{member.wonDeals} won</p>
                    <p className="erix-text-xs erix-text-muted-foreground">${(member.revenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              ))}
              {(team ?? []).length === 0 && (
                <p className="erix-text-center erix-text-sm erix-text-muted-foreground py-8">No team data yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
