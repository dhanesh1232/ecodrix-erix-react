import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "erix-inline-flex erix-w-fit erix-shrink-0 erix-items-center erix-justify-center erix-gap-1 erix-overflow-hidden erix-rounded-full erix-border erix-border-transparent erix-px-2 erix-py-0.5 erix-text-xs erix-font-medium erix-whitespace-nowrap erix-transition-[color,box-shadow] focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50 aria-invalid:erix-border-destructive aria-invalid:erix-ring-destructive/20 dark:erix-ring-destructive/40 [&>svg]:erix-pointer-events-none [&>svg]:erix-size-3",
  {
    variants: {
      variant: {
        default: "erix-bg-primary erix-text-primary-foreground [a&]:erix-bg-primary/90",
        secondary:
          "erix-bg-secondary erix-text-secondary-foreground [a&]:erix-bg-secondary/90",
        destructive:
          "erix-bg-destructive erix-text-white focus-visible:erix-ring-destructive/20 dark:erix-bg-destructive/60 dark:erix-ring-destructive/40 [a&]:erix-bg-destructive/90",
        outline:
          "erix-border-border erix-text-foreground [a&]:erix-bg-accent [a&]:erix-text-accent-foreground",
        ghost: "[a&]:erix-bg-accent [a&]:erix-text-accent-foreground",
        link: "erix-text-primary erix-underline-offset-4 [a&]:erix-underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
