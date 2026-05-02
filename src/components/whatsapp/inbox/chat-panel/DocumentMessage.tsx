"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { useErixToast } from "../../../../toast/useErixToast";
import { cn } from "../../../../lib/utils";

const FILE_COLORS: Record<string, { bg: string; text: string; icon: string }> =
  {
    PDF: {
      bg: "erix-bg-red-500/10",
      text: "erix-text-red-600",
      icon: "erix-text-red-500",
    },
    DOC: {
      bg: "erix-bg-primary/10",
      text: "erix-text-primary-dark",
      icon: "erix-text-primary",
    },
    DOCX: {
      bg: "erix-bg-primary/10",
      text: "erix-text-primary-dark",
      icon: "erix-text-primary",
    },
    XLS: {
      bg: "erix-bg-primary/10",
      text: "erix-text-primary",
      icon: "erix-text-primary",
    },
    XLSX: {
      bg: "erix-bg-primary/10",
      text: "erix-text-primary",
      icon: "erix-text-primary",
    },
    PPT: {
      bg: "erix-bg-orange-500/10",
      text: "erix-text-orange-600",
      icon: "erix-text-orange-500",
    },
    PPTX: {
      bg: "erix-bg-orange-500/10",
      text: "erix-text-orange-600",
      icon: "erix-text-orange-500",
    },
    CSV: {
      bg: "erix-bg-primary/10",
      text: "erix-text-primary",
      icon: "erix-text-primary",
    },
  };

const DEFAULT_COLOR = {
  bg: "erix-bg-primary/10",
  text: "erix-text-primary",
  icon: "erix-text-primary",
};

// Previewable file types
const PREVIEWABLE = new Set(["PDF", "PNG", "JPG", "JPEG", "GIF", "WEBP"]);

export default function DocumentMessage({ src }: { src: string }) {
  const toast = useErixToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  let filename = "Document";
  try {
    const url = new URL(src);
    filename = decodeURIComponent(url.pathname.split("/").pop() || "Document");
  } catch {
    filename = src.split("/").pop() || "Document";
  }

  const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
  const colors = FILE_COLORS[ext] || DEFAULT_COLOR;
  const canPreview = PREVIEWABLE.has(ext) && !previewError;

  const cleanFilename = (raw: string) => {
    try {
      const lastDotIndex = raw.lastIndexOf(".");
      const name = lastDotIndex !== -1 ? raw.slice(0, lastDotIndex) : raw;
      const fileExt = lastDotIndex !== -1 ? raw.slice(lastDotIndex) : "";
      let cleanName = name.replace(/(_\d{10,14})$/, "");
      cleanName = cleanName.replace(/[_-]/g, " ").trim();
      return `${cleanName}${fileExt}`;
    } catch {
      return raw;
    }
  };

  const displayFilename = cleanFilename(filename);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpen = () => {
    window.open(src, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="erix-min-w-0 erix-max-w-full erix-overflow-hidden erix-rounded-md erix-border erix-border-black/5">
      {/* Preview Area */}
      {canPreview ? (
        <div className="erix-relative erix-h-[140px] erix-w-full erix-overflow-hidden erix-bg-neutral-800">
          {isLoading && (
            <div className="erix-absolute erix-inset-0 erix-z-10 erix-flex erix-items-center erix-justify-center erix-bg-neutral-900/50">
              <div className="erix-h-full erix-w-full erix-animate-pulse erix-bg-neutral-700" />
            </div>
          )}
          {ext === "PDF" ? (
            <iframe
              src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="Document preview"
              className={cn(
                "erix-h-[300px] erix-w-[200%] erix-origin-top-left erix-scale-50 erix-pointer-events-none erix-transition-opacity erix-duration-300",
                isLoading ? "erix-opacity-0" : "erix-opacity-100",
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setPreviewError(true);
                setIsLoading(false);
              }}
            />
          ) : (
            <img
              src={src}
              alt="Preview"
              className={cn(
                "erix-h-full erix-w-full erix-object-cover erix-transition-opacity erix-duration-300",
                isLoading ? "erix-opacity-0" : "erix-opacity-100",
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setPreviewError(true);
                setIsLoading(false);
              }}
            />
          )}
          {/* Fade overlay at bottom */}
          <div className="erix-absolute erix-inset-x-0 erix-bottom-0 erix-h-8 erix-bg-gradient-to-t erix-from-neutral-800/80 erix-to-transparent" />
        </div>
      ) : (
        // Non-previewable: show a styled placeholder
        <div
          className={cn(
            "erix-flex erix-h-[60px] erix-items-center erix-justify-center",
            colors.bg,
          )}
        >
          <FileText
            className={cn("erix-h-8 erix-w-8 erix-opacity-40", colors.icon)}
          />
        </div>
      )}

      {/* File Info Bar */}
      <div
        className={cn(
          "erix-flex erix-items-center erix-gap-2.5 erix-px-3 erix-py-2",
          colors.bg,
          "erix-border-t erix-border-black/5",
        )}
      >
        <FileText
          className={cn("erix-h-5 erix-w-5 erix-shrink-0", colors.icon)}
        />
        <div className="erix-flex erix-min-w-0 erix-flex-1 erix-flex-col">
          <span className="erix-line-clamp-1 erix-text-[13px] erix-leading-snug erix-font-medium erix-break-all">
            {displayFilename}
          </span>
          <span
            className={cn(
              "erix-text-[10px] erix-font-semibold erix-uppercase erix-tracking-wide erix-opacity-70",
              colors.text,
            )}
          >
            {ext}
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div
        className="erix-flex erix-items-center erix-justify-between erix-border-t erix-border-black/5 erix-bg-white/40 erix-px-3 erix-py-1.5 erix-cursor-pointer hover:erix-bg-black/5"
        onClick={handleDownload}
      >
        <div className="erix-text-primary erix-flex erix-items-center erix-gap-1.5 erix-text-[11px] erix-font-bold">
          {isDownloading ? (
            <Loader2 className="erix-h-3.5 erix-w-3.5 erix-animate-spin" />
          ) : (
            <Download className="erix-h-3.5 erix-w-3.5" />
          )}
          Download
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          className="erix-text-primary erix-p-1 hover:erix-bg-black/5 erix-rounded-full"
        >
          <ExternalLink className="erix-h-3.5 erix-w-3.5" />
        </button>
      </div>
    </div>
  );
}
