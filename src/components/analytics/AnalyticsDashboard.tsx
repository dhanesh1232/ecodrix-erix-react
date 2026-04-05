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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Business intelligence across your pipeline</p>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                range === r.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={overview?.totalLeads ?? "—"}
          sub={overview?.newLeads ? `${overview.newLeads} new` : undefined}
          icon={<Users className="size-5" />}
          color="blue"
          loading={ov}
        />
        <StatCard
          label="Conversion Rate"
          value={overview ? `${(overview.conversionRate * 100).toFixed(1)}%` : "—"}
          icon={<TrendingUp className="size-5" />}
          color="emerald"
          loading={ov}
        />
        <StatCard
          label="Pipeline Value"
          value={overview ? `$${(overview.pipelineValue / 1000).toFixed(1)}k` : "—"}
          sub={overview ? `$${(overview.wonRevenue / 1000).toFixed(1)}k won` : undefined}
          icon={<Wallet className="size-5" />}
          color="violet"
          loading={ov}
        />
        <StatCard
          label="Avg Score"
          value={overview ? overview.avgScore.toFixed(0) : "—"}
          icon={<Star className="size-5" />}
          color="amber"
          loading={ov}
        />
      </div>

      {/* Row 2 — Funnel + Source Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Funnel className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Pipeline Funnel</h3>
          </div>
          {fv ? (
            <div className="flex h-48 items-center justify-center"><ErixSpinner /></div>
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
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Lead Sources</h3>
          </div>
          {sv ? (
            <div className="flex h-48 items-center justify-center"><ErixSpinner /></div>
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
      <div className="grid gap-4 lg:grid-cols-2">
        {/* WA Volume Chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">WhatsApp Volume</h3>
            {waAnalytics && (
              <span className="ml-auto text-xs text-muted-foreground">
                {waAnalytics.totalSent} sent · {waAnalytics.read} read
              </span>
            )}
          </div>
          {wv ? (
            <div className="flex h-48 items-center justify-center"><ErixSpinner /></div>
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
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Team Leaderboard</h3>
          </div>
          {tv ? (
            <div className="flex h-48 items-center justify-center"><ErixSpinner /></div>
          ) : (
            <div className="space-y-3">
              {(team ?? []).slice(0, 5).map((member, i) => (
                <div key={member.name} className="flex items-center gap-3">
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-zinc-500/20 text-zinc-400" :
                    i === 2 ? "bg-orange-700/20 text-orange-600" :
                    "bg-muted text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((member.wonDeals / ((team?.[0]?.wonDeals ?? 1) || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{member.wonDeals} won</p>
                    <p className="text-xs text-muted-foreground">${(member.revenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              ))}
              {(team ?? []).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No team data yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
