"use client";
// src/components/email/PreviewPane.tsx
// Live preview of the rendered email template via srcdoc iframe.
// The preview is fetched from POST /:id/preview with the current variable values.

import * as React from "react";
import { Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { unwrap, useEmailTemplateApi } from "@/lib/emailTemplateClient";
import type { EmailPreviewResult, IEmailTemplate } from "@/types/email";

type DeviceType = "desktop" | "mobile";

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: "100%",
  mobile: "375px",
};

export interface PreviewPaneProps {
  templateId: string | null;
  /** Live draft (used when templateId is null — shows raw HTML) */
  draft: Partial<IEmailTemplate>;
  className?: string;
}

export function PreviewPane({ templateId, draft, className = "" }: PreviewPaneProps) {
  const { base, headers } = useEmailTemplateApi();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [preview, setPreview] = React.useState<EmailPreviewResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Fetch preview ──────────────────────────────────────────────────────
  const fetchPreview = React.useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/${templateId}/preview`, {
        method: "POST",
        headers,
        body: JSON.stringify({ variables: {} }),
      });
      const data = await unwrap<EmailPreviewResult>(res);
      setPreview(data);
    } catch (err: any) {
      setError(err.message ?? "Preview failed");
    } finally {
      setLoading(false);
    }
  }, [base, headers, templateId]);

  // Auto-fetch when templateId becomes available
  React.useEffect(() => {
    if (templateId) void fetchPreview();
  }, [templateId, fetchPreview]);

  // ── Build srcdoc ───────────────────────────────────────────────────────
  const srcdoc = React.useMemo(() => {
    const html = preview?.resolvedHtml ?? draft.htmlBody ?? "";
    const subject = preview?.resolvedSubject ?? draft.subject ?? "";
    const preheader = preview?.resolvedPreheader ?? draft.preheader ?? "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${subject}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px 16px;
    background: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
  }
  .email-wrapper {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,.08);
    overflow: hidden;
  }
  .preheader {
    display: none;
    max-height: 0;
    overflow: hidden;
  }
</style>
</head>
<body>
${preheader ? `<span class="preheader">${preheader}</span>` : ""}
<div class="email-wrapper">
  ${html || '<div style="padding:40px;text-align:center;color:#94a3b8;font-size:14px;">Your email HTML will appear here…</div>'}
</div>
</body>
</html>`;
  }, [preview, draft]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("erix-flex erix-flex-col erix-h-full erix-overflow-hidden", className)}>
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div
        className="erix-flex erix-shrink-0 erix-items-center erix-gap-2 erix-px-3 erix-border-b"
        style={{ height: "40px", background: "#1a1a2a", borderColor: "#2e2e3e" }}
      >
        <span className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest" style={{ color: "#475569" }}>
          Preview
        </span>

        <div className="erix-flex-1" />

        {/* Device toggle */}
        <div
          className="erix-flex erix-items-center erix-rounded erix-overflow-hidden erix-border"
          style={{ borderColor: "#2e2e3e" }}
        >
          {(["desktop", "mobile"] as DeviceType[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className="erix-flex erix-items-center erix-justify-center erix-w-7 erix-h-6 erix-transition-all erix-cursor-pointer erix-border-0"
              style={{
                background: device === d ? "rgba(124,58,237,.25)" : "transparent",
                color: device === d ? "#a78bfa" : "#475569",
              }}
              title={d === "desktop" ? "Desktop (600px)" : "Mobile (375px)"}
            >
              {d === "desktop" ? (
                <Monitor className="erix-h-3 erix-w-3" />
              ) : (
                <Smartphone className="erix-h-3 erix-w-3" />
              )}
            </button>
          ))}
        </div>

        {/* Refresh — only when we have a saved template */}
        {templateId && (
          <button
            type="button"
            onClick={fetchPreview}
            disabled={loading}
            title="Fetch resolved preview from backend"
            className="erix-flex erix-items-center erix-justify-center erix-w-7 erix-h-6 erix-rounded erix-border erix-transition-all erix-cursor-pointer"
            style={{ borderColor: "#2e2e3e", background: "transparent", color: "#475569" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >
            {loading ? (
              <Loader2 className="erix-h-3 erix-w-3 erix-animate-spin" />
            ) : (
              <RefreshCw className="erix-h-3 erix-w-3" />
            )}
          </button>
        )}
      </div>

      {/* ── Subject + Preheader strip ──────────────────────────────────── */}
      {(draft.subject || draft.preheader) && (
        <div
          className="erix-flex-shrink-0 erix-px-4 erix-py-2 erix-border-b"
          style={{ background: "#15151f", borderColor: "#2e2e3e" }}
        >
          {draft.subject && (
            <p className="erix-text-xs erix-font-semibold erix-truncate" style={{ color: "#cbd5e1" }}>
              <span style={{ color: "#475569" }}>Subject: </span>
              {preview?.resolvedSubject ?? draft.subject}
            </p>
          )}
          {draft.preheader && (
            <p className="erix-text-[10px] erix-truncate erix-mt-0.5" style={{ color: "#64748b" }}>
              <span style={{ color: "#334155" }}>Preheader: </span>
              {preview?.resolvedPreheader ?? draft.preheader}
            </p>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="erix-flex-shrink-0 erix-px-4 erix-py-2 erix-text-xs erix-border-b"
          style={{ background: "rgba(239,68,68,.08)", borderColor: "rgba(239,68,68,.2)", color: "#f87171" }}
        >
          ⚠ {error}
        </div>
      )}

      {/* ── Iframe preview ────────────────────────────────────────────── */}
      <div
        className="erix-flex-1 erix-min-h-0 erix-overflow-auto erix-flex erix-items-start erix-justify-center erix-p-4"
        style={{ background: "#0f0f1a" }}
      >
        <iframe
          ref={iframeRef}
          title="Email Preview"
          sandbox="allow-same-origin"
          srcDoc={srcdoc}
          className="erix-rounded erix-overflow-hidden erix-transition-all erix-duration-300"
          style={{
            width: DEVICE_WIDTHS[device],
            maxWidth: "100%",
            minHeight: "500px",
            height: "100%",
            border: "none",
            background: "#f1f5f9",
          }}
        />
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      {!templateId && (
        <div
          className="erix-flex-shrink-0 erix-flex erix-items-center erix-px-4 erix-border-t"
          style={{ height: "26px", borderColor: "#2e2e3e", background: "#1a1a2a" }}
        >
          <span className="erix-text-[10px]" style={{ color: "#475569" }}>
            Live draft preview — save to fetch server-resolved variables
          </span>
        </div>
      )}
    </div>
  );
}
