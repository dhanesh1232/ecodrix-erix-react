"use client";
// src/hooks/whatsapp/useMarketingCampaigns.ts
// Hook for fetching and creating WhatsApp broadcast campaigns.
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Broadcast } from "@/types/platform";

export function useMarketingCampaigns() {
  const sdk = useErixClient();
  const [campaigns, setCampaigns] = React.useState<Broadcast[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.whatsapp.broadcasts.list();
      if (signal?.aborted) return;
      setCampaigns(res?.data ?? []);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  return {
    campaigns,
    loading,
    error,
    refetch: () => fetch_(),
  };
}
