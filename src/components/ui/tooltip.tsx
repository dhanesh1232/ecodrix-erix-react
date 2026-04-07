"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "erix-z-50 erix-w-fit erix-origin-(--radix-tooltip-content-transform-origin) erix-animate-in erix-rounded-md erix-bg-foreground erix-px-3 erix-py-1.5 erix-text-xs erix-text-balance erix-text-background erix-fade-in-0 erix-zoom-in-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=closed]:erix-zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="erix-z-50 erix-size-2.5 erix-translate-y-[calc(-50%_-_2px)] erix-rotate-45 erix-rounded-[2px] erix-bg-foreground erix-fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
