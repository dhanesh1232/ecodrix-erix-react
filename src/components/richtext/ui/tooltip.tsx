"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "erix-z-50 erix-overflow-hidden erix-rounded-lg erix-border erix-bg-popover erix-px-3 erix-py-1.5 erix-text-xs erix-font-medium erix-text-popover-foreground erix-shadow-xl erix-animate-in erix-fade-in-0 erix-zoom-in-95 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=closed]:erix-zoom-out-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2",
        "erix-border-border",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
