"use client";

import { Send } from "lucide-react";
import { cn } from "../../../lib/utils";

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "erix-text-muted-foreground erix-bg-muted/10 erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-p-8 erix-text-center",
        className,
      )}
    >
      <div className="erix-bg-muted erix-mb-4 erix-flex erix-h-16 erix-w-16 erix-items-center erix-justify-center erix-rounded-full">
        <Send className="erix-text-muted-foreground/50 erix-h-8 erix-w-8" />
      </div>
      <h3 className="erix-text-foreground erix-text-lg erix-font-semibold">
        Your Messages
      </h3>
      <p className="erix-mt-2 erix-max-w-xs erix-text-sm">
        Send and receive messages without keeping your phone online.
      </p>
      <div className="erix-bg-background erix-border-border erix-mt-8 erix-flex erix-items-center erix-gap-2 erix-rounded-full erix-border erix-p-2 erix-px-4 erix-text-xs">
        <span className="erix-h-2 erix-w-2 erix-animate-pulse erix-rounded-full erix-bg-primary"></span>{" "}
        End-to-end encrypted
      </div>
    </div>
  );
}
