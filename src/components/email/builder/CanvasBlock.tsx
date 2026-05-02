"use client";
// src/components/email/builder/CanvasBlock.tsx
// Renders a single block on the email canvas.
//
// Bug-fixes in this revision:
//  1. Toolbar stays visible when mouse moves into it (data-block-toolbar + relatedTarget check)
//  2. Layout blocks (section / 2-col / 3-col) are now fully inline-editable
//  3. Block gets selected AND click doesn't bubble to canvas deselect handler
//  4. InlineEdit no longer stops mouseDown – lets block selection work naturally

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";
import { getBlockDef } from "./blockDefs";
import type { EmailBlock, BlockType } from "./types";
import { DND_MOVE_ID_KEY } from "./types";
import { DropZone } from "./EmailCanvasBuilder";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CanvasBlockProps {
  block: EmailBlock;
  isSelected: boolean;
  isHovered: boolean;
  draggingId: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<EmailBlock>) => void;
  onStyleUpdate: (id: string, style: Partial<EmailBlock["style"]>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropNew: (type: BlockType, index: number, parentId: string | null) => void;
  onDropMove: (
    movingId: string,
    index: number,
    parentId: string | null,
  ) => void;
  isPreview?: boolean;
}

// ─── Portal toolbar ────────────────────────────────────────────────────────────
// Portals into [data-erix-builder] root — never clipped by overflow: auto parents,
// and always below Radix dialogs which portal to document.body.
// KEY: The portal div has data-block-toolbar={blockId} so the block's
// onMouseLeave can detect "am I moving into my own toolbar?" and not hide it.
// Conversely, the toolbar re-fires onBlockHover(blockId) on mouseEnter so the
// block stays "hovered" even though the pointer is in the portal.

function FloatingToolbar({
  anchorEl,
  blockId,
  blockType,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onBlockHover,
}: {
  anchorEl: HTMLDivElement | null;
  blockId: string;
  blockType: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onBlockHover: (id: string | null) => void;
}) {
  const def = getBlockDef(blockType as never);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(
    null,
  );

  const reposition = React.useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const TOOLBAR_H = 34;
    const GAP = 5;
    let top = rect.top - TOOLBAR_H - GAP;
    if (top < 8) top = rect.bottom + GAP; // flip below if no room above
    setPos({ top, left: rect.left });
  }, [anchorEl]);

  React.useLayoutEffect(() => {
    reposition();
    const scrollParent = anchorEl?.closest("[data-canvas-scroll]");
    scrollParent?.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });
    return () => {
      scrollParent?.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [reposition, anchorEl]);

  if (!pos || typeof document === "undefined") return null;

  // Portal into the builder root element, not document.body.
  // Radix dialogs portal to document.body (above all local stacking contexts),
  // so they naturally sit above the toolbar without any z-index fighting.
  const portalTarget =
    document.querySelector<HTMLElement>("[data-erix-builder]") ?? document.body;

  return createPortal(
    <div
      // ← This attribute lets the block's onMouseLeave know we moved into OUR toolbar
      data-block-toolbar={blockId}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        // 9000: above builder chrome (~50) but below Radix Dialog portals
        // (Shadcn Dialog renders at a higher stacking context so it stays on top)
        zIndex: 9000,
        pointerEvents: "all",
      }}
      // Keep block hovered while pointer is in toolbar
      onMouseEnter={() => onBlockHover(blockId)}
      onMouseLeave={(e) => {
        const rel = e.relatedTarget;
        // Don't hide if moving back into the block element
        if (
          rel instanceof Element &&
          rel.closest(`[data-block-id="${blockId}"]`)
        )
          return;
        onBlockHover(null);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1px",
          background: "hsl(var(--erix-primary))",
          border: "1px solid hsl(var(--erix-primary-foreground) / 0.2)",
          borderRadius: "8px",
          padding: "3px 6px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {/* Drag handle */}
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(DND_MOVE_ID_KEY, blockId);
            e.dataTransfer.effectAllowed = "move";
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          title="Drag to reorder"
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "grab",
            color: "rgba(255,255,255,.55)",
            padding: "2px 3px",
            borderRadius: "4px",
            transition: "color .1s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLSpanElement).style.color =
              "hsl(var(--erix-primary-foreground))")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLSpanElement).style.color =
              "hsl(var(--erix-primary-foreground) / 0.6)")
          }
        >
          <GripVertical size={13} />
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "hsl(var(--erix-primary-foreground))",
            padding: "0 6px",
            letterSpacing: "0.4px",
            fontFamily: "sans-serif",
          }}
        >
          {def?.label ?? blockType}
        </span>

        <Sep />

        <TBtn onClick={onMoveUp} title="Move up (Ctrl+↑)" disabled={!canMoveUp}>
          <ChevronUp size={12} />
        </TBtn>
        <TBtn
          onClick={onMoveDown}
          title="Move down (Ctrl+↓)"
          disabled={!canMoveDown}
        >
          <ChevronDown size={12} />
        </TBtn>

        <Sep />

        <TBtn onClick={onDuplicate} title="Duplicate (Ctrl+D)">
          <Copy size={12} />
        </TBtn>
        <TBtn onClick={onDelete} title="Delete (Del)" danger>
          <Trash2 size={12} />
        </TBtn>
      </div>
    </div>,
    portalTarget,
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Sep() {
  return (
    <div
      style={{
        width: 1,
        height: 14,
        background: "hsl(var(--erix-primary-foreground) / 0.2)",
        margin: "0 3px",
        flexShrink: 0,
      }}
    />
  );
}

function TBtn({
  onClick,
  title,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        background: "none",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled
          ? "hsl(var(--erix-primary-foreground) / 0.3)"
          : danger
            ? "hsl(var(--erix-destructive))"
            : "hsl(var(--erix-primary-foreground) / 0.9)",
        transition: "background .1s, color .1s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background =
            "hsl(var(--erix-primary-foreground) / 0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "none";
      }}
    >
      {children}
    </button>
  );
}

// ─── Inline editor ────────────────────────────────────────────────────────────
// Only commits to React state on blur — prevents cursor jumping while typing.
// Does NOT stop mouseDown propagation — lets CanvasBlock.handleMouseDown fire
// so the block gets selected when clicking inside editable content.

function InlineEdit({
  html,
  style,
  tag: Tag = "div",
  placeholder,
  onCommit,
}: {
  html: string;
  style: React.CSSProperties;
  tag?: React.ElementType;
  placeholder?: string;
  onCommit: (newHtml: string) => void;
}) {
  const elRef = React.useRef<HTMLElement>(null);
  const lastRef = React.useRef(html);
  const focusedRef = React.useRef(false);
  const mountedRef = React.useRef(false);

  // Set initial HTML on mount (replaces dangerouslySetInnerHTML)
  React.useLayoutEffect(() => {
    if (elRef.current && !mountedRef.current) {
      elRef.current.innerHTML = html;
      lastRef.current = html;
      mountedRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external changes (undo/redo/backend) only while not focused
  React.useEffect(() => {
    if (!focusedRef.current && elRef.current && html !== lastRef.current) {
      elRef.current.innerHTML = html;
      lastRef.current = html;
    }
  }, [html]);

  return (
    <Tag
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      // biome-ignore lint/a11y/noStaticElementInteractions: intentional canvas editor
      data-placeholder={placeholder}
      style={{
        ...style,
        outline: "none",
        cursor: "text",
        // Show placeholder when empty
        ...((!html || html === "<br>") && placeholder
          ? { color: "hsl(var(--erix-muted-foreground))" }
          : {}),
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        focusedRef.current = false;
        const val = e.currentTarget.innerHTML;
        if (val !== lastRef.current) {
          lastRef.current = val;
          onCommit(val);
        }
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        // Stop keyboard shortcuts (Ctrl+Z, Del) from being caught by canvas
        e.stopPropagation();
        if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
      }}
      // ↓ Stop click from bubbling to canvas background (would deselect)
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      // ↓ Do NOT stop mouseDown — let it bubble to CanvasBlock to select the block
    />
  );
}

// ─── Block visual renderer ────────────────────────────────────────────────────

// Splits block.style into wrapper (box-model) props and content (typography) props
// so that ALL Style Manager changes are visually reflected on the canvas.

function getWrapperStyle(s: React.CSSProperties): React.CSSProperties {
  const hasSpecificPadding =
    s.paddingTop !== undefined ||
    s.paddingRight !== undefined ||
    s.paddingBottom !== undefined ||
    s.paddingLeft !== undefined;

  const hasSpecificMargin =
    s.marginTop !== undefined ||
    s.marginRight !== undefined ||
    s.marginBottom !== undefined ||
    s.marginLeft !== undefined;

  return {
    padding: hasSpecificPadding ? undefined : s.padding,
    paddingTop: s.paddingTop,
    paddingRight: s.paddingRight,
    paddingBottom: s.paddingBottom,
    paddingLeft: s.paddingLeft,
    margin: hasSpecificMargin ? undefined : s.margin,
    marginTop: s.marginTop,
    marginRight: s.marginRight,
    marginBottom: s.marginBottom,
    marginLeft: s.marginLeft,
    backgroundColor: s.backgroundColor,
    backgroundImage: s.backgroundImage,
    border: s.border,
    borderTop: s.borderTop,
    borderBottom: s.borderBottom,
    borderLeft: s.borderLeft,
    borderRight: s.borderRight,
    borderColor: s.borderColor,
    borderWidth: s.borderWidth,
    borderStyle: s.borderStyle,
    borderRadius: s.borderRadius,
    width: s.width,
    maxWidth: s.maxWidth,
    height: s.height,
    minHeight: s.minHeight,
    opacity: s.opacity != null ? Number(s.opacity) : undefined,
    boxShadow: s.boxShadow,
    textAlign: s.textAlign as React.CSSProperties["textAlign"],
  };
}

function getContentStyle(s: React.CSSProperties): React.CSSProperties {
  return {
    color: s.color,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontFamily: s.fontFamily || "inherit",
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textDecoration: s.textDecoration,
    textAlign: s.textAlign as React.CSSProperties["textAlign"],
  };
}

function BlockVisual({
  block,
  onUpdate,
  onStyleUpdate,
  onSelect,
  onHover,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDropNew,
  onDropMove,
  isSelected,
  isHovered,
  draggingId,
  isPreview,
}: {
  block: EmailBlock;
  onUpdate: (id: string, patch: Partial<EmailBlock>) => void;
  onStyleUpdate: (id: string, style: Partial<EmailBlock["style"]>) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropNew: (type: BlockType, index: number, parentId: string | null) => void;
  onDropMove: (
    movingId: string,
    index: number,
    parentId: string | null,
  ) => void;
  isSelected: boolean;
  isHovered: boolean;
  draggingId: string | null;
  isPreview: boolean;
}) {
  const s = block.style as React.CSSProperties;
  const wrapStyle = getWrapperStyle(s);
  const contentStyle = getContentStyle(s);

  switch (block.type) {
    // ── Heading ──────────────────────────────────────────────────────────
    case "heading": {
      const level = block.level ?? 1;
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      const defaultSize = level === 1 ? "28px" : level === 2 ? "22px" : "18px";

      // Logic to avoid shorthand/longhand conflicts
      const finalStyle = { ...wrapStyle };
      if (
        !finalStyle.padding &&
        !finalStyle.paddingTop &&
        !finalStyle.paddingBottom
      ) {
        finalStyle.padding = "16px 24px 8px";
      }

      return (
        <div style={finalStyle}>
          <InlineEdit
            html={block.content ?? "Your Heading Here"}
            tag={Tag}
            style={{
              margin: 0,
              fontSize: contentStyle.fontSize ?? defaultSize,
              fontWeight: contentStyle.fontWeight ?? "700",
              color: contentStyle.color ?? "#1e293b",
              lineHeight: contentStyle.lineHeight ?? "1.3",
              letterSpacing: contentStyle.letterSpacing ?? "-0.3px",
              fontFamily: contentStyle.fontFamily,
              textDecoration: contentStyle.textDecoration,
              textAlign: contentStyle.textAlign,
            }}
            onCommit={(v) => onUpdate(block.id, { content: v })}
          />
        </div>
      );
    }

    // ── Text / Paragraph ─────────────────────────────────────────────────
    case "text": {
      const finalStyle = { ...wrapStyle };
      if (
        !finalStyle.padding &&
        !finalStyle.paddingTop &&
        !finalStyle.paddingBottom
      ) {
        finalStyle.padding = "12px 24px";
      }

      return (
        <div style={finalStyle}>
          <InlineEdit
            html={block.content ?? "Enter your text here…"}
            style={{
              margin: 0,
              fontSize: contentStyle.fontSize ?? "15px",
              color: contentStyle.color ?? "#374151",
              lineHeight: contentStyle.lineHeight ?? "1.65",
              letterSpacing: contentStyle.letterSpacing,
              fontFamily: contentStyle.fontFamily,
              fontWeight: contentStyle.fontWeight,
              textDecoration: contentStyle.textDecoration,
              textAlign: contentStyle.textAlign,
            }}
            onCommit={(v) => onUpdate(block.id, { content: v })}
          />
        </div>
      );
    }

    // ── Button ───────────────────────────────────────────────────────────
    case "button": {
      const btnBg = s.backgroundColor ?? "#7c3aed";
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "16px 24px",
            textAlign:
              (wrapStyle.textAlign as "left" | "center" | "right") ?? "center",
          }}
        >
          <span
            contentEditable
            suppressContentEditableWarning
            style={{
              display: "inline-block",
              background: btnBg.startsWith("linear")
                ? btnBg
                : `linear-gradient(135deg, ${btnBg}, ${btnBg})`,
              color: contentStyle.color ?? "#ffffff",
              padding: "13px 36px",
              borderRadius: s.borderRadius ?? "8px",
              fontSize: contentStyle.fontSize ?? "15px",
              fontWeight: contentStyle.fontWeight ?? "600",
              cursor: "text",
              userSelect: "text",
              letterSpacing: contentStyle.letterSpacing ?? "0.2px",
              fontFamily: contentStyle.fontFamily,
              textDecoration: contentStyle.textDecoration ?? "none",
              outline: "none",
              maxWidth: s.maxWidth,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape")
                e.currentTarget.blur();
              e.stopPropagation();
            }}
            onBlur={(e) =>
              onUpdate(block.id, { content: e.currentTarget.textContent ?? "" })
            }
            onClick={(e) => e.stopPropagation()}
          >
            {block.content ?? "Click Me"}
          </span>
        </div>
      );
    }

    // ── Image ────────────────────────────────────────────────────────────
    case "image":
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "0",
            backgroundColor: wrapStyle.backgroundColor,
            textAlign: "center",
            borderRadius: wrapStyle.borderRadius,
            opacity: wrapStyle.opacity,
          }}
        >
          {block.src ? (
            <img
              src={block.src}
              alt={block.alt ?? ""}
              style={{
                maxWidth: s.maxWidth ?? "100%",
                width: s.width ?? "100%",
                height: "auto",
                display: "block",
                margin: "0 auto",
                borderRadius: s.borderRadius,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                minHeight: "160px",
                background: "hsl(var(--erix-muted) / 0.2)",
                border: "2px dashed hsl(var(--erix-border))",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "hsl(var(--erix-muted-foreground))",
                fontFamily: "sans-serif",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--erix-muted-foreground) / 0.5)"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "hsl(var(--erix-muted-foreground))",
                  }}
                >
                  No image selected
                </p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  Enter a URL in the Style panel →
                </p>
              </div>
            </div>
          )}
        </div>
      );

    // ── Divider ──────────────────────────────────────────────────────────
    case "divider":
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor,
            opacity: wrapStyle.opacity,
          }}
        >
          <hr
            style={{
              border: 0,
              borderTop: `${s.borderWidth ?? "1px"} ${s.borderStyle ?? "solid"} ${s.borderColor ?? "#e2e8f0"}`,
              margin: 0,
              borderRadius: s.borderRadius,
            }}
          />
        </div>
      );

    // ── Spacer ───────────────────────────────────────────────────────────
    case "spacer": {
      const h = block.height ?? 32;
      return (
        <div
          style={{
            height: `${h}px`,
            backgroundColor: wrapStyle.backgroundColor,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: wrapStyle.opacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "5%",
              right: "5%",
              top: "50%",
              height: "1px",
              background:
                "repeating-linear-gradient(90deg, hsl(var(--erix-primary) / 0.3) 0, hsl(var(--erix-primary) / 0.3) 6px, transparent 6px, transparent 14px)",
            }}
          />
          <span
            style={{
              position: "relative",
              background: "hsl(var(--erix-card))",
              border: "1px dashed hsl(var(--erix-border))",
              borderRadius: "4px",
              padding: "1px 8px",
              fontSize: "10px",
              fontFamily: "monospace",
              color: "hsl(var(--erix-muted-foreground))",
            }}
          >
            {h}px
          </span>
        </div>
      );
    }

    // ── Custom HTML ───────────────────────────────────────────────────────
    case "html":
      return (
        <div
          style={{ ...wrapStyle }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: user-controlled HTML block
          dangerouslySetInnerHTML={{ __html: block.content ?? "" }}
        />
      );

    // ── Variable token ────────────────────────────────────────────────────
    case "variable":
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "8px 24px",
            backgroundColor: wrapStyle.backgroundColor,
            textAlign: wrapStyle.textAlign as React.CSSProperties["textAlign"],
            opacity: wrapStyle.opacity,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "monospace",
              fontSize: contentStyle.fontSize ?? "13px",
              color: "hsl(var(--erix-primary))",
              background: "hsl(var(--erix-primary) / 0.08)",
              borderRadius: "6px",
              padding: "4px 10px",
              border: "1px dashed hsl(var(--erix-primary) / 0.4)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--erix-primary))"
              strokeWidth="2"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {`{{${block.variableName ?? "variable"}}}`}
          </span>
        </div>
      );

    // ── Social links ──────────────────────────────────────────────────────
    case "social": {
      let links: { label: string; href: string; color: string }[] = [];
      try {
        links = JSON.parse(block.content || "[]");
      } catch {
        links = [];
      }
      if (links.length === 0) {
        links = [
          { label: "Twitter", href: "#", color: "#1da1f2" },
          { label: "LinkedIn", href: "#", color: "#0077b5" },
          { label: "Instagram", href: "#", color: "#e1306c" },
        ];
      }
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor,
            display: "flex",
            gap: s.gap ?? "10px",
            flexWrap: "wrap",
            justifyContent:
              (wrapStyle.textAlign as "center" | "left" | "right") ?? "center",
            opacity: wrapStyle.opacity,
          }}
        >
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: l.color,
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
                borderRadius: "6px",
                padding: "7px 18px",
                background: `${l.color}18`,
                border: `1px solid ${l.color}40`,
                fontFamily: "sans-serif",
              }}
              onClick={(e) => e.preventDefault()}
            >
              {l.label}
            </a>
          ))}
        </div>
      );
    }

    // ── Product Card ──────────────────────────────────────────────────────
    case "productCard": {
      let data: {
        title: string;
        description: string;
        buttonLabel: string;
        buttonUrl: string;
      } = {
        title: "Product Name",
        description:
          "A brief description that explains why this product is worth buying.",
        buttonLabel: "Shop Now",
        buttonUrl: "#",
      };
      try {
        data = {
          ...data,
          ...(JSON.parse(block.content ?? "{}") as typeof data),
        };
      } catch {
        /* use defaults */
      }

      const cardBg = block.style.backgroundColor ?? "#ffffff";
      const accentColor = block.style.color ?? "hsl(var(--erix-primary))";

      return (
        <div
          style={{
            backgroundColor: cardBg,
            padding: wrapStyle.padding ?? "32px 24px",
            textAlign: "center",
            borderRadius: wrapStyle.borderRadius,
            opacity: wrapStyle.opacity,
          }}
        >
          {/* Product image */}
          {block.src ? (
            <img
              src={block.src}
              alt={block.alt ?? data.title}
              style={{
                width: "100%",
                maxWidth: "320px",
                height: "200px",
                objectFit: "cover",
                borderRadius: "12px",
                marginBottom: "20px",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: "320px",
                height: "200px",
                background: "hsl(var(--erix-muted) / 0.3)",
                borderRadius: "12px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "hsl(var(--erix-muted-foreground))",
                fontSize: "13px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Title */}
          <h3
            contentEditable
            suppressContentEditableWarning
            style={{
              margin: "0 0 10px",
              fontSize: contentStyle.fontSize ?? "20px",
              fontWeight: "700",
              color: contentStyle.color ?? "#1a202c",
              fontFamily: "inherit",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              e.stopPropagation();
            }}
            onBlur={(e) => {
              try {
                const current = JSON.parse(block.content ?? "{}");
                onUpdate(block.id, {
                  content: JSON.stringify({
                    ...current,
                    title: e.currentTarget.textContent ?? "",
                  }),
                });
              } catch {
                /* ignore */
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {data.title}
          </h3>

          {/* Description */}
          <p
            contentEditable
            suppressContentEditableWarning
            style={{
              margin: "0 0 16px",
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.65",
              fontFamily: "inherit",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              e.stopPropagation();
            }}
            onBlur={(e) => {
              try {
                const current = JSON.parse(block.content ?? "{}");
                onUpdate(block.id, {
                  content: JSON.stringify({
                    ...current,
                    description: e.currentTarget.textContent ?? "",
                  }),
                });
              } catch {
                /* ignore */
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {data.description}
          </p>

          {/* Price */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: accentColor,
              marginBottom: "20px",
              letterSpacing: "-0.5px",
            }}
          >
            {block.price ?? "$29.99"}
          </div>

          {/* CTA Button */}
          <a
            href={data.buttonUrl ?? block.href ?? "#"}
            style={{
              display: "inline-block",
              background: `linear-gradient(135deg, hsl(var(--erix-primary)), hsl(var(--erix-primary) / 0.8))`,
              color: "#ffffff",
              padding: "13px 36px",
              borderRadius: block.style.borderRadius ?? "8px",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: "600",
              letterSpacing: "0.2px",
            }}
            onClick={(e) => e.preventDefault()}
          >
            {data.buttonLabel ?? "Shop Now"}
          </a>
        </div>
      );
    }

    // ── Footer ────────────────────────────────────────────────────────────
    case "footer": {
      let data: {
        copyright: string;
        links: { label: string; href: string }[];
      } = {
        copyright: "© 2025 Your Company. All rights reserved.",
        links: [
          { label: "Unsubscribe", href: "#" },
          { label: "Privacy Policy", href: "#" },
        ],
      };
      try {
        data = { ...data, ...JSON.parse(block.content ?? "{}") };
      } catch {
        /* use defaults */
      }

      return (
        <div
          style={{
            backgroundColor: wrapStyle.backgroundColor ?? "#f8fafc",
            padding: wrapStyle.padding ?? "24px 20px",
            textAlign: "center",
            borderTop: block.style.borderTop ?? "1px solid #e2e8f0",
            opacity: wrapStyle.opacity,
          }}
        >
          {/* Footer links */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            {data.links.map((l, i) => (
              <a
                key={i}
                href={l.href}
                style={{
                  fontSize: "12px",
                  color: contentStyle.color ?? "#64748b",
                  textDecoration: "none",
                  fontFamily: "inherit",
                }}
                onClick={(e) => e.preventDefault()}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#94a3b8",
              fontFamily: "inherit",
            }}
          >
            {data.copyright}
          </p>
        </div>
      );
    }

    // ── Video thumbnail ───────────────────────────────────────────────────
    case "video": {
      let vcData: { thumbnail: string } = { thumbnail: "" };
      try {
        vcData = {
          ...vcData,
          ...(JSON.parse(block.content ?? "{}") as typeof vcData),
        };
      } catch {
        /* ignore */
      }
      const thumbnail = vcData.thumbnail;
      const videoUrl = block.src ?? "#";

      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor ?? "#ffffff",
            opacity: wrapStyle.opacity,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              borderRadius: block.style.borderRadius ?? "12px",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={block.alt ?? "Video thumbnail"}
                style={{
                  width: "100%",
                  display: "block",
                  aspectRatio: "16/9",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontFamily: "sans-serif",
                  }}
                >
                  Set thumbnail URL in Style panel →
                </span>
              </div>
            )}

            {/* Play button overlay */}
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                backdropFilter: "blur(4px)",
              }}
              onClick={(e) => e.preventDefault()}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="hsl(var(--erix-primary))"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </a>
          </div>

          {/* Watch CTA */}
          <p
            style={{
              margin: "10px 0 0",
              textAlign: "center",
              fontSize: "13px",
              color: "#64748b",
              fontFamily: "inherit",
            }}
          >
            {block.alt ?? "Watch our video"}
          </p>
        </div>
      );
    }

    // ── List ──────────────────────────────────────────────────────────────
    case "list": {
      let data: { style: "bullet" | "numbered" | "check"; items: string[] } = {
        style: "bullet",
        items: ["First item", "Second item", "Third item"],
      };
      try {
        data = { ...data, ...JSON.parse(block.content ?? "{}") };
      } catch {
        /* use defaults */
      }

      const ListTag = data.style === "numbered" ? "ol" : "ul";

      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "12px 24px",
            backgroundColor: wrapStyle.backgroundColor ?? "#ffffff",
            opacity: wrapStyle.opacity,
          }}
        >
          <ListTag
            style={{
              margin: 0,
              paddingLeft: data.style === "check" ? "0" : "28px",
              listStyle:
                data.style === "numbered"
                  ? "decimal"
                  : data.style === "bullet"
                    ? "disc"
                    : "none",
            }}
          >
            {data.items.map((item, i) => (
              <li
                key={i}
                style={{
                  marginBottom: "10px",
                  fontSize: contentStyle.fontSize ?? "15px",
                  color: contentStyle.color ?? "#374151",
                  lineHeight: contentStyle.lineHeight ?? "1.75",
                  fontFamily: "inherit",
                  display: data.style === "check" ? "flex" : undefined,
                  alignItems: data.style === "check" ? "flex-start" : undefined,
                  gap: data.style === "check" ? "10px" : undefined,
                  listStyle: data.style === "check" ? "none" : undefined,
                }}
              >
                {data.style === "check" && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="hsl(var(--erix-primary) / 0.1)"
                      stroke="hsl(var(--erix-primary))"
                      strokeWidth="1.5"
                    />
                    <polyline
                      points="8 12 11 15 16 9"
                      stroke="hsl(var(--erix-primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item}
              </li>
            ))}
          </ListTag>
        </div>
      );
    }

    // ── Menu / Navigation bar ─────────────────────────────────────────────
    case "menu": {
      let links: { label: string; href: string }[] = [
        { label: "Home", href: "#" },
        { label: "Products", href: "#" },
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
      ];
      try {
        links = JSON.parse(block.content ?? "[]");
      } catch {
        /* use defaults */
      }

      const menuBg = wrapStyle.backgroundColor ?? "#1e1b4b";
      const linkColor = contentStyle.color ?? "#ffffff";

      return (
        <div
          style={{
            backgroundColor: menuBg,
            padding: wrapStyle.padding ?? "14px 24px",
            display: "flex",
            justifyContent:
              (wrapStyle.textAlign as "center" | "left" | "right") ?? "center",
            gap: s.gap ?? "28px",
            flexWrap: "wrap",
            alignItems: "center",
            opacity: wrapStyle.opacity,
          }}
        >
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href}
              style={{
                fontSize: contentStyle.fontSize ?? "14px",
                color: linkColor,
                fontWeight: contentStyle.fontWeight ?? "500",
                textDecoration: "none",
                fontFamily: "inherit",
                letterSpacing: "0.2px",
                opacity: 0.9,
              }}
              onClick={(e) => e.preventDefault()}
            >
              {l.label}
            </a>
          ))}
        </div>
      );
    }

    // ── Section (editable container) ──────────────────────────────────────

    case "section":
      return (
        <div
          style={{
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor ?? "#ffffff",
            minHeight: "60px",
            borderRadius: wrapStyle.borderRadius,
            borderColor: wrapStyle.borderColor,
            borderWidth: wrapStyle.borderWidth,
            borderStyle: wrapStyle.borderStyle,
            opacity: wrapStyle.opacity,
          }}
        >
          {!isPreview && (
            <DropZone
              insertAtIndex={0}
              parentId={block.id}
              isActive={!!draggingId}
              onDropNew={onDropNew}
              onDropMove={onDropMove}
            />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0",
            }}
          >
            {(block.children ?? []).map((child, ci) => (
              <React.Fragment key={child.id}>
                <CanvasBlock
                  block={child}
                  isSelected={false} // Selection state is handled by the main component
                  isHovered={false}
                  draggingId={draggingId}
                  canMoveUp={ci > 0}
                  canMoveDown={ci < (block.children?.length ?? 0) - 1}
                  onSelect={onSelect}
                  onHover={onHover}
                  onUpdate={onUpdate}
                  onStyleUpdate={onStyleUpdate}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropNew={onDropNew}
                  onDropMove={onDropMove}
                  isPreview={isPreview}
                />
                {!isPreview && (
                  <DropZone
                    insertAtIndex={ci + 1}
                    parentId={block.id}
                    isActive={!!draggingId}
                    onDropNew={onDropNew}
                    onDropMove={onDropMove}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {(block.children ?? []).length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "hsl(var(--erix-muted-foreground))",
                fontSize: "13px",
                border: "1px dashed hsl(var(--erix-border))",
                borderRadius: "8px",
                pointerEvents: "none",
              }}
            >
              Empty Section - Drag blocks here
            </div>
          )}
        </div>
      );

    // ── 2 Columns ────────────────────────────────────────────────────────
    case "twoColumns": {
      const cols = block.children ?? [];
      return (
        <div
          style={{
            display: "flex",
            gap: s.gap ?? "12px",
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor ?? "#ffffff",
            borderRadius: wrapStyle.borderRadius,
            opacity: wrapStyle.opacity,
          }}
        >
          {[0, 1].map((i) => {
            const col = cols[i] ?? {
              id: `${block.id}-col-${i}`,
              type: "text",
              children: [],
            };
            return (
              <div
                key={col.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: "100px",
                  border: "1px dashed hsl(var(--erix-border) / 0.5)",
                  borderRadius: "8px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {!isPreview && (
                  <DropZone
                    insertAtIndex={0}
                    parentId={col.id}
                    isActive={!!draggingId}
                    onDropNew={onDropNew}
                    onDropMove={onDropMove}
                  />
                )}
                {(col.children ?? []).map((child, chi) => (
                  <React.Fragment key={child.id}>
                    <CanvasBlock
                      block={child}
                      isSelected={false}
                      isHovered={false}
                      draggingId={draggingId}
                      canMoveUp={chi > 0}
                      canMoveDown={chi < (col.children?.length ?? 0) - 1}
                      onSelect={onSelect}
                      onHover={onHover}
                      onUpdate={onUpdate}
                      onStyleUpdate={onStyleUpdate}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDropNew={onDropNew}
                      onDropMove={onDropMove}
                      isPreview={isPreview}
                    />
                    {!isPreview && (
                      <DropZone
                        insertAtIndex={chi + 1}
                        parentId={col.id}
                        isActive={!!draggingId}
                        onDropNew={onDropNew}
                        onDropMove={onDropMove}
                      />
                    )}
                  </React.Fragment>
                ))}
                {(col.children ?? []).length === 0 && (
                  <div
                    style={{
                      padding: "10px",
                      fontSize: "11px",
                      color: "hsl(var(--erix-muted-foreground))",
                      textAlign: "center",
                      pointerEvents: "none",
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Empty Column
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // ── 3 Columns ────────────────────────────────────────────────────────
    case "threeColumns": {
      const cols = block.children ?? [];
      return (
        <div
          style={{
            display: "flex",
            gap: s.gap ?? "10px",
            padding: wrapStyle.padding ?? "16px 24px",
            backgroundColor: wrapStyle.backgroundColor ?? "#ffffff",
            borderRadius: wrapStyle.borderRadius,
            opacity: wrapStyle.opacity,
          }}
        >
          {[0, 1, 2].map((i) => {
            const col = cols[i] ?? {
              id: `${block.id}-col-${i}`,
              type: "text",
              children: [],
            };
            return (
              <div
                key={col.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: "100px",
                  border: "1px dashed hsl(var(--erix-border) / 0.5)",
                  borderRadius: "8px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {!isPreview && (
                  <DropZone
                    insertAtIndex={0}
                    parentId={col.id}
                    isActive={!!draggingId}
                    onDropNew={onDropNew}
                    onDropMove={onDropMove}
                  />
                )}
                {(col.children ?? []).map((child, chi) => (
                  <React.Fragment key={child.id}>
                    <CanvasBlock
                      block={child}
                      isSelected={false}
                      isHovered={false}
                      draggingId={draggingId}
                      canMoveUp={chi > 0}
                      canMoveDown={chi < (col.children?.length ?? 0) - 1}
                      onSelect={onSelect}
                      onHover={onHover}
                      onUpdate={onUpdate}
                      onStyleUpdate={onStyleUpdate}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDropNew={onDropNew}
                      onDropMove={onDropMove}
                      isPreview={isPreview}
                    />
                    {!isPreview && (
                      <DropZone
                        insertAtIndex={chi + 1}
                        parentId={col.id}
                        isActive={!!draggingId}
                        onDropNew={onDropNew}
                        onDropMove={onDropMove}
                      />
                    )}
                  </React.Fragment>
                ))}
                {(col.children ?? []).length === 0 && (
                  <div
                    style={{
                      padding: "10px",
                      fontSize: "11px",
                      color: "hsl(var(--erix-muted-foreground))",
                      textAlign: "center",
                      pointerEvents: "none",
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Empty Column
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Main CanvasBlock ─────────────────────────────────────────────────────────

export function CanvasBlock({
  block,
  isSelected,
  isHovered,
  draggingId,
  canMoveUp,
  canMoveDown,
  onSelect,
  onHover,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onStyleUpdate,
  onDropNew,
  onDropMove,
  isPreview = false,
}: CanvasBlockProps) {
  const blockRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isBeingDragged = draggingId === block.id;
  const toolbarVisible = (isSelected || isHovered) && !draggingId && !isPreview;

  const borderColor = isSelected
    ? "#7c3aed"
    : isHovered
      ? "rgba(124,58,237,.5)"
      : "transparent";

  return (
    <div
      ref={blockRef}
      // ← data-block-id is queried by FloatingToolbar.onMouseLeave to detect
      //   "did the pointer return to the block?" and avoid hiding the toolbar.
      data-block-id={block.id}
      style={{
        position: "relative",
        outline: `2px solid ${borderColor}`,
        outlineOffset: "2px",
        borderRadius: "3px",
        opacity: isBeingDragged ? 0.25 : 1,
        transition: "outline-color 0.12s, opacity 0.15s",
        cursor: "default",
      }}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={(e) => {
        // Don't clear hover if the pointer is entering this block's toolbar
        const rel = e.relatedTarget;
        if (
          rel instanceof Element &&
          rel.closest(`[data-block-toolbar="${block.id}"]`)
        )
          return;
        onHover(null);
      }}
      // Select block on click
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      // IMPORTANT: stop click from bubbling to canvas background (which deselects)
      onClick={(e) => e.stopPropagation()}
    >
      {/* Block content */}
      <BlockVisual
        block={block}
        isSelected={isSelected}
        isHovered={isHovered}
        draggingId={draggingId}
        isPreview={isPreview}
        onSelect={onSelect}
        onHover={onHover}
        onUpdate={onUpdate}
        onStyleUpdate={onStyleUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDropNew={onDropNew}
        onDropMove={onDropMove}
      />

      {/* Floating portal toolbar */}
      {mounted && toolbarVisible && (
        <FloatingToolbar
          anchorEl={blockRef.current}
          blockId={block.id}
          blockType={block.type}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onDuplicate={() => onDuplicate(block.id)}
          onDelete={() => onDelete(block.id)}
          onMoveUp={() => onMoveUp(block.id)}
          onMoveDown={() => onMoveDown(block.id)}
          onDragStart={() => onDragStart(block.id)}
          onDragEnd={onDragEnd}
          onBlockHover={onHover}
        />
      )}

      {/* Selection corner handles */}
      {isSelected &&
        (
          [
            { top: -3, left: -3 },
            { top: -3, right: -3 },
            { bottom: -3, left: -3 },
            { bottom: -3, right: -3 },
          ] as const
        ).map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              background: "#7c3aed",
              borderRadius: "50%",
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,.25)",
              pointerEvents: "none",
              ...pos,
            }}
          />
        ))}
    </div>
  );
}
