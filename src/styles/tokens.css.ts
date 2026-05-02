export const tokensCSS = `/* ============================================================
   ERIX RICHTEXT — CSS TOKEN SYSTEM
   Override any token at :root to theme the editor.
   All tokens are prefixed with --erix- to avoid collisions.
   ============================================================ */

:root {
  /* ── Brand / Accent ─────────────────────────────────── */
  --erix-color-primary: #3b82f6;
  --erix-color-primary-hover: #2563eb;
  --erix-color-primary-muted: rgba(59, 130, 246, 0.12);

  /* ── Surface ─────────────────────────────────────────── */
  --erix-color-bg: var(--erix-background, #ffffff);
  --erix-color-fg: var(--erix-foreground, #111111);
  --erix-color-surface: var(--erix-muted, #f9fafb);
  --erix-color-surface-hover: #f3f4f6;
  --erix-color-border: var(--erix-border, #e5e7eb);
  --erix-color-placeholder: var(--erix-muted-foreground, rgba(100, 116, 139, 0.55));

  /* ── Toolbar ─────────────────────────────────────────── */
  --erix-toolbar-bg: #ffffff;
  --erix-toolbar-border: #e5e7eb;
  --erix-toolbar-btn-bg: transparent;
  --erix-toolbar-btn-hover: #f3f4f6;
  --erix-toolbar-btn-active: #e5e7eb;
  --erix-toolbar-btn-active-fg: #3b82f6;
  --erix-toolbar-separator: #e5e7eb;

  /* ── Typography ──────────────────────────────────────── */
  --erix-font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
  --erix-font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
  --erix-font-size-base: 15px;
  --erix-line-height: 1.7;

  /* ── Spacing ─────────────────────────────────────────── */
  --erix-editor-padding: 1rem 1.25rem;
  --erix-block-gap: 0.5em;

  /* ── Radius ──────────────────────────────────────────── */
  --erix-radius-xs: 3px;
  --erix-radius-sm: 5px;
  --erix-radius-md: 8px;
  --erix-radius-lg: 12px;
  --erix-radius-xl: 16px;

  /* ── Shadow ──────────────────────────────────────────── */
  --erix-shadow-sm:
    0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --erix-shadow-md:
    0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  --erix-shadow-lg:
    0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);

  /* ── Overlay / Menu ──────────────────────────────────── */
  --erix-menu-bg: #ffffff;
  --erix-menu-border: #e5e7eb;
  --erix-menu-item-hover: #f3f4f6;
  --erix-menu-item-active: #eff6ff;
  --erix-menu-item-active-fg: #3b82f6;

  /* ── Code ────────────────────────────────────────────── */
  --erix-code-bg: #f3f4f6;
  --erix-code-fg: #dc2626;
  --erix-codeblock-bg: #1e1e2e;
  --erix-codeblock-fg: #cdd6f4;
  --erix-codeblock-border: transparent;

  /* ── Blockquote / Callout ────────────────────────────── */
  --erix-blockquote-border: #3b82f6;
  --erix-blockquote-bg: rgba(59, 130, 246, 0.04);
  --erix-callout-bg: #fef3c7;
  --erix-callout-border: #fcd34d;

  /* ── Table ───────────────────────────────────────────── */
  --erix-table-border: #e5e7eb;
  --erix-table-header-bg: #f9fafb;
  --erix-table-row-hover: rgba(59, 130, 246, 0.04);

  /* ── Link ────────────────────────────────────────────── */
  --erix-link-color: #3b82f6;
  --erix-link-hover: #1d4ed8;

  /* ── Scrollbar ───────────────────────────────────────── */
  --erix-scroll-thumb: rgba(100, 116, 139, 0.35);
  --erix-scroll-thumb-hover: rgba(100, 116, 139, 0.55);

  /* ── Transition ──────────────────────────────────────── */
  --erix-transition: 150ms ease;
  --erix-transition-slow: 250ms ease;

  /* ── Z-index ─────────────────────────────────────────── */
  --erix-z-toolbar: 10;
  --erix-z-menu: 100;
  --erix-z-bubble: 200;
  --erix-z-modal: 300;
}

/* ── Dark Theme ─────────────────────────────────────────── */
[data-erix-theme="dark"] {
  --erix-color-primary: #60a5fa;
  --erix-color-primary-hover: #93c5fd;
  --erix-color-primary-muted: rgba(96, 165, 250, 0.14);
  --erix-color-bg: #0f0f13;
  --erix-color-fg: #e5e7eb;
  --erix-color-surface: #1a1a24;
  --erix-color-surface-hover: #22222e;
  --erix-color-border: #2a2a3a;
  --erix-color-placeholder: rgba(148, 163, 184, 0.45);

  --erix-toolbar-bg: #0f0f13;
  --erix-toolbar-border: #2a2a3a;
  --erix-toolbar-btn-hover: #22222e;
  --erix-toolbar-btn-active: #2a2a3a;

  --erix-menu-bg: #1a1a24;
  --erix-menu-border: #2a2a3a;
  --erix-menu-item-hover: #22222e;
  --erix-menu-item-active: #1e3a5f;
  --erix-menu-item-active-fg: #60a5fa;

  --erix-code-bg: #22222e;
  --erix-code-fg: #fb7185;
  --erix-codeblock-bg: #12121a;
  --erix-codeblock-fg: #e5e7eb;

  --erix-blockquote-border: #60a5fa;
  --erix-blockquote-bg: rgba(96, 165, 250, 0.06);
  --erix-callout-bg: #2d2510;
  --erix-callout-border: #78350f;

  --erix-table-border: #2a2a3a;
  --erix-table-header-bg: #1a1a24;
  --erix-link-color: #60a5fa;
  --erix-link-hover: #93c5fd;

  --erix-scroll-thumb: rgba(148, 163, 184, 0.25);
  --erix-scroll-thumb-hover: rgba(148, 163, 184, 0.4);

  --erix-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2);
  --erix-shadow-md:
    0 4px 12px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2);
  --erix-shadow-lg:
    0 12px 32px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.3);
}`;
