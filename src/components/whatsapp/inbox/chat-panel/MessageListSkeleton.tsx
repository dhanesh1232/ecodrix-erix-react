"use client";

import { Skeleton } from "../../../ui/skeleton";
import { cn } from "../../../../lib/utils";

// A realistic skeleton that mimics the natural variance of real chat messages
const SKELETON_ROWS: Array<{
  side: "left" | "right";
  widths: string[];
  height: string;
}> = [
  { side: "left", widths: ["erix-w-[55%]"], height: "erix-h-10" },
  { side: "right", widths: ["erix-w-[40%]"], height: "erix-h-10" },
  {
    side: "left",
    widths: ["erix-w-[65%]", "erix-w-[50%]"],
    height: "erix-h-10",
  },
  { side: "right", widths: ["erix-w-[35%]"], height: "erix-h-12" },
  { side: "left", widths: ["erix-w-[48%]"], height: "erix-h-10" },
  { side: "right", widths: ["erix-w-[60%]"], height: "erix-h-10" },
  { side: "right", widths: ["erix-w-[45%]"], height: "erix-h-10" },
  {
    side: "left",
    widths: ["erix-w-[70%]", "erix-w-[30%]"],
    height: "erix-h-10",
  },
  { side: "right", widths: ["erix-w-[50%]"], height: "erix-h-10" },
  { side: "left", widths: ["erix-w-[42%]"], height: "erix-h-10" },
];

export function MessageListSkeleton() {
  return (
    <div
      className="erix-flex erix-flex-1 erix-flex-col erix-gap-2 erix-px-4 erix-py-3 erix-overflow-hidden"
      style={{
        backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
        backgroundSize: "400px",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "overlay",
        backgroundColor: "#efeae2",
      }}
    >
      {SKELETON_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            "erix-flex erix-flex-col erix-gap-1",
            row.side === "erix-right" ? "erix-items-end" : "erix-items-start",
          )}
        >
          {row.widths.map((width, wIdx) => (
            <Skeleton
              key={wIdx}
              className={cn(
                width,
                row.height,
                "erix-rounded-lg",
                row.side === "erix-right"
                  ? "erix-rounded-tr-none erix-bg-[#dcf8c6]/80"
                  : "erix-rounded-tl-none erix-bg-white/80",
              )}
            />
          ))}
          {/* Tiny timestamp line */}
          <Skeleton
            className={cn(
              "erix-h-2 erix-w-10 erix-opacity-50",
              row.side === "erix-right"
                ? "erix-bg-[#dcf8c6]/60"
                : "erix-bg-white/60",
            )}
          />
        </div>
      ))}
    </div>
  );
}
