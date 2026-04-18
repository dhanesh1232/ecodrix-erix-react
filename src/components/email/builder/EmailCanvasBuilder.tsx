"use client";
// src/components/email/builder/EmailCanvasBuilder.tsx
// Full visual email IDE.
//
// Fixed in this revision:
//  - DropZone uses insertAtIndex so drops at position 0 correctly PREPEND
//  - Click-to-insert in library inserts after selected block (not always at end)
//  - canvas scroll container has data-canvas-scroll for toolbar repositioning
//  - moveBlockUp / moveBlockDown wired into CanvasBlock
//  - Keyboard: Ctrl+D duplicate, Escape deselect, Del/Backspace delete

import * as React from "react";
import {
  Code2,
  Eye,
  Loader2,
  Mail,
  Monitor,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Send,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IEmailTemplate, VariableMapping } from "@/types/email";
import { useEmailTemplate } from "@/hooks/email/useEmailTemplates";
import { useEmailTemplateSync } from "@/hooks/email/useEmailTemplateSync";
import { SyncStatus } from "../SyncStatus";

import { useCanvasState } from "./useCanvasState";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import { CanvasBlock } from "./CanvasBlock";
import { StylePanel } from "./StylePanel";
import { documentToHtml, documentToPreviewHtml } from "./htmlExport";
import type { BlockType, EmailDocument } from "./types";
import { DND_MOVE_ID_KEY, DND_NEW_TYPE_KEY } from "./types";
import { VariableMappingPanel } from "../VariableMappingPanel";

// ─── Device presets ───────────────────────────────────────────────────────────

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "640px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

// ─── Drop Zone ────────────────────────────────────────────────────────────────
// insertAtIndex is the FINAL position the new block should land at.
// This is correct: index 0 = prepend, index N = append after Nth block.

export interface DropZoneProps {
  insertAtIndex: number;
  parentId?: string | null;
  isActive: boolean;
  onDropNew: (type: BlockType, index: number, parentId: string | null) => void;
  onDropMove: (
    movingId: string,
    index: number,
    parentId: string | null,
  ) => void;
}

export function DropZone({
  insertAtIndex,
  parentId = null,
  isActive,
  onDropNew,
  onDropMove,
}: DropZoneProps) {
  const [over, setOver] = React.useState(false);

  return (
    <div
      style={{
        // Expands hit area when dragging is active, stays invisible at rest
        height: over ? "36px" : isActive ? "12px" : "6px",
        transition: "height .1s ease",
        display: "flex",
        alignItems: "center",
        position: "relative",
        zIndex: 5,
        cursor: over ? "copy" : "default",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const newType = e.dataTransfer.getData(DND_NEW_TYPE_KEY) as BlockType;
        const moveId = e.dataTransfer.getData(DND_MOVE_ID_KEY);
        if (newType) onDropNew(newType, insertAtIndex, parentId);
        else if (moveId) onDropMove(moveId, insertAtIndex, parentId);
      }}
    >
      {/* Insertion line — only visible when this specific zone is hovered */}
      {over && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 0,
            pointerEvents: "none",
          }}
        >
          {/* Left line */}
          <div
            style={{
              flex: 1,
              height: "2px",
              background: "hsl(var(--erix-primary))",
              borderRadius: "1px",
            }}
          />
          {/* Center diamond dot */}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              background: "hsl(var(--erix-primary))",
              transform: "rotate(45deg)",
              flexShrink: 0,
              margin: "0 2px",
            }}
          />
          {/* Right line */}
          <div
            style={{
              flex: 1,
              height: "2px",
              background: "hsl(var(--erix-primary))",
              borderRadius: "1px",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Code view modal ──────────────────────────────────────────────────────────

interface CodeModalProps {
  html: string;
  onClose: () => void;
}
function CodeModal({ html, onClose }: CodeModalProps) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(90vw, 820px)",
          height: "82vh",
          background: "hsl(var(--erix-card))",
          border: "1px solid hsl(var(--erix-border))",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid hsl(var(--erix-border))",
            flexShrink: 0,
          }}
        >
          <Code2 size={14} className="erix-text-primary" />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "hsl(var(--erix-foreground))",
              fontFamily: "sans-serif",
            }}
          >
            Generated HTML
          </span>
          <button
            type="button"
            onClick={copy}
            style={{
              marginLeft: "auto",
              padding: "5px 14px",
              background: copied
                ? "hsl(var(--erix-primary) / 0.1)"
                : "hsl(var(--erix-primary) / 0.2)",
              border: `1px solid hsl(var(--erix-primary))`,
              borderRadius: "6px",
              color: "hsl(var(--erix-primary))",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "sans-serif",
            }}
          >
            {copied ? "✓ Copied!" : "Copy HTML"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "hsl(var(--erix-muted-foreground))",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <pre
          style={{
            flex: 1,
            overflow: "auto",
            margin: 0,
            padding: "16px",
            fontSize: "11px",
            color: "hsl(var(--erix-foreground))",
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {html}
        </pre>
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  html: string;
  onClose: () => void;
}
function PreviewModal({ html, onClose }: PreviewModalProps) {
  const [device, setDevice] = React.useState<DeviceId>("desktop");
  const width = DEVICES.find((d) => d.id === device)?.width ?? "100%";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.85)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 20px",
          background: "hsl(var(--erix-card))",
          borderBottom: "1px solid hsl(var(--erix-border))",
          flexShrink: 0,
        }}
      >
        <Eye size={14} className="erix-text-primary" />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "hsl(var(--erix-foreground))",
            fontFamily: "sans-serif",
          }}
        >
          Live Preview
        </span>
        <div style={{ display: "flex", gap: "4px", marginLeft: "16px" }}>
          {DEVICES.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  background:
                    device === d.id
                      ? "hsl(var(--erix-primary) / 0.15)"
                      : "transparent",
                  border: `1px solid ${device === d.id ? "hsl(var(--erix-primary) / 0.3)" : "hsl(var(--erix-border))"}`,
                  borderRadius: "6px",
                  color:
                    device === d.id
                      ? "hsl(var(--erix-primary))"
                      : "hsl(var(--erix-muted-foreground))",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "sans-serif",
                }}
              >
                <Icon size={13} />
                {d.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: "hsl(var(--erix-muted-foreground))",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          overflow: "auto",
          padding: "24px",
          background: "hsl(var(--erix-background))",
        }}
      >
        <div
          style={{
            width,
            maxWidth: "100%",
            boxShadow: "0 8px 60px rgba(0,0,0,.6)",
            borderRadius: "8px",
            overflow: "hidden",
            transition: "width .3s ease",
          }}
        >
          <iframe
            title="Email Preview"
            srcDoc={html}
            style={{ width: "100%", border: "none", minHeight: "600px" }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EmailCanvasBuilderProps {
  templateId?: string | null;
  onBack?: () => void;
  onSave?: (template: IEmailTemplate) => void;
  onCreated?: (id: string) => void;
  /** Called when user clicks "Send Test". Receives the full HTML and target email address. */
  onSendTest?: (html: string, to: string) => void | Promise<void>;
  className?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmailCanvasBuilder({
  templateId: savedIdProp = null,
  onBack,
  onSave,
  onSendTest,
  className = "",
}: EmailCanvasBuilderProps) {
  const [savedId] = React.useState<string | null>(savedIdProp ?? null);
  const [device, setDevice] = React.useState<DeviceId>("desktop");
  const [rightTab, setRightTab] = React.useState<"style" | "mapping">("style");
  const [showCode, setShowCode] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [isInCanvasPreview, setIsInCanvasPreview] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [showSendTest, setShowSendTest] = React.useState(false);
  const [sendTestEmail, setSendTestEmail] = React.useState("");
  const [sendTestStatus, setSendTestStatus] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  // ── Responsive states ────────────────────────────────────────────────
  const [isMobile, setIsMobile] = React.useState(false);
  const [showLeftMobile, setShowLeftMobile] = React.useState(false);
  const [showRightMobile, setShowRightMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clear selection + hover state when entering canvas preview so the
  // floating toolbar never flashes over the read-only preview canvas.
  React.useEffect(() => {
    if (isInCanvasPreview) {
      selectBlock(null);
      hoverBlock(null);
      setShowLeftMobile(false);
      setShowRightMobile(false);
    }
  }, [isInCanvasPreview]);

  // ── Load template ─────────────────────────────────────────────────────
  const { template: loaded, loading } = useEmailTemplate(savedId);

  // ── Canvas state ──────────────────────────────────────────────────────
  const initialDoc = React.useMemo<Partial<EmailDocument> | undefined>(() => {
    if (!loaded) return undefined;
    const dj = loaded.designJson as Record<string, unknown> | null;
    return {
      backgroundColor: (dj?.backgroundColor as string) ?? "#f1f5f9",
      contentWidth: (dj?.contentWidth as number) ?? 600,
      fontFamily:
        (dj?.fontFamily as string) ??
        "'Helvetica Neue', Helvetica, Arial, sans-serif",
      blocks: (dj?.blocks as []) ?? [],
    };
  }, [loaded]);

  const {
    editorState,
    insertBlockAt,
    insertBlockAfterSelected,
    updateBlock,
    updateBlockStyle,
    removeBlock,
    duplicateBlock,
    moveBlockTo,
    moveBlockUp,
    moveBlockDown,
    selectBlock,
    hoverBlock,
    setDraggingBlockId,
    setDraggingNewType,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedBlock,
    selectedIndex,
    updateDocumentStyle,
  } = useCanvasState(initialDoc);

  const {
    document: emailDoc,
    selectedId,
    hoveredId,
    draggingBlockId,
  } = editorState;

  // ── Auto-save ─────────────────────────────────────────────────────────
  const syncDraft = React.useMemo(
    () => ({
      designJson: emailDoc as unknown as Record<string, unknown>,
      htmlBody: documentToHtml(emailDoc),
    }),
    [emailDoc],
  );

  const { syncStatus, lastSyncedAt, forceSave } = useEmailTemplateSync(
    savedId,
    syncDraft,
    { debounceMs: 2000 },
  );

  // ── Preview HTML ──────────────────────────────────────────────────────
  const previewHtml = React.useMemo(
    () => documentToPreviewHtml(emailDoc),
    [emailDoc],
  );

  // ── Drop handlers ─────────────────────────────────────────────────────
  // insertAtIndex gets the exact slot index from each DropZone.
  // For drag-move the index is where the block should land in the NEW array
  // (accounting for the hole left by removal — handled inside moveBlockTo).
  const handleDropNew = React.useCallback(
    (type: BlockType, atIndex: number, parentId: string | null = null) => {
      insertBlockAt(type, atIndex, parentId);
      setDraggingNewType(null);
      setIsDraggingOver(false);
    },
    [insertBlockAt, setDraggingNewType],
  );

  const handleDropMove = React.useCallback(
    (movingId: string, atIndex: number, parentId: string | null = null) => {
      moveBlockTo(movingId, atIndex, parentId);
      setDraggingBlockId(null);
      setIsDraggingOver(false);
    },
    [moveBlockTo, setDraggingBlockId],
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      )
        return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) duplicateBlock(selectedId);
      }
      if (e.key === "Escape") {
        selectBlock(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          removeBlock(selectedId);
        }
      }
      if (e.key === "ArrowUp" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedId) moveBlockUp(selectedId);
      }
      if (e.key === "ArrowDown" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedId) moveBlockDown(selectedId);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [
    undo,
    redo,
    selectedId,
    removeBlock,
    duplicateBlock,
    selectBlock,
    moveBlockUp,
    moveBlockDown,
  ]);

  const canvasWidth = DEVICES.find((d) => d.id === device)?.width ?? "100%";
  const blockCount = emailDoc.blocks.length;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(var(--erix-background))",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <Loader2
          size={28}
          className="erix-text-primary"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span
          style={{
            fontSize: "12px",
            color: "hsl(var(--erix-muted-foreground))",
            fontFamily: "sans-serif",
          }}
        >
          Loading template…
        </span>
      </div>
    );
  }

  return (
    <div
      // Toolbar portals into this element so it shares the builder's
      // stacking context. Radix dialogs portal to document.body and
      // therefore always sit above the entire builder — no z-index fight.
      data-erix-builder
      className={cn(
        "erix-flex erix-flex-col erix-h-full erix-overflow-hidden",
        className,
      )}
      style={{
        background: "hsl(var(--erix-background))",
        color: "hsl(var(--erix-foreground))",
        position: "relative", // establish stacking context
      }}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 10px",
          height: "44px",
          background: "hsl(var(--erix-card))",
          borderBottom: "1px solid hsl(var(--erix-border))",
          flexShrink: 0,
          zIndex: 50,
        }}
      >
        {onBack && (
          <>
            <ToolbarBtn
              onClick={onBack}
              title="Back"
              style={{ width: "28px", height: "28px" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </ToolbarBtn>
            <Divider />
          </>
        )}

        {isMobile && !isInCanvasPreview && (
          <>
            <ToolbarBtn
              onClick={() => {
                setShowLeftMobile(!showLeftMobile);
                setShowRightMobile(false);
              }}
              active={showLeftMobile}
              title="Blocks Library"
            >
              <PanelLeft size={16} />
            </ToolbarBtn>
            <Divider />
          </>
        )}

        {/* Template name */}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "hsl(var(--erix-foreground))",
            fontFamily: "sans-serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "180px",
          }}
        >
          {loaded?.name ?? "New Template"}
        </span>

        <Divider />

        {/* Undo / Redo - Desktop only */}
        {!isMobile && (
          <>
            <ToolbarBtn
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </ToolbarBtn>
            <Divider />
          </>
        )}

        {/* Device - Desktop only */}
        {!isMobile && (
          <>
            {DEVICES.map((d) => {
              const Icon = d.icon;
              return (
                <ToolbarBtn
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  active={device === d.id}
                  title={d.label}
                >
                  <Icon size={14} />
                </ToolbarBtn>
              );
            })}
            <Divider />
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Block count indicator - Desktop only */}
        {blockCount > 0 && !isMobile && (
          <span
            style={{
              fontSize: "10px",
              color: "hsl(var(--erix-muted-foreground))",
              fontFamily: "monospace",
              background: "hsl(var(--erix-muted) / 0.5)",
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid hsl(var(--erix-border))",
            }}
          >
            {blockCount} block{blockCount !== 1 ? "s" : ""}
            {selectedId && selectedIndex >= 0 ? ` · #${selectedIndex + 1}` : ""}
          </span>
        )}

        {/* Sync status - Desktop only */}
        {savedId && !isMobile && (
          <>
            <Divider />
            <SyncStatus status={syncStatus} lastSyncedAt={lastSyncedAt} />
          </>
        )}

        <Divider />

        <ToolbarBtn onClick={() => setShowCode(true)} title="View HTML source">
          <Code2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setShowPreview(true)} title="Live preview">
          <Eye size={16} />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => {
            if (!isInCanvasPreview) selectBlock(null);
            setIsInCanvasPreview(!isInCanvasPreview);
          }}
          active={isInCanvasPreview}
          title={isInCanvasPreview ? "Exit Preview" : "Canvas Preview"}
        >
          <div className="erix-relative">
            <Eye size={16} />
            <div
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 7,
                height: 7,
                background: "hsl(var(--erix-primary))",
                borderRadius: "50%",
                border: "1.5px solid hsl(var(--erix-card))",
              }}
            />
          </div>
        </ToolbarBtn>

        {isMobile && !isInCanvasPreview && (
          <>
            <Divider />
            <ToolbarBtn
              onClick={() => {
                setShowRightMobile(!showRightMobile);
                setShowLeftMobile(false);
              }}
              active={showRightMobile}
              title="Style Settings"
            >
              <Settings2 size={16} />
            </ToolbarBtn>
          </>
        )}

        <Divider />

        {/* Panel tab toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid hsl(var(--erix-border))",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <PanelTab
            active={rightTab === "style"}
            onClick={() => setRightTab("style")}
            title="Style Manager"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </PanelTab>
          <PanelTab
            active={rightTab === "mapping"}
            onClick={() => setRightTab("mapping")}
            title="Variable Mapping"
          >
            <Zap size={13} />
          </PanelTab>
        </div>

        {savedId && (
          <button
            type="button"
            onClick={() => void forceSave()}
            disabled={syncStatus === "saving"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              height: "28px",
              background:
                syncStatus === "saving"
                  ? "hsl(var(--erix-primary) / 0.1)"
                  : "hsl(var(--erix-primary) / 0.2)",
              border: "1px solid hsl(var(--erix-primary))",
              borderRadius: "6px",
              color: "hsl(var(--erix-primary))",
              fontSize: "12px",
              fontWeight: 600,
              cursor: syncStatus === "saving" ? "wait" : "pointer",
              fontFamily: "sans-serif",
            }}
          >
            {syncStatus === "saving" ? (
              <Loader2
                size={12}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Save size={12} />
            )}
            Save
          </button>
        )}

        {/* Send Test Email button */}
        <button
          type="button"
          onClick={() => {
            setShowSendTest(true);
            setSendTestStatus("idle");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            height: "28px",
            background: "hsl(var(--erix-muted) / 0.4)",
            border: "1px solid hsl(var(--erix-border))",
            borderRadius: "6px",
            color: "hsl(var(--erix-foreground))",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "sans-serif",
          }}
        >
          <Send size={12} />
          Send Test
        </button>
      </header>

      {/* ── Send Test Email Modal ────────────────────────────────────── */}
      {showSendTest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSendTest(false)}
        >
          <div
            style={{
              background: "hsl(var(--erix-card))",
              border: "1px solid hsl(var(--erix-border))",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "440px",
              maxWidth: "90vw",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "hsl(var(--erix-primary) / 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mail
                    size={16}
                    style={{ color: "hsl(var(--erix-primary))" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "hsl(var(--erix-foreground))",
                      fontFamily: "sans-serif",
                    }}
                  >
                    Send Test Email
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "hsl(var(--erix-muted-foreground))",
                      fontFamily: "sans-serif",
                    }}
                  >
                    {emailDoc.blocks.length} block
                    {emailDoc.blocks.length !== 1 ? "s" : ""} ·{" "}
                    {documentToHtml(emailDoc).length.toLocaleString()} chars
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendTest(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "hsl(var(--erix-muted-foreground))",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Email input */}
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "hsl(var(--erix-muted-foreground))",
                fontFamily: "sans-serif",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Recipient email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={sendTestEmail}
              onChange={(e) => setSendTestEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  document.getElementById("send-test-btn")?.click();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1.5px solid hsl(var(--erix-border))",
                background: "hsl(var(--erix-background))",
                color: "hsl(var(--erix-foreground))",
                fontSize: "14px",
                fontFamily: "sans-serif",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />

            {/* Status */}
            {sendTestStatus === "sent" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "13px",
                  fontFamily: "sans-serif",
                  marginBottom: "16px",
                }}
              >
                ✓ Sent successfully to {sendTestEmail}
              </div>
            )}
            {sendTestStatus === "error" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: "13px",
                  fontFamily: "sans-serif",
                  marginBottom: "16px",
                }}
              >
                ✗ onSendTest callback not configured. Copy the HTML from the
                &lt;/&gt; panel instead.
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowSendTest(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--erix-border))",
                  background: "transparent",
                  color: "hsl(var(--erix-foreground))",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                id="send-test-btn"
                type="button"
                disabled={!sendTestEmail || sendTestStatus === "sending"}
                onClick={async () => {
                  if (!sendTestEmail) return;
                  if (onSendTest) {
                    setSendTestStatus("sending");
                    try {
                      await onSendTest(documentToHtml(emailDoc), sendTestEmail);
                      setSendTestStatus("sent");
                    } catch {
                      setSendTestStatus("error");
                    }
                  } else {
                    setSendTestStatus("error");
                  }
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    sendTestStatus === "sending"
                      ? "hsl(var(--erix-primary) / 0.5)"
                      : "hsl(var(--erix-primary))",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor:
                    !sendTestEmail || sendTestStatus === "sending"
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {sendTestStatus === "sending" ? (
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Send size={13} />
                )}
                {sendTestStatus === "sending" ? "Sending…" : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="erix-flex erix-flex-1 erix-flex-row erix-overflow-hidden"
        style={{ position: "relative" }}
      >
        {/* Left Sidebar: Block Library */}
        {!isInCanvasPreview && (
          <div
            style={{
              width: "280px",
              height: "100%",
              position: isMobile ? "absolute" : "relative",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
              borderRight: "1px solid hsl(var(--erix-border))",
              background: "hsl(var(--erix-card))",
              flexShrink: 0,
              boxShadow: isMobile ? "10px 0 30px rgba(0,0,0,0.15)" : "none",
              transition: "transform 0.3s ease, opacity 0.3s ease",
              transform:
                isMobile && !showLeftMobile
                  ? "translateX(-100%)"
                  : "translateX(0)",
              opacity: isMobile && !showLeftMobile ? 0 : 1,
              pointerEvents: isMobile && !showLeftMobile ? "none" : "auto",
            }}
          >
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid hsl(var(--erix-border))",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "hsl(var(--erix-muted-foreground))",
                  }}
                >
                  Blocks
                </span>
                <ToolbarBtn onClick={() => setShowLeftMobile(false)}>
                  <X size={16} />
                </ToolbarBtn>
              </div>
            )}
            <BlockLibraryPanel
              onInsert={(type) => {
                insertBlockAfterSelected(type);
                if (isMobile) setShowLeftMobile(false);
              }}
              onDragStart={(type) => setDraggingNewType(type)}
              onDragEnd={() => setDraggingNewType(null)}
              blocks={emailDoc.blocks}
              selectedId={selectedId}
              onSelect={selectBlock}
            />
          </div>
        )}

        {/* Backdrop for mobile */}
        {isMobile && (showLeftMobile || showRightMobile) && (
          <div
            onClick={() => {
              setShowLeftMobile(false);
              setShowRightMobile(false);
            }}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(2px)",
              zIndex: 45,
            }}
          />
        )}

        {/* ── Center: Canvas ───────────────────────────────────────────── */}
        {(() => {
          const selectedDevice = DEVICES.find((d) => d.id === device);
          return (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 10px 80px",
                background: "hsl(var(--erix-background))",
                backgroundImage:
                  "radial-gradient(hsl(var(--erix-muted-foreground) / 0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
              data-canvas-scroll="true"
              onClick={() => {
                if (isMobile) {
                  setShowLeftMobile(false);
                  setShowRightMobile(false);
                }
                if (!isInCanvasPreview) selectBlock(null);
              }}
            >
              <div
                style={{
                  width: selectedDevice?.width ?? "100%",
                  maxWidth: "100%",
                  background: emailDoc.backgroundColor || "#ffffff",
                  boxShadow: "0 10px 20px hsl(var(--erix-foreground) / 0.02)",
                  borderRadius: "0",
                  minHeight: "100%",
                  transition: "width .25s ease",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    maxWidth: `${emailDoc.contentWidth}px`,
                    margin: "0 auto",
                    minHeight: "400px",
                  }}
                >
                  {/* ── Empty state ─────────────────────────────────────────── */}
                  {blockCount === 0 && (
                    <>
                      {!isInCanvasPreview && (
                        <DropZone
                          insertAtIndex={0}
                          isActive={isDraggingOver || !!draggingBlockId}
                          onDropNew={handleDropNew}
                          onDropMove={handleDropMove}
                        />
                      )}
                      <div
                        style={{
                          padding: "60px 24px",
                          textAlign: "center",
                          fontFamily: "sans-serif",
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, hsl(var(--erix-primary) / 0.15), hsl(var(--erix-primary) / 0.04))",
                            border:
                              "2px dashed hsl(var(--erix-primary) / 0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                          }}
                        >
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="hsl(var(--erix-primary))"
                            strokeWidth="1.5"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </div>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            margin: "0 0 8px",
                            color: "hsl(var(--erix-foreground))",
                          }}
                        >
                          Start building your email
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            margin: "0 0 6px",
                            color: "hsl(var(--erix-muted-foreground))",
                          }}
                        >
                          Drag a block here, or click any block in the panel
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            margin: 0,
                            color: "hsl(var(--erix-muted-foreground))",
                          }}
                        >
                          Tip: Click a block to select it, then add more blocks
                          below it
                        </p>
                      </div>
                    </>
                  )}

                  {/* ── Block list with drop zones between each ─────────────── */}
                  {blockCount > 0 && (
                    <>
                      {/* Drop zone at index 0 (before first block = prepend) */}
                      {!isInCanvasPreview && (
                        <DropZone
                          insertAtIndex={0}
                          isActive={isDraggingOver || !!draggingBlockId}
                          onDropNew={handleDropNew}
                          onDropMove={handleDropMove}
                        />
                      )}

                      {emailDoc.blocks.map((block, index) => (
                        <React.Fragment key={block.id}>
                          <CanvasBlock
                            block={block}
                            isSelected={selectedId === block.id}
                            isHovered={hoveredId === block.id}
                            draggingId={draggingBlockId}
                            canMoveUp={index > 0}
                            canMoveDown={index < blockCount - 1}
                            onSelect={selectBlock}
                            onHover={hoverBlock}
                            onUpdate={updateBlock}
                            onStyleUpdate={updateBlockStyle}
                            onDuplicate={duplicateBlock}
                            onDelete={removeBlock}
                            onMoveUp={moveBlockUp}
                            onMoveDown={moveBlockDown}
                            onDragStart={setDraggingBlockId}
                            onDragEnd={() => setDraggingBlockId(null)}
                            onDropNew={handleDropNew}
                            onDropMove={handleDropMove}
                            isPreview={isInCanvasPreview}
                          />

                          {/* Drop zone AFTER each block */}
                          {!isInCanvasPreview && (
                            <DropZone
                              insertAtIndex={index + 1}
                              isActive={isDraggingOver || !!draggingBlockId}
                              onDropNew={handleDropNew}
                              onDropMove={handleDropMove}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Right: Style / Mapping ───────────────────────────────────── */}
        {!isInCanvasPreview && (
          <div
            style={{
              width: isMobile ? "280px" : "260px",
              height: "100%",
              position: isMobile ? "absolute" : "relative",
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid hsl(var(--erix-border))",
              background: "hsl(var(--erix-card))",
              overflow: "hidden",
              boxShadow: isMobile ? "-10px 0 30px rgba(0,0,0,0.15)" : "none",
              transition: "transform 0.3s ease, opacity 0.3s ease",
              transform:
                isMobile && !showRightMobile
                  ? "translateX(100%)"
                  : "translateX(0)",
              opacity: isMobile && !showRightMobile ? 0 : 1,
              pointerEvents: isMobile && !showRightMobile ? "none" : "auto",
            }}
          >
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid hsl(var(--erix-border))",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "hsl(var(--erix-muted-foreground))",
                  }}
                >
                  Settings
                </span>
                <ToolbarBtn onClick={() => setShowRightMobile(false)}>
                  <X size={16} />
                </ToolbarBtn>
              </div>
            )}
            {rightTab === "style" ? (
              <StylePanel
                block={selectedBlock}
                document={emailDoc}
                onUpdateBlock={updateBlock}
                onUpdateStyle={updateBlockStyle}
                onUpdateDocument={updateDocumentStyle}
              />
            ) : (
              <VariableMappingPanel
                templateId={savedId}
                draft={{
                  htmlBody: previewHtml,
                  variableMapping: loaded?.variableMapping ?? [],
                }}
                onMappingsChange={(_mappings: VariableMapping[]) => {
                  // synced via normal debounced save
                }}
                className="erix-h-full"
              />
            )}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showCode && (
        <CodeModal html={previewHtml} onClose={() => setShowCode(false)} />
      )}
      {showPreview && (
        <PreviewModal
          html={previewHtml}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ─── Toolbar primitives ───────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  disabled,
  title,
  active,
  style: extraStyle,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        background: active ? "hsl(var(--erix-primary) / 0.15)" : "transparent",
        border: `1px solid ${active ? "hsl(var(--erix-primary) / 0.3)" : "transparent"}`,
        borderRadius: "6px",
        color: disabled
          ? "hsl(var(--erix-muted-foreground) / 0.4)"
          : active
            ? "hsl(var(--erix-primary))"
            : "hsl(var(--erix-muted-foreground))",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .1s",
        flexShrink: 0,
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.color =
            "hsl(var(--erix-foreground))";
          (e.currentTarget as HTMLButtonElement).style.background =
            "hsl(var(--erix-muted) / 0.5)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.color =
            "hsl(var(--erix-muted-foreground))";
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}

function PanelTab({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "26px",
        background: active ? "hsl(var(--erix-primary) / 0.15)" : "transparent",
        borderRadius: "4px",
        border: "none",
        color: active
          ? "hsl(var(--erix-primary))"
          : "hsl(var(--erix-muted-foreground))",
        cursor: "pointer",
        transition: "all .1s",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.background =
            "hsl(var(--erix-muted) / 0.4)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "hsl(var(--erix-border))",
        flexShrink: 0,
        margin: "0 4px",
      }}
    />
  );
}
