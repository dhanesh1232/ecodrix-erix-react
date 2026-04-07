"use client";
// src/components/whatsapp/TemplateSelector.tsx
import * as React from "react";
import { Search, X, CheckCircle2 } from "lucide-react";
import { useTemplates } from "@/hooks/whatsapp/useTemplates";
import { ErixBadge } from "@/components/ui/erix-badge";
import { ErixSpinner } from "@/components/ui/erix-spinner";

interface TemplateSelectorProps {
  onSelect: (name: string, variables?: string[]) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const { templates, loading } = useTemplates("approved");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [variables, setVariables] = React.useState<string[]>([]);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedTemplate = templates.find((t) => t.name === selected);
  const varCount = (selectedTemplate?.bodyText?.match(/\{\{(\d+)\}\}/g) ?? [])
    .length;

  React.useEffect(() => {
    if (varCount > 0) setVariables(Array(varCount).fill(""));
  }, [varCount]);

  return (
    <div className="erix-absolute erix-inset-x-0 erix-bottom-full erix-z-50 mb-2 mx-3 erix-overflow-hidden erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-shadow-xl erix-shadow-black/20">
      {/* Header */}
      <div className="erix-flex erix-items-center erix-gap-2 erix-border-b erix-border-border px-3 py-2.5">
        <Search className="erix-size-3.5 erix-shrink-0 erix-text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="erix-flex-1 erix-bg-transparent erix-text-sm erix-text-foreground placeholder:erix-text-muted-foreground focus:erix-outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="erix-rounded-md erix-p-1 hover:erix-bg-muted"
        >
          <X className="erix-size-4 erix-text-muted-foreground" />
        </button>
      </div>

      <div className="erix-flex max-h-72">
        {/* List */}
        <div className="erix-w-1/2 erix-overflow-y-auto erix-border-r erix-border-border erix-p-1.5">
          {loading ? (
            <div className="erix-flex erix-h-20 erix-items-center erix-justify-center">
              <ErixSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 erix-text-center erix-text-xs erix-text-muted-foreground">
              No approved templates
            </p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelected(t.name)}
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  selected === t.name
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:erix-bg-muted"
                }`}
              >
                {selected === t.name && (
                  <CheckCircle2 className="mt-0.5 erix-size-3.5 erix-shrink-0 erix-text-primary" />
                )}
                <div className="min-w-0">
                  <p className="erix-truncate erix-text-xs font-semibold erix-text-foreground">
                    {t.name}
                  </p>
                  <div className="mt-0.5 erix-flex erix-gap-1">
                    <ErixBadge variant="info" size="sm">
                      {t.language}
                    </ErixBadge>
                    <ErixBadge variant="ghost" size="sm">
                      {t.category}
                    </ErixBadge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Preview / Variables */}
        <div className="erix-flex erix-w-1/2 erix-flex-col erix-p-3">
          {selectedTemplate ? (
            <>
              <p className="mb-2 erix-text-xs font-semibold erix-text-muted-foreground erix-uppercase erix-tracking-wider">
                Preview
              </p>
              {/* WhatsApp-style bubble */}
              <div className="erix-rounded-xl erix-rounded-tl-none erix-border erix-border-border erix-bg-muted/40 px-3 py-2.5 erix-text-xs erix-leading-relaxed erix-text-foreground">
                {selectedTemplate.bodyText ?? selectedTemplate.name}
              </div>
              {/* Variable inputs */}
              {varCount > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="erix-text-xs font-semibold erix-text-muted-foreground erix-uppercase erix-tracking-wider">
                    Variables
                  </p>
                  {variables.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      onChange={(e) => {
                        const next = [...variables];
                        next[i] = e.target.value;
                        setVariables(next);
                      }}
                      placeholder={`{{${i + 1}}}`}
                      className="erix-w-full erix-rounded-lg erix-border erix-border-border erix-bg-muted/40 px-2.5 py-1.5 erix-text-xs erix-text-foreground placeholder:erix-text-muted-foreground focus:erix-outline-none focus:erix-border-primary"
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                disabled={varCount > 0 && variables.some((v) => !v.trim())}
                onClick={() =>
                  onSelect(
                    selectedTemplate.name,
                    varCount > 0 ? variables : undefined,
                  )
                }
                className="mt-auto erix-w-full erix-rounded-xl erix-bg-primary px-3 py-2 erix-text-xs font-semibold erix-text-primary-foreground transition-opacity hover:erix-opacity-90 disabled:erix-opacity-40"
              >
                Send Template
              </button>
            </>
          ) : (
            <p className="my-auto erix-text-center erix-text-xs erix-text-muted-foreground">
              Select a template to preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
