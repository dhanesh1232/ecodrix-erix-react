import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "erix-relative erix-w-full erix-rounded-lg erix-border erix-px-4 erix-py-3 erix-text-sm erix-grid erix-grid-cols-[0.875rem_1fr] erix-gap-3 [&>svg]:erix-size-4 [&>svg]:erix-translate-y-0.5 [&>svg]:erix-text-foreground",
  {
    variants: {
      variant: {
        default: "erix-bg-background erix-text-foreground",
        destructive:
          "erix-border-destructive/50 erix-text-destructive dark:erix-border-destructive [&>svg]:erix-text-destructive",
        warning:
          "erix-border-amber-500/50 erix-text-amber-900 dark:erix-text-amber-100 erix-bg-amber-50 dark:erix-bg-amber-950/20 [&>svg]:erix-text-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "erix-col-start-2 erix-line-height-none erix-font-medium erix-tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "erix-col-start-2 erix-text-xs erix-opacity-90 [&_p]:erix-leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
