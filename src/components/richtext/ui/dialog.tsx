"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "erix-fixed erix-inset-0 erix-z-[150] erix-bg-background/60 erix-backdrop-blur-sm data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { popoverRadius, shadowClass } = useErixStyle();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "erix-fixed erix-left-[50%] erix-top-[50%] erix-z-[200] erix-grid erix-w-full erix-max-w-lg erix-translate-x-[-50%] erix-translate-y-[-50%] erix-gap-4 erix-border erix-bg-background erix-p-6 erix-duration-200 data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-zoom-in-95 data-[state=closed]:erix-slide-out-to-left-1/2 data-[state=closed]:erix-slide-out-to-top-[48%] data-[state=open]:erix-slide-in-from-left-1/2 data-[state=open]:erix-slide-in-from-top-[48%]",
          popoverRadius,
          shadowClass,
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="erix-absolute erix-right-4 erix-top-4 erix-rounded-sm erix-opacity-70 erix-ring-offset-background erix-transition-opacity hover:erix-opacity-100 focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-ring focus:erix-ring-offset-2 disabled:erix-pointer-events-none data-[state=open]:erix-bg-accent data-[state=open]:erix-text-muted-foreground">
          <X className="erix-h-4 erix-w-4" />
          <span className="erix-sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "erix-flex erix-flex-col erix-space-y-1.5 erix-text-center sm:erix-text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "erix-flex erix-flex-col-reverse sm:erix-flex-row sm:erix-justify-end sm:erix-space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "erix-text-lg erix-font-semibold erix-leading-none erix-tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("erix-text-sm erix-text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
