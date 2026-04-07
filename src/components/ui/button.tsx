import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  pointer?: boolean;
}

const buttonVariants = cva(
  "erix-inline-flex erix-shrink-0 erix-items-center erix-justify-center erix-gap-2 erix-rounded-md erix-text-sm erix-font-medium erix-whitespace-nowrap erix-transition-all erix-outline-none focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50 disabled:erix-pointer-events-none disabled:erix-opacity-50 aria-invalid:erix-border-destructive aria-invalid:erix-ring-destructive/20 dark:erix-ring-destructive/40 [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4",
  {
    variants: {
      variant: {
        default:
          "erix-bg-primary erix-text-primary-foreground hover:erix-bg-primary/90",
        destructive:
          "erix-bg-destructive erix-text-white hover:erix-bg-destructive/90 focus-visible:erix-ring-destructive/20 dark:erix-bg-destructive/60 dark:erix-ring-destructive/40",
        outline:
          "erix-border erix-bg-background erix-shadow-xs hover:erix-bg-accent hover:erix-text-accent-foreground dark:erix-border-input dark:erix-bg-input/30 dark:erix-bg-input/50",
        secondary:
          "erix-bg-secondary erix-text-secondary-foreground hover:erix-bg-secondary/80",
        ghost:
          "hover:erix-bg-accent hover:erix-text-accent-foreground dark:erix-bg-accent/50",
        link: "erix-text-primary erix-underline-offset-4 hover:erix-underline",
      },
      size: {
        default: "erix-h-9 erix-px-4 erix-py-2 has-[>svg]:erix-px-3",
        xs: "erix-h-6 erix-gap-1 erix-rounded-md erix-px-2 erix-text-xs has-[>svg]:erix-px-1.5 [&_svg:erix-size-3",
        sm: "erix-h-8 erix-gap-1.5 erix-rounded-md erix-px-3 has-[>svg]:erix-px-2.5",
        lg: "erix-h-10 erix-rounded-md erix-px-6 has-[>svg]:erix-px-4",
        icon: "erix-size-9",
        "icon-xs": "erix-size-6 erix-rounded-md [&_svg:erix-size-3",
        "icon-sm": "erix-size-8",
        "icon-lg": "erix-size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pointer = true,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pointer?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        pointer ? "erix-cursor-pointer" : "",
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
