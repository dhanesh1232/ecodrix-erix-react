"use client";

import * as React from "react";
import type { ResourceManifest } from "@ecodrix/erix-api";
import { useErixClient } from "@/context/ErixProvider";

/**
 * Hook to fetch the UI Blueprint (ResourceManifest) for a specific SDK resource.
 *
 * @param getDescribeFn - A function that calls the .describe() method on an SDK resource.
 * @example
 * ```tsx
 * const sdk = useErixClient();
 * const { manifest, loading } = useResourceManifest(() => sdk.crm.leads.describe());
 * ```
 */
export function useResourceManifest(getDescribeFn: () => Promise<ResourceManifest>) {
  const [manifest, setManifest] = React.useState<ResourceManifest | null>(null);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<Error | null>(null);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDescribeFn();
      if (signal?.aborted) return;
      setManifest(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e as Error);
      console.error("[useResourceManifest] Failed to fetch manifest:", e);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [getDescribeFn]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  return { manifest, loading, error, refetch: () => fetch_() };
}
