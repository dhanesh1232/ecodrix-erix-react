"use client";
// src/components/meet/MeetingList.tsx
import * as React from "react";
import { Video, Calendar, Clock, ExternalLink, Plus, Phone } from "lucide-react";
import { useMeetings } from "@/hooks/meet/useMeetings";
import { ErixBadge } from "@/components/ui/erix-badge";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import type { Meeting, MeetingStatus } from "@/types/platform";
import { cn } from "@/lib/utils";

const statusVariant: Record<MeetingStatus, "default" | "info" | "success" | "danger" | "warning"> = {
  pending: "warning",
  scheduled: "info",
  completed: "success",
  cancelled: "danger",
};

function MeetingRow({ meeting, onReschedule, onCancel }: {
  meeting: Meeting;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md hover:shadow-black/10">
      {/* Date block */}
      <div className="flex shrink-0 flex-col items-center rounded-xl bg-muted/60 px-3 py-2.5 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {start.toLocaleDateString("en", { month: "short" })}
        </span>
        <span className="text-2xl font-bold leading-none text-foreground">{start.getDate()}</span>
        <span className="text-[10px] text-muted-foreground">{start.toLocaleDateString("en", { weekday: "short" })}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{meeting.participantName}</p>
          <ErixBadge variant={statusVariant[meeting.status]} size="sm" dot>{meeting.status}</ErixBadge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="size-3" />
            {meeting.participantPhone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" "}({duration}m)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {meeting.meetLink && (
          <a
            href={meeting.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/25"
          >
            <Video className="size-3.5" />
            Join
            <ExternalLink className="size-3" />
          </a>
        )}
        {meeting.status === "scheduled" && (
          <>
            {onReschedule && (
              <button
                type="button"
                onClick={() => onReschedule(meeting._id)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Reschedule
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={() => onCancel(meeting._id)}
                className="rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function MeetingList({ leadId, onScheduleNew }: { leadId?: string; onScheduleNew?: () => void }) {
  const { meetings, loading, updateStatus } = useMeetings({ leadId });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Meetings</h2>
          <p className="text-sm text-muted-foreground">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</p>
        </div>
        {onScheduleNew && (
          <button
            type="button"
            onClick={onScheduleNew}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><ErixSpinner size="lg" /></div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16">
          <Calendar className="size-10 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No meetings yet</p>
          {onScheduleNew && (
            <button
              type="button"
              onClick={onScheduleNew}
              className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/80"
            >
              Schedule your first meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <MeetingRow
              key={m._id}
              meeting={m}
              onCancel={(id) => void updateStatus(id, "cancelled")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
