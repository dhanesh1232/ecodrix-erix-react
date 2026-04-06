"use client";
// src/hooks/crm/useAutomations.ts
// Full CRUD hook for automation rules.
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { AutomationRule } from "@/types/platform";

export function useAutomations() {
  const sdk = useErixClient();
  const [rules, setRules] = React.useState<AutomationRule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await sdk.crm.automations.list();
        if (signal?.aborted) return;
        setRules(res?.data ?? []);
      } catch (e) {
        if (signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [sdk],
  );

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const create = React.useCallback(
    async (
      data: Omit<
        AutomationRule,
        "_id" | "createdAt" | "updatedAt" | "runCount" | "lastRunAt"
      >,
    ): Promise<AutomationRule> => {
      const res: any = await sdk.crm.automations.create(data as any);
      const rule = (res?.data ?? res) as AutomationRule;
      setRules((prev) => [...prev, rule]);
      return rule;
    },
    [sdk],
  );

  const update = React.useCallback(
    async (
      id: string,
      patch: Partial<AutomationRule>,
    ): Promise<AutomationRule> => {
      const res: any = await sdk.crm.automations.update(id, patch as any);
      const updated = (res?.data ?? res) as AutomationRule;
      setRules((prev) => prev.map((r) => (r._id === id ? updated : r)));
      return updated;
    },
    [sdk],
  );

  const toggle = React.useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      await sdk.crm.automations.update(id, { isActive } as any);
      setRules((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isActive } : r)),
      );
    },
    [sdk],
  );

  const remove = React.useCallback(
    async (id: string): Promise<void> => {
      await sdk.crm.automations.delete(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
    },
    [sdk],
  );

  return {
    rules,
    loading,
    error,
    refetch: () => fetch_(),
    create,
    update,
    toggle,
    remove,
  };
}
