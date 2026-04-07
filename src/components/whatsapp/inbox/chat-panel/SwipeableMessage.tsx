"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import type React from "react";
import { useRef } from "react";
import { Reply } from "lucide-react";
import { cn } from "../../../../lib/utils";

// Register Draggable plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipe?: () => void;
  direction?: "left" | "right";
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableMessage({
  children,
  onSwipe,
  direction = "right",
  threshold = 60,
  className,
  disabled = false,
}: SwipeableMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const thresholdReacher = useRef(false);

  useGSAP(
    () => {
      if (disabled || !dragRef.current) return;

      // Create the draggable instance
      const draggable = Draggable.create(dragRef.current, {
        type: "x",
        cursor: "default",
        lockAxis: true,
        bounds:
          direction === "right"
            ? { minX: 0, maxX: threshold + 40 }
            : { minX: -(threshold + 40), maxX: 0 },
        edgeResistance: 0.6,
        onDrag: function () {
          const x = this.x;
          const progress = Math.min(Math.abs(x) / threshold, 1);

          // Use gsap.set for instant performance during drag
          gsap.set(iconRef.current, {
            opacity: progress,
            scale: 0.5 + progress * 0.5,
            x: x * 0.15, // Subtle parallax effect for the icon
          });

          // Trigger haptic once when threshold reached
          if (Math.abs(x) >= threshold) {
            if (!thresholdReacher.current) {
              thresholdReacher.current = true;
              if (typeof window !== "undefined" && window.navigator?.vibrate) {
                window.navigator.vibrate(10);
              }
            }
          } else {
            thresholdReacher.current = false;
          }
        },
        onRelease: function () {
          // Check if threshold was met
          if (Math.abs(this.x) >= threshold) {
            onSwipe?.();
          }

          // Snap back animation
          gsap.to(this.target, {
            x: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.8)",
          });

          // Icon fade out
          gsap.to(iconRef.current, {
            opacity: 0,
            scale: 0.5,
            x: 0,
            duration: 0.3,
            ease: "power2.out",
          });

          thresholdReacher.current = false;
        },
      })[0];

      return () => {
        draggable.kill();
      };
    },
    {
      dependencies: [disabled, direction, threshold, onSwipe],
      scope: containerRef,
    },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "erix-relative erix-flex erix-w-full erix-overflow-visible erix-select-none",
        className,
      )}
    >
      {/* Background Icon Layer - Positioned absolutely behind the moving bubble */}
      <div
        ref={iconRef}
        style={{
          left: direction === "right" ? 12 : "auto",
          right: direction === "left" ? 12 : "auto",
          opacity: 0,
          transform: "scale(0.5)",
        }}
        className="erix-bg-primary/15 erix-text-primary erix-border-primary/10 erix-absolute erix-top-1/2 erix-z-0 erix-flex erix-h-9 erix-w-9 erix--erix-translate-y-1/2 erix-items-center erix-justify-center erix-rounded-full erix-border erix-shadow-sm"
      >
        <Reply className="erix-h-4 erix-w-4" />
      </div>

      {/* Draggable Layer - This wraps everything including the bubble and its drop-down UI */}
      <div
        ref={dragRef}
        className={cn(
          "erix-relative erix-z-10 erix-flex erix-w-full erix-min-w-0 erix-cursor-default",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
