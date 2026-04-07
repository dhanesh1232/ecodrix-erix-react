"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "erix-shrink-0 erix-bg-border data-[orientation=horizontal]:erix-h-px data-[orientation=horizontal]:erix-w-full data-[orientation=vertical]:erix-h-full data-[orientation=vertical]:erix-w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
