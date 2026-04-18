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

function renderProductCard(block: EmailBlock): string {
  let data: { title: string; description: string; buttonLabel: string } = {
    title: "Product Name",
    description: "A brief description of the product.",
    buttonLabel: "Shop Now",
  };
  try {
    data = { ...data, ...JSON.parse(block.content ?? "{}") };
  } catch {
    /* ok */
  }

  const price = block.price ?? "$29.99";
  const href = block.href || "#";
  const btnColor = block.style.color ?? "#7c3aed";
  const bg = block.style.backgroundColor ?? "#ffffff";
  const pad = block.style.padding ?? "32px 24px";

  const imgHtml = block.src
    ? `<img src="${block.src}" alt="${block.alt ?? data.title}" width="320" style="display:block;width:320px;max-width:100%;height:auto;border-radius:12px;margin:0 auto 20px;" />`
    : "";

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${bg};">
  <tr><td align="center" style="padding:${pad};">
    ${imgHtml}
    <h3 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#1a202c;">${data.title}</h3>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.65;">${data.description}</p>
    <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:${btnColor};letter-spacing:-0.5px;">${price}</p>
    <a href="${href}" target="_blank" style="display:inline-block;background:${btnColor};color:#ffffff;padding:13px 36px;border-radius:${block.style.borderRadius ?? "8px"};text-decoration:none;font-size:15px;font-weight:600;mso-padding-alt:0;">${data.buttonLabel}</a>
  </td></tr>
</table>`;
}

function renderFooter(block: EmailBlock): string {
  let data: { copyright: string; links: { label: string; href: string }[] } = {
    copyright: "© 2025 Your Company. All rights reserved.",
    links: [
      { label: "Unsubscribe", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  };
  try {
    data = { ...data, ...JSON.parse(block.content ?? "{}") };
  } catch {
    /* ok */
  }

  const bg = block.style.backgroundColor ?? "#f8fafc";
  const pad = block.style.padding ?? "24px 20px";
  const linkColor = block.style.color ?? "#64748b";

  const linksHtml = data.links
    .map(
      (l, i) =>
        `${i > 0 ? " &nbsp;|&nbsp; " : ""}<a href="${l.href}" target="_blank" style="color:${linkColor};text-decoration:none;font-size:12px;">${l.label}</a>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${bg};border-top:1px solid #e2e8f0;">
  <tr><td align="center" style="padding:${pad};">
    <p style="margin:0 0 10px;">${linksHtml}</p>
    <p style="margin:0;font-size:11px;color:#94a3b8;">${data.copyright}</p>
  </td></tr>
</table>`;
}

function renderVideo(block: EmailBlock): string {
  let vcData: { thumbnail: string } = { thumbnail: "" };
  try {
    vcData = {
      ...vcData,
      ...(JSON.parse(block.content ?? "{}") as typeof vcData),
    };
  } catch {
    /* ignore */
  }
  const thumbnail = vcData.thumbnail;
  const href = block.src || "#";

  const alt = block.alt ?? "Watch our video";
  const pad = block.style.padding ?? "16px 24px";
  const bg = block.style.backgroundColor ?? "#ffffff";
  const radius = block.style.borderRadius ?? "12px";

  const imgHtml = thumbnail
    ? `<img src="${thumbnail}" alt="${alt}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:${radius};" />`
    : `<div style="width:100%;max-width:560px;height:280px;background:#0f172a;border-radius:${radius};display:block;"></div>`;

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${bg};">
  <tr><td align="center" style="padding:${pad};">
    <a href="${href}" target="_blank" style="display:block;text-decoration:none;position:relative;">
      ${imgHtml}
    </a>
    <p style="margin:8px 0 0;text-align:center;font-size:13px;color:#64748b;">${alt}</p>
  </td></tr>
</table>`;
}

function renderList(block: EmailBlock): string {
  let data: { style: string; items: string[] } = { style: "bullet", items: [] };
  try {
    data = { ...data, ...JSON.parse(block.content ?? "{}") };
  } catch {
    /* ok */
  }

  const pad = block.style.padding ?? "12px 24px";
  const bg = block.style.backgroundColor ?? "#ffffff";
  const color = block.style.color ?? "#374151";
  const fontSize = block.style.fontSize ?? "15px";
  const lineHeight = block.style.lineHeight ?? "1.75";

  const tag = data.style === "numbered" ? "ol" : "ul";
  const listStyle =
    data.style === "numbered"
      ? "decimal"
      : data.style === "check"
        ? "none"
        : "disc";

  const itemsHtml = data.items
    .map((item) => {
      const check =
        data.style === "check"
          ? `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:rgba(124,58,237,.1);border:1.5px solid #7c3aed;text-align:center;line-height:16px;margin-right:10px;flex-shrink:0;font-size:10px;color:#7c3aed;">&#10003;</span>`
          : "";
      return (
        `<li style="margin-bottom:10px;font-size:${fontSize};color:${color};line-height:${lineHeight};${data.style === "check" ? "list-style:none;display:flex;align-items:flex-start;" : ""}">` +
        `${check}${item}</li>`
      );
    })
    .join("\n");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${bg};">
  <tr><td style="padding:${pad};">
    <${tag} style="margin:0;padding-left:${data.style === "check" ? "0" : "28px"};list-style-type:${listStyle};">
      ${itemsHtml}
    </${tag}>
  </td></tr>
</table>`;
}

function renderMenu(block: EmailBlock): string {
  let links: { label: string; href: string }[] = [];
  try {
    links = JSON.parse(block.content ?? "[]");
  } catch {
    /* ok */
  }

  const bg = block.style.backgroundColor ?? "#1e1b4b";
  const pad = block.style.padding ?? "14px 24px";
  const color = block.style.color ?? "#ffffff";
  const fontSize = block.style.fontSize ?? "14px";

  const linksHtml = links
    .map(
      (l, i) =>
        `${i > 0 ? " &nbsp;&nbsp; " : ""}<a href="${l.href}" target="_blank" style="color:${color};text-decoration:none;font-size:${fontSize};font-weight:500;">${l.label}</a>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${bg};">
  <tr><td align="center" style="padding:${pad};">${linksHtml}</td></tr>
</table>`;
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
        `<td class="col" valign="top" width="${pct}%" style="width:${pct}%;vertical-align:top;">${renderBlock(c)}</td>`,
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
    // New blocks
    case "productCard":
      return renderProductCard(block);
    case "footer":
      return renderFooter(block);
    case "video":
      return renderVideo(block);
    case "list":
      return renderList(block);
    case "menu":
      return renderMenu(block);
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
    img { border: 0; outline: none; max-width: 100%; height: auto; }
    a { color: inherit; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    @media only screen and (max-width: 600px) {
      .email-content { width: 100% !important; }
      .col { display: block !important; width: 100% !important; float: left !important; padding: 0 !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full { width: 100% !important; max-width: 100% !important; }
      img { max-width: 100% !important; height: auto !important; }
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
