"use client";
// src/components/email/TemplatePreview.tsx
// Sandboxed iframe preview of the resolved email HTML.
// For saved templates: calls POST /:id/preview on the backend.
// For unsaved drafts: does a client-side {{token}} replacement as a best-effort preview.

import * as React from "react";
import { Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { unwrap, useEmailTemplateApi } from "@/lib/emailTemplateClient";
import type { EmailPreviewResult, IEmailTemplate, VariableMapping } from "@/types/email";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Client-side fallback resolver ───────────────────────────────────────────

/**
 * Best-effort client-side replacement for unsaved drafts.
 * Uses static mapping values or the token name as a placeholder.
 */
function clientSideResolve(
  html: string,
  mappings: VariableMapping[],
): string {
  if (!html) return "";
  const mapByKey: Record<string, string> = {};
  for (const m of mappings) {
    mapByKey[m.originalIndex] =
      m.source === "custom" && m.staticValue
        ? m.staticValue
        : m.fallback ?? `[${m.label || m.originalIndex}]`;
  }
  return html.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    return mapByKey[key.trim()] ?? `[${key.trim()}]`;
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

type DeviceMode = "desktop" | "mobile";

export interface TemplatePreviewProps {
  /** Saved template ID. If null, client-side preview is used. */
  templateId: string | null;
  /** Current draft — used for client-side preview + server preview fallback */
  draft: Partial<IEmailTemplate>;
  className?: string;
  /** When true, use the dark GrapesJS panel styling */
  dark?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "100%",
  mobile: "375px",
};

export function TemplatePreview({
  templateId,
  draft,
  className = "",
  dark,
}: TemplatePreviewProps) {
  const { base, headers } = useEmailTemplateApi();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const [mode, setMode] = React.useState<DeviceMode>("desktop");
  const [resolvedHtml, setResolvedHtml] = React.useState<string>("");
  const [resolvedSubject, setResolvedSubject] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPreview = React.useCallback(async () => {
    if (!templateId) {
      // Client-side fallback for unsaved templates
      const html = clientSideResolve(
        draft.htmlBody ?? "",
        draft.variableMapping ?? [],
      );
      setResolvedHtml(html);
      setResolvedSubject(draft.subject ?? "");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/${templateId}/preview`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const data = await unwrap<EmailPreviewResult>(res);
      setResolvedHtml(data.resolvedHtml);
      setResolvedSubject(data.resolvedSubject);
    } catch (err: any) {
      setError(err.message ?? "Preview failed");
    } finally {
      setLoading(false);
    }
  }, [base, headers, templateId, draft.htmlBody, draft.subject, draft.variableMapping]);

  // Initial preview load + refresh when templateId changes
  React.useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  // Write HTML into the sandboxed iframe
  React.useEffect(() => {
    const frame = iframeRef.current;
    if (!frame || !resolvedHtml) return;

    // Wait for srcdoc to be ready; use contentDocument if available
    const doc = frame.contentDocument ?? frame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>${resolvedHtml}</body>
</html>`);
    doc.close();
  }, [resolvedHtml]);

  return (
    <section
      className={cn("erix-flex erix-flex-col erix-h-full erix-overflow-hidden", className)}
      aria-label="Email preview"
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={cn(
        "erix-flex erix-shrink-0 erix-items-center erix-gap-2 erix-px-3 erix-py-2 erix-border-b erix-flex-wrap",
        dark ? "erix-border-[#2e2e3e]" : "erix-border-border",
      )}>
        {/* Device toggle */}
        <div
          className={cn(
            "erix-flex erix-rounded erix-border erix-p-0.5",
            dark ? "erix-border-[#2e2e3e] erix-bg-white/5" : "erix-border-border erix-bg-muted/30",
          )}
          role="group"
          aria-label="Preview device size"
        >
          {(["desktop", "mobile"] as DeviceMode[]).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <Button
                key={d}
                variant="ghost"
                size="icon"
                onClick={() => setMode(d)}
                aria-pressed={mode === d}
                aria-label={`${d} view`}
                className={cn(
                  "erix-h-6 erix-w-6 erix-rounded erix-transition-all",
                  dark
                    ? mode === d
                      ? "erix-bg-violet-600/40 erix-text-violet-300"
                      : "erix-text-slate-500 hover:erix-text-slate-300 hover:erix-bg-transparent"
                    : mode === d
                      ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                      : "erix-text-muted-foreground hover:erix-bg-transparent hover:erix-text-foreground",
                )}
              >
                <Icon className="erix-h-3 erix-w-3" aria-hidden="true" />
              </Button>
            );
          })}
        </div>

        {/* Refresh button */}
        <Button
          id="email-preview-refresh-btn"
          variant="ghost"
          size="sm"
          onClick={fetchPreview}
          disabled={loading}
          className={cn(
            "erix-h-6 erix-px-2 erix-gap-1.5 erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-tighter erix-ml-auto",
            dark ? "erix-text-slate-400 hover:erix-text-slate-200 hover:erix-bg-white/10" : "",
          )}
          aria-label="Refresh preview"
        >
          <RefreshCw
            className={cn("erix-h-3 erix-w-3", loading && "erix-animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* Subject line */}
      {resolvedSubject && (
        <div className={cn(
          "erix-shrink-0 erix-px-3 erix-py-1.5 erix-border-b",
          dark ? "erix-border-[#2e2e3e]" : "erix-border-border",
        )}>
          <p className={cn("erix-truncate erix-text-[10px]", dark ? "erix-text-slate-500" : "erix-text-muted-foreground")}>
            <span className={cn("erix-font-bold", dark ? "erix-text-slate-400" : "erix-text-foreground")}>SUBJECT: </span>
            {resolvedSubject}
          </p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="erix-py-2">
          <AlertDescription className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-tight">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Iframe container ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "erix-relative erix-flex-1 erix-overflow-hidden",
          dark ? "erix-bg-[#2a2a3a]" : "erix-bg-white erix-border erix-border-border/50 erix-rounded-lg",
        )}
        style={dark ? {} : {}}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="erix-absolute erix-inset-0 erix-z-10 erix-flex erix-items-center erix-justify-center erix-bg-background/70 erix-backdrop-blur-[2px]">
            <Loader2 className={cn("erix-h-6 erix-w-6 erix-animate-spin", dark ? "erix-text-violet-400" : "erix-text-primary")} />
          </div>
        )}

        {/* Centered iframe wrapper */}
        <div className="erix-flex erix-h-full erix-justify-center erix-overflow-auto erix-p-2">
          <iframe
            ref={iframeRef}
            title="Email preview"
            aria-label="Rendered email preview"
            sandbox="allow-same-origin"
            className="erix-rounded erix-bg-white"
            style={{
              width: DEVICE_WIDTHS[mode],
              minHeight: "100%",
              border: "none",
              display: "block",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Empty state */}
        {!resolvedHtml && !loading && (
          <div className="erix-absolute erix-inset-0 erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-p-8 erix-text-center">
            <Monitor className={cn("erix-h-10 erix-w-10 erix-opacity-10", dark ? "erix-text-slate-400" : "erix-text-muted-foreground")} />
            <p className={cn("erix-text-xs erix-max-w-[150px] erix-leading-relaxed", dark ? "erix-text-slate-600" : "erix-text-muted-foreground")}>
              No content to preview yet.
            </p>
          </div>
        )}
      </div>

      {/* Unsaved draft notice */}
      {!templateId && (
        <p className={cn(
          "erix-shrink-0 erix-text-[10px] erix-text-center erix-px-3 erix-py-2",
          dark ? "erix-text-slate-600" : "erix-text-muted-foreground",
        )}>
          Preview uses client-side resolution. Save to see backend-resolved values.
        </p>
      )}
    </section>
  );
}
