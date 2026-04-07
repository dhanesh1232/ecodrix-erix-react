"use client";

import * as React from "react";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "erix-z-50 erix-max-h-(--radix-dropdown-menu-content-available-height) erix-min-w-[8rem] erix-origin-(--radix-dropdown-menu-content-transform-origin) erix-overflow-x-hidden erix-overflow-y-auto erix-rounded-md erix-border erix-bg-popover erix-p-1 erix-text-popover-foreground erix-shadow-md data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-animate-in data-[state=open]:erix-fade-in-0 data-[state=open]:erix-zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-items-center erix-gap-2 erix-rounded-sm erix-px-2 erix-py-1.5 erix-text-sm erix-outline-hidden erix-select-none focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50 data-[inset]:erix-pl-8 data-[variant=destructive]:erix-text-destructive data-[variant=destructive]:erix-bg-destructive/10 data-[variant=destructive]:erix-text-destructive dark:erix-bg-destructive/20 [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4 [&_svg]:erix-text-muted-foreground data-[variant=destructive]:erix-text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-items-center erix-gap-2 erix-rounded-sm erix-py-1.5 erix-pr-2 erix-pl-8 erix-text-sm erix-outline-hidden erix-select-none focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50 [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="erix-pointer-events-none erix-absolute erix-left-2 erix-flex erix-size-3.5 erix-items-center erix-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="erix-size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-items-center erix-gap-2 erix-rounded-sm erix-py-1.5 erix-pr-2 erix-pl-8 erix-text-sm erix-outline-hidden erix-select-none focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50 [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4",
        className,
      )}
      {...props}
    >
      <span className="erix-pointer-events-none erix-absolute erix-left-2 erix-flex erix-size-3.5 erix-items-center erix-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="erix-size-2 erix-fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "erix-px-2 erix-py-1.5 erix-text-sm erix-font-medium data-[inset]:erix-pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("erix--mx-1 erix-my-1 erix-h-px erix-bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "erix-ml-auto erix-text-xs erix-tracking-widest erix-text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "erix-flex erix-cursor-default erix-items-center erix-gap-2 erix-rounded-sm erix-px-2 erix-py-1.5 erix-text-sm erix-outline-0 erix-select-none focus:erix-bg-accent focus:erix-text-accent-foreground data-[inset]:erix-pl-8 data-[state=open]:erix-bg-accent data-[state=open]:erix-text-accent-foreground [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4 [&_svg]:erix-text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="erix-ml-auto erix-size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "erix-z-50 erix-min-w-[8rem] erix-origin-(--radix-dropdown-menu-content-transform-origin) erix-overflow-hidden erix-rounded-md erix-border erix-bg-popover erix-p-1 erix-text-popover-foreground erix-shadow-lg data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2 data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-animate-in data-[state=open]:erix-fade-in-0 data-[state=open]:erix-zoom-in-95",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
