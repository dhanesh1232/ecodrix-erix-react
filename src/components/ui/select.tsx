"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "../../lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "erix-flex erix-h-10 erix-w-full erix-items-center erix-justify-between erix-rounded-md erix-border erix-border-input erix-bg-background erix-px-3 erix-py-2 erix-text-sm erix-ring-offset-background placeholder:erix-text-muted-foreground focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-ring focus:erix-ring-offset-2 disabled:erix-cursor-not-allowed disabled:erix-opacity-50 [&>span]:erix-line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="erix-h-4 erix-w-4 erix-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "erix-flex erix-cursor-default erix-items-center erix-justify-center erix-py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className="erix-h-4 erix-w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "erix-flex erix-cursor-default erix-items-center erix-justify-center erix-py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className="erix-h-4 erix-w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "erix-relative erix-z-50 erix-max-h-96 erix-min-w-[8rem] erix-overflow-hidden erix-rounded-md erix-border erix-bg-popover erix-text-popover-foreground erix-shadow-md data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-zoom-in-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:erix-translate-y-1 data-[side=left]:erix--erix-translate-x-1 data-[side=right]:erix-translate-x-1 data-[side=top]:erix--erix-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "erix-p-1",
          position === "popper" &&
            "erix-h-[var(--radix-select-trigger-height)] erix-w-full erix-min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "erix-py-1.5 erix-pl-8 erix-pr-2 erix-text-sm erix-font-semibold",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "erix-relative erix-flex erix-w-full erix-cursor-default erix-select-none erix-items-center erix-rounded-sm erix-py-1.5 erix-pl-8 erix-pr-2 erix-text-sm erix-outline-none focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50",
      className,
    )}
    {...props}
  >
    <span className="erix-absolute erix-left-2 erix-flex erix-h-3.5 erix-w-3.5 erix-items-center erix-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="erix-h-4 erix-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      "erix--erix-mx-1 erix-my-1 erix-h-px erix-bg-muted",
      className,
    )}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
