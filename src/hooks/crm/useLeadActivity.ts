"use client";
// src/hooks/crm/useLeadActivity.ts
// Hooks for lead activity timeline and pinnable notes.
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { LeadActivity, LeadNote } from "@/types/platform";

// ─── useLeadActivities ────────────────────────────────────────────────────────

export function useLeadActivities(leadId: string | null) {
  const sdk = useErixClient();
  const [activities, setActivities] = React.useState<LeadActivity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.crm.leads.activities(leadId);
      if (signal?.aborted) return;
      setActivities(res?.data ?? []);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk, leadId]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  return { activities, loading, error, refetch: () => fetch_() };
}

// ─── useLeadNotes ─────────────────────────────────────────────────────────────

export function useLeadNotes(leadId: string | null) {
  const sdk = useErixClient();
  const [notes, setNotes] = React.useState<LeadNote[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.crm.leads.notes(leadId);
      if (signal?.aborted) return;
      setNotes(res?.data ?? []);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk, leadId]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const createNote = React.useCallback(
    async (content: string): Promise<LeadNote> => {
      const res: any = await sdk.crm.leads.createNote(leadId!, { content });
      const note = (res?.data ?? res) as LeadNote;
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    [sdk, leadId],
  );

  const updateNote = React.useCallback(
    async (noteId: string, content: string): Promise<void> => {
      await sdk.crm.leads.updateNote(leadId!, noteId, { content });
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n)),
      );
    },
    [sdk, leadId],
  );

  const deleteNote = React.useCallback(
    async (noteId: string): Promise<void> => {
      await sdk.crm.leads.deleteNote(leadId!, noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    },
    [sdk, leadId],
  );

  const pinNote = React.useCallback(
    async (noteId: string, isPinned: boolean): Promise<void> => {
      await sdk.crm.leads.updateNote(leadId!, noteId, { isPinned } as any);
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, isPinned } : n)),
      );
    },
    [sdk, leadId],
  );

  return {
    notes,
    loading,
    error,
    refetch: () => fetch_(),
    createNote,
    updateNote,
    deleteNote,
    pinNote,
  };
}
