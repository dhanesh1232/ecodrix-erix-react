"use client";
// src/components/email/VariablePalette.tsx
// Displays detected {{tokens}} from the template and lets the user map
// each one to a CRM field, static value, or AI-generated content.
// Supports a dark prop for the GrapesJS-style sidebar panel.

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
  Sparkles,
  Type,
  Variable,
} from "lucide-react";
import { useEmailVariables } from "@/hooks/email/useEmailVariables";
import type { VariableMapping, VariableSource } from "@/types/email";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface VariablePaletteProps {
  htmlBody: string;
  subject: string;
  preheader: string;
  mappings: VariableMapping[];
  onMappingsChange: (mappings: VariableMapping[]) => void;
  className?: string;
  /** When true, render with GrapesJS dark panel styling */
  dark?: boolean;
}

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<VariableSource, React.ElementType> = {
  crm: Database,
  custom: Type,
  ai: Sparkles,
};

const SOURCE_LABELS: Record<VariableSource, string> = {
  crm: "CRM Field",
  custom: "Static Value",
  ai: "AI Generated",
};

const SOURCE_COLORS: Record<VariableSource, string> = {
  crm: "erix-text-blue-400",
  custom: "erix-text-amber-400",
  ai: "erix-text-violet-400",
};

// ─── Individual mapping row ───────────────────────────────────────────────────

function MappingRow({
  varName,
  mapping,
  collections,
  fieldsByCollection,
  onLoadFields,
  onChange,
  dark,
}: {
  varName: string;
  mapping: VariableMapping;
  collections: Array<{ name: string; label: string }>;
  fieldsByCollection: Record<string, Array<{ name: string; label: string }>>;
  onLoadFields: (col: string) => void;
  onChange: (updated: VariableMapping) => void;
  dark?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const SourceIcon = SOURCE_ICONS[mapping.source];
  const availableFields = mapping.collection
    ? (fieldsByCollection[mapping.collection] ?? null)
    : null;

  const handleCollectionChange = (col: string) => {
    onChange({ ...mapping, collection: col, field: undefined });
    if (col) onLoadFields(col);
  };

  const darkInput = "erix-h-7 erix-text-xs erix-bg-[#15151f] erix-border-[#2e2e3e] erix-text-slate-200 placeholder:erix-text-slate-600 focus-visible:erix-ring-1 focus-visible:erix-ring-violet-500";
  const darkSelect = "erix-h-7 erix-text-xs erix-bg-[#15151f] erix-border-[#2e2e3e] erix-text-slate-200 focus:erix-ring-violet-500";
  const darkLabel = "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-slate-500";

  return (
    <div
      className={cn(
        "erix-rounded-lg erix-overflow-hidden erix-transition-all",
        dark
          ? cn(
              "erix-border",
              expanded ? "erix-border-violet-500/40" : "erix-border-[#2e2e3e]",
            )
          : cn("erix-border erix-border-border", expanded && "erix-ring-1 erix-ring-primary/20"),
      )}
      role="group"
      aria-label={`Variable mapping: {{${varName}}}`}
    >
      {/* Header button */}
      <button
        type="button"
        className={cn(
          "erix-w-full erix-flex erix-items-center erix-gap-2 erix-px-3 erix-py-2.5 erix-text-left erix-transition-colors erix-cursor-pointer erix-border-0",
          dark
            ? "erix-bg-[#1a1a2a] hover:erix-bg-white/5"
            : "erix-bg-background hover:erix-bg-muted/50",
        )}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown
            className={cn("erix-h-3 erix-w-3 erix-shrink-0", dark ? "erix-text-slate-500" : "erix-text-muted-foreground")}
          />
        ) : (
          <ChevronRight
            className={cn("erix-h-3 erix-w-3 erix-shrink-0", dark ? "erix-text-slate-500" : "erix-text-muted-foreground")}
          />
        )}

        <span
          className={cn(
            "erix-flex-1 erix-font-mono erix-text-[11px] erix-font-semibold erix-truncate",
            dark ? "erix-text-violet-400" : "erix-text-primary",
          )}
        >
          {`{{${varName}}}`}
        </span>

        <span
          className={cn(
            "erix-flex erix-items-center erix-gap-1 erix-text-[10px] erix-font-medium erix-shrink-0",
            dark ? SOURCE_COLORS[mapping.source] : "erix-text-muted-foreground",
          )}
        >
          <SourceIcon className="erix-h-3 erix-w-3" aria-hidden="true" />
          <span className="erix-hidden sm:erix-inline">{SOURCE_LABELS[mapping.source]}</span>
        </span>
      </button>

      {/* Expanded controls */}
      {expanded && (
        <div
          className={cn(
            "erix-space-y-3 erix-px-3 erix-py-3 erix-border-t",
            dark ? "erix-bg-[#15151f] erix-border-[#2e2e3e]" : "erix-bg-muted/10 erix-border-border/50",
          )}
        >
          {/* Label */}
          <div className="erix-grid erix-gap-1">
            <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
              Display Label
            </span>
            <Input
              id={`vm-label-${varName}`}
              type="text"
              value={mapping.label}
              onChange={(e) => onChange({ ...mapping, label: e.target.value })}
              className={dark ? darkInput : "erix-h-7 erix-text-xs"}
              placeholder="e.g. First Name"
            />
          </div>

          {/* Source */}
          <div className="erix-grid erix-gap-1">
            <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
              Value Source
            </span>
            <Select
              value={mapping.source}
              onValueChange={(v) =>
                onChange({
                  ...mapping,
                  source: v as VariableSource,
                  collection: undefined,
                  field: undefined,
                  staticValue: undefined,
                })
              }
            >
              <SelectTrigger id={`vm-source-${varName}`} className={dark ? darkSelect : "erix-h-7 erix-text-xs"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crm">CRM Field</SelectItem>
                <SelectItem value="custom">Static Value</SelectItem>
                <SelectItem value="ai">AI Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CRM: collection + field */}
          {mapping.source === "crm" && (
            <>
              <div className="erix-grid erix-gap-1">
                <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
                  Collection
                </span>
                <Select
                  value={mapping.collection ?? ""}
                  onValueChange={handleCollectionChange}
                >
                  <SelectTrigger id={`vm-collection-${varName}`} className={dark ? darkSelect : "erix-h-7 erix-text-xs"}>
                    <SelectValue placeholder="Select collection…" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections?.filter(Boolean).map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mapping.collection && (
                <div className="erix-grid erix-gap-1">
                  <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
                    Field
                  </span>
                  {availableFields === null ? (
                    <div className={cn("erix-flex erix-items-center erix-gap-1.5 erix-text-[10px] erix-px-2 erix-py-1.5 erix-rounded", dark ? "erix-text-slate-500 erix-bg-white/5" : "erix-text-muted-foreground erix-bg-muted/30")}>
                      <Loader2 className="erix-h-3 erix-w-3 erix-animate-spin" />
                      Loading fields…
                    </div>
                  ) : availableFields.length === 0 ? (
                    <p className={cn("erix-text-[10px] erix-italic", dark ? "erix-text-slate-600" : "erix-text-muted-foreground")}>
                      No fields found.
                    </p>
                  ) : (
                    <Select
                      value={mapping.field ?? ""}
                      onValueChange={(v) => onChange({ ...mapping, field: v })}
                    >
                      <SelectTrigger id={`vm-field-${varName}`} className={dark ? darkSelect : "erix-h-7 erix-text-xs"}>
                        <SelectValue placeholder="Select field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.filter(Boolean).map((f) => (
                          <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </>
          )}

          {/* Custom: static value */}
          {mapping.source === "custom" && (
            <div className="erix-grid erix-gap-1">
              <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
                Static Value
              </span>
              <Input
                id={`vm-static-${varName}`}
                type="text"
                value={mapping.staticValue ?? ""}
                onChange={(e) => onChange({ ...mapping, staticValue: e.target.value })}
                className={dark ? darkInput : "erix-h-7 erix-text-xs"}
                placeholder="The hardcoded value"
              />
            </div>
          )}

          {/* AI: info */}
          {mapping.source === "ai" && (
            <div className={cn("erix-rounded erix-p-2.5 erix-flex erix-items-center erix-gap-2 erix-text-[10px]", dark ? "erix-bg-violet-500/10 erix-border erix-border-violet-500/20 erix-text-violet-400" : "erix-bg-violet-500/5 erix-border erix-border-violet-500/20 erix-text-violet-600")}>
              <Sparkles className="erix-h-3 erix-w-3 erix-shrink-0" />
              AI-generated values are resolved at send-time.
            </div>
          )}

          {/* Fallback */}
          <div className="erix-grid erix-gap-1">
            <span className={dark ? darkLabel : "erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground"}>
              Fallback (Optional)
            </span>
            <Input
              id={`vm-fallback-${varName}`}
              type="text"
              value={mapping.fallback ?? ""}
              onChange={(e) => onChange({ ...mapping, fallback: e.target.value })}
              className={dark ? darkInput : "erix-h-7 erix-text-xs"}
              placeholder="e.g. there"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VariablePalette({
  htmlBody,
  subject,
  preheader,
  mappings,
  onMappingsChange,
  className = "",
  dark,
}: VariablePaletteProps) {
  const { detectedVars, collections, fieldsByCollection, loading, loadFields } =
    useEmailVariables(htmlBody, subject, preheader);

  const mappingMap = React.useMemo<Record<string, VariableMapping>>(() => {
    const map: Record<string, VariableMapping> = {};
    for (const m of mappings) map[m.originalIndex] = m;
    return map;
  }, [mappings]);

  const normalizedMappings = React.useMemo<Record<string, VariableMapping>>(() => {
    const result = { ...mappingMap };
    detectedVars.forEach((varName, idx) => {
      if (!result[varName]) {
        result[varName] = {
          position: idx + 1,
          label: varName.replace(/_/g, " ").toUpperCase(),
          originalIndex: varName,
          source: "crm",
          collection: "leads",
        };
      }
    });
    return result;
  }, [detectedVars, mappingMap]);

  const handleRowChange = React.useCallback(
    (updated: VariableMapping) => {
      const next = { ...normalizedMappings, [updated.originalIndex]: updated };
      onMappingsChange(
        detectedVars.map((v, i) => ({
          ...(next[v] ?? {
            position: i + 1,
            label: v.toUpperCase(),
            originalIndex: v,
            source: "crm" as VariableSource,
            collection: "leads",
          }),
          position: i + 1,
        })),
      );
    },
    [normalizedMappings, detectedVars, onMappingsChange],
  );

  return (
    <aside
      className={cn("erix-flex erix-flex-col erix-gap-3", className)}
      aria-label="Variable mapping palette"
    >
      {/* Header */}
      <div className="erix-flex erix-items-center erix-justify-between">
        <div className="erix-flex erix-items-center erix-gap-2">
          <Variable
            className={cn("erix-h-3.5 erix-w-3.5", dark ? "erix-text-violet-400" : "erix-text-muted-foreground")}
          />
          <span className={cn("erix-text-xs erix-font-semibold", dark ? "erix-text-slate-300" : "erix-text-foreground")}>
            Variables
          </span>
          {detectedVars.length > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "erix-h-4 erix-px-1.5 erix-text-[9px] erix-font-bold",
                dark && "erix-bg-violet-600/30 erix-text-violet-300 erix-border-violet-500/30",
              )}
            >
              {detectedVars.length}
            </Badge>
          )}
        </div>
        {loading && (
          <Loader2
            className={cn("erix-h-3.5 erix-w-3.5 erix-animate-spin", dark ? "erix-text-slate-500" : "erix-text-muted-foreground")}
          />
        )}
      </div>

      <ScrollArea className="erix-flex-1">
        {detectedVars.length === 0 ? (
          <div
            className={cn(
              "erix-flex erix-flex-col erix-items-center erix-gap-3 erix-rounded-lg erix-border erix-border-dashed erix-p-8 erix-text-center",
              dark ? "erix-border-[#2e2e3e] erix-text-slate-500" : "erix-border-border erix-text-muted-foreground",
            )}
          >
            <Variable className="erix-h-7 erix-w-7 erix-opacity-20" />
            <p className="erix-text-xs erix-leading-relaxed">
              No variables yet.
              <br />
              Type{" "}
              <code className={cn("erix-font-mono", dark ? "erix-text-violet-400" : "erix-text-primary")}>
                {"{{var}}"}
              </code>{" "}
              in the editor.
            </p>
          </div>
        ) : (
          <div className="erix-space-y-2 erix-pb-4">
            {detectedVars.map((varName) => {
              const mapping = normalizedMappings[varName];
              if (!mapping) return null;
              return (
                <MappingRow
                  key={varName}
                  varName={varName}
                  mapping={mapping}
                  collections={collections}
                  fieldsByCollection={fieldsByCollection}
                  onLoadFields={loadFields}
                  onChange={handleRowChange}
                  dark={dark}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {detectedVars.length > 0 && (
        <p className={cn("erix-text-[10px]", dark ? "erix-text-slate-600" : "erix-text-muted-foreground")}>
          Mappings are saved when you publish or use "Save" above.
        </p>
      )}
    </aside>
  );
}
