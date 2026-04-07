import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "erix-h-9 erix-w-full erix-min-w-0 erix-rounded-md erix-border erix-border-input erix-bg-transparent erix-px-3 erix-py-1 erix-text-base erix-shadow-xs erix-transition-[color,box-shadow] erix-outline-none selection:erix-bg-primary selection:erix-text-primary-foreground file:erix-inline-flex file:erix-h-7 file:erix-border-0 file:erix-bg-transparent file:erix-text-sm file:erix-font-medium file:erix-text-foreground placeholder:erix-text-muted-foreground disabled:erix-pointer-events-none disabled:erix-cursor-not-allowed disabled:erix-opacity-50 md:erix-text-sm dark:erix-bg-input/30",
        "focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50",
        "aria-invalid:erix-border-destructive aria-invalid:erix-ring-destructive/20 dark:erix-ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
