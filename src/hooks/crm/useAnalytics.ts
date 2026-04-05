"use client";
// src/hooks/crm/useAnalytics.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type {
  AnalyticsRange,
  OverviewKPIs,
  FunnelStage,
  SourceBreakdown,
  TeamMember,
  WhatsAppAnalytics,
} from "@/types/platform";

interface UseAnalyticsOptions {
  range?: AnalyticsRange;
  from?:  string;
  to?:    string;
}

/** Build a { range, from, to } params object for the CRM analytics resource. */
function rangeParams(range: AnalyticsRange, from?: string, to?: string) {
  return { range, ...(from ? { from } : {}), ...(to ? { to } : {}) };
}

export function useAnalyticsOverview(opts: UseAnalyticsOptions = {}) {
  const sdk = useErixClient();
  const { range = "30d", from, to } = opts;
  const [data, setData]       = React.useState<OverviewKPIs | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    sdk.crm.analytics.overview(rangeParams(range, from, to) as any)
      .then((res: any) => setData(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, range, from, to]);

  return { data, loading };
}

export function useAnalyticsFunnel(pipelineId: string | null) {
  const sdk = useErixClient();
  const [data, setData]       = React.useState<FunnelStage[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!pipelineId) return;
    setLoading(true);
    sdk.crm.analytics.funnel({ pipelineId } as any)
      .then((res: any) => setData(res?.data ?? []))
      .finally(() => setLoading(false));
  }, [sdk, pipelineId]);

  return { data, loading };
}

export function useAnalyticsSources(opts: UseAnalyticsOptions = {}) {
  const sdk = useErixClient();
  const { range = "30d", from, to } = opts;
  const [data, setData]       = React.useState<SourceBreakdown[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    sdk.crm.analytics.sources(rangeParams(range, from, to) as any)
      .then((res: any) => setData(res?.data ?? []))
      .finally(() => setLoading(false));
  }, [sdk, range, from, to]);

  return { data, loading };
}

export function useAnalyticsTeam(opts: UseAnalyticsOptions = {}) {
  const sdk = useErixClient();
  const { range = "30d", from, to } = opts;
  const [data, setData]       = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    sdk.crm.analytics.team(rangeParams(range, from, to) as any)
      .then((res: any) => setData(res?.data ?? []))
      .finally(() => setLoading(false));
  }, [sdk, range, from, to]);

  return { data, loading };
}

export function useWhatsAppAnalytics(opts: UseAnalyticsOptions = {}) {
  const sdk = useErixClient();
  const { range = "30d", from, to } = opts;
  const [data, setData]       = React.useState<WhatsAppAnalytics | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    // Uses the raw escape-hatch for the WhatsApp analytics endpoint
    sdk.request("GET", "/api/saas/crm/analytics/whatsapp", undefined, rangeParams(range, from, to))
      .then((res: any) => setData(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, range, from, to]);

  return { data, loading };
}

export function useAnalyticsSummary(opts: UseAnalyticsOptions = {}) {
  const sdk = useErixClient();
  const { range = "30d", from, to } = opts;
  const [data, setData]       = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    sdk.crm.analytics.summary(rangeParams(range, from, to) as any)
      .then((res: any) => setData(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, range, from, to]);

  return { data, loading };
}
