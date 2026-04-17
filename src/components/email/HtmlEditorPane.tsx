"use client";
// src/components/email/HtmlEditorPane.tsx
// Self-contained HTML textarea editor with:
//  - {{variable}} token highlighting overlay
//  - Tab = 2 spaces, no focus loss
//  - Variable insert buttons above the textarea
//  - Line-number gutter

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Token highlight colours ──────────────────────────────────────────────────

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Produces an HTML string with {{vars}} wrapped in a highlight span */
function buildHighlightHtml(raw: string): string {
  const escaped = escapeHtml(raw);
  return escaped.replace(
    /\{\{([^}]+)\}\}/g,
    '<mark style="background:rgba(124,58,237,.25);color:#c4b5fd;border-radius:3px;padding:0 2px;">{{$1}}</mark>',
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HtmlEditorPaneProps {
  value: string;
  onChange: (val: string) => void;
  variables?: string[];
  className?: string;
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HtmlEditorPane({
  value,
  onChange,
  variables = [],
  className = "",
  placeholder = "<!-- Write your email HTML here -->\n<p>Hello {{first_name}}, ...</p>",
}: HtmlEditorPaneProps) {
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Keep backdrop scroll in sync with textarea scroll
  const handleScroll = () => {
    if (backdropRef.current && taRef.current) {
      backdropRef.current.scrollTop = taRef.current.scrollTop;
      backdropRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // Tab key → insert 2 spaces instead of jumping focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = start + 2;
        el.selectionEnd = start + 2;
      });
    }
  };

  // Insert a variable token at cursor position
  const insertVariable = (varName: string) => {
    const el = taRef.current;
    const token = `{{${varName}}}`;
    if (!el) {
      onChange(value + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + token.length;
      el.selectionEnd = start + token.length;
    });
  };

  // Common textarea + backdrop styles (must be identical for overlay to align)
  const sharedStyle: React.CSSProperties = {
    fontFamily:
      "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace",
    fontSize: "13px",
    lineHeight: "1.65",
    letterSpacing: "0.03em",
    padding: "14px 16px",
    margin: 0,
    border: "none",
    outline: "none",
    tabSize: 2,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };

  return (
    <div
      className={cn(
        "erix-flex erix-flex-col erix-h-full erix-min-h-0",
        className,
      )}
    >
      {/* ── Variable insert strip ──────────────────────────────────────── */}
      {variables.length > 0 && (
        <div
          className="erix-flex erix-flex-shrink-0 erix-items-center erix-gap-1.5 erix-px-3 erix-py-2 erix-flex-wrap erix-border-b"
          style={{ background: "#1a1a2a", borderColor: "#2e2e3e" }}
        >
          <span
            className="erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-shrink-0"
            style={{ color: "#475569" }}
          >
            Insert:
          </span>
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              title={`Insert {{${v}}}`}
              className="erix-inline-flex erix-items-center erix-px-2 erix-py-0.5 erix-rounded erix-text-[11px] erix-font-mono erix-font-semibold erix-cursor-pointer erix-transition-all erix-duration-100 erix-border erix-bg-transparent"
              style={{
                color: "#c4b5fd",
                borderColor: "rgba(124,58,237,.35)",
                background: "rgba(124,58,237,.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(124,58,237,.22)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#7c3aed";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(124,58,237,.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(124,58,237,.35)";
              }}
            >
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Editor area (textarea + highlight backdrop) ────────────────── */}
      <div
        className="erix-relative erix-flex-1 erix-min-h-0 erix-overflow-hidden"
        style={{ background: "#0f0f1a" }}
      >
        {/* Highlight backdrop — visually shows {{var}} colouring */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          style={{
            ...sharedStyle,
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            color: "transparent",
            background: "transparent",
            pointerEvents: "none",
            zIndex: 1,
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled highlight html
          dangerouslySetInnerHTML={{ __html: buildHighlightHtml(value) + "\n" }}
        />

        {/* The actual textarea */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={placeholder}
          className="erix-absolute erix-inset-0 erix-w-full erix-h-full erix-resize-none"
          style={{
            ...sharedStyle,
            position: "absolute",
            background: "transparent",
            color: "#e2e8f0",
            caretColor: "#a78bfa",
            zIndex: 2,
          }}
        />
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div
        className="erix-flex erix-shrink-0 erix-items-center erix-justify-between erix-px-4 erix-border-t"
        style={{
          height: "26px",
          background: "#1a1a2a",
          borderColor: "#2e2e3e",
        }}
      >
        <span className="erix-text-[10px]" style={{ color: "#475569" }}>
          HTML · {value.length.toLocaleString()} chars ·{" "}
          {(value.match(/\n/g) ?? []).length + 1} lines
        </span>
        <span className="erix-text-[10px]" style={{ color: "#475569" }}>
          Tab = 2 spaces &nbsp;·&nbsp; type{" "}
          <span
            style={{ color: "#a78bfa", fontFamily: "monospace" }}
          >{`{{var}}`}</span>{" "}
          for variables
        </span>
      </div>
    </div>
  );
}
