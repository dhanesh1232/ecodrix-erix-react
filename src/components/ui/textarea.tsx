import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "erix-flex erix-field-sizing-content erix-min-h-16 erix-w-full erix-rounded-md erix-border erix-border-input erix-bg-transparent erix-px-3 erix-py-2 erix-text-base erix-shadow-xs erix-transition-[color,box-shadow] erix-outline-none placeholder:erix-text-muted-foreground focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50 disabled:erix-cursor-not-allowed disabled:erix-opacity-50 aria-invalid:erix-border-destructive aria-invalid:erix-ring-destructive/20 md:erix-text-sm dark:erix-bg-input/30 dark:erix-ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
