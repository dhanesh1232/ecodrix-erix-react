"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "erix-fixed erix-inset-0 erix-z-50 erix-bg-black/50 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-animate-in data-[state=open]:erix-fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "erix-fixed erix-z-50 erix-flex erix-flex-col erix-gap-4 erix-bg-background erix-shadow-lg erix-transition erix-ease-in-out data-[state=closed]:erix-animate-out data-[state=closed]:erix-duration-300 data-[state=open]:erix-animate-in data-[state=open]:erix-duration-500",
          side === "erix-right" &&
            "erix-inset-y-0 erix-right-0 erix-h-full erix-w-3/4 erix-border-l data-[state=closed]:erix-slide-out-to-right data-[state=open]:erix-slide-in-from-right sm:erix-max-w-sm",
          side === "erix-left" &&
            "erix-inset-y-0 erix-left-0 erix-h-full erix-w-3/4 erix-border-r data-[state=closed]:erix-slide-out-to-left data-[state=open]:erix-slide-in-from-left sm:erix-max-w-sm",
          side === "erix-top" &&
            "erix-inset-x-0 erix-top-0 erix-h-auto erix-border-b data-[state=closed]:erix-slide-out-to-top data-[state=open]:erix-slide-in-from-top",
          side === "erix-bottom" &&
            "erix-inset-x-0 erix-bottom-0 erix-h-auto erix-border-t data-[state=closed]:erix-slide-out-to-bottom data-[state=open]:erix-slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="erix-absolute erix-top-4 erix-right-4 erix-rounded-xs erix-opacity-70 erix-ring-offset-background erix-transition-opacity hover:erix-opacity-100 focus:erix-ring-2 focus:erix-ring-ring focus:erix-ring-offset-2 focus:erix-outline-hidden disabled:erix-pointer-events-none data-[state=open]:erix-bg-secondary">
            <XIcon className="erix-size-4" />
            <span className="erix-sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("erix-flex erix-flex-col erix-gap-1.5 erix-p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("erix-mt-auto erix-flex erix-flex-col erix-gap-2 erix-p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("erix-font-semibold erix-text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("erix-text-sm erix-text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
