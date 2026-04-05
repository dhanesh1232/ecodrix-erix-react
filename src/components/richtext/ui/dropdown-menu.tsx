"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import * as React from "react";
import { useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "erix-flex erix-cursor-default erix-select-none erix-items-center erix-px-2 erix-py-1.5 erix-text-sm erix-outline-none focus:erix-bg-accent data-[state=open]:erix-bg-accent",
        buttonRadius,
        inset && "erix-pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="erix-ml-auto erix-h-4 erix-w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const { popoverRadius, shadowClass } = useErixStyle();
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "erix-z-50 erix-min-w-[8rem] erix-overflow-hidden erix-border erix-bg-popover erix-p-1 erix-text-popover-foreground data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-zoom-in-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2",
        popoverRadius,
        shadowClass,
        className,
      )}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const { popoverRadius, shadowClass } = useErixStyle();
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "erix-z-50 erix-min-w-[8rem] erix-overflow-hidden erix-border erix-bg-popover erix-p-1 erix-text-popover-foreground data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-zoom-in-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2",
          popoverRadius,
          shadowClass,
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-select-none erix-items-center erix-px-2 erix-py-1.5 erix-text-sm erix-outline-none erix-transition-colors focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50",
        buttonRadius,
        inset && "erix-pl-8",
        className,
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-select-none erix-items-center erix-py-1.5 erix-pl-8 erix-pr-2 erix-text-sm erix-outline-none erix-transition-colors focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50",
        buttonRadius,
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="erix-absolute erix-left-2 erix-flex erix-h-3.5 erix-w-3.5 erix-items-center erix-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="erix-h-4 erix-w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "erix-relative erix-flex erix-cursor-default erix-select-none erix-items-center erix-py-1.5 erix-pl-8 erix-pr-2 erix-text-sm erix-outline-none erix-transition-colors focus:erix-bg-accent focus:erix-text-accent-foreground data-[disabled]:erix-pointer-events-none data-[disabled]:erix-opacity-50",
        buttonRadius,
        className,
      )}
      {...props}
    >
      <span className="erix-absolute erix-left-2 erix-flex erix-h-3.5 erix-w-3.5 erix-items-center erix-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="erix-h-2 erix-w-2 erix-fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "erix-px-2 erix-py-1.5 erix-text-sm erix-font-semibold",
      inset && "erix-pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("erix--mx-1 erix-my-1 erix-h-px erix-bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "erix-ml-auto erix-text-xs erix-tracking-widest erix-opacity-60",
        className,
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
