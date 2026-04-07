"use client";

import { format, isValid } from "date-fns";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface StatusTimelineProps {
  history: Array<{
    status: string;
    timestamp: string | number | Date;
  }>;
}

export default function StatusTimeline({ history }: StatusTimelineProps) {
  if (!history || history.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return <Check className="erix-h-3 erix-w-3 erix-text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="erix-h-3 erix-w-3 erix-text-muted-foreground" />;
      case "read":
        return <CheckCheck className="erix-h-3 erix-w-3 erix-text-[#53bdeb]" />;
      case "failed":
        return <AlertCircle className="erix-h-3 erix-w-3 erix-text-destructive" />;
      default:
        return <Clock className="erix-h-3 erix-w-3 erix-text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      case "failed":
        return "Failed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="erix-flex erix-flex-col erix-gap-2.5 erix-min-w-[120px]">
      <h4 className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-wider erix-text-muted-foreground/60">
        Message Status
      </h4>
      <div className="erix-flex erix-flex-col erix-gap-3">
        {history
          .slice()
          .reverse()
          .map((item, i) => {
            const date = new Date(item.timestamp);
            const isValidDate = isValid(date);
            return (
              <div key={i} className="erix-relative erix-flex erix-items-start erix-gap-2.5">
                <div className="erix-relative erix-z-10 erix-mt-0.5 erix-flex erix-h-5 erix-w-5 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-bg-white erix-shadow-sm erix-ring-1 erix-ring-black/5">
                  {getStatusIcon(item.status)}
                </div>
                <div className="erix-flex erix-flex-col erix-leading-none">
                  <span className="erix-text-[11px] erix-font-bold erix-text-foreground">
                    {getStatusLabel(item.status)}
                  </span>
                  <span className="erix-font-mono erix-text-[9px] erix-font-medium erix-opacity-60 erix-mt-0.5">
                    {isValidDate ? format(date, "h:mm:ss a") : "---"}
                  </span>
                </div>
                {i < history.length - 1 && (
                  <div className="erix-absolute erix-top-[10px] erix-left-[10px] erix-h-[calc(100%+8px)] erix-w-px erix-bg-black/10" />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
