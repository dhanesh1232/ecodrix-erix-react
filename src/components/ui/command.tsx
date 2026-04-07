"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "erix-flex erix-h-full erix-w-full erix-flex-col erix-overflow-hidden erix-rounded-md erix-bg-popover erix-text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="erix-sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("erix-overflow-hidden erix-p-0", className)}
        showCloseButton={showCloseButton}
      >
        <Command className="data-[slot=command-input-wrapper]:erix-h-12 [&_[cmdk-group-heading]]:erix-px-2 [&_[cmdk-group-heading]]:erix-font-medium [&_[cmdk-group-heading]]:erix-text-muted-foreground [&_[cmdk-group]]:erix-px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:erix-pt-0 [&_[cmdk-input-wrapper]_svg]:erix-h-5 [&_[cmdk-input-wrapper]_svg]:erix-w-5 [&_[cmdk-input]]:erix-h-12 [&_[cmdk-item]]:erix-px-2 [&_[cmdk-item]]:erix-py-3 [&_[cmdk-item]_svg]:erix-h-5 [&_[cmdk-item]_svg]:erix-w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="erix-flex erix-h-9 erix-items-center erix-gap-2 erix-border-b erix-px-3"
    >
      <SearchIcon className="erix-size-4 erix-shrink-0 erix-opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "erix-flex erix-h-10 erix-w-full erix-rounded-md erix-bg-transparent erix-py-3 erix-text-sm erix-outline-hidden placeholder:erix-text-muted-foreground disabled:erix-cursor-not-allowed disabled:erix-opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "erix-max-h-[300px] erix-scroll-py-1 erix-overflow-x-hidden erix-overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="erix-py-6 erix-text-center erix-text-sm"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "erix-overflow-hidden erix-p-1 erix-text-foreground [&_[cmdk-group-heading]]:erix-px-2 [&_[cmdk-group-heading]]:erix-py-1.5 [&_[cmdk-group-heading]]:erix-text-xs [&_[cmdk-group-heading]]:erix-font-medium [&_[cmdk-group-heading]]:erix-text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("erix--mx-1 erix-h-px erix-bg-border", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-items-center erix-gap-2 erix-rounded-sm erix-px-2 erix-py-1.5 erix-text-sm erix-outline-hidden erix-select-none data-[disabled=true]:erix-pointer-events-none data-[disabled=true]:erix-opacity-50 data-[selected=true]:erix-bg-accent data-[selected=true]:erix-text-accent-foreground [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4 [&_svg:not([class*=text-])]:erix-text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "erix-ml-auto erix-text-xs erix-tracking-widest erix-text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
