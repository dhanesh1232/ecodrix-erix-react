"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "erix-fixed erix-inset-0 erix-z-50 erix-bg-black/50 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-animate-in data-[state=open]:erix-fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "erix-fixed erix-top-[50%] erix-left-[50%] erix-z-50 erix-grid erix-w-full erix-max-w-[calc(100%-2rem)] erix-translate-x-[-50%] erix-translate-y-[-50%] erix-gap-4 erix-rounded-lg erix-border erix-bg-background erix-p-6 erix-shadow-lg erix-duration-200 erix-outline-none data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-animate-in data-[state=open]:erix-fade-in-0 data-[state=open]:erix-zoom-in-95 sm:erix-max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="erix-absolute erix-top-4 erix-right-4 erix-rounded-xs erix-opacity-70 erix-ring-offset-background erix-transition-opacity hover:erix-opacity-100 focus:erix-ring-2 focus:erix-ring-ring focus:erix-ring-offset-2 focus:erix-outline-hidden disabled:erix-pointer-events-none data-[state=open]:erix-bg-accent data-[state=open]:erix-text-muted-foreground [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:erix-size-4"
          >
            <XIcon />
            <span className="erix-sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "erix-flex erix-flex-col erix-gap-2 erix-text-center sm:erix-text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "erix-flex erix-flex-col-reverse erix-gap-2 sm:erix-flex-row sm:erix-justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "erix-text-lg erix-leading-none erix-font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("erix-text-sm erix-text-muted-foreground", className)}
      {...props}
    />
  );
}

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
