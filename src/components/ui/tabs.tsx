"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "erix-group/tabs erix-flex erix-gap-2 data-[orientation=horizontal]:erix-flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "erix-group/tabs-list erix-inline-flex erix-w-fit erix-items-center erix-justify-center erix-rounded-lg erix-p-[3px] erix-text-muted-foreground group-data-[orientation=horizontal]/tabs:erix-h-9 group-data-[orientation=vertical]/tabs:erix-h-fit group-data-[orientation=vertical]/tabs:erix-flex-col data-[variant=line]:erix-rounded-none",
  {
    variants: {
      variant: {
        default: "erix-bg-muted",
        line: "erix-gap-1 erix-bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "erix-relative erix-inline-flex erix-h-[calc(100%-1px)] erix-flex-1 erix-items-center erix-justify-center erix-gap-1.5 erix-rounded-md erix-border erix-border-transparent erix-px-2 erix-py-1 erix-text-sm erix-font-medium erix-whitespace-nowrap erix-text-foreground/60 erix-transition-all group-data-[orientation=vertical]/tabs:erix-w-full group-data-[orientation=vertical]/tabs:erix-justify-start hover:erix-text-foreground focus-visible:erix-border-ring focus-visible:erix-ring-[3px] focus-visible:erix-ring-ring/50 focus-visible:erix-outline-1 focus-visible:erix-outline-ring disabled:erix-pointer-events-none disabled:erix-opacity-50 group-data-[variant=default]/tabs-list:erix-shadow-sm group-data-[variant=line]/tabs-list:erix-shadow-none dark:erix-text-muted-foreground dark:erix-text-foreground [&_svg]:erix-pointer-events-none [&_svg]:erix-shrink-0 [&_svg:not([class*=size-])]:erix-size-4",
        "group-data-[variant=line]/tabs-list:erix-bg-transparent dark:erix-border-transparent dark:erix-bg-transparent",
        "data-[state=active]:erix-bg-background data-[state=active]:erix-text-foreground dark:erix-border-input dark:erix-bg-input/30 dark:erix-text-foreground",
        "after:erix-absolute after:erix-bg-foreground after:erix-opacity-0 after:erix-transition-opacity group-data-[orientation=horizontal]/tabs:erix-inset-x-0 group-data-[orientation=horizontal]/tabs:erix-bottom-[-5px] group-data-[orientation=horizontal]/tabs:erix-h-0.5 group-data-[orientation=vertical]/tabs:erix-inset-y-0 group-data-[orientation=vertical]/tabs:erix-right-1 group-data-[orientation=vertical]/tabs:erix-w-0.5 group-data-[variant=line]/tabs-list:erix-opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("erix-flex-1 erix-outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
