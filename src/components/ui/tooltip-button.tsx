"use client";

import Link from "next/link";
import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type TooltipButtonProps = {
  tooltip?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
} & (
  | ({ href?: never } & ButtonProps)
  | ({ href: string } & React.ComponentPropsWithoutRef<typeof Link> &
      Omit<ButtonProps, "asChild">)
);

const TooltipButton = React.forwardRef<any, TooltipButtonProps>(
  ({ tooltip, side = "top", sideOffset = 4, children, ...props }, ref) => {
    const { href, ...buttonProps } = props as any;

    const button = (
      <Button ref={ref} asChild={!!href} {...buttonProps}>
        {href ? <Link href={href}>{children}</Link> : children}
      </Button>
    );

    if (!tooltip) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={sideOffset}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  },
);

TooltipButton.displayName = "TooltipButton";

export { TooltipButton };
