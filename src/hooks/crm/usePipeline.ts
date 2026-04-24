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

        const boardData = boardRes?.data;
        if (boardData && !boardData.columns) {
          // If board is returned but columns are missing, treat as invalid/loading
          setBoard(null);
        } else {
          setBoard((boardData as KanbanBoard) ?? null);
        }
        setStageManifest((manifestRes as ResourceManifest) ?? null);
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

  const moveLead = React.useCallback(
    async (leadId: string, toStageId: string) => {
      // Optimistic update
      setBoard((prev) => {
        if (!prev) return null;
        let leadToMove: any;

        const newCols = prev.columns.map((col) => {
          const found = col.leads.find((l) => l._id === leadId);
          if (found) {
            leadToMove = { ...found, stageId: toStageId };
            return {
              ...col,
              leads: col.leads.filter((l) => l._id !== leadId),
              total: Math.max(0, col.total - 1),
            };
          }
          return col;
        });

        if (leadToMove) {
          return {
            ...prev,
            columns: newCols.map((col) => {
              if (col.stage._id === toStageId) {
                return {
                  ...col,
                  leads: [...col.leads, leadToMove],
                  total: col.total + 1,
                };
              }
              return col;
            }),
          };
        }
        return prev;
      });

      try {
        await sdk.crm.leads.move(leadId, toStageId);
      } catch (e) {
        void fetch_();
        throw e;
      }
    },
    [sdk, fetch_],
  );

  return {
    board,
    stageManifest,
    loading,
    error,
    refetch: () => fetch_(),
    moveLead,
  };
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
        const rows = res?.data || [];
        const grandTotal = rows.reduce(
          (acc: number, r: any) => acc + (r.expectedRevenue || 0),
          0,
        );
        const totalPipeline = rows.reduce(
          (acc: number, r: any) => acc + (r.totalValue || 0),
          0,
        );
        setForecast({ rows, grandTotal, totalPipeline });
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

export function usePipelineMutations() {
  const sdk = useErixClient();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createPipeline = React.useCallback(
    async (payload: Partial<Pipeline>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.create(payload as any);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const updatePipeline = React.useCallback(
    async (id: string, payload: Partial<Pipeline>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.update(id, payload as any);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const archivePipeline = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.update(id, {
          isActive: false,
        } as any);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const deletePipeline = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await sdk.crm.pipelines.delete(id);
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const setDefaultPipeline = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.setDefault(id);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const checkPipelineInUse = React.useCallback(
    async (id: string) => {
      try {
        const res: any = await sdk.crm.pipelines.checkInUse(id);
        return res?.data?.inUse || false;
      } catch (err) {
        return false;
      }
    },
    [sdk],
  );

  // Stage Mutations
  const addStage = React.useCallback(
    async (pipelineId: string, stage: Partial<PipelineStage>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.addStage(pipelineId, stage as any);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const updateStage = React.useCallback(
    async (stageId: string, payload: Partial<PipelineStage>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.updateStage(
          stageId,
          payload as any,
        );
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const deleteStage = React.useCallback(
    async (stageId: string) => {
      setLoading(true);
      setError(null);
      try {
        await sdk.crm.pipelines.deleteStage(stageId);
        return true;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  const reorderStages = React.useCallback(
    async (pipelineId: string, stageIds: string[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await sdk.crm.pipelines.reorderStages(pipelineId, stageIds);
        return res?.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk],
  );

  return {
    createPipeline,
    updatePipeline,
    archivePipeline,
    deletePipeline,
    setDefaultPipeline,
    checkPipelineInUse,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    loading,
    error,
  };
}
