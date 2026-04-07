"use client";
// src/components/whatsapp/MessageBubble.tsx
import * as React from "react";
import { Star, Check, CheckCheck, AlertCircle } from "lucide-react";
import type { Message } from "@/types/platform";
import { cn } from "@/lib/utils";

const statusIcon = (status: Message["status"]) => {
  if (status === "read") return <CheckCheck className="erix-size-3 erix-text-blue-400" />;
  if (status === "delivered")
    return <CheckCheck className="erix-size-3 erix-text-muted-foreground" />;
  if (status === "sent")
    return <Check className="erix-size-3 erix-text-muted-foreground" />;
  if (status === "failed")
    return <AlertCircle className="erix-size-3 erix-text-red-400" />;
  return null;
};

export function MessageBubble({ message }: { message: Message }) {
  const isOut = message.direction === "outbound";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("erix-flex erix-w-full", isOut ? "erix-justify-end" : "erix-justify-start")}>
      <div
        className={cn(
          "erix-group erix-relative erix-max-w-[75%] erix-rounded-2xl px-3.5 py-2.5 erix-text-sm erix-shadow-sm",
          isOut
            ? "erix-rounded-br-sm erix-bg-primary erix-text-primary-foreground"
            : "erix-rounded-bl-sm erix-bg-muted erix-text-foreground erix-border erix-border-border",
        )}
      >
        {/* Template label */}
        {message.type === "template" && (
          <div
            className={cn(
              "mb-1.5 erix-text-xs font-medium erix-opacity-70",
              isOut ? "erix-text-primary-foreground" : "erix-text-muted-foreground",
            )}
          >
            📋 {message.templateName ?? "Template"}
          </div>
        )}

        {/* Media */}
        {message.mediaUrl && message.mediaType?.startsWith("image") && (
          <img
            src={message.mediaUrl}
            alt="media"
            className="mb-2 max-h-48 erix-w-full erix-rounded-lg erix-object-cover"
          />
        )}
        {message.mediaUrl && message.mediaType?.startsWith("video") && (
          <video
            src={message.mediaUrl}
            controls
            className="mb-2 max-h-48 erix-w-full erix-rounded-lg"
          />
        )}

        {/* Text */}
        {message.text && (
          <p className="erix-whitespace-pre-wrap erix-break-words">{message.text}</p>
        )}

        {/* Footer */}
        <div
          className={cn(
            "mt-1 erix-flex erix-items-center erix-justify-end erix-gap-1.5",
            isOut ? "erix-opacity-70" : "erix-opacity-50",
          )}
        >
          {message.isStarred && (
            <Star className="erix-size-2.5 erix-fill-amber-400 erix-text-amber-400" />
          )}
          {message.reaction && (
            <span className="erix-text-sm">{message.reaction}</span>
          )}
          <span className="erix-text-[10px]">{time}</span>
          {isOut && statusIcon(message.status)}
        </div>
      </div>
    </div>
  );
}

// src/components/whatsapp/TemplateSelector.tsx
