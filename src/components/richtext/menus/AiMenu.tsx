// src/components/richtext/menus/AiMenu.tsx
"use client";
import {
  CheckCircle,
  FileText,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import type { AiAction, AiProvider } from "@/types/erix";

interface AiMenuProps {
  provider?: AiProvider;
  visible?: boolean;
  onClose?: () => void;
}

interface AiAction_ {
  id: AiAction;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AI_ACTIONS: AiAction_[] = [
  {
    id: "improve",
    label: "Improve writing",
    icon: <Sparkles size={14} />,
    description: "Make it clearer and more professional",
  },
  {
    id: "continue",
    label: "Continue",
    icon: <Zap size={14} />,
    description: "Keep writing from where you left off",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <FileText size={14} />,
    description: "Make it shorter and simpler",
  },
  {
    id: "translate",
    label: "Translate",
    icon: <Globe size={14} />,
    description: "Change the language",
  },
  {
    id: "fix_grammar",
    label: "Fix grammar",
    icon: <CheckCircle size={14} />,
    description: "Correct spelling and grammar",
  },
  {
    id: "make_shorter",
    label: "Make shorter",
    icon: <Minimize2 size={14} />,
    description: "Trim the selection",
  },
  {
    id: "make_longer",
    label: "Make longer",
    icon: <Maximize2 size={14} />,
    description: "Expand with more detail",
  },
];

export const AiMenu: React.FC<AiMenuProps> = ({
  provider,
  visible = false,
  onClose,
}) => {
  const { engine, ctx, menuContainerRef } = useErixEditor();
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();
  const [loading, setLoading] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (action: AiAction, prompt?: string) => {
    if (!provider) {
      setError("No AI provider configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const selected = ctx.hasSelection
        ? window.getSelection()?.toString() || ""
        : "";
      const text = selected || engine?.getHTML() || "";
      const output = await provider.enhance(text, action, prompt);
      setResult(output);
    } catch (e) {
      setError((e as Error).message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    engine?.insertHTML(result);
    setResult(null);
    onClose?.();
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, "");
  };

  if (!visible || !menuContainerRef.current) return null;

  return ReactDOM.createPortal(
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop */}
      <div
        role="presentation"
        className="erix-absolute erix-inset-0 erix-z-290 erix-bg-black/20 erix-backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="erix-absolute erix-inset-0 erix-z-300 erix-flex erix-items-center erix-justify-center erix-pointer-events-none">
        <div
          role="presentation"
          className={cn(
            "erix-w-85 erix-border erix-border-border erix-bg-popover/95 erix-backdrop-blur-xl erix-overflow-hidden",
            "erix-flex erix-flex-col erix-pointer-events-auto erix-transition-all erix-duration-300 erix-ease-out-back",
            "erix-animate-in erix-fade-in erix-zoom-in-95",
            popoverRadius,
            shadowClass,
          )}
          style={{
            maxWidth: "calc(100% - 24px)",
            maxHeight: "calc(100% - 48px)",
          }}
          data-erix-ignore-dismiss="true"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="erix-flex erix-items-center erix-justify-between erix-px-5 erix-py-4 erix-border-b erix-border-border/50">
            <div className="erix-flex erix-items-center erix-gap-3">
              <span
                className={cn(
                  "erix-w-8 erix-h-8 erix-bg-primary erix-flex erix-items-center erix-justify-center erix-shadow-lg erix-shadow-primary/20",
                  buttonRadius,
                )}
              >
                <Sparkles size={14} className="erix-text-primary-foreground" />
              </span>
              <div className="erix-flex erix-flex-col">
                <span className="erix-text-sm erix-font-bold erix-tracking-tight">
                  AI Assistant
                </span>
                <span className="erix-text-[10px] erix-text-muted-foreground erix-font-medium erix-uppercase erix-tracking-wider">
                  Powered by Ecodrix
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "erix-w-8 erix-h-8 erix-flex erix-items-center erix-justify-center hover:erix-bg-accent erix-text-muted-foreground hover:erix-text-foreground erix-transition-all",
                buttonRadius,
              )}
            >
              <X size={15} />
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="erix-px-4 erix-py-3 erix-border-b erix-border-border/50 erix-bg-primary/[0.03]">
              <div className="erix-flex erix-items-center erix-gap-1.5 erix-mb-2">
                <div className="erix-w-1.5 erix-h-1.5 erix-rounded-full erix-bg-primary erix-animate-pulse" />
                <p className="erix-text-primary erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-tighter">
                  AI Suggestion
                </p>
              </div>
              <div className="erix-max-h-48 erix-overflow-y-auto erix-scrollbar-none">
                <p className="erix-text-sm erix-leading-relaxed erix-text-foreground/90 erix-font-medium">
                  {stripHtml(result)}
                </p>
              </div>
              <div className="erix-flex erix-gap-2 erix-mt-4">
                <button
                  type="button"
                  onClick={apply}
                  className={cn(
                    "erix-flex-1 erix-px-4 erix-py-2 erix-text-xs erix-font-bold erix-bg-primary erix-text-primary-foreground hover:erix-bg-primary/90 erix-transition-all active:erix-scale-95",
                    buttonRadius,
                  )}
                >
                  Insert Result
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className={cn(
                    "erix-px-4 erix-py-2 erix-text-xs erix-font-bold erix-bg-muted erix-text-muted-foreground hover:erix-bg-accent hover:erix-text-foreground erix-transition-all",
                    buttonRadius,
                  )}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="erix-p-1 erix-space-y-0.5 erix-max-h-64 erix-overflow-y-auto erix-scrollbar-thin">
            {AI_ACTIONS.map((action) => (
              <button
                type="button"
                key={action.id}
                disabled={loading}
                onClick={() => run(action.id)}
                className={cn(
                  "erix-w-full erix-flex erix-items-center erix-gap-3 erix-px-3 erix-py-2 erix-text-left",
                  "hover:erix-bg-accent/60 erix-transition-all erix-duration-200",
                  "disabled:erix-opacity-40 disabled:erix-pointer-events-none",
                  "erix-group",
                  buttonRadius,
                )}
              >
                <div
                  className={cn(
                    "erix-w-8 erix-h-8 erix-flex erix-items-center erix-justify-center erix-bg-background erix-border erix-border-border/50 erix-text-muted-foreground group-hover:erix-bg-accent group-hover:erix-text-primary erix-transition-colors",
                    buttonRadius,
                  )}
                >
                  {action.icon}
                </div>
                <div className="erix-flex erix-flex-col erix-flex-1">
                  <span className="erix-text-[13px] erix-font-semibold erix-leading-tight">
                    {action.label}
                  </span>
                  <span className="erix-text-[11px] erix-text-muted-foreground erix-leading-tight erix-opacity-70">
                    {action.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom prompt */}
          <div className="erix-p-3 erix-border-t erix-border-border/50">
            <div className="erix-flex erix-gap-2">
              <div className="erix-relative erix-flex-1">
                <input
                  type="text"
                  placeholder="Custom instruction…"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customPrompt.trim())
                      run("custom", customPrompt);
                  }}
                  className={cn(
                    "erix-w-full erix-text-sm erix-pl-3 erix-pr-10 erix-py-2 erix-border erix-border-border",
                    "erix-bg-background placeholder:erix-text-muted-foreground/50",
                    "focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20 erix-transition-shadow",
                    buttonRadius,
                  )}
                />
                <div className="erix-absolute erix-right-2 erix-top-1/2 erix--translate-y-1/2">
                  <Zap
                    size={12}
                    className={cn(
                      "erix-transition-colors",
                      customPrompt
                        ? "erix-text-primary"
                        : "erix-text-muted-foreground/30",
                    )}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={!customPrompt.trim() || loading}
                onClick={() => run("custom", customPrompt)}
                className={cn(
                  "erix-px-4 erix-py-2 erix-text-sm erix-font-bold",
                  "erix-bg-primary erix-text-primary-foreground",
                  "hover:erix-bg-primary/90 erix-transition-all active:erix-scale-95",
                  "disabled:erix-opacity-30 disabled:erix-pointer-events-none",
                  "erix-min-w-[50px] erix-flex erix-items-center erix-justify-center",
                  buttonRadius,
                )}
              >
                {loading ? (
                  <Loader2 size={16} className="erix-animate-spin" />
                ) : (
                  "Run"
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className={cn(
                "erix-mx-3 erix-mb-3 erix-flex erix-items-center erix-gap-2 erix-text-xs erix-text-destructive erix-bg-destructive/5 erix-px-4 erix-py-3 erix-border erix-border-destructive/10",
                buttonRadius,
              )}
            >
              <X size={12} />
              <span className="erix-font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>
    </>,
    menuContainerRef.current,
  );
};
