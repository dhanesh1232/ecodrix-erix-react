"use client";
// src/components/email/builder/StylePanel.tsx
// Right panel: style controls for the selected block.
// Organized into accordion sections: Layout, Typography, Spacing, Border, Background.

import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image,
  Italic,
  Link,
  Settings,
  Type,
} from "lucide-react";
import type { EmailBlock, EmailDocument } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StylePanelProps {
  block: EmailBlock | undefined;
  document: EmailDocument;
  onUpdateBlock: (id: string, patch: Partial<EmailBlock>) => void;
  onUpdateStyle: (id: string, style: Partial<EmailBlock["style"]>) => void;
  onUpdateDocument: (patch: Partial<EmailDocument>) => void;
}

// ─── Accordion section ────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid hsl(var(--erix-border))" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "none",
          border: "none",
          color: "hsl(var(--erix-foreground))",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          cursor: "pointer",
        }}
      >
        {title}
        <ChevronDown
          size={13}
          style={{
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform .15s",
            color: "hsl(var(--erix-muted-foreground))",
          }}
        />
      </button>
      {open && <div style={{ padding: "2px 14px 14px" }}>{children}</div>}
    </div>
  );
}

// ─── Field primitives ─────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          fontWeight: 600,
          color: "hsl(var(--erix-muted-foreground))",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          marginBottom: "4px",
          fontFamily: "sans-serif",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder = "",
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "hsl(var(--erix-muted) / 0.5)",
        border: "1px solid hsl(var(--erix-border))",
        borderRadius: "5px",
        padding: "6px 8px",
        color: "hsl(var(--erix-foreground))",
        fontSize: "12px",
        outline: "none",
        fontFamily: mono ? "'Fira Code', monospace" : "sans-serif",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  unit = "px",
}: {
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const num =
    typeof value === "string" ? value.replace(/[a-z%]+$/, "") : String(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <input
        type="number"
        value={num}
        min={min}
        max={max}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        style={{
          flex: 1,
          background: "hsl(var(--erix-muted) / 0.5)",
          border: "1px solid hsl(var(--erix-border))",
          borderRadius: "5px",
          padding: "6px 8px",
          color: "hsl(var(--erix-foreground))",
          fontSize: "12px",
          outline: "none",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
      />
      <span
        style={{
          color: "hsl(var(--erix-muted-foreground))",
          fontSize: "10px",
          fontFamily: "sans-serif",
          width: "20px",
        }}
      >
        {unit}
      </span>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  // Guard: only fire onChange when the value actually changed
  const handleChange = React.useCallback(
    (v: string) => {
      if (v !== value) onChange(v);
    },
    [value, onChange],
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          width: "32px",
          height: "28px",
          border: "1px solid hsl(var(--erix-border))",
          borderRadius: "4px",
          background: "none",
          cursor: "pointer",
          padding: "0 2px",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="#rrggbb"
        style={{
          flex: 1,
          background: "hsl(var(--erix-muted) / 0.5)",
          border: "1px solid hsl(var(--erix-border))",
          borderRadius: "5px",
          padding: "5px 8px",
          color: "hsl(var(--erix-foreground))",
          fontSize: "12px",
          outline: "none",
          fontFamily: "monospace",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "hsl(var(--erix-muted) / 0.5)",
        border: "1px solid hsl(var(--erix-border))",
        borderRadius: "5px",
        padding: "6px 8px",
        color: "hsl(var(--erix-foreground))",
        fontSize: "12px",
        outline: "none",
        cursor: "pointer",
        fontFamily: "sans-serif",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "28px",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "hsl(var(--erix-card))" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function AlignButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {(["left", "center", "right"] as const).map((a) => {
        const Icon =
          a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            title={`Align ${a}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              background: active ? "hsl(var(--erix-primary) / 0.15)" : "hsl(var(--erix-muted) / 0.5)",
              border: `1px solid ${active ? "hsl(var(--erix-primary))" : "hsl(var(--erix-border))"}`,
              borderRadius: "5px",
              color: active ? "hsl(var(--erix-primary))" : "hsl(var(--erix-muted-foreground))",
              cursor: "pointer",
            }}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}

// ─── SpacingInput (4-side) ────────────────────────────────────────────────────

function parseSides(value: string) {
  const parts = (value || "0px").split(/\s+/).map((v) => v.trim());
  return {
    t: parts[0] ?? "0px",
    r: parts[1] ?? parts[0] ?? "0px",
    b: parts[2] ?? parts[0] ?? "0px",
    l: parts[3] ?? parts[1] ?? parts[0] ?? "0px",
  };
}

function SpacingInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const parsed = parseSides(value);
  const [t, setT] = React.useState(parsed.t);
  const [r, setR] = React.useState(parsed.r);
  const [b, setB] = React.useState(parsed.b);
  const [l, setL] = React.useState(parsed.l);

  // Re-sync local state when the prop value changes
  // (e.g. selecting a different block, undo/redo)
  React.useEffect(() => {
    const next = parseSides(value);
    setT(next.t);
    setR(next.r);
    setB(next.b);
    setL(next.l);
  }, [value]);

  const commit = (top = t, right = r, bottom = b, left = l) => {
    onChange(`${top} ${right} ${bottom} ${left}`);
  };

  const px = (v: string) => v.replace("px", "") || "0";

  return (
    <div>
      <label
        style={{
          fontSize: "10px",
          color: "hsl(var(--erix-muted-foreground))",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          marginBottom: "6px",
          display: "block",
          fontFamily: "sans-serif",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "4px",
        }}
      >
        {[
          { lbl: "T", val: t, set: setT, axis: "top" },
          { lbl: "R", val: r, set: setR, axis: "right" },
          { lbl: "B", val: b, set: setB, axis: "bottom" },
          { lbl: "L", val: l, set: setL, axis: "left" },
        ].map(({ lbl, val, set, axis }) => (
          <div key={axis}>
            <div
              style={{
                textAlign: "center",
                fontSize: "9px",
                color: "hsl(var(--erix-muted-foreground))",
                marginBottom: "2px",
                fontFamily: "sans-serif",
              }}
            >
              {lbl}
            </div>
            <input
              type="number"
              value={px(val)}
              onChange={(e) => {
                const nv = `${e.target.value}px`;
                set(nv);
                commit(
                  axis === "top" ? nv : t,
                  axis === "right" ? nv : r,
                  axis === "bottom" ? nv : b,
                  axis === "left" ? nv : l,
                );
              }}
              style={{
                width: "100%",
                background: "hsl(var(--erix-muted) / 0.5)",
                border: "1px solid hsl(var(--erix-border))",
                borderRadius: "4px",
                padding: "5px 4px",
                color: "hsl(var(--erix-foreground))",
                fontSize: "11px",
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main StylePanel ──────────────────────────────────────────────────────────

export function StylePanel({
  block,
  document,
  onUpdateBlock,
  onUpdateStyle,
  onUpdateDocument,
}: StylePanelProps) {
  const upd = (patch: Partial<EmailBlock>) => {
    if (!block) return;
    onUpdateBlock(block.id, patch);
  };

  const style = (patch: Partial<EmailBlock["style"]>) => {
    if (!block) return;
    onUpdateStyle(block.id, patch);
  };

  const s = block?.style ?? {};

  // ─── No block selected ─────────────────────────────────────────────────

  if (!block) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid hsl(var(--erix-border))",
            padding: "12px 14px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "hsl(var(--erix-muted-foreground))",
              fontFamily: "sans-serif",
            }}
          >
            Email Settings
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Section title="Document">
            <Field label="Background Colour">
              <ColorInput
                value={document.backgroundColor}
                onChange={(v) => onUpdateDocument({ backgroundColor: v })}
              />
            </Field>
            <Field label="Content Width">
              <NumberInput
                value={document.contentWidth}
                onChange={(v) =>
                  onUpdateDocument({ contentWidth: parseInt(v) || 600 })
                }
                unit="px"
                min={300}
                max={900}
              />
            </Field>
            <Field label="Font Family">
              <Select
                value={document.fontFamily}
                onChange={(v) => onUpdateDocument({ fontFamily: v })}
                options={[
                  {
                    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    label: "Helvetica",
                  },
                  {
                    value: "Georgia, 'Times New Roman', serif",
                    label: "Georgia",
                  },
                  {
                    value: "'Trebuchet MS', sans-serif",
                    label: "Trebuchet MS",
                  },
                  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
                  { value: "Arial, sans-serif", label: "Arial" },
                ]}
              />
            </Field>
          </Section>
        </div>
      </div>
    );
  }

  // ─── Block type-specific props ──────────────────────────────────────────

  const renderTypeProps = () => {
    switch (block.type) {
      case "heading":
        return (
          <Section title="Heading">
            <Field label="Text">
              <Input
                value={block.content ?? ""}
                onChange={(v) => upd({ content: v })}
                placeholder="Heading text…"
              />
            </Field>
            <Field label="Level">
              <Select
                value={String(block.level ?? 1)}
                onChange={(v) => upd({ level: parseInt(v) as 1 | 2 | 3 })}
                options={[
                  { value: "1", label: "H1 — Large" },
                  { value: "2", label: "H2 — Medium" },
                  { value: "3", label: "H3 — Small" },
                ]}
              />
            </Field>
          </Section>
        );
      case "button":
        return (
          <Section title="Button">
            <Field label="Label">
              <Input
                value={block.content ?? ""}
                onChange={(v) => upd({ content: v })}
                placeholder="Button label…"
              />
            </Field>
            <Field label="Link URL">
              <Input
                value={block.href ?? ""}
                onChange={(v) => upd({ href: v })}
                placeholder="https://…"
              />
            </Field>
          </Section>
        );
      case "image":
        return (
          <Section title="Image">
            <Field label="Image URL">
              <Input
                value={block.src ?? ""}
                onChange={(v) => upd({ src: v })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Alt Text">
              <Input
                value={block.alt ?? ""}
                onChange={(v) => upd({ alt: v })}
                placeholder="Describe the image"
              />
            </Field>
            <Field label="Link URL (optional)">
              <Input
                value={block.href ?? ""}
                onChange={(v) => upd({ href: v })}
                placeholder="https://…"
              />
            </Field>
          </Section>
        );
      case "spacer":
        return (
          <Section title="Spacer">
            <Field label="Height">
              <NumberInput
                value={block.height ?? 32}
                onChange={(v) => upd({ height: parseInt(v) || 32 })}
                unit="px"
                min={4}
                max={200}
              />
            </Field>
          </Section>
        );
      case "variable":
        return (
          <Section title="Variable">
            <Field label="Variable Name">
              <Input
                value={block.variableName ?? ""}
                onChange={(v) => upd({ variableName: v })}
                placeholder="e.g. first_name"
                mono
              />
            </Field>
            <p
              style={{
                fontSize: "11px",
                color: "hsl(var(--erix-muted-foreground))",
                fontFamily: "sans-serif",
                margin: "6px 0 0",
              }}
            >
              This renders as{" "}
              <code
                style={{ color: "hsl(var(--erix-primary))", fontFamily: "monospace" }}
              >{`{{${block.variableName || "variable"}}}`}</code>{" "}
              in the sent email.
            </p>
          </Section>
        );
      case "html":
        return (
          <Section title="HTML">
            <Field label="Source">
              <textarea
                value={block.content ?? ""}
                onChange={(e) => upd({ content: e.target.value })}
                rows={6}
                placeholder="<!-- your HTML -->"
                style={{
                  width: "100%",
                  background: "hsl(var(--erix-muted) / 0.6)",
                  border: "1px solid hsl(var(--erix-border))",
                  borderRadius: "5px",
                  padding: "8px",
                  color: "hsl(var(--erix-foreground))",
                  fontSize: "11px",
                  fontFamily: "'Fira Code', monospace",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-primary))")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--erix-border))")}
              />
            </Field>
          </Section>
        );
      default:
        return null;
    }
  };

  // ─── Full panel ────────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid hsl(var(--erix-border))",
          padding: "10px 14px",
          flexShrink: 0,
        }}
      >
        <Settings size={13} className="erix-text-primary" />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "hsl(var(--erix-muted-foreground))",
            fontFamily: "sans-serif",
          }}
        >
          Style Manager
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            color: "hsl(var(--erix-primary))",
            fontFamily: "monospace",
            background: "hsl(var(--erix-primary) / 0.12)",
            padding: "1px 6px",
            borderRadius: "3px",
          }}
        >
          {block.type}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Type-specific props (top) */}
        {renderTypeProps()}

        {/* Background */}
        <Section title="Background">
          <Field label="Colour">
            <ColorInput
              value={s.backgroundColor ?? ""}
              onChange={(v) => style({ backgroundColor: v })}
            />
          </Field>
        </Section>

        {/* Typography (shown for text-type blocks) */}
        {["text", "heading", "button", "variable"].includes(block.type) && (
          <Section title="Typography">
            <Field label="Colour">
              <ColorInput
                value={s.color ?? ""}
                onChange={(v) => style({ color: v })}
              />
            </Field>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "10px",
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                    display: "block",
                    marginBottom: "4px",
                    fontFamily: "sans-serif",
                  }}
                >
                  Size
                </label>
                <NumberInput
                  value={s.fontSize ?? "14px"}
                  onChange={(v) => style({ fontSize: v })}
                  unit="px"
                  min={8}
                  max={96}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "10px",
                    color: "hsl(var(--erix-muted-foreground))",
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                    display: "block",
                    marginBottom: "4px",
                    fontFamily: "sans-serif",
                  }}
                >
                  Weight
                </label>
                <Select
                  value={s.fontWeight ?? "400"}
                  onChange={(v) => style({ fontWeight: v })}
                  options={[
                    { value: "300", label: "Light" },
                    { value: "400", label: "Normal" },
                    { value: "500", label: "Medium" },
                    { value: "600", label: "Semi Bold" },
                    { value: "700", label: "Bold" },
                    { value: "800", label: "Extra Bold" },
                  ]}
                />
              </div>
            </div>
            <Field label="Line Height">
              <NumberInput
                value={s.lineHeight ?? "1.5"}
                onChange={(v) => style({ lineHeight: v })}
                unit=""
                min={1}
                max={3}
              />
            </Field>
            <Field label="Letter Spacing">
              <NumberInput
                value={s.letterSpacing ?? "0px"}
                onChange={(v) => style({ letterSpacing: v })}
                unit="px"
                min={-2}
                max={10}
              />
            </Field>
            <Field label="Text Align">
              <AlignButtons
                value={s.textAlign ?? "left"}
                onChange={(v) => style({ textAlign: v })}
              />
            </Field>
          </Section>
        )}

        {/* Spacing */}
        <Section title="Spacing">
          <SpacingInput
            value={s.padding ?? "0px"}
            onChange={(v) => style({ padding: v })}
            label="Padding"
          />
          <div style={{ height: "12px" }} />
          <SpacingInput
            value={s.margin ?? "0px"}
            onChange={(v) => style({ margin: v })}
            label="Margin"
          />
        </Section>

        {/* Border */}
        <Section title="Border" defaultOpen={false}>
          <Field label="Border Colour">
            <ColorInput
              value={s.borderColor ?? ""}
              onChange={(v) => style({ borderColor: v })}
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Width
              </label>
              <NumberInput
                value={s.borderWidth ?? "0px"}
                onChange={(v) => style({ borderWidth: v })}
                unit="px"
                min={0}
                max={20}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Radius
              </label>
              <NumberInput
                value={s.borderRadius ?? "0px"}
                onChange={(v) => style({ borderRadius: v })}
                unit="px"
                min={0}
                max={100}
              />
            </div>
          </div>
          <Field label="Style">
            <Select
              value={s.borderStyle ?? "solid"}
              onChange={(v) => style({ borderStyle: v })}
              options={[
                { value: "solid", label: "Solid" },
                { value: "dashed", label: "Dashed" },
                { value: "dotted", label: "Dotted" },
                { value: "none", label: "None" },
              ]}
            />
          </Field>
        </Section>

        {/* Dimensions */}
        <Section title="Dimensions" defaultOpen={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Width
              </label>
              <Input
                value={s.width ?? ""}
                onChange={(v) => style({ width: v })}
                placeholder="auto"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Max Width
              </label>
              <Input
                value={s.maxWidth ?? ""}
                onChange={(v) => style({ maxWidth: v })}
                placeholder="100%"
              />
            </div>
          </div>
          <div style={{ height: "8px" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Height
              </label>
              <Input
                value={s.height ?? ""}
                onChange={(v) => style({ height: v })}
                placeholder="auto"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "sans-serif",
                }}
              >
                Opacity
              </label>
              <Input
                value={s.opacity ?? "1"}
                onChange={(v) => style({ opacity: v })}
                placeholder="1"
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
