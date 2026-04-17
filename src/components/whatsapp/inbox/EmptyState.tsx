"use client";

import { Lock } from "lucide-react";
import { cn } from "../../../lib/utils";

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-gap-4 erix-bg-[#f0f2f5] erix-p-12 erix-text-center",
        className,
      )}
    >
      {/* Phone illustration */}
      <div className="erix-relative erix-mb-2">
        <div className="erix-flex erix-h-[120px] erix-w-[120px] erix-items-center erix-justify-center erix-rounded-full erix-bg-white/60 erix-shadow-sm erix-ring-1 erix-ring-black/5">
          <svg
            viewBox="0 0 64 64"
            className="erix-h-16 erix-w-16 erix-opacity-20"
            fill="none"
          >
            <rect
              x="12"
              y="4"
              width="40"
              height="56"
              rx="6"
              stroke="currentColor"
              strokeWidth="3"
            />
            <line
              x1="22"
              y1="10"
              x2="42"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="32" cy="54" r="2" fill="currentColor" />
          </svg>
        </div>
        <div className="erix-absolute erix-bottom-1 erix-right-1 erix-flex erix-h-8 erix-w-8 erix-items-center erix-justify-center erix-rounded-full erix-bg-[#25D366] erix-shadow-md">
          <Lock className="erix-h-4 erix-w-4 erix-text-white" />
        </div>
      </div>

      <div className="erix-max-w-xs erix-space-y-2">
        <h3 className="erix-text-[17px] erix-font-light erix-text-zinc-600">
          Download the WhatsApp app
        </h3>
        <p className="erix-text-[13px] erix-leading-relaxed erix-text-zinc-400">
          Select a conversation or start a new one from the sidebar.
        </p>
      </div>

      <div className="erix-mt-6 erix-flex erix-items-center erix-gap-1.5 erix-rounded-full erix-bg-white/70 erix-px-4 erix-py-2 erix-shadow-sm erix-ring-1 erix-ring-black/5">
        <Lock className="erix-h-3 erix-w-3 erix-text-zinc-400" />
        <span className="erix-text-[11px] erix-text-zinc-400">
          Your personal messages are end-to-end encrypted
        </span>
      </div>
    </div>
  );
}
