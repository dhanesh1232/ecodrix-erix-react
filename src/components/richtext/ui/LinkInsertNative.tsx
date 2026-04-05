// src/components/richtext/ui/LinkInsertNative.tsx
"use client";
import { Link, Link2Off, X } from "lucide-react";
import * as React from "react";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const LinkInsertNative: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { linkPickerVisible, setLinkPickerVisible, engine, ctx } =
    useErixEditor();
  const [url, setUrl] = React.useState("https://");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (linkPickerVisible) {
      setUrl("https://");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [linkPickerVisible]);

  const apply = () => {
    if (!url.trim()) return;
    engine?.link(url.trim());
    setLinkPickerVisible(false);
  };

  const remove = () => {
    engine?.unlink();
    setLinkPickerVisible(false);
  };

  const { popoverRadius, buttonRadius, shadowClass } = useErixStyle();

  return (
    <Popover open={linkPickerVisible} onOpenChange={setLinkPickerVisible}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={8}
        className={cn(
          "erix-z-300 erix-w-80 erix-border erix-border-border",
          "erix-bg-popover/96 erix-backdrop-blur-xl erix-p-4 erix-flex erix-flex-col erix-gap-3",
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
          <div className="erix-flex erix-items-center erix-gap-2">
            <div
              className={cn(
                "erix-w-7 erix-h-7 erix-bg-primary/10 erix-flex erix-items-center erix-justify-center",
                buttonRadius,
              )}
            >
              <Link size={14} className="erix-text-primary" />
            </div>
            <span className="erix-font-bold erix-text-[13px] erix-tracking-tight">
              {ctx.link ? "Edit Link" : "Insert Link"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLinkPickerVisible(false)}
            className={cn(
              "erix-w-7 erix-h-7 erix-flex erix-items-center erix-justify-center hover:erix-bg-accent erix-text-muted-foreground hover:erix-text-foreground erix-transition-all",
              buttonRadius,
            )}
          >
            <X size={14} />
          </button>
        </div>

        {/* URL Input */}
        <div className="erix-relative">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
              if (e.key === "Escape") setLinkPickerVisible(false);
            }}
            placeholder="https://example.com"
            className={cn(
              "erix-w-full erix-text-sm erix-px-3 erix-py-2 erix-border erix-border-border erix-bg-background/50",
              buttonRadius,
              "placeholder:erix-text-muted-foreground/40",
              "focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20 erix-transition-all",
            )}
          />
        </div>

        {/* Actions */}
        <div className="erix-flex erix-gap-2 erix-mt-1">
          {ctx.link && (
            <button
              type="button"
              onClick={remove}
              className={cn(
                "erix-px-3 erix-py-2 erix-text-xs erix-font-semibold erix-text-destructive hover:erix-bg-destructive/10 erix-transition-all erix-flex erix-items-center erix-gap-1.5",
                buttonRadius,
              )}
            >
              <Link2Off size={13} />
              Remove
            </button>
          )}
          <div className="erix-flex-1" />
          <button
            type="button"
            onClick={apply}
            disabled={!url.trim() || url === "https://"}
            className={cn(
              "erix-px-4 erix-py-2 erix-text-xs erix-font-bold",
              buttonRadius,
              "erix-bg-primary erix-text-primary-foreground hover:erix-bg-primary/90 erix-transition-all",
              "disabled:erix-opacity-30 disabled:erix-pointer-events-none active:erix-scale-95",
              "erix-shadow-sm",
            )}
          >
            {ctx.link ? "Update" : "Insert"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
