"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "erix-flex erix-items-center erix-gap-2 erix-text-sm erix-leading-none erix-font-medium erix-select-none group-data-[disabled=true]:erix-pointer-events-none group-data-[disabled=true]:erix-opacity-50 peer-disabled:erix-cursor-not-allowed peer-disabled:erix-opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
