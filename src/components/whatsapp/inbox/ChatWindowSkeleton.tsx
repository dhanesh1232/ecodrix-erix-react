"use client";

import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../../lib/utils";

interface ChatWindowSkeletonProps {
  className?: string;
  /** Pass the chat object to render real contact info in the header */
  chat?: { name?: string; phone?: string; avatar?: string };
}

export function ChatWindowSkeleton({
  className,
  chat,
}: ChatWindowSkeletonProps) {
  return (
    <div className={cn("erix-bg-[#f0f2f5] erix-flex erix-flex-1 erix-flex-col", className)}>
      {/* Header — renders real contact info if available, skeleton otherwise */}
      <div className="erix-border-border erix-bg-[#f0f2f5] erix-flex erix-h-[60px] erix-items-center erix-justify-between erix-border-b erix-p-3">
        <div className="erix-flex erix-items-center erix-gap-3">
          {chat ? (
            <>
              <Avatar className="erix-h-9 erix-w-9">
                <AvatarFallback className="erix-bg-primary/10 erix-text-primary erix-text-xs erix-font-semibold">
                  {chat.avatar || (chat.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="erix-flex erix-flex-col erix-gap-0.5">
                <span className="erix-text-sm erix-font-semibold erix-leading-none">
                  {chat.name}
                </span>
                <span className="erix-text-muted-foreground erix-text-[10px] erix-leading-none">
                  {chat.phone}
                </span>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="erix-h-9 erix-w-9 erix-rounded-full" />
              <div className="erix-flex erix-flex-col erix-gap-1.5">
                <Skeleton className="erix-h-3.5 erix-w-28" />
                <Skeleton className="erix-h-2.5 erix-w-20" />
              </div>
            </>
          )}
        </div>
        <div className="erix-flex erix-items-center erix-gap-1">
          <Skeleton className="erix-h-8 erix-w-8 erix-rounded-full" />
        </div>
      </div>

      {/* Messages Area Skeleton — WhatsApp chat pattern */}
      <div
        className="erix-flex erix-flex-1 erix-flex-col erix-gap-3 erix-px-4 erix-py-3 erix-overflow-hidden"
        style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "overlay",
          backgroundColor: "#efeae2",
        }}
      >
        <div className="erix-flex erix-justify-start">
          <Skeleton className="erix-h-10 erix-w-[55%] erix-rounded-lg erix-rounded-tl-none erix-bg-white/80" />
        </div>
        <div className="erix-flex erix-justify-end">
          <Skeleton className="erix-h-10 erix-w-[40%] erix-rounded-lg erix-rounded-tr-none erix-bg-[#dcf8c6]/80" />
        </div>
        <div className="erix-flex erix-justify-start">
          <Skeleton className="erix-h-16 erix-w-[65%] erix-rounded-lg erix-rounded-tl-none erix-bg-white/80" />
        </div>
        <div className="erix-flex erix-justify-end">
          <Skeleton className="erix-h-12 erix-w-[35%] erix-rounded-lg erix-rounded-tr-none erix-bg-[#dcf8c6]/80" />
        </div>
        <div className="erix-flex erix-justify-end">
          <Skeleton className="erix-h-10 erix-w-[50%] erix-rounded-lg erix-rounded-tr-none erix-bg-[#dcf8c6]/80" />
        </div>
        <div className="erix-flex erix-justify-start">
          <Skeleton className="erix-h-10 erix-w-[48%] erix-rounded-lg erix-rounded-tl-none erix-bg-white/80" />
        </div>
        <div className="erix-flex erix-justify-end">
          <Skeleton className="erix-h-10 erix-w-[38%] erix-rounded-lg erix-rounded-tr-none erix-bg-[#dcf8c6]/80" />
        </div>
        <div className="erix-flex erix-justify-start">
          <Skeleton className="erix-h-12 erix-w-[60%] erix-rounded-lg erix-rounded-tl-none erix-bg-white/80" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="erix-border-border erix-bg-[#f0f2f5] erix-flex erix-items-center erix-gap-2 erix-border-t erix-p-3">
        <Skeleton className="erix-h-9 erix-w-9 erix-rounded-full" />
        <Skeleton className="erix-h-9 erix-w-9 erix-rounded-full" />
        <Skeleton className="erix-h-10 erix-flex-1 erix-rounded-full" />
        <Skeleton className="erix-h-9 erix-w-9 erix-rounded-full" />
      </div>
    </div>
  );
}
