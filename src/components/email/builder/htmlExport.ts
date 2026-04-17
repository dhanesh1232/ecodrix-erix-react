// src/components/email/builder/htmlExport.ts
// Converts the EmailDocument JSON tree into email-safe HTML.
// Uses table-based layout for maximum email client compatibility.

import type { EmailBlock, EmailDocument } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function styleToString(style: Record<string, string | undefined>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      // Convert camelCase to kebab-case
      const prop = k.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      return `${prop}:${v}`;
    })
    .join(";");
}

function getBlockStyle(block: EmailBlock): string {
  const raw = block.style as Record<string, string | undefined>;
  return styleToString(raw);
}

// ─── Block HTML generators ────────────────────────────────────────────────────

function renderHeading(block: EmailBlock): string {
  const level = block.level ?? 1;
  const tag = `h${level}`;
  const defaultStyle = `margin:0;padding:0;`;
  return `<${tag} style="${defaultStyle}${getBlockStyle(block)}">${block.content ?? ""}</${tag}>`;
}

function renderText(block: EmailBlock): string {
  return `<p style="margin:0;${getBlockStyle(block)}">${block.content ?? ""}</p>`;
}

function renderButton(block: EmailBlock): string {
  const href = block.href || "#";
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
  <tr>
    <td align="center">
      <a href="${href}" target="_blank" style="display:inline-block;text-decoration:none;${getBlockStyle(block)}">${block.content ?? "Click Here"}</a>
    </td>
  </tr>
</table>`;
}

function renderImage(block: EmailBlock): string {
  const src = block.src || "";
  const alt = block.alt || "";
  const href = block.href;
  const imgStyle = `border:0;display:block;outline:none;${getBlockStyle(block)}`;
  const img = src
    ? `<img src="${src}" alt="${alt}" style="${imgStyle}" />`
    : `<div style="${imgStyle}min-height:80px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-family:sans-serif;font-size:13px;">[ Image ]</div>`;
  return href ? `<a href="${href}" target="_blank">${img}</a>` : img;
}

function renderDivider(block: EmailBlock): string {
  const borderColor = block.style.borderColor || "#e2e8f0";
  const borderWidth = block.style.borderWidth || "1px";
  const style = getBlockStyle(block);
  return `<div style="${style}"><hr style="border:0;border-top:${borderWidth} ${block.style.borderStyle || "solid"} ${borderColor};margin:0;" /></div>`;
}

function renderSpacer(block: EmailBlock): string {
  const h = block.height ?? 32;
  return `<div style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</div>`;
}

function renderHtml(block: EmailBlock): string {
  const style = getBlockStyle(block);
  return `<div style="${style}">${block.content || ""}</div>`;
}

function renderVariable(block: EmailBlock): string {
  const name = block.variableName || "variable";
  const style = getBlockStyle(block);
  return `<span style="${style}">{{${name}}}</span>`;
}

function renderSocial(block: EmailBlock): string {
  let links: { label: string; href: string; color: string }[] = [];
  try {
    links = JSON.parse(block.content || "[]");
  } catch {
    links = [];
  }
  const style = getBlockStyle(block);
  const items = links
    .map(
      (l) =>
        `<a href="${l.href}" target="_blank" style="display:inline-block;margin:0 8px;color:${l.color};font-family:sans-serif;font-size:13px;font-weight:600;text-decoration:none;">${l.label}</a>`,
    )
    .join("");
  return `<div style="text-align:center;${style}">${items}</div>`;
}

function renderSection(block: EmailBlock): string {
  const style = getBlockStyle(block);
  const inner = (block.children || []).map(renderBlock).join("\n");
  return `<div style="${style}">${inner}</div>`;
}

function renderColumns(block: EmailBlock, cols: number): string {
  const style = getBlockStyle(block);
  const children = block.children || [];
  const pct = Math.floor(100 / cols);
  const colHtml = children
    .map(
      (c) =>
        `<td valign="top" width="${pct}%" style="width:${pct}%">${renderBlock(c)}</td>`,
    )
    .join("\n");
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="${style}">
  <tr>${colHtml}</tr>
</table>`;
}

export function renderBlock(block: EmailBlock): string {
  switch (block.type) {
    case "heading":
      return renderHeading(block);
    case "text":
      return renderText(block);
    case "button":
      return renderButton(block);
    case "image":
      return renderImage(block);
    case "divider":
      return renderDivider(block);
    case "spacer":
      return renderSpacer(block);
    case "html":
      return renderHtml(block);
    case "variable":
      return renderVariable(block);
    case "social":
      return renderSocial(block);
    case "section":
      return renderSection(block);
    case "twoColumns":
      return renderColumns(block, 2);
    case "threeColumns":
      return renderColumns(block, 3);
    default:
      return "";
  }
}

// ─── Full document HTML ───────────────────────────────────────────────────────

export function documentToHtml(doc: EmailDocument): string {
  const blocksHtml = doc.blocks.map(renderBlock).join("\n");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: ${doc.backgroundColor}; }
    img { border: 0; outline: none; }
    a { color: inherit; }
    @media only screen and (max-width: 600px) {
      .email-content { width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${doc.backgroundColor};font-family:${doc.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background-color:${doc.backgroundColor};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table class="email-content" width="${doc.contentWidth}" cellpadding="0" cellspacing="0" border="0"
          role="presentation" style="width:${doc.contentWidth}px;max-width:100%;">
          <tr>
            <td>${blocksHtml}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Quick preview HTML (lighter, for srcdoc) ────────────────────────────────

export function documentToPreviewHtml(doc: EmailDocument): string {
  const blocksHtml = doc.blocks.map(renderBlock).join("\n");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px; background:${doc.backgroundColor}; font-family:${doc.fontFamily}; }
  .wrap { max-width:${doc.contentWidth}px; margin:0 auto; }
  img { max-width:100%; }
  a[href] { color:#7c3aed; }
</style>
</head>
<body>
<div class="wrap">${blocksHtml}</div>
</body>
</html>`;
}
