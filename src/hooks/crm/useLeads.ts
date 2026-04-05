"use client";
// src/hooks/crm/useLeads.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Lead, LeadListFilters } from "@/types/platform";

export function useLeads(filters: LeadListFilters = {}) {
  const sdk = useErixClient();
  const [leads, setLeads]   = React.useState<Lead[]>([]);
  const [total, setTotal]   = React.useState(0);
  const [pages, setPages]   = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.crm.leads.list({
        page:       filters.page,
        limit:      filters.limit,
        search:     filters.search,
        status:     filters.status as any,
        pipelineId: filters.pipelineId,
        stageId:    filters.stageId,
        source:     filters.source as any,
        assignedTo: filters.assignedTo,
        minScore:   filters.minScore,
        startDate:  filters.startDate,
        endDate:    filters.endDate,
        tags:       filters.tags as any,
      });
      setLeads(res?.data ?? []);
      setTotal(res?.pagination?.total ?? 0);
      setPages(res?.pagination?.pages ?? 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, JSON.stringify(filters)]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  const create = React.useCallback(async (data: Partial<Lead>) => {
    const res: any = await sdk.crm.leads.create(data as any);
    void fetch_();
    return res?.data as Lead;
  }, [sdk, fetch_]);

  const update = React.useCallback(async (leadId: string, data: Partial<Lead>) => {
    const res: any = await sdk.crm.leads.update(leadId, data as any);
    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, ...res?.data } : l)));
    return res?.data as Lead;
  }, [sdk]);

  const move = React.useCallback(async (leadId: string, stageId: string) => {
    const res: any = await sdk.crm.leads.move(leadId, stageId);
    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, stageId } : l)));
    return res?.data as Lead;
  }, [sdk]);

  const archive = React.useCallback(async (leadId: string) => {
    await sdk.crm.leads.delete(leadId);
    setLeads((prev) => prev.filter((l) => l._id !== leadId));
  }, [sdk]);

  const convert = React.useCallback(
    async (leadId: string, outcome: "won" | "lost", reason?: string) => {
      const res: any = await sdk.crm.leads.convert(leadId, outcome, reason);
      void fetch_();
      return res?.data as Lead;
    },
    [sdk, fetch_],
  );

  return { leads, total, pages, loading, error, refetch: fetch_, create, update, move, archive, convert };
}

export function useLead(leadId: string | null) {
  const sdk = useErixClient();
  const [lead, setLead]     = React.useState<Lead | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    sdk.crm.leads.retrieve(leadId)
      .then((res: any) => setLead(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, leadId]);

  return { lead, loading };
}
