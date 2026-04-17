// src/components/email/builder/types.ts
// Complete type system for the visual email canvas builder.

// ─── Block Types ──────────────────────────────────────────────────────────────

export type BlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "section"
  | "twoColumns"
  | "threeColumns"
  | "html"
  | "variable"
  | "social";

// ─── Block Style ──────────────────────────────────────────────────────────────

export interface BlockStyle {
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  // Typography
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: string;
  letterSpacing?: string;
  textDecoration?: string;
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  // Border
  border?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  // Size
  width?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  // Display
  display?: string;
  gap?: string;
  alignItems?: string;
  justifyContent?: string;
  // Image / other
  objectFit?: string;
  opacity?: string;
  boxShadow?: string;
}

// ─── Email Block (node in document tree) ─────────────────────────────────────

export interface EmailBlock {
  id: string;
  type: BlockType;

  // Content (type-specific)
  content?: string;      // text, heading, button label, HTML
  level?: 1 | 2 | 3;    // heading level
  src?: string;          // image src
  alt?: string;          // image alt
  href?: string;         // button / image link
  height?: number;       // spacer height (px)
  variableName?: string; // variable block token key

  // Style
  style: BlockStyle;

  // Children (section, twoColumns, threeColumns)
  children?: EmailBlock[];
}

// ─── Email Document ───────────────────────────────────────────────────────────

export interface EmailDocument {
  backgroundColor: string;
  contentWidth: number;
  fontFamily: string;
  blocks: EmailBlock[];
}

// ─── Editor State ─────────────────────────────────────────────────────────────

export interface EditorState {
  document: EmailDocument;
  selectedId: string | null;
  hoveredId: string | null;
  // drag tracking
  draggingBlockId: string | null;   // reordering an existing block
  draggingNewType: BlockType | null; // dragging from library
}

// ─── Drag Data ────────────────────────────────────────────────────────────────

export const DND_NEW_TYPE_KEY = "email-builder-new-type";
export const DND_MOVE_ID_KEY  = "email-builder-move-id";

// ─── UID factory ─────────────────────────────────────────────────────────────

export function uid(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Default document ────────────────────────────────────────────────────────

export const DEFAULT_DOCUMENT: EmailDocument = {
  backgroundColor: "#f1f5f9",
  contentWidth: 600,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  blocks: [],
};
