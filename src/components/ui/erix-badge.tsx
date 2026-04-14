// src/components/ui/erix-badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ghost";

const variants: Record<BadgeVariant, string> = {
  default:
    "erix-bg-muted erix-text-muted-foreground erix-border erix-border-border",
  success:
    "erix-bg-emerald-500/15 erix-text-emerald-400 erix-border erix-border-emerald-500/20",
  warning:
    "erix-bg-amber-500/15 erix-text-amber-400 erix-border erix-border-amber-500/20",
  danger:
    "erix-bg-red-500/15 erix-text-red-400 erix-border erix-border-red-500/20",
  info: "erix-bg-blue-500/15 erix-text-blue-400 erix-border erix-border-blue-500/20",
  ghost:
    "erix-bg-transparent erix-text-muted-foreground erix-border erix-border-transparent",
};

export interface ErixBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export function ErixBadge({
  variant = "default",
  size = "sm",
  dot,
  className,
  children,
  ...props
}: ErixBadgeProps) {
  return (
    <span
      className={cn(
        "erix-inline-flex erix-items-center erix-gap-1.5 erix-rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 erix-text-xs" : "px-3 py-1 erix-text-sm",
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "erix-size-1.5 erix-rounded-full",
            variant === "success" && "erix-bg-emerald-400",
            variant === "warning" && "erix-bg-amber-400",
            variant === "danger" && "erix-bg-red-400",
            variant === "info" && "erix-bg-blue-400",
            variant === "default" && "erix-bg-muted-foreground",
          )}
        />
      )}
      {children}
    </span>
  );
}
