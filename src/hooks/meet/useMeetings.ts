"use client";
// src/hooks/meet/useMeetings.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Meeting, MeetingStatus } from "@/types/platform";

export function useMeetings(filters: { leadId?: string; status?: MeetingStatus } = {}) {
  const sdk = useErixClient();
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.meet.list({
        leadId: filters.leadId,
        status: filters.status,
      } as any);
      if (signal?.aborted) return;
      setMeetings(res?.data ?? []);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk, filters.leadId, filters.status]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const schedule = React.useCallback(async (data: {
    leadId:           string;
    participantName:  string;
    participantPhone: string;
    startTime:        string;
    endTime:          string;
    duration?:        number;
  }): Promise<Meeting> => {
    const res: any = await sdk.meet.create(data as any);
    const meeting = (res?.data ?? res) as Meeting;
    setMeetings((prev) => [meeting, ...prev]);
    return meeting;
  }, [sdk]);

  const reschedule = React.useCallback(
    async (id: string, startTime: string, endTime: string, duration?: number): Promise<Meeting> => {
      const res: any = await sdk.meet.reschedule(id, { startTime, endTime, duration });
      const updated = (res?.data ?? res) as Meeting;
      setMeetings((prev) => prev.map((m) => (m._id === id ? updated : m)));
      return updated;
    },
    [sdk],
  );

  const updateStatus = React.useCallback(async (id: string, status: MeetingStatus): Promise<Meeting> => {
    const res: any = await sdk.meet.update(id, { status } as any);
    const updated = (res?.data ?? res) as Meeting;
    setMeetings((prev) => prev.map((m) => (m._id === id ? updated : m)));
    return updated;
  }, [sdk]);

  const cancel = React.useCallback(async (id: string): Promise<void> => {
    await sdk.meet.delete(id);
    setMeetings((prev) => prev.map((m) =>
      m._id === id ? { ...m, status: "cancelled" as MeetingStatus } : m,
    ));
  }, [sdk]);

  return {
    meetings,
    loading,
    error,
    refetch: () => fetch_(),
    schedule,
    reschedule,
    updateStatus,
    cancel,
  };
}
