// src/components/richtext/menus/BubbleMenu.tsx
"use client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Italic,
  Link,
  Sparkles,
  Strikethrough,
  Underline,
  Unlink,
} from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

interface BubbleBtn {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  active?: boolean;
  separator?: boolean;
}

export const BubbleMenu: React.FC = () => {
  const {
    bubbleVisible,
    bubblePos,
    bubbleSide,
    engine,
    ctx,
    setLinkPickerVisible,
    setAiVisible,
    menuContainerRef,
  } = useErixEditor();
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [adjustedX, setAdjustedX] = React.useState(bubblePos?.x || 0);

  // Sync adjustedX when bubblePos changes
  React.useEffect(() => {
    if (bubblePos) setAdjustedX(bubblePos.x);
  }, [bubblePos?.x, bubblePos]);

  // Horizontal Clamping Logic
  React.useLayoutEffect(() => {
    if (!visible || !menuRef.current || !menuContainerRef.current || !bubblePos)
      return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const containerRect = menuContainerRef.current.getBoundingClientRect();
    const halfWidth = menuRect.width / 2;
    const padding = 12; // Gap from edges

    let newX = bubblePos.x;

    // Clamp Left
    if (newX - halfWidth < padding) {
      newX = halfWidth + padding;
    }
    // Clamp Right
    else if (newX + halfWidth > containerRect.width - padding) {
      newX = containerRect.width - halfWidth - padding;
    }

    if (newX !== adjustedX) {
      setAdjustedX(newX);
    }
  }, [visible, bubblePos, adjustedX, menuContainerRef]);

  // Animate in/out
  React.useEffect(() => {
    if (bubbleVisible && bubblePos) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [bubbleVisible, bubblePos]);

  if (!mounted || !bubblePos || !menuContainerRef.current) return null;

  const buttons: BubbleBtn[] = [
    {
      icon: <Sparkles size={14} className="erix-text-primary" />,
      label: "Ask AI",
      action: () => setAiVisible(true),
    },
    { separator: true } as BubbleBtn,
    {
      icon: <Bold size={14} />,
      label: "Bold",
      active: ctx.bold,
      action: () => engine?.bold(),
    },
    {
      icon: <Italic size={14} />,
      label: "Italic",
      active: ctx.italic,
      action: () => engine?.italic(),
    },
    {
      icon: <Underline size={14} />,
      label: "Underline",
      active: ctx.underline,
      action: () => engine?.underline(),
    },
    {
      icon: <Strikethrough size={14} />,
      label: "Strike",
      active: ctx.strike,
      action: () => engine?.strike(),
    },
    {
      icon: <Code size={14} />,
      label: "Code",
      active: ctx.code,
      action: () => engine?.inlineCode(),
    },
    { separator: true } as BubbleBtn,
    {
      icon: ctx.link ? <Unlink size={14} /> : <Link size={14} />,
      label: ctx.link ? "Unlink" : "Link",
      active: ctx.link,
      action: () => (ctx.link ? engine?.unlink() : setLinkPickerVisible(true)),
    },
    {
      icon: <Highlighter size={14} />,
      label: "Highlight",
      action: () => engine?.highlight("var(--erix-primary)"),
    },
    { separator: true } as BubbleBtn,
    {
      icon: <AlignLeft size={14} />,
      label: "Left",
      active: ctx.textAlign === "left",
      action: () => engine?.align("left"),
    },
    {
      icon: <AlignCenter size={14} />,
      label: "Center",
      active: ctx.textAlign === "center",
      action: () => engine?.align("center"),
    },
    {
      icon: <AlignRight size={14} />,
      label: "Right",
      active: ctx.textAlign === "right",
      action: () => engine?.align("right"),
    },
  ];

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      role="toolbar"
      aria-label="Text formatting"
      data-erix-ignore-dismiss="true"
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "erix-absolute erix-z-100 erix-flex erix-items-center erix-gap-1 erix-px-1.5 erix-py-1.5",
        "erix-bg-popover/90 erix-border erix-border-border erix-backdrop-blur-xl",
        "erix-transition-all erix-duration-200 erix-ease-out",
        popoverRadius,
        shadowClass,
        visible
          ? "erix-opacity-100 erix-scale-100 erix-translate-y-0"
          : "erix-opacity-0 erix-scale-95 erix-translate-y-2 erix-pointer-events-none",
      )}
      style={{
        left: adjustedX,
        top: bubblePos.y,
        transform: `translateX(-50%) ${bubbleSide === "top" ? "translateY(-100%)" : "translateY(0)"}`,
      }}
    >
      {buttons.map((btn, i) => {
        if (btn.separator) {
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Static separator elements
              key={`sep-${i}`}
              className="erix-w-px erix-h-4 erix-bg-border/60 erix-mx-0.5 erix-shrink-0"
            />
          );
        }
        return (
          <button
            type="button"
            key={btn.label}
            title={btn.label}
            onMouseDown={(e) => {
              e.preventDefault();
              btn.action();
            }}
            className={cn(
              "erix-w-8 erix-h-8 erix-flex erix-items-center erix-justify-center erix-transition-all erix-duration-150",
              "erix-text-sm erix-font-medium",
              buttonRadius,
              btn.active
                ? "erix-bg-primary erix-text-primary-foreground"
                : "erix-text-foreground/70 hover:erix-bg-accent hover:erix-text-foreground",
              "focus:erix-outline-none erix-ring-0",
            )}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>,
    menuContainerRef.current,
  );
};
