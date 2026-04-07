"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "erix-group/avatar erix-relative erix-flex erix-size-8 erix-shrink-0 erix-overflow-hidden erix-rounded-full erix-select-none data-[size=lg]:erix-size-10 data-[size=sm]:erix-size-6",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("erix-aspect-square erix-size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "erix-flex erix-size-full erix-items-center erix-justify-center erix-rounded-full erix-bg-muted erix-text-sm erix-text-muted-foreground group-data-[size=sm]/avatar:erix-text-xs",
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "erix-absolute erix-right-0 erix-bottom-0 erix-z-10 erix-inline-flex erix-items-center erix-justify-center erix-rounded-full erix-bg-primary erix-text-primary-foreground erix-ring-2 erix-ring-background erix-select-none",
        "group-data-[size=sm]/avatar:erix-size-2 group-data-[size=sm]/avatar:[&>svg]:erix-hidden",
        "group-data-[size=default]/avatar:erix-size-2.5 group-data-[size=default]/avatar:[&>svg]:erix-size-2",
        "group-data-[size=lg]/avatar:erix-size-3 group-data-[size=lg]/avatar:[&>svg]:erix-size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "erix-group/avatar-group erix-flex erix--space-x-2 *:erix-ring-2 *:erix-ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "erix-relative erix-flex erix-size-8 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-bg-muted erix-text-sm erix-text-muted-foreground erix-ring-2 erix-ring-background group-has-data-[size=lg]/avatar-group:erix-size-10 group-has-data-[size=sm]/avatar-group:erix-size-6 [&>svg]:erix-size-4 group-has-data-[size=lg]/avatar-group:erix-size-5 group-has-data-[size=sm]/avatar-group:erix-size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
