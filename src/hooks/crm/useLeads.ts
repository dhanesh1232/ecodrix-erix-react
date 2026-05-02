"use client";
// src/hooks/crm/useLeads.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Lead, LeadListFilters } from "@/types/platform";

export function useLeads(filters: LeadListFilters = {}) {
  const sdk = useErixClient();
  const [leads, setLeads]     = React.useState<Lead[]>([]);
  const [total, setTotal]     = React.useState(0);
  const [pages, setPages]     = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  // Stable key so useCallback dep doesn't change on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filterKey = React.useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)]);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
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
      if (signal?.aborted) return;
      setLeads(res?.data ?? []);
      setTotal(res?.pagination?.total ?? 0);
      setPages(res?.pagination?.pages ?? 1);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, filterKey]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const create = React.useCallback(async (data: Partial<Lead>): Promise<Lead> => {
    const res: any = await sdk.crm.leads.create(data as any);
    const lead = (res?.data ?? res) as Lead;
    // Prepend optimistically, full refetch reconciles
    setLeads((prev) => [lead, ...prev]);
    setTotal((t) => t + 1);
    return lead;
  }, [sdk]);

  const update = React.useCallback(async (leadId: string, data: Partial<Lead>): Promise<Lead> => {
    const res: any = await sdk.crm.leads.update(leadId, data as any);
    const updated = (res?.data ?? res) as Lead;
    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, ...updated } : l)));
    return updated;
  }, [sdk]);

  const move = React.useCallback(async (leadId: string, stageId: string): Promise<Lead> => {
    const res: any = await sdk.crm.leads.move(leadId, stageId);
    const updated = (res?.data ?? res) as Lead;
    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, stageId } : l)));
    return updated;
  }, [sdk]);

  const archive = React.useCallback(async (leadId: string): Promise<void> => {
    await sdk.crm.leads.delete(leadId);
    setLeads((prev) => prev.filter((l) => l._id !== leadId));
    setTotal((t) => Math.max(0, t - 1));
  }, [sdk]);

  const convert = React.useCallback(
    async (leadId: string, outcome: "won" | "lost", reason?: string): Promise<Lead> => {
      const res: any = await sdk.crm.leads.convert(leadId, outcome, reason);
      const updated = (res?.data ?? res) as Lead;
      void fetch_();
      return updated;
    },
    [sdk, fetch_],
  );

  return {
    leads,
    total,
    pages,
    loading,
    error,
    refetch: () => fetch_(),
    create,
    update,
    move,
    archive,
    convert,
  };
}

export function useLead(leadId: string | null) {
  const sdk = useErixClient();
  const [lead, setLead]     = React.useState<Lead | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!leadId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    sdk.crm.leads
      .retrieve(leadId)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setLead(res?.data ?? null);
      })
      .catch((e: Error) => {
        if (ctrl.signal.aborted) return;
        setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [sdk, leadId]);

  return { lead, loading, error };
}
