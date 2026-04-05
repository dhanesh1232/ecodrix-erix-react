// src/lib/useFetch.ts — Escape-hatch fetcher using the SDK client
// Prefer sdk.crm/whatsapp/meet methods in hooks. Use this only for
// non-standard endpoints not covered by the SDK resource namespaces.

import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Thin hook that makes an authenticated GET request via the SDK client.
 * Re-fetches whenever `path` changes. Path should be relative, e.g. "/api/saas/foo".
 */
export function useFetch<T>(path: string | null): FetchState<T> & { refetch: () => void } {
  const sdk = useErixClient();
  const [state, setState] = React.useState<FetchState<T>>({
    data: null, loading: false, error: null,
  });

  const fetch_ = React.useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await sdk.request("GET", path) as any;
      setState({ data: res?.data ?? res, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [path, sdk]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  return { ...state, refetch: fetch_ };
}

/**
 * Mutation helper — escape-hatch for endpoints not covered by SDK namespaces.
 */
export function useMutation<TBody = unknown, TResult = unknown>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
) {
  const sdk = useErixClient();
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  const mutate = React.useCallback(
    async (body?: TBody): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.request(method, path, body) as any;
        return (res?.data ?? res) as TResult;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [path, method, sdk],
  );

  return { mutate, loading, error };
}
