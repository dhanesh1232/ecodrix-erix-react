"use client";
// src/hooks/meet/useMeetings.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Meeting, MeetingStatus } from "@/types/platform";

export function useMeetings(filters: { leadId?: string; status?: MeetingStatus } = {}) {
  const sdk = useErixClient();
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading]   = React.useState(false);

  const fetch_ = React.useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await sdk.meet.list({
        leadId: filters.leadId,
        status: filters.status,
      } as any);
      setMeetings(res?.data ?? []);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, filters.leadId, filters.status]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  const schedule = React.useCallback(async (data: {
    leadId:           string;
    participantName:  string;
    participantPhone: string;
    startTime:        string;
    endTime:          string;
  }) => {
    const res: any = await sdk.meet.create(data as any);
    void fetch_();
    return res?.data as Meeting;
  }, [sdk, fetch_]);

  const reschedule = React.useCallback(
    async (id: string, startTime: string, endTime: string, duration?: number) => {
      const res: any = await sdk.meet.reschedule(id, { startTime, endTime, duration });
      setMeetings((prev) => prev.map((m) => (m._id === id ? res?.data ?? m : m)));
      return res?.data as Meeting;
    },
    [sdk],
  );

  const updateStatus = React.useCallback(async (id: string, status: MeetingStatus) => {
    const res: any = await sdk.meet.update(id, { status } as any);
    setMeetings((prev) => prev.map((m) => (m._id === id ? res?.data ?? m : m)));
    return res?.data as Meeting;
  }, [sdk]);

  const cancel = React.useCallback(async (id: string) => {
    await sdk.meet.delete(id);
    setMeetings((prev) => prev.map((m) => (m._id === id ? { ...m, status: "cancelled" as MeetingStatus } : m)));
  }, [sdk]);

  return { meetings, loading, refetch: fetch_, schedule, reschedule, updateStatus, cancel };
}
