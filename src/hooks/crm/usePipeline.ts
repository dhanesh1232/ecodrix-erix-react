"use client";
// src/hooks/crm/usePipeline.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Pipeline, KanbanBoard } from "@/types/platform";

export function usePipelines() {
  const sdk = useErixClient();
  const [pipelines, setPipelines] = React.useState<Pipeline[]>([]);
  const [loading, setLoading]     = React.useState(false);

  const fetch_ = React.useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await sdk.crm.pipelines.list();
      setPipelines(res?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  return { pipelines, loading, refetch: fetch_ };
}

export function usePipelineBoard(pipelineId: string | null) {
  const sdk = useErixClient();
  const [board, setBoard]     = React.useState<KanbanBoard | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetch_ = React.useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    try {
      const res: any = await sdk.crm.pipelines.board(pipelineId);
      setBoard(res?.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [sdk, pipelineId]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  return { board, loading, refetch: fetch_ };
}

export function usePipelineForecast(pipelineId: string | null) {
  const sdk = useErixClient();
  const [forecast, setForecast] = React.useState<any>(null);
  const [loading, setLoading]   = React.useState(false);

  React.useEffect(() => {
    if (!pipelineId) return;
    setLoading(true);
    sdk.crm.pipelines.forecast(pipelineId)
      .then((res: any) => setForecast(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, pipelineId]);

  return { forecast, loading };
}
