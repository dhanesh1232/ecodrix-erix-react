"use client";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";

interface TableBtn {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  danger?: boolean;
  separator?: boolean;
}

export const TableMenu: React.FC = () => {
  const { ctx, engine, menuContainerRef, bubblePos, bubbleSide } =
    useErixEditor();
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [adjustedX, setAdjustedX] = React.useState(bubblePos?.x || 0);

  const isInTable = ctx.isInTable && ctx.hasSelection && bubblePos;

  // Sync adjustedX when bubblePos changes
  React.useEffect(() => {
    if (bubblePos) setAdjustedX(bubblePos.x);
  }, [bubblePos?.x, bubblePos]);

  // Horizontal Clamping Logic (same as BubbleMenu)
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
    if (isInTable) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [isInTable]);

  if (!mounted || !bubblePos || !menuContainerRef.current) return null;

  const buttons: TableBtn[] = [
    {
      icon: <ArrowUpToLine size={14} />,
      label: "Row Above",
      action: () => engine?.tableAddRow("before"),
    },
    {
      icon: <ArrowDownToLine size={14} />,
      label: "Row Below",
      action: () => engine?.tableAddRow("after"),
    },
    { separator: true } as TableBtn,
    {
      icon: <ArrowLeftToLine size={14} />,
      label: "Column Left",
      action: () => engine?.tableAddCol("before"),
    },
    {
      icon: <ArrowRightToLine size={14} />,
      label: "Column Right",
      action: () => engine?.tableAddCol("after"),
    },
    { separator: true } as TableBtn,
    {
      icon: <Trash2 size={14} />,
      label: "Delete Row",
      action: () => engine?.tableDeleteRow(),
      danger: true,
    },
    {
      icon: <Trash2 size={14} />,
      label: "Delete Col",
      action: () => engine?.tableDeleteCol(),
      danger: true,
    },
    { separator: true } as TableBtn,
    {
      icon: <TableIcon size={14} />,
      label: "Delete Table",
      action: () => engine?.deleteTable(),
      danger: true,
    },
  ];

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 flex items-center space-x-1 p-1 will-change-transform",
        "bg-erix-bg border border-erix-border",
        shadowClass,
        "transition-all duration-200 ease-out",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 scale-95 pointer-events-none",
        bubbleSide === "top" ? "translate-y-2" : "-translate-y-2",
        // Position slightly above the normal bubble menu if both are active, or just offset it
        "mt-8",
      )}
      style={{
        left: adjustedX,
        top: bubblePos.y,
        transform: `translateX(-50%) ${
          bubbleSide === "top" ? "translateY(-100%)" : "translateY(0)"
        }`,
        borderRadius: `var(--erix-radius-${popoverRadius})`,
      }}
    >
      {buttons.map((btn, i) => {
        if (btn.separator) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static separator elements
            <div key={`sep-${i}`} className="w-px h-4 bg-erix-border mx-1" />
          );
        }

        return (
          <button
            type="button"
            key={btn.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              btn.action();
            }}
            title={btn.label}
            className={cn(
              "p-1.5 transition-colors flex items-center justify-center",
              btn.danger
                ? "text-red-500 hover:bg-red-50"
                : "text-erix-fg hover:bg-erix-border/50",
              "hover:text-erix-primary focus:outline-none",
            )}
            style={{
              borderRadius: `var(--erix-radius-${buttonRadius})`,
            }}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>,
    menuContainerRef.current,
  );
};
