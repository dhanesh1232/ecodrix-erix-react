// src/components/email/builder/blockDefs.ts
// Block catalog — defines all available block types with icons, labels,
// categories, and their default data structure.

import type { BlockType, EmailBlock } from "./types";
import { uid } from "./types";

// ─── Block Definition ─────────────────────────────────────────────────────────

export interface BlockDef {
  type: BlockType;
  label: string;
  category: "Layout" | "Content" | "Advanced";
  /** SVG path data for the block icon */
  icon: React.ReactNode;
  /** Factory function — returns a new block with unique id */
  create(): EmailBlock;
}

// ─── SVG Icons (inline, no dep) ───────────────────────────────────────────────

function Icon({
  d,
  viewBox = "0 0 24 24",
}: {
  d: string | string[];
  viewBox?: string;
}) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width="20"
      height="20"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

// ─── Block Catalog ────────────────────────────────────────────────────────────

export const BLOCK_DEFS: BlockDef[] = [
  // ─── Layout ──────────────────────────────────────────────────────────────
  {
    type: "section",
    label: "Section",
    category: "Layout",
    icon: <Icon d={["M3 5h18", "M3 9h18v10H3z"]} />,
    create: () => ({
      id: uid(),
      type: "section",
      style: { backgroundColor: "#ffffff", padding: "24px 20px" },
      children: [],
    }),
  },
  {
    type: "twoColumns",
    label: "2 Columns",
    category: "Layout",
    icon: <Icon d="M3 3h8v18H3zM13 3h8v18h-8z" />,
    create: () => ({
      id: uid(),
      type: "twoColumns",
      style: { backgroundColor: "#ffffff", padding: "16px 20px", gap: "16px" },
      children: [
        {
          id: uid(),
          type: "text",
          content: "Column 1 — click to edit",
          style: {
            fontSize: "14px",
            color: "#4a5568",
            lineHeight: "1.7",
            padding: "8px",
          },
        },
        {
          id: uid(),
          type: "text",
          content: "Column 2 — click to edit",
          style: {
            fontSize: "14px",
            color: "#4a5568",
            lineHeight: "1.7",
            padding: "8px",
          },
        },
      ],
    }),
  },
  {
    type: "threeColumns",
    label: "3 Columns",
    category: "Layout",
    icon: <Icon d="M2 3h6v18H2zM9 3h6v18H9zM17 3h5v18h-5z" />,
    create: () => ({
      id: uid(),
      type: "threeColumns",
      style: { backgroundColor: "#ffffff", padding: "16px 20px", gap: "12px" },
      children: [
        {
          id: uid(),
          type: "text",
          content: "Col 1",
          style: { fontSize: "13px", color: "#4a5568", padding: "8px" },
        },
        {
          id: uid(),
          type: "text",
          content: "Col 2",
          style: { fontSize: "13px", color: "#4a5568", padding: "8px" },
        },
        {
          id: uid(),
          type: "text",
          content: "Col 3",
          style: { fontSize: "13px", color: "#4a5568", padding: "8px" },
        },
      ],
    }),
  },

  // ─── Content ──────────────────────────────────────────────────────────────
  {
    type: "heading",
    label: "Heading",
    category: "Content",
    icon: <Icon d="M4 6h16M4 12h10M4 18h12" />,
    create: () => ({
      id: uid(),
      type: "heading",
      level: 1,
      content: "Your Heading Here",
      style: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#1a202c",
        padding: "20px 20px 8px",
        lineHeight: "1.3",
        textAlign: "left",
        backgroundColor: "#ffffff",
      },
    }),
  },
  {
    type: "text",
    label: "Text",
    category: "Content",
    icon: <Icon d={["M4 7h16", "M4 11h16", "M4 15h10"]} />,
    create: () => ({
      id: uid(),
      type: "text",
      content:
        'Write your message here. You can style text, add <a href="#">links</a>, and use <strong>bold</strong> or <em>italic</em> formatting.',
      style: {
        fontSize: "15px",
        color: "#4a5568",
        padding: "8px 20px",
        lineHeight: "1.75",
        textAlign: "left",
        backgroundColor: "#ffffff",
      },
    }),
  },
  {
    type: "button",
    label: "Button",
    category: "Content",
    icon: (
      <Icon d="M4 8h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
    ),
    create: () => ({
      id: uid(),
      type: "button",
      content: "Get Started →",
      href: "https://example.com",
      style: {
        display: "block",
        backgroundColor: "#7c3aed",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: "600",
        textAlign: "center",
        padding: "14px 32px",
        borderRadius: "8px",
        maxWidth: "220px",
        margin: "20px auto",
        letterSpacing: "0.3px",
        textDecoration: "none",
      },
    }),
  },
  {
    type: "image",
    label: "Image",
    category: "Content",
    icon: (
      <Icon
        d={[
          "M21 15l-5-5L5 21",
          "M3 3h18v18H3z",
          "M8.5 8.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0",
        ]}
      />
    ),
    create: () => ({
      id: uid(),
      type: "image",
      src: "",
      alt: "Image",
      href: "",
      style: {
        display: "block",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
      },
    }),
  },
  {
    type: "divider",
    label: "Divider",
    category: "Content",
    icon: <Icon d="M3 12h18" />,
    create: () => ({
      id: uid(),
      type: "divider",
      style: {
        padding: "12px 20px",
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "0",
      },
    }),
  },
  {
    type: "spacer",
    label: "Spacer",
    category: "Content",
    icon: <Icon d={["M12 3v18", "M7 8l5-5 5 5", "M7 16l5 5 5-5"]} />,
    create: () => ({
      id: uid(),
      type: "spacer",
      height: 32,
      style: { backgroundColor: "transparent" },
    }),
  },

  // ─── Advanced ─────────────────────────────────────────────────────────────
  {
    type: "html",
    label: "Custom HTML",
    category: "Advanced",
    icon: <Icon d={["M16 18l6-6-6-6", "M8 6L2 12l6 6"]} />,
    create: () => ({
      id: uid(),
      type: "html",
      content:
        '<div style="padding:20px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;"><!-- Custom HTML --></div>',
      style: { padding: "0 20px", backgroundColor: "#ffffff" },
    }),
  },
  {
    type: "variable",
    label: "Variable",
    category: "Advanced",
    icon: <Icon d={["M9 3H5L3 9l9 12 9-12-2-6h-4", "M13 3L9 9l3 5"]} />,
    create: () => ({
      id: uid(),
      type: "variable",
      variableName: "first_name",
      style: {
        display: "inline",
        fontSize: "14px",
        color: "#7c3aed",
        fontFamily: "monospace",
        padding: "2px 6px",
        backgroundColor: "rgba(124,58,237,.1)",
        borderRadius: "4px",
      },
    }),
  },
  {
    type: "social",
    label: "Social Links",
    category: "Advanced",
    icon: (
      <Icon d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    ),
    create: () => ({
      id: uid(),
      type: "social",
      content: JSON.stringify([
        { label: "Twitter", href: "#", color: "#1DA1F2" },
        { label: "LinkedIn", href: "#", color: "#0A66C2" },
        { label: "Instagram", href: "#", color: "#E1306C" },
      ]),
      style: {
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#ffffff",
        gap: "12px",
      },
    }),
  },

  // ─── New Blocks ───────────────────────────────────────────────────────────
  {
    type: "productCard",
    label: "Product Card",
    category: "Content",
    icon: (
      <Icon d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
    ),
    create: () => ({
      id: uid(),
      type: "productCard",
      src: "",
      alt: "Product image",
      href: "https://example.com",
      price: "$29.99",
      content: JSON.stringify({
        title: "Product Name",
        description:
          "A brief description that explains why this product is worth buying.",
        buttonLabel: "Shop Now",
      }),
      style: {
        backgroundColor: "#ffffff",
        padding: "32px 24px",
        textAlign: "center",
        borderRadius: "0",
      },
    }),
  },
  {
    type: "footer",
    label: "Footer",
    category: "Content",
    icon: <Icon d={["M3 20h18", "M3 16h18", "M9 12h6", "M3 4h18v8H3z"]} />,
    create: () => ({
      id: uid(),
      type: "footer",
      content: JSON.stringify({
        copyright: "© 2025 Your Company. All rights reserved.",
        links: [
          { label: "Unsubscribe", href: "#" },
          { label: "Privacy Policy", href: "#" },
          { label: "Terms", href: "#" },
        ],
      }),
      style: {
        backgroundColor: "#f8fafc",
        padding: "24px 20px",
        textAlign: "center",
        borderTop: "1px solid #e2e8f0",
      },
    }),
  },
  {
    type: "video",
    label: "Video",
    category: "Content",
    icon: (
      <Icon d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    ),
    create: () => ({
      id: uid(),
      type: "video",
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "", // thumbnail image URL
      alt: "Watch our video",
      style: {
        backgroundColor: "#ffffff",
        padding: "16px 24px",
        borderRadius: "0",
      },
    }),
  },
  {
    type: "list",
    label: "List",
    category: "Content",
    icon: (
      <Icon
        d={[
          "M9 6h11",
          "M9 12h11",
          "M9 18h11",
          "M5 6h.01",
          "M5 12h.01",
          "M5 18h.01",
        ]}
      />
    ),
    create: () => ({
      id: uid(),
      type: "list",
      content: JSON.stringify({
        style: "bullet",
        items: [
          "First benefit or talking point",
          "Second benefit or talking point",
          "Third benefit or talking point",
        ],
      }),
      style: {
        backgroundColor: "#ffffff",
        padding: "12px 24px",
        fontSize: "15px",
        color: "#374151",
        lineHeight: "1.75",
      },
    }),
  },
  {
    type: "menu",
    label: "Menu",
    category: "Layout",
    icon: <Icon d={["M3 6h18", "M3 12h18", "M3 18h18"]} />,
    create: () => ({
      id: uid(),
      type: "menu",
      content: JSON.stringify([
        { label: "Home", href: "#" },
        { label: "Products", href: "#" },
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
      ]),
      style: {
        backgroundColor: "#1e1b4b",
        padding: "14px 24px",
        textAlign: "center",
        color: "#ffffff",
      },
    }),
  },
];

// ─── Lookup by type ───────────────────────────────────────────────────────────

export function getBlockDef(type: BlockType): BlockDef | undefined {
  return BLOCK_DEFS.find((d) => d.type === type);
}

export function createBlock(type: BlockType): EmailBlock {
  const def = getBlockDef(type);
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return def.create();
}

// Grouped by category for the left panel
export const BLOCK_CATEGORIES = ["Layout", "Content", "Advanced"] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];
