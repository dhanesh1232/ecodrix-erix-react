"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "erix-peer erix-size-4 erix-shrink-0 erix-rounded-[4px] erix-border erix-border-input erix-shadow-xs erix-transition-shadow erix-outline-none focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50 disabled:erix-cursor-not-allowed disabled:erix-opacity-50 aria-invalid:erix-border-destructive aria-invalid:erix-ring-destructive/20 data-[state=checked]:erix-border-primary data-[state=checked]:erix-bg-primary data-[state=checked]:erix-text-primary-foreground dark:erix-bg-input/30 dark:erix-ring-destructive/40 dark:erix-bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="erix-grid erix-place-content-center erix-text-current erix-transition-none"
      >
        <CheckIcon className="erix-size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
