"use client";
// src/ai/useErixAi.ts
// AI-powered hooks for lead scoring, reply suggestions, and summaries.
// Uses sdk.request() escape-hatch — assumes AI endpoints on the backend.

import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";

// ── Lead score badge ──────────────────────────────────────────────────────────
export function useLeadScore(leadId: string | null) {
  const sdk   = useErixClient();
  const [score, setScore]     = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    sdk.crm.leads.retrieve(leadId)
      .then((res: any) => setScore(res?.data?.score ?? res?.score ?? null))
      .finally(() => setLoading(false));
  }, [sdk, leadId]);

  const recalculate = React.useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res: any = await sdk.crm.leads.recalculateScore(leadId);
      setScore(res?.data?.score ?? res?.score ?? null);
    } finally { setLoading(false); }
  }, [sdk, leadId]);

  return { score, loading, recalculate };
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
    } finally { setLoading(false); }
  }, [sdk, conversationId]);

  return { suggestions, loading, generate, clear: () => setSuggestions([]) };
}

// ── Lead AI summary ──────────────────────────────────────────────────────────
export function useLeadAiSummary(leadId: string | null) {
  const sdk = useErixClient();
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    sdk.request("GET", `/api/saas/ai/leads/${leadId}/summary`)
      .then((res: any) => setSummary(res?.data?.summary ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [sdk, leadId]);

  return { summary, loading };
}
