"use client";
// src/hooks/crm/usePipeline.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { ResourceManifest } from "@ecodrix/erix-api";
import type { Pipeline, KanbanBoard, PipelineForecast } from "@/types/platform";

export function usePipelines() {
  const sdk = useErixClient();
  const [pipelines, setPipelines] = React.useState<Pipeline[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await sdk.crm.pipelines.list();
        if (signal?.aborted) return;
        setPipelines(res?.data ?? []);
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

  return { pipelines, loading, error, refetch: () => fetch_() };
}

export function usePipelineBoard(pipelineId: string | null) {
  const sdk = useErixClient();
  const [board, setBoard] = React.useState<KanbanBoard | null>(null);
  const [stageManifest, setStageManifest] =
    React.useState<ResourceManifest | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch_ = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!pipelineId) return;
      setLoading(true);
      setError(null);
      try {
        const [boardRes, manifestRes] = await Promise.all([
          sdk.crm.pipelines.board(pipelineId),
          sdk.crm.pipelines.getStageManifest(pipelineId),
        ]);

        if (signal?.aborted) return;

        setBoard(boardRes?.data ?? null);
        setStageManifest(manifestRes || []);
      } catch (e) {
        if (signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [sdk, pipelineId],
  );

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  return { board, stageManifest, loading, error, refetch: () => fetch_() };
}

export function usePipelineForecast(pipelineId: string | null) {
  const sdk = useErixClient();
  const [forecast, setForecast] = React.useState<PipelineForecast | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pipelineId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    sdk.crm.pipelines
      .forecast(pipelineId)
      .then((res: any) => {
        if (ctrl.signal.aborted) return;
        setForecast(res?.data ?? null);
      })
      .catch((e: Error) => {
        if (ctrl.signal.aborted) return;
        setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [sdk, pipelineId]);

  return { forecast, loading, error };
}
