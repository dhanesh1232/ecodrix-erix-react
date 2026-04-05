"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "erix-inline-flex erix-h-10 erix-items-center erix-justify-center erix-bg-muted erix-p-1 erix-text-muted-foreground",
        buttonRadius,
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { buttonRadius } = useErixStyle();
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "erix-inline-flex erix-items-center erix-justify-center erix-whitespace-nowrap erix-px-3 erix-py-1.5 erix-text-sm erix-font-medium data-[state=active]:erix-bg-background data-[state=active]:erix-text-foreground data-[state=active]:erix-shadow-sm erix-transition-all focus-visible:erix-outline-none focus-visible:erix-ring-2 focus-visible:erix-ring-ring focus-visible:erix-ring-offset-2 disabled:erix-pointer-events-none disabled:erix-opacity-50",
        buttonRadius,
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "erix-mt-2 erix-ring-offset-background focus-visible:erix-outline-none focus-visible:erix-ring-2 focus-visible:erix-ring-ring focus-visible:erix-ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
