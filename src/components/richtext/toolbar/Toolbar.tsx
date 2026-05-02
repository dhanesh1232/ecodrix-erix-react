"use client";
/**
 * Toolbar.tsx — Erix editor toolbar primitives
 *
 * CRITICAL design rule for toolbar buttons in an iframe-based editor:
 *   - onMouseDown MUST call e.preventDefault() to prevent the editor iframe
 *     from losing its active selection when the user clicks a toolbar item.
 *   - onClick MUST pass through untouched so that Radix UI's PopoverTrigger
 *     asChild / DropdownMenuTrigger asChild can inject and fire their own
 *     onClick handlers (which toggle open/close the popover / dropdown).
 *   - NEVER call onClick inside onMouseDown; NEVER set onClick={undefined}.
 */

import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── ToolbarBtn ───────────────────────────────────────────────────────────────
export interface ToolbarBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tooltip?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export const ToolbarBtn = React.forwardRef<HTMLButtonElement, ToolbarBtnProps>(
  (
    {
      children,
      active,
      tooltip,
      size = "sm",
      className,
      disabled,
      onMouseDown,
      // All other props (including onClick injected by Radix asChild) pass through
      ...rest
    },
    ref,
  ) => {
    const [tooltipOpen, setTooltipOpen] = React.useState(false);

    // Close tooltip when cursor enters the editor iframe
    React.useEffect(() => {
      const close = () => setTooltipOpen(false);
      window.addEventListener("erix:iframe-enter", close);
      return () => window.removeEventListener("erix:iframe-enter", close);
    }, []);

    const sizeMap = {
      xs: "erix-h-[22px] erix-w-[22px]",
      sm: "erix-h-[26px] erix-w-[26px]",
      md: "erix-h-[30px] erix-w-[30px]",
      lg: "erix-h-[34px] erix-w-[34px]",
    } as const;

    const { buttonRadius } = useErixStyle();

    const btn = (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={active}
        aria-label={tooltip}
        tabIndex={-1}
        onMouseDown={(e) => {
          /**
           * Prevent focus from moving to the toolbar button.
           * This keeps the editor's contenteditable focused and preserves
           * the active text selection so formatting commands work correctly.
           *
           * We MUST NOT call onClick here — click events fire after mouseup
           * and handle Radix trigger open/close logic. Calling onClick in
           * mousedown would double-fire actions and would receive a
           * MouseEvent typed as a PointerEvent which causes type errors.
           */
          e.preventDefault();
          onMouseDown?.(e);
        }}
        data-erix-ignore-dismiss="true"
        className={cn(
          sizeMap[size],
          buttonRadius,
          "erix-relative erix-inline-flex erix-items-center erix-justify-center erix-shrink-0",
          "erix-transition-colors erix-duration-100",
          "erix-outline-none erix-select-none erix-cursor-default",
          // Inactive
          !active && [
            "erix-text-foreground/50",
            "hover:erix-text-foreground hover:erix-bg-accent",
          ],
          // Active — primary tint
          active && [
            "erix-bg-primary/10 erix-text-primary",
            "hover:erix-bg-primary/15",
          ],
          // Disabled
          "disabled:erix-opacity-30 disabled:erix-pointer-events-none",
          className,
        )}
        // Spread rest LAST so Radix's injected onClick is not shadowed
        {...rest}
      >
        {children}
      </button>
    );

    if (!tooltip) return btn;

    return (
      <TooltipProvider delayDuration={600}>
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={6}
            className={cn(
              "erix-bg-foreground erix-text-background erix-border-foreground/20",
              "erix-px-2 erix-py-px erix-text-[11px] erix-font-medium erix-shadow-md",
              buttonRadius,
            )}
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
ToolbarBtn.displayName = "ToolbarBtn";

// ─── ToolbarGroup ─────────────────────────────────────────────────────────────
export const ToolbarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "erix-flex erix-items-center erix-gap-px erix-shrink-0",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
ToolbarGroup.displayName = "ToolbarGroup";

// ─── ToolbarSep ───────────────────────────────────────────────────────────────
export const ToolbarSep: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div
    aria-hidden="true"
    role="separator"
    className={cn(
      "erix-w-px erix-h-3.5 erix-bg-border/70 erix-mx-1 erix-shrink-0",
      className,
    )}
    {...props}
  />
);

// ─── ToolbarWrapper (legacy — kept for custom toolbar builds) ─────────────────
// ToolbarChain manages its own overflow internally.
export interface ToolbarWrapperProps extends React.ComponentProps<"div"> {
  alwaysVisible?: number;
}

export const ToolbarWrapper = React.forwardRef<
  HTMLDivElement,
  ToolbarWrapperProps
>(({ children, className, alwaysVisible = 1, ...props }, ref) => {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);
  const [cutoff, setCutoff] = React.useState<number>(-1);

  React.useLayoutEffect(() => {
    const row = rowRef.current;
    const ghost = ghostRef.current;
    if (!row || !ghost) return;

    const RESERVED = 32; // px for the "…" button
    const compute = () => {
      const avail = row.offsetWidth;
      if (!avail) return;
      const ghosts = Array.from(ghost.children) as HTMLElement[];
      let used = 0;
      let cut = ghosts.length;
      for (let i = 0; i < ghosts.length; i++) {
        used += ghosts[i].offsetWidth + 2;
        const next = ghosts[i + 1];
        if (next && used + next.offsetWidth + 2 + RESERVED > avail) {
          cut = Math.max(i + 1, alwaysVisible);
          break;
        }
      }
      setCutoff(cut);
    };
    const ro = new ResizeObserver(compute);
    ro.observe(row);
    compute();
    return () => ro.disconnect();
  }, [alwaysVisible, children]);

  const arr = React.Children.toArray(children);
  const visible = cutoff < 0 ? arr : arr.slice(0, cutoff);
  const hidden = cutoff < 0 ? [] : arr.slice(cutoff);
  const isOverflowing = hidden.length > 0;

  const { containerRadius, shadowClass, popoverRadius } = useErixStyle();

  return (
    <div
      ref={ref}
      className={cn(
        "erix-relative erix-w-full erix-select-none",
        "erix-bg-background erix-border-b erix-border-border",
        containerRadius,
        className,
      )}
      {...props}
      style={{
        borderBottomRightRadius: "0px",
        borderBottomLeftRadius: "0px",
      }}
    >
      {/* Ghost layer for measurement */}
      <div
        ref={ghostRef}
        aria-hidden="true"
        className="erix-absolute erix-top-0 erix-left-0 erix-right-0 erix-flex erix-items-center erix-gap-0.5 erix-px-2 erix-py-1.5 erix-pointer-events-none erix-overflow-hidden"
        style={{ visibility: "hidden" }}
      >
        {arr}
      </div>

      {/* Visible row */}
      <div
        ref={rowRef}
        role="toolbar"
        aria-label="Editor toolbar"
        className="erix-flex erix-items-center erix-gap-0.5 erix-px-2 erix-py-1.5 erix-overflow-hidden erix-min-h-[42px]"
      >
        {visible}
        {isOverflowing && (
          <div className="erix-ml-auto erix-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <ToolbarBtn tooltip="More options" size="sm">
                  <MoreHorizontal size={14} />
                </ToolbarBtn>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                className={cn(
                  "erix-p-1.5 erix-flex erix-flex-wrap erix-items-center erix-gap-0.5",
                  "erix-w-auto erix-max-w-[320px]",
                  popoverRadius,
                  shadowClass,
                )}
              >
                {hidden}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
});
ToolbarWrapper.displayName = "ToolbarWrapper";
