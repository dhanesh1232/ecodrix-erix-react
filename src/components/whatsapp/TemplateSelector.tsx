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
    <div className="absolute inset-x-0 bottom-full z-50 mb-2 mx-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/20">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex max-h-72">
        {/* List */}
        <div className="w-1/2 overflow-y-auto border-r border-border p-1.5">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <ErixSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
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
                    : "hover:bg-muted"
                }`}
              >
                {selected === t.name && (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {t.name}
                  </p>
                  <div className="mt-0.5 flex gap-1">
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
        <div className="flex w-1/2 flex-col p-3">
          {selectedTemplate ? (
            <>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview
              </p>
              {/* WhatsApp-style bubble */}
              <div className="rounded-xl rounded-tl-none border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-foreground">
                {selectedTemplate.bodyText ?? selectedTemplate.name}
              </div>
              {/* Variable inputs */}
              {varCount > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                      className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
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
                className="mt-auto w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Send Template
              </button>
            </>
          ) : (
            <p className="my-auto text-center text-xs text-muted-foreground">
              Select a template to preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
