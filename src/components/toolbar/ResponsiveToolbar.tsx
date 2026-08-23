"use client";
/**
 * ResponsiveToolbar.tsx — Mobile-responsive toolbar component
 * 
 * Provides adaptive layout based on viewport width with:
 * - Touch-friendly button sizing (44x44px minimum on mobile)
 * - Overflow menu for collapsed controls
 * - Integration with mobile detection infrastructure
 * 
 * Requirements: 1.1, 1.8
 */

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { useMobileDetection } from "@/lib/mobile/useMobileDetection";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResponsiveToolbarControl {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Controls visibility on mobile
}

export interface ResponsiveToolbarProps {
  /** Array of toolbar controls to display */
  controls: ResponsiveToolbarControl[];
  /** Breakpoints for responsive behavior */
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  /** Strategy for handling overflow */
  overflowStrategy?: 'collapse' | 'scroll' | 'dropdown';
  /** Minimum number of controls to always show */
  minVisibleControls?: number;
  /** Custom className for the toolbar container */
  className?: string;
  /** Custom styles for the toolbar container */
  style?: React.CSSProperties;
  /** ARIA label for the toolbar */
  ariaLabel?: string;
}

// ─── Default Configuration ────────────────────────────────────────────────────

const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

const DEFAULT_MIN_VISIBLE = 3;

// ─── Touch-Friendly Button Component ──────────────────────────────────────────

interface ResponsiveToolbarButtonProps {
  control: ResponsiveToolbarControl;
  isMobile: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ResponsiveToolbarButton: React.FC<ResponsiveToolbarButtonProps> = ({
  control,
  isMobile,
  size = 'md',
}) => {
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  // Size mapping - mobile gets larger touch targets
  const sizeMap: Record<'sm' | 'md' | 'lg', string> = {
    sm: isMobile ? "erix-h-[44px] erix-w-[44px]" : "erix-h-[26px] erix-w-[26px]",
    md: isMobile ? "erix-h-[44px] erix-w-[44px]" : "erix-h-[30px] erix-w-[30px]",
    lg: isMobile ? "erix-h-[48px] erix-w-[48px]" : "erix-h-[34px] erix-w-[34px]",
  };

  const button = (
    <button
      type="button"
      disabled={control.disabled}
      aria-pressed={control.active}
      aria-label={control.label}
      onClick={control.onClick}
      onMouseDown={(e) => e.preventDefault()}
      data-erix-ignore-dismiss="true"
      className={cn(
        sizeMap[size],
        "erix-relative erix-inline-flex erix-items-center erix-justify-center erix-shrink-0",
        "erix-transition-colors erix-duration-100",
        "erix-outline-none erix-select-none erix-cursor-default",
        "erix-rounded",
        // Inactive
        !control.active && [
          "erix-text-foreground/50",
          "hover:erix-text-foreground hover:erix-bg-accent",
        ],
        // Active — primary tint
        control.active && [
          "erix-bg-primary/10 erix-text-primary",
          "hover:erix-bg-primary/15",
        ],
        // Disabled
        "disabled:erix-opacity-30 disabled:erix-pointer-events-none",
      )}
    >
      {control.icon}
    </button>
  );

  // Skip tooltip on mobile for better touch experience
  if (isMobile) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={600}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={6}
          className={cn(
            "erix-bg-foreground erix-text-background erix-border-foreground/20",
            "erix-px-2 erix-py-px erix-text-[11px] erix-font-medium erix-shadow-md",
            "erix-rounded",
          )}
        >
          {control.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Overflow Menu Component ───────────────────────────────────────────────────

interface OverflowMenuProps {
  controls: ResponsiveToolbarControl[];
  isMobile: boolean;
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({ controls, isMobile }) => {
  const [open, setOpen] = React.useState(false);

  if (controls.length === 0) {
    return null;
  }

  const buttonSize = isMobile ? "erix-h-[44px] erix-w-[44px]" : "erix-h-[26px] erix-w-[26px]";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipProvider delayDuration={600}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                aria-expanded={open}
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  buttonSize,
                  "erix-inline-flex erix-items-center erix-justify-center erix-shrink-0",
                  "erix-text-foreground/40 hover:erix-text-foreground hover:erix-bg-accent",
                  "erix-border erix-border-transparent hover:erix-border-border/50",
                  open && "erix-bg-accent erix-text-foreground erix-border-border/50",
                  "erix-transition-all erix-duration-100 erix-outline-none erix-rounded",
                )}
              >
                <MoreHorizontal size={isMobile ? 18 : 14} />
              </button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="erix-text-[11px]"
              >
                More
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "erix-p-2 erix-flex erix-flex-wrap erix-items-center erix-gap-1",
          "erix-w-auto erix-max-w-[320px]",
          "erix-bg-popover/97 erix-backdrop-blur-xl",
          "erix-rounded erix-shadow-md",
        )}
      >
        {controls.map((control) => (
          <ResponsiveToolbarButton
            key={control.id}
            control={control}
            isMobile={isMobile}
            size="sm"
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};

// ─── Main ResponsiveToolbar Component ─────────────────────────────────────────

export const ResponsiveToolbar: React.FC<ResponsiveToolbarProps> = ({
  controls,
  breakpoints = DEFAULT_BREAKPOINTS,
  overflowStrategy = 'dropdown',
  minVisibleControls = DEFAULT_MIN_VISIBLE,
  className,
  style,
  ariaLabel = "Responsive toolbar",
}) => {
  const { isMobile, viewportWidth } = useMobileDetection({
    breakpoint: breakpoints.mobile,
  });

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(controls.length);

  // ── Priority-based filtering for mobile ──────────────────────────────────
  const prioritizedControls = React.useMemo(() => {
    if (!isMobile) {
      return controls;
    }

    // On mobile, prioritize high-priority controls
    const sorted = [...controls].sort((a, b) => {
      const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return aPriority - bPriority;
    });

    return sorted;
  }, [controls, isMobile]);

  // ── Overflow measurement (similar to ToolbarChain) ───────────────────────
  const measure = React.useCallback(() => {
    if (overflowStrategy !== 'dropdown') {
      setVisibleCount(controls.length);
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      const ghost = ghostRef.current;
      if (!wrap || !ghost) return;

      const padding = isMobile ? 16 : 16; // px-2 on both sides
      const gap = isMobile ? 8 : 4; // gap between buttons
      const moreButtonWidth = isMobile ? 52 : 34; // overflow button + gap
      const availableWidth = wrap.offsetWidth - padding;

      if (availableWidth <= 0) return;

      const buttons = Array.from(
        ghost.querySelectorAll<HTMLElement>('[data-control-id]')
      );

      if (buttons.length === 0) return;

      const buttonWidths = buttons.map(
        (btn: HTMLElement) => btn.getBoundingClientRect().width + gap
      );

      const totalWidth = buttonWidths.reduce((sum, width) => sum + width, 0);

      // If everything fits, show all
      if (totalWidth <= availableWidth) {
        setVisibleCount(controls.length);
        return;
      }

      // Calculate how many buttons fit with overflow menu
      let usedWidth = 0;
      let count = 0;

      for (let i = 0; i < buttonWidths.length; i++) {
        const needsOverflow = i < buttonWidths.length - 1;
        const requiredWidth = usedWidth + buttonWidths[i] + (needsOverflow ? moreButtonWidth : 0);

        if (requiredWidth > availableWidth) {
          // Ensure minimum visible controls
          count = Math.max(i, minVisibleControls);
          break;
        }

        usedWidth += buttonWidths[i];
        count = i + 1;
      }

      setVisibleCount(Math.max(count, minVisibleControls));
    });
  }, [controls.length, isMobile, minVisibleControls, overflowStrategy]);

  // ── Measure on mount and resize ──────────────────────────────────────────
  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(wrap);
    measure();

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [measure]);

  // Re-measure when controls or viewport changes
  React.useLayoutEffect(() => {
    measure();
  }, [controls.length, viewportWidth, measure]);

  // ── Derive visible and overflow controls ─────────────────────────────────
  const visibleControls = prioritizedControls.slice(0, visibleCount);
  const overflowControls = prioritizedControls.slice(visibleCount);
  const hasOverflow = overflowControls.length > 0;

  // ── Render strategies ─────────────────────────────────────────────────────
  const renderScrollStrategy = () => (
    <div
      className={cn(
        "erix-flex erix-items-center erix-overflow-x-auto erix-overflow-y-hidden",
        "erix-gap-1 erix-px-2 erix-py-2",
        "erix-scrollbar-thin erix-scrollbar-thumb-border erix-scrollbar-track-transparent",
      )}
    >
      {prioritizedControls.map((control) => (
        <ResponsiveToolbarButton
          key={control.id}
          control={control}
          isMobile={isMobile}
        />
      ))}
    </div>
  );

  const renderCollapseStrategy = () => (
    <div
      className={cn(
        "erix-flex erix-items-center erix-flex-wrap",
        "erix-gap-1 erix-px-2 erix-py-2",
      )}
    >
      {prioritizedControls.map((control) => (
        <ResponsiveToolbarButton
          key={control.id}
          control={control}
          isMobile={isMobile}
        />
      ))}
    </div>
  );

  const renderDropdownStrategy = () => (
    <>
      {/* Ghost layer for measurement */}
      <div
        ref={ghostRef}
        aria-hidden="true"
        style={{ visibility: "hidden", pointerEvents: "none" }}
        className="erix-absolute erix-inset-x-0 erix-top-0 erix-flex erix-items-center erix-gap-1 erix-px-2 erix-py-2 erix-overflow-hidden"
      >
        {prioritizedControls.map((control) => (
          <div key={control.id} data-control-id={control.id}>
            <ResponsiveToolbarButton
              control={control}
              isMobile={isMobile}
            />
          </div>
        ))}
      </div>

      {/* Visible toolbar */}
      <div
        className={cn(
          "erix-flex erix-items-center erix-gap-1 erix-px-2 erix-py-2",
          isMobile ? "erix-min-h-[60px]" : "erix-min-h-[42px]",
        )}
      >
        {visibleControls.map((control) => (
          <ResponsiveToolbarButton
            key={control.id}
            control={control}
            isMobile={isMobile}
          />
        ))}

        {hasOverflow && (
          <>
            <div className="erix-w-px erix-h-6 erix-bg-border/70 erix-mx-1 erix-shrink-0" />
            <OverflowMenu controls={overflowControls} isMobile={isMobile} />
          </>
        )}
      </div>
    </>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "erix-relative erix-w-full erix-select-none",
        "erix-bg-background erix-border-b erix-border-border",
        "erix-rounded-t",
        className,
      )}
      style={style}
    >
      {overflowStrategy === 'scroll' && renderScrollStrategy()}
      {overflowStrategy === 'collapse' && renderCollapseStrategy()}
      {overflowStrategy === 'dropdown' && renderDropdownStrategy()}
    </div>
  );
};

// ─── Export utilities ──────────────────────────────────────────────────────────
// ResponsiveToolbarControl is already exported above
