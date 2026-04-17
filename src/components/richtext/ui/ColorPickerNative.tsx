// src/components/richtext/ui/ColorPickerNative.tsx
"use client";
import { Check, Highlighter, Palette, Type, X } from "lucide-react";
import * as React from "react";
import { type ColorResult, SketchPicker } from "react-color";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SWATCHES = [
  "#000000",
  "#374151",
  "#6b7280",
  "#ffffff",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#0284c7",
  "#4f46e5",
  "#7c3aed",
  "#db2777",
  "transparent",
];

type ColorType = "text" | "highlight";

export const ColorPickerNative: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { engine, ctx } = useErixEditor();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<ColorType>("text");

  // Current values from editor context
  const textColor = ctx.foreColor || "#000000";
  const highlightColor = ctx.backColor || "transparent";

  const currentColor = tab === "text" ? textColor : highlightColor;

  const handleColorChange = (result: ColorResult) => {
    const newColor = result.hex;
    if (tab === "text") {
      engine?.color(newColor);
    } else {
      engine?.highlight(newColor);
    }
  };

  const handleSwatchSelect = (c: string) => {
    if (tab === "text") {
      engine?.color(c);
    } else {
      engine?.highlight(c);
    }
  };

  const { popoverRadius, buttonRadius, shadowClass } = useErixStyle();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className={cn(
          "erix-z-300 erix-w-[280px] erix-border erix-border-border",
          "erix-bg-popover/96 erix-backdrop-blur-xl erix-p-4 erix-flex erix-flex-col erix-gap-4",
          "erix-animate-in erix-fade-in erix-zoom-in-95 erix-duration-200",
          popoverRadius,
          shadowClass,
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="erix-flex erix-items-center erix-justify-between">
          <div className="erix-flex erix-items-center erix-gap-2.5">
            <div
              className={cn(
                "erix-w-8 erix-h-8 erix-bg-primary/10 erix-flex erix-items-center erix-justify-center",
                buttonRadius,
              )}
            >
              <Palette size={15} className="erix-text-primary" />
            </div>
            <span className="erix-font-bold erix-text-sm erix-tracking-tight">
              Color Settings
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn(
              "erix-w-7 erix-h-7 erix-flex erix-items-center erix-justify-center hover:erix-bg-accent erix-text-muted-foreground hover:erix-text-foreground erix-transition-all",
              buttonRadius,
            )}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className={cn(
            "erix-flex erix-p-1 erix-bg-muted/50 erix-gap-1",
            buttonRadius,
          )}
        >
          <button
            type="button"
            onClick={() => setTab("text")}
            className={cn(
              "erix-flex-1 erix-flex erix-items-center erix-justify-center erix-gap-2 erix-py-2 erix-text-[11px] erix-font-bold erix-transition-all",
              buttonRadius,
              tab === "text"
                ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                : "erix-text-muted-foreground hover:erix-text-foreground",
            )}
          >
            <Type size={13} />
            Text
          </button>
          <button
            type="button"
            onClick={() => setTab("highlight")}
            className={cn(
              "erix-flex-1 erix-flex erix-items-center erix-justify-center erix-gap-2 erix-py-2 erix-text-[11px] erix-font-bold erix-transition-all",
              buttonRadius,
              tab === "highlight"
                ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                : "erix-text-muted-foreground hover:erix-text-foreground",
            )}
          >
            <Highlighter size={13} />
            Background
          </button>
        </div>

        {/* Swatches */}
        <div className="erix-grid erix-grid-cols-6 erix-gap-2">
          {SWATCHES.map((c) => (
            <button
              type="button"
              key={c}
              title={c}
              onClick={() => handleSwatchSelect(c)}
              className={cn(
                "erix-w-full erix-aspect-square erix-border erix-border-border/40 erix-transition-all hover:erix-scale-105 hover:erix-shadow-sm focus:erix-outline-none erix-flex erix-items-center erix-justify-center",
                buttonRadius,
                c === "transparent" &&
                  "erix-bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJElEQVQoU2NkYGAwZiAD/P8P/ACTAwA=')] erix-bg-repeat",
                currentColor === c &&
                  "erix-ring-2 erix-ring-primary erix-ring-offset-2 erix-ring-offset-popover",
              )}
              style={{ background: c !== "transparent" ? c : undefined }}
            >
              {currentColor === c && (
                <Check
                  size={12}
                  className={cn(
                    c === "#ffffff" || c === "transparent"
                      ? "erix-text-black"
                      : "erix-text-white",
                  )}
                />
              )}
            </button>
          ))}
        </div>

        <div className="erix-h-px erix-bg-border/60 -erix-mx-4" />

        {/* Custom Picker */}
        <div className="erix-flex erix-justify-center erix-py-1">
          <SketchPicker
            color={currentColor === "transparent" ? "#ffffff" : currentColor}
            onChangeComplete={handleColorChange}
            disableAlpha={true}
            presetColors={[]}
            styles={{
              default: {
                picker: {
                  boxShadow: "none",
                  border: "none",
                  background: "transparent",
                  padding: "0",
                  width: "100%",
                },
                saturation: {
                  borderRadius:
                    buttonRadius.replace("erix-rounded-", "") === "none"
                      ? "0"
                      : "8px",
                },
                activeColor: {
                  borderRadius: "4px",
                },
                controls: {
                  paddingTop: "14px",
                },
                hue: {
                  height: "12px",
                  borderRadius: "6px",
                },
              },
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className={cn(
            "erix-w-full erix-px-4 erix-py-2.5 erix-text-xs erix-font-bold erix-bg-primary erix-text-primary-foreground hover:erix-bg-primary/90 erix-transition-all active:erix-scale-95",
            buttonRadius,
            shadowClass !== "erix-shadow-none" &&
              "erix-shadow-lg erix-shadow-primary/20",
          )}
        >
          Done
        </button>
      </PopoverContent>
    </Popover>
  );
};
