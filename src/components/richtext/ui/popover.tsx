"use client";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { popoverRadius, shadowClass } = useErixStyle();
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "erix-z-300 erix-w-auto erix-border erix-bg-popover/95 erix-backdrop-blur-xl erix-p-4 erix-text-popover-foreground erix-outline-none",
          popoverRadius,
          shadowClass,
          "data-[state=open]:erix-animate-in data-[state=closed]:erix-animate-out data-[state=closed]:erix-fade-out-0 data-[state=open]:erix-fade-in-0 data-[state=closed]:erix-zoom-out-95 data-[state=open]:erix-zoom-in-95 data-[side=bottom]:erix-slide-in-from-top-2 data-[side=left]:erix-slide-in-from-right-2 data-[side=right]:erix-slide-in-from-left-2 data-[side=top]:erix-slide-in-from-bottom-2",
          className,
        )}
        data-erix-ignore-dismiss="true"
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
