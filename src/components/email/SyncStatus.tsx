"use client";
// src/components/email/SyncStatus.tsx
// Small pill-shaped indicator showing the current auto-save state.
// Uses role="status" so screen readers announce changes.

import * as React from "react";
import { CheckCircle, CloudOff, Loader2, Minus } from "lucide-react";
import type { SyncStatusValue } from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SyncStatusProps {
  status: SyncStatusValue;
  lastSyncedAt?: string | null;
  className?: string;
}

const CONFIG = {
  idle: {
    icon: Minus,
    label: "All changes saved",
    variant: "outline" as const,
    className: "erix-text-muted-foreground erix-bg-muted/30",
    animate: false,
  },
  saving: {
    icon: Loader2,
    label: "Saving…",
    variant: "outline" as const,
    className: "erix-text-blue-500 erix-border-blue-500/20 erix-bg-blue-500/5",
    animate: true,
  },
  saved: {
    icon: CheckCircle,
    label: "Saved",
    variant: "outline" as const,
    className:
      "erix-text-emerald-500 erix-border-emerald-500/20 erix-bg-emerald-500/5",
    animate: false,
  },
  error: {
    icon: CloudOff,
    label: "Save failed",
    variant: "destructive" as const,
    className: "erix-bg-destructive/10",
    animate: false,
  },
} as const;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SyncStatus({
  status,
  lastSyncedAt,
  className = "",
}: SyncStatusProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;

  return (
    <Badge
      variant={cfg.variant}
      className={cn(
        "erix-flex erix-items-center erix-gap-1.5 erix-rounded-full erix-px-2.5 erix-py-0.5 erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-tighter erix-transition-all erix-duration-300 erix-h-6",
        cfg.className,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={cfg.label}
    >
      <Icon
        className={cn(
          "erix-h-3 erix-w-3 erix-shrink-0",
          cfg.animate && "erix-animate-spin",
        )}
        aria-hidden="true"
      />
      <span className="erix-truncate">
        {cfg.label}
        {status === "saved" && lastSyncedAt
          ? ` at ${formatTime(lastSyncedAt)}`
          : ""}
      </span>
    </Badge>
  );
}
