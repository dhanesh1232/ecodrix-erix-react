"use client";
// src/components/email/builder/BlockLibraryPanel.tsx
// Left panel: categorized draggable block tiles.
// Supports both click-to-insert and HTML5 drag-to-canvas.

import * as React from "react";
import { Layers, LayoutGrid, Search } from "lucide-react";
import { BLOCK_DEFS, BLOCK_CATEGORIES, type BlockDef } from "./blockDefs";
import type { BlockType, EmailBlock } from "./types";
import { DND_NEW_TYPE_KEY } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BlockLibraryPanelProps {
  onInsert: (type: BlockType) => void;
  onDragStart: (type: BlockType) => void;
  onDragEnd: () => void;
  // Layers tab
  blocks: EmailBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type Tab = "blocks" | "layers";

// ─── Component ────────────────────────────────────────────────────────────────

export function BlockLibraryPanel({
  onInsert,
  onDragStart,
  onDragEnd,
  blocks,
  selectedId,
  onSelect,
}: BlockLibraryPanelProps) {
  const [tab, setTab] = React.useState<Tab>("blocks");
  const [search, setSearch] = React.useState("");
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >({
    Layout: true,
    Content: true,
    Advanced: false,
  });

  const toggleCat = (cat: string) =>
    setOpenCategories((p) => ({ ...p, [cat]: !p[cat] }));

  // Filtered blocks
  const filtered = search
    ? BLOCK_DEFS.filter((b: BlockDef) =>
        b.label.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "hsl(var(--erix-card))",
        borderRight: "1px solid hsl(var(--erix-border))",
      }}
    >
      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid hsl(var(--erix-border))",
          flexShrink: 0,
        }}
      >
        {(["blocks", "layers"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 6px",
              background: "none",
              border: "none",
              borderBottom:
                tab === t ? "2px solid hsl(var(--erix-primary))" : "2px solid transparent",
              color: tab === t ? "hsl(var(--erix-primary))" : "hsl(var(--erix-muted-foreground))",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              transition: "color 0.1s, border-bottom 0.2s",
              marginBottom: "-1px",
            }}
          >
            {t === "blocks" ? <LayoutGrid size={13} /> : <Layers size={13} />}
            {t === "blocks" ? "Blocks" : "Layers"}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tab === "blocks" ? (
          <>
            {/* Search */}
            <div style={{ padding: "10px 10px 6px", flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "hsl(var(--erix-muted) / 0.5)",
                  border: "1px solid hsl(var(--erix-border))",
                  borderRadius: "6px",
                  padding: "6px 10px",
                }}
              >
                <Search size={12} className="erix-text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search blocks…"
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "hsl(var(--erix-foreground))",
                    fontSize: "12px",
                    flex: 1,
                    fontFamily: "sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Block tiles */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "4px 8px 12px" }}
            >
              {filtered !== null ? (
                <BlockGrid
                  blocks={filtered}
                  onInsert={onInsert}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ) : (
                BLOCK_CATEGORIES.map((cat) => {
                  const catBlocks = BLOCK_DEFS.filter(
                    (b: BlockDef) => b.category === cat,
                  );
                  const isOpen = openCategories[cat] !== false;
                  return (
                    <div key={cat} style={{ marginBottom: "8px" }}>
                      <button
                        type="button"
                        onClick={() => toggleCat(cat)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 4px",
                          background: "none",
                          border: "none",
                          color: "hsl(var(--erix-muted-foreground))",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          cursor: "pointer",
                        }}
                      >
                        {cat}
                        <span
                          style={{
                            fontSize: "10px",
                            transform: isOpen ? "rotate(90deg)" : "none",
                            transition: "transform .15s",
                          }}
                        >
                          ›
                        </span>
                      </button>
                      {isOpen && (
                        <BlockGrid
                          blocks={catBlocks}
                          onInsert={onInsert}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <LayersTree
            blocks={blocks}
            selectedId={selectedId}
            onSelect={onSelect}
            level={0}
          />
        )}
      </div>
    </div>
  );
}

// ─── Block grid ───────────────────────────────────────────────────────────────

function BlockGrid({
  blocks,
  onInsert,
  onDragStart,
  onDragEnd,
}: {
  blocks: BlockDef[];
  onInsert: (type: BlockType) => void;
  onDragStart: (type: BlockType) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px",
      }}
    >
      {blocks.map((def) => (
        <BlockTile
          key={def.type}
          def={def}
          onInsert={onInsert}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

function BlockTile({
  def,
  onInsert,
  onDragStart,
  onDragEnd,
}: {
  def: BlockDef;
  onInsert: (type: BlockType) => void;
  onDragStart: (type: BlockType) => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      draggable
      title={`Drag or click to insert ${def.label}`}
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_NEW_TYPE_KEY, def.type);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(def.type);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onInsert(def.type)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "12px 8px",
        background: hovered ? "hsl(var(--erix-primary) / 0.15)" : "hsl(var(--erix-muted) / 0.3)",
        border: `1px solid ${hovered ? "hsl(var(--erix-primary) / 0.5)" : "hsl(var(--erix-border))"}`,
        borderRadius: "8px",
        cursor: "grab",
        userSelect: "none",
        transition: "border-color 0.1s, background 0.1s",
      }}
    >
      <span
        style={{
          color: hovered ? "hsl(var(--erix-primary))" : "hsl(var(--erix-muted-foreground))",
          transition: "color 0.1s",
        }}
      >
        {def.icon}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: hovered ? "hsl(var(--erix-foreground))" : "hsl(var(--erix-muted-foreground))",
          fontFamily: "sans-serif",
          textAlign: "center",
          transition: "color 0.1s",
        }}
      >
        {def.label}
      </span>
    </div>
  );
}

// ─── Layers tree ─────────────────────────────────────────────────────────────

function LayersTree({
  blocks,
  selectedId,
  onSelect,
  level,
}: {
  blocks: EmailBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
}) {
  if (blocks.length === 0) {
    return (
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          color: "hsl(var(--erix-muted-foreground))",
          fontSize: "12px",
          fontFamily: "sans-serif",
        }}
      >
        No blocks yet
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {blocks.map((block) => (
        <LayerRow
          key={block.id}
          block={block}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  );
}

function LayerRow({
  block,
  selectedId,
  onSelect,
  level,
}: {
  block: EmailBlock;
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const def = BLOCK_DEFS.find((d: BlockDef) => d.type === block.type);
  const hasChildren = (block.children?.length ?? 0) > 0;
  const isSelected = block.id === selectedId;

  return (
    <div>
      <div
        onClick={() => onSelect(block.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: `6px 10px 6px ${10 + level * 14}px`,
          cursor: "pointer",
          background: isSelected ? "hsl(var(--erix-primary) / 0.15)" : "transparent",
          borderLeft: isSelected
            ? "2px solid hsl(var(--erix-primary))"
            : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLDivElement).style.background =
              "hsl(var(--erix-muted) / 0.4)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "10px",
              cursor: "pointer",
              padding: "0 2px",
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform .15s",
            }}
          >
            ›
          </button>
        ) : (
          <span style={{ width: "16px" }} />
        )}
        <span style={{ color: isSelected ? "hsl(var(--erix-primary))" : "hsl(var(--erix-muted-foreground))" }}>
          {def?.icon}
        </span>
        <span
          style={{
            fontSize: "12px",
            color: isSelected ? "hsl(var(--erix-foreground))" : "hsl(var(--erix-muted-foreground))",
            fontFamily: "sans-serif",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {def?.label ?? block.type}
        </span>
      </div>

      {hasChildren && expanded && (
        <LayersTree
          blocks={block.children ?? []}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      )}
    </div>
  );
}
