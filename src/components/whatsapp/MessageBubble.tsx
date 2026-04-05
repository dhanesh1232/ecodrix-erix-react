"use client";
// src/components/whatsapp/MessageBubble.tsx
import * as React from "react";
import { Star, Check, CheckCheck, AlertCircle } from "lucide-react";
import type { Message } from "@/types/platform";
import { cn } from "@/lib/utils";

const statusIcon = (status: Message["status"]) => {
  if (status === "read") return <CheckCheck className="size-3 text-blue-400" />;
  if (status === "delivered")
    return <CheckCheck className="size-3 text-muted-foreground" />;
  if (status === "sent")
    return <Check className="size-3 text-muted-foreground" />;
  if (status === "failed")
    return <AlertCircle className="size-3 text-red-400" />;
  return null;
};

export function MessageBubble({ message }: { message: Message }) {
  const isOut = message.direction === "outbound";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex w-full", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group relative max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          isOut
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground border border-border",
        )}
      >
        {/* Template label */}
        {message.type === "template" && (
          <div
            className={cn(
              "mb-1.5 text-xs font-medium opacity-70",
              isOut ? "text-primary-foreground" : "text-muted-foreground",
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
            className="mb-2 max-h-48 w-full rounded-lg object-cover"
          />
        )}
        {message.mediaUrl && message.mediaType?.startsWith("video") && (
          <video
            src={message.mediaUrl}
            controls
            className="mb-2 max-h-48 w-full rounded-lg"
          />
        )}

        {/* Text */}
        {message.text && (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {/* Footer */}
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1.5",
            isOut ? "opacity-70" : "opacity-50",
          )}
        >
          {message.isStarred && (
            <Star className="size-2.5 fill-amber-400 text-amber-400" />
          )}
          {message.reaction && (
            <span className="text-sm">{message.reaction}</span>
          )}
          <span className="text-[10px]">{time}</span>
          {isOut && statusIcon(message.status)}
        </div>
      </div>
    </div>
  );
}

// src/components/whatsapp/TemplateSelector.tsx
