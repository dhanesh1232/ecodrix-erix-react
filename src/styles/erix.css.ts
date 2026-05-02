export const erixCSS = `/* ============================================================
   ERIX RICHTEXT — IFRAME EDITOR STYLES
   Injected into the iframe contenteditable document.
   Uses --erix-* tokens for full override support.
   ============================================================ */

/* ── Reset & Base ───────────────────────────────────────────────────────── */
html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: var(--erix-color-bg, #fff);
  color: var(--erix-color-fg, #111);
  font-family: var(--erix-font-body, system-ui, sans-serif);
  font-size: var(--erix-font-size-base, 15px);
  line-height: var(--erix-line-height, 1.7);
  cursor: text;
  transition:
    background-color var(--erix-transition-slow, 250ms ease),
    color var(--erix-transition-slow, 250ms ease);
  overflow-y: hidden;
  scrollbar-width: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  width: 0;
  height: 0;
}

html:focus-within,
body:focus-within {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--erix-scroll-thumb) transparent;
}

html:focus-within::-webkit-scrollbar,
body:focus-within::-webkit-scrollbar {
  width: 7px;
}

html:focus-within::-webkit-scrollbar-thumb,
body:focus-within::-webkit-scrollbar-thumb {
  background: var(--erix-scroll-thumb, rgba(100, 116, 139, 0.35));
  border-radius: 999px;
}

html:focus-within::-webkit-scrollbar-thumb:hover,
body:focus-within::-webkit-scrollbar-thumb:hover {
  background: var(--erix-scroll-thumb-hover, rgba(100, 116, 139, 0.55));
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

/* ── Body (editor root) ────────────────────────────────────────────────── */
body {
  padding: var(--erix-editor-padding, 1rem 1.25rem);
  caret-color: var(--erix-color-primary, #3b82f6);
  position: relative;
}

[contenteditable]:focus {
  outline: none;
}

/* ── Placeholder ────────────────────────────────────────────────────────── */
body.erix-empty::before {
  content: attr(data-placeholder);
  color: var(--erix-color-placeholder, rgba(100, 116, 139, 0.5));
  pointer-events: none;
  user-select: none;
  position: absolute;
  top: 1rem;
  left: 1.25rem;
  right: 1.25rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: inherit;
  font-family: inherit;
  line-height: inherit;
  z-index: 0;
}

/* ── Block Spacing ──────────────────────────────────────────────────────── */
p,
h1,
h2,
h3,
h4,
h5,
h6,
pre,
blockquote,
ul,
ol,
hr,
div {
  margin: 0 0 var(--erix-block-gap, 0.5em);
}

p:last-child,
h1:last-child,
h2:last-child,
h3:last-child,
h4:last-child,
h5:last-child,
h6:last-child {
  margin-bottom: 0;
}

/* ── Headings ───────────────────────────────────────────────────────────── */
h1 {
  font-size: 2em;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
h2 {
  font-size: 1.5em;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
h3 {
  font-size: 1.25em;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
}
h4 {
  font-size: 1.1em;
  font-weight: 600;
  line-height: 1.35;
}
h5 {
  font-size: 1em;
  font-weight: 600;
}
h6 {
  font-size: 0.9em;
  font-weight: 600;
  color: color-mix(in srgb, var(--erix-color-fg) 70%, transparent);
}

/* ── Paragraph ──────────────────────────────────────────────────────────── */
p {
  min-height: 1.5em;
}

/* ── Inline Marks ───────────────────────────────────────────────────────── */
strong,
b {
  font-weight: 700;
}
em,
i {
  font-style: italic;
}
u {
  text-decoration: underline;
  text-underline-offset: 2px;
}
s,
strike,
del {
  text-decoration: line-through;
}

sup {
  vertical-align: super;
  font-size: 0.7em;
}
sub {
  vertical-align: sub;
  font-size: 0.7em;
}

mark {
  background-color: #fef08a;
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}

code {
  background: var(--erix-code-bg, #f3f4f6);
  color: var(--erix-code-fg, #dc2626);
  font-family: var(--erix-font-mono, monospace);
  font-size: 0.87em;
  padding: 1px 5px;
  border-radius: var(--erix-radius-xs, 3px);
}

/* ── Link ───────────────────────────────────────────────────────────────── */
a {
  color: var(--erix-link-color, #3b82f6);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--erix-transition, 150ms ease);
}
a:hover {
  color: var(--erix-link-hover, #1d4ed8);
}

/* ── Blockquote ─────────────────────────────────────────────────────────── */
blockquote {
  border-left: 3px solid var(--erix-blockquote-border, #3b82f6);
  background: var(--erix-blockquote-bg, rgba(59, 130, 246, 0.04));
  padding: 0.6em 1em;
  border-radius: 0 var(--erix-radius-sm, 5px) var(--erix-radius-sm, 5px) 0;
  margin: 0.75em 0;
  font-style: italic;
  color: color-mix(in srgb, var(--erix-color-fg) 80%, transparent);
}

/* ── Code Block ─────────────────────────────────────────────────────────── */
pre {
  background: var(--erix-codeblock-bg, #1e1e2e);
  color: var(--erix-codeblock-fg, #cdd6f4);
  font-family: var(--erix-font-mono, monospace);
  font-size: 0.88em;
  line-height: 1.65;
  padding: 1rem 1.25rem;
  border-radius: var(--erix-radius-md, 8px);
  overflow-x: auto;
  white-space: pre;
  tab-size: 2;
  border: 1px solid var(--erix-codeblock-border, transparent);
  margin: 0.75em 0;
}

pre code {
  background: none;
  color: inherit;
  font-size: inherit;
  padding: 0;
  border-radius: 0;
}

/* ── Lists ──────────────────────────────────────────────────────────────── */
ul,
ol {
  padding-left: 1.6em;
  margin: 0.5em 0;
}
li {
  margin: 0.2em 0;
}
ul li {
  list-style-type: disc;
}
ul ul li {
  list-style-type: circle;
}
ul ul ul li {
  list-style-type: square;
}
ol li {
  list-style-type: decimal;
}

/* ── Task List ──────────────────────────────────────────────────────────── */
.erix-task-list {
  list-style: none !important;
  padding-left: 0;
  margin: 0.5em 0;
}

.erix-task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  padding: 0.1em 0;
}

.erix-task-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 4px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--erix-color-primary, #3b82f6);
  border-radius: 3px;
}

.erix-task-item span {
  flex: 1;
}

.erix-task-item.done span {
  text-decoration: line-through;
  opacity: 0.55;
}

/* ── Horizontal Rule ────────────────────────────────────────────────────── */
hr {
  border: none;
  border-top: 1px solid var(--erix-color-border, #e5e7eb);
  margin: 1.25em 0;
}

/* ── Table ──────────────────────────────────────────────────────────────── */
.erix-table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin: 0.75em 0;
  border-radius: var(--erix-radius-md, 8px);
  position: relative;
}

table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

th,
td {
  border: 1px solid var(--erix-table-border, #e5e7eb);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  min-width: 80px;
}

th {
  background: var(--erix-table-header-bg, #f9fafb);
  font-weight: 600;
  font-size: 0.9em;
}

tr:hover td {
  background: var(--erix-table-row-hover, rgba(59, 130, 246, 0.03));
}

/* ── Image ──────────────────────────────────────────────────────────────── */
img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--erix-radius-sm, 5px);
  margin: 0.75em 0;
  object-fit: contain;
}

img.erix-img-selected {
  outline: 2px solid var(--erix-color-primary, #3b82f6);
  outline-offset: 2px;
}

/* ── Callout ────────────────────────────────────────────────────────────── */
.erix-callout {
  display: flex;
  gap: 0.75em;
  align-items: flex-start;
  background: var(--erix-callout-bg, #fef3c7);
  border: 1px solid var(--erix-callout-border, #fcd34d);
  border-radius: var(--erix-radius-md, 8px);
  padding: 0.75em 1em;
  margin: 0.75em 0;
}

.erix-callout-emoji {
  font-size: 1.2em;
  flex-shrink: 0;
  user-select: none;
  line-height: 1.6;
}

.erix-callout-content {
  flex: 1;
  min-width: 0;
}

.erix-callout-content p {
  margin: 0;
}

/* ── Toggle Block ───────────────────────────────────────────────────────── */
.erix-toggle {
  margin: 0.5em 0;
}

.erix-toggle-trigger {
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
  user-select: none;
  padding: 0.2em 0;
  font-weight: 500;
}

.erix-toggle-arrow {
  font-size: 0.7em;
  transition: transform 200ms ease;
  flex-shrink: 0;
}

.erix-toggle.open .erix-toggle-arrow {
  transform: rotate(90deg);
}

.erix-toggle-content {
  display: none;
  padding-left: 1.5em;
  border-left: 2px solid var(--erix-color-border, #e5e7eb);
  margin-top: 0.25em;
}

.erix-toggle.open .erix-toggle-content {
  display: block;
}

/* ── Column Layout ──────────────────────────────────────────────────────── */
.erix-columns {
  display: grid;
  gap: 1em;
  margin: 0.75em 0;
}

.erix-columns[data-cols="2"] {
  grid-template-columns: 1fr 1fr;
}
.erix-columns[data-cols="3"] {
  grid-template-columns: 1fr 1fr 1fr;
}

.erix-column {
  min-width: 0;
  padding: 0.5em;
  border: 1px dashed var(--erix-color-border, #e5e7eb);
  border-radius: var(--erix-radius-sm, 5px);
}

/* ── Video Embed ────────────────────────────────────────────────────────── */
.erix-video-embed {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: var(--erix-radius-md, 8px);
  background: #000;
  margin: 0.75em 0;
}

.erix-video-embed iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* ── Slash Command Highlight ─────────────────────────────────────────────── */
.erix-slash-text {
  color: var(--erix-color-primary, #3b82f6);
  background: var(--erix-color-primary-muted, rgba(59, 130, 246, 0.1));
  border-radius: 2px;
  padding: 0 2px;
}

/* ── Selection ───────────────────────────────────────────────────────────── */
::selection {
  background: color-mix(
    in srgb,
    var(--erix-color-primary, #3b82f6) 25%,
    transparent
  );
}

/* ── Focus caret ─────────────────────────────────────────────────────────── */
p,
h1,
h2,
h3,
h4,
h5,
h6,
pre,
blockquote,
li,
td,
th,
div {
  caret-color: var(--erix-color-primary, #3b82f6);
}`;
