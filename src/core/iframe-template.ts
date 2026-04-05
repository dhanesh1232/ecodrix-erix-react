// src/core/iframe-template.ts
// Builds the full HTML document injected into the iframe.
// Embeds tokens.css + erix.css inline so no external requests are needed.

import { erixCSS as editorCSS } from "@/styles/erix.css";
import { tokensCSS } from "@/styles/tokens.css";

export function buildIframeHTML(
  initialHTML: string,
  placeholder: string,
  shortcuts = true,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style id="__ERIX_TOKENS__">${tokensCSS}</style>
  <style id="__ERIX_STYLES__">${editorCSS}</style>
</head>
<body
  contenteditable="true"
  spellcheck="true"
  data-shortcuts="${shortcuts}"
  data-placeholder="${placeholder.replace(/"/g, "&quot;")}"
>${initialHTML}</body>
</html>`;
}
