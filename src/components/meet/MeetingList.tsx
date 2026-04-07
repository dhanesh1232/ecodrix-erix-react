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
    <div className="erix-flex erix-items-center erix-gap-4 erix-rounded-xl erix-border erix-border-border erix-bg-card erix-p-4 transition-shadow hover:erix-shadow-md hover:erix-shadow-black/10">
      {/* Date block */}
      <div className="erix-flex erix-shrink-0 erix-flex-col erix-items-center erix-rounded-xl erix-bg-muted/60 px-3 py-2.5 erix-text-center">
        <span className="erix-text-[10px] font-semibold erix-uppercase erix-tracking-wider erix-text-muted-foreground">
          {start.toLocaleDateString("en", { month: "short" })}
        </span>
        <span className="erix-text-2xl font-bold erix-leading-none erix-text-foreground">{start.getDate()}</span>
        <span className="erix-text-[10px] erix-text-muted-foreground">{start.toLocaleDateString("en", { weekday: "short" })}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 erix-flex-1">
        <div className="erix-flex erix-items-center erix-gap-2">
          <p className="erix-truncate erix-text-sm font-semibold erix-text-foreground">{meeting.participantName}</p>
          <ErixBadge variant={statusVariant[meeting.status]} size="sm" dot>{meeting.status}</ErixBadge>
        </div>
        <div className="mt-1 erix-flex erix-flex-wrap erix-items-center erix-gap-x-3 erix-gap-y-1 erix-text-xs erix-text-muted-foreground">
          <span className="erix-flex erix-items-center erix-gap-1">
            <Phone className="erix-size-3" />
            {meeting.participantPhone}
          </span>
          <span className="erix-flex erix-items-center erix-gap-1">
            <Clock className="erix-size-3" />
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" "}({duration}m)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="erix-flex erix-shrink-0 erix-items-center erix-gap-2">
        {meeting.meetLink && (
          <a
            href={meeting.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="erix-flex erix-items-center erix-gap-1.5 erix-rounded-lg erix-bg-blue-500/15 px-3 py-1.5 erix-text-xs font-medium erix-text-blue-400 transition-colors hover:erix-bg-blue-500/25"
          >
            <Video className="erix-size-3.5" />
            Join
            <ExternalLink className="erix-size-3" />
          </a>
        )}
        {meeting.status === "scheduled" && (
          <>
            {onReschedule && (
              <button
                type="button"
                onClick={() => onReschedule(meeting._id)}
                className="erix-rounded-lg erix-border erix-border-border px-2.5 py-1.5 erix-text-xs erix-text-muted-foreground hover:erix-bg-muted transition-colors"
              >
                Reschedule
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={() => onCancel(meeting._id)}
                className="erix-rounded-lg erix-border erix-border-red-500/20 px-2.5 py-1.5 erix-text-xs erix-text-red-400 hover:erix-bg-red-500/10 transition-colors"
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
    <div className="erix-flex erix-flex-col erix-gap-4 erix-p-6">
      <div className="erix-flex erix-items-center erix-justify-between">
        <div>
          <h2 className="erix-text-xl font-bold erix-tracking-tight">Meetings</h2>
          <p className="erix-text-sm erix-text-muted-foreground">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</p>
        </div>
        {onScheduleNew && (
          <button
            type="button"
            onClick={onScheduleNew}
            className="erix-flex erix-items-center erix-gap-1.5 erix-rounded-xl erix-bg-primary px-4 py-2 erix-text-sm font-semibold erix-text-primary-foreground hover:erix-opacity-90 transition-opacity"
          >
            <Plus className="erix-size-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="erix-flex erix-h-48 erix-items-center erix-justify-center"><ErixSpinner size="lg" /></div>
      ) : meetings.length === 0 ? (
        <div className="erix-flex erix-flex-col erix-items-center erix-gap-3 erix-rounded-2xl erix-border erix-border-dashed erix-border-border py-16">
          <Calendar className="erix-size-10 erix-text-muted-foreground erix-opacity-30" />
          <p className="erix-text-sm erix-text-muted-foreground">No meetings yet</p>
          {onScheduleNew && (
            <button
              type="button"
              onClick={onScheduleNew}
              className="erix-rounded-xl erix-bg-muted px-4 py-2 erix-text-sm erix-text-muted-foreground hover:erix-bg-muted/80"
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
