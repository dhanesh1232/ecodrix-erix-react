"use client";
// src/ai/useErixAi.ts
// AI-powered hooks for lead scoring, reply suggestions, and summaries.
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";

// ── Lead score ────────────────────────────────────────────────────────────────

export function useLeadScore(leadId: string | null) {
  const sdk   = useErixClient();
  const [score, setScore]     = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!leadId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    sdk.crm.leads
      .retrieve(leadId)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setScore(res?.data?.score ?? res?.score ?? null);
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

  const recalculate = React.useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.crm.leads.recalculateScore(leadId);
      setScore(res?.data?.score ?? res?.score ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sdk, leadId]);

  return { score, loading, error, recalculate };
}

// ── Smart reply suggestions ───────────────────────────────────────────────────

export interface SmartReplySuggestion {
  id:   string;
  text: string;
  tone: "professional" | "friendly" | "urgent";
}

export function useSmartReplies(conversationId: string | null) {
  const sdk = useErixClient();
  const [suggestions, setSuggestions] = React.useState<SmartReplySuggestion[]>([]);
  const [loading, setLoading]         = React.useState(false);

  const generate = React.useCallback(async (lastMessage?: string) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res: any = await sdk.request("POST", "/api/saas/ai/smart-replies", {
        conversationId,
        lastMessage,
      });
      setSuggestions(res?.data ?? res ?? []);
    } catch {
      // Graceful degradation — AI is non-critical
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [sdk, conversationId]);

  return {
    suggestions,
    loading,
    generate,
    clear: () => setSuggestions([]),
  };
}

// ── Lead AI summary ──────────────────────────────────────────────────────────

export function useLeadAiSummary(leadId: string | null) {
  const sdk = useErixClient();
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!leadId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    sdk
      .request("GET", `/api/saas/ai/leads/${leadId}/summary`)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setSummary(res?.data?.summary ?? null);
      })
      .catch((e: Error) => {
        if (ctrl.signal.aborted) return;
        setError(e.message);
        setSummary(null);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [sdk, leadId]);

  return { summary, loading, error };
}
