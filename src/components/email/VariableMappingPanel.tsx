"use client";
// src/components/email/VariableMappingPanel.tsx
// Full variable mapping panel wired to the real backend.
//   - Auto-extracts {{varName}} tokens from htmlBody + subject + preheader
//   - Fetches CRM collections and fields from the backend
//   - Saves mappings via PUT /:id/mapping
//   - Live preview via POST /:id/preview

import * as React from "react";
import { Check, ChevronDown, Database, Link2, Loader2, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmailTemplateApi, unwrap } from "@/lib/emailTemplateClient";
import type { CuratedMappingConfig, IEmailTemplate, VariableMapping, VariableSource } from "@/types/email";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVars(htmlBody: string, subject: string, preheader = ""): string[] {
  const re = /\{\{([^}]+)\}\}/g;
  const all = `${subject} ${preheader} ${htmlBody}`;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
  while ((m = re.exec(all)) !== null) tokens.push(m[1].trim());
  return [...new Set(tokens)];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface VariableMappingPanelProps {
  templateId: string | null;
  draft: Partial<IEmailTemplate>;
  onMappingsChange: (mappings: VariableMapping[]) => void;
  className?: string;
}

// ─── Source options ───────────────────────────────────────────────────────────

const SOURCE_OPTIONS: { value: VariableSource; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "crm", label: "CRM Field", icon: <Database className="erix-h-3 erix-w-3" />, color: "#60a5fa" },
  { value: "custom", label: "Static Value", icon: <Link2 className="erix-h-3 erix-w-3" />, color: "#4ade80" },
  { value: "ai", label: "AI Generated", icon: <Sparkles className="erix-h-3 erix-w-3" />, color: "#f59e0b" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function VariableMappingPanel({
  templateId,
  draft,
  onMappingsChange,
  className = "",
}: VariableMappingPanelProps) {
  const { base, headers } = useEmailTemplateApi();

  // ── State ────────────────────────────────────────────────────────────────
  const [mappings, setMappings] = React.useState<VariableMapping[]>([]);
  const [curatedConfig, setCuratedConfig] = React.useState<CuratedMappingConfig>({});
  const [collectionFields, setCollectionFields] = React.useState<Record<string, { path: string; label: string }[]>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loadingConfig, setLoadingConfig] = React.useState(false);

  // ── Extract variables ────────────────────────────────────────────────────
  const tokens = React.useMemo(
    () => extractVars(draft.htmlBody ?? "", draft.subject ?? "", draft.preheader ?? ""),
    [draft.htmlBody, draft.subject, draft.preheader],
  );

  // ── Sync mappings from draft + tokens ───────────────────────────────────
  React.useEffect(() => {
    const existing = draft.variableMapping ?? [];
    const next: VariableMapping[] = tokens.map((token, idx) => {
      const found = existing.find((m) => m.originalIndex === token);
      return found ?? {
        position: idx + 1,
        label: token.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        originalIndex: token,
        source: "crm" as VariableSource,
        collection: "leads",
        field: "",
        fallback: "",
      };
    });
    setMappings(next);
  }, [tokens, draft.variableMapping]);

  // ── Load curated mapping config ──────────────────────────────────────────
  React.useEffect(() => {
    setLoadingConfig(true);
    fetch(`${base}/mapping/config`, { headers })
      .then((r) => unwrap<CuratedMappingConfig>(r))
      .then(setCuratedConfig)
      .catch(() => {
        // Fallback minimal config
        setCuratedConfig({
          leads: {
            label: "Leads",
            fields: [
              { path: "firstName", label: "First Name" },
              { path: "lastName", label: "Last Name" },
              { path: "email", label: "Email" },
              { path: "phone", label: "Phone" },
              { path: "status", label: "Status" },
              { path: "dealValue", label: "Deal Value" },
              { path: "source", label: "Source" },
            ],
          },
        });
      })
      .finally(() => setLoadingConfig(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  // ── Load fields for a collection ─────────────────────────────────────────
  const loadCollectionFields = React.useCallback(
    async (collectionName: string) => {
      if (collectionFields[collectionName] || !collectionName) return;

      // Try curated first
      if (curatedConfig[collectionName]) {
        setCollectionFields((prev) => ({
          ...prev,
          [collectionName]: curatedConfig[collectionName].fields,
        }));
        return;
      }

      try {
        const res = await fetch(`${base}/collections/${collectionName}/fields`, { headers });
        const data = await unwrap<{ path: string; label: string }[]>(res);
        setCollectionFields((prev) => ({ ...prev, [collectionName]: data }));
      } catch {
        // silently fail, user still sees curated config
      }
    },
    [base, headers, collectionFields, curatedConfig],
  );

  // ── Update a single mapping field ────────────────────────────────────────
  const updateMapping = React.useCallback(
    (originalIndex: string, patch: Partial<VariableMapping>) => {
      setMappings((prev) => {
        const next = prev.map((m) =>
          m.originalIndex === originalIndex ? { ...m, ...patch } : m,
        );
        onMappingsChange(next);
        return next;
      });
      setSaved(false);
    },
    [onMappingsChange],
  );

  // ── Save mappings to backend ──────────────────────────────────────────────
  const saveMappings = React.useCallback(async () => {
    if (!templateId) return;
    setSaving(true);
    try {
      await fetch(`${base}/${templateId}/mapping`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ mappings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // noop — user sees no change
    } finally {
      setSaving(false);
    }
  }, [base, headers, templateId, mappings]);

  // ── Available collections ─────────────────────────────────────────────────
  const collectionNames = Object.keys(curatedConfig).length > 0
    ? Object.entries(curatedConfig).map(([k, v]) => ({ value: k, label: v.label }))
    : [
        { value: "leads", label: "Leads" },
        { value: "orders", label: "Orders" },
        { value: "meetings", label: "Meetings" },
      ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("erix-flex erix-flex-col erix-h-full erix-overflow-hidden", className)}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        className="erix-flex erix-shrink-0 erix-items-center erix-justify-between erix-px-4 erix-border-b"
        style={{ height: "44px", background: "#1a1a2a", borderColor: "#2e2e3e" }}
      >
        <div className="erix-flex erix-items-center erix-gap-2">
          <Database className="erix-h-3.5 erix-w-3.5" style={{ color: "#7c3aed" }} />
          <span className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-widest" style={{ color: "#94a3b8" }}>
            Variable Mapping
          </span>
          {tokens.length > 0 && (
            <span
              className="erix-text-[10px] erix-font-bold erix-px-1.5 erix-py-0.5 erix-rounded-full"
              style={{ background: "rgba(124,58,237,.2)", color: "#a78bfa" }}
            >
              {tokens.length}
            </span>
          )}
        </div>

        {templateId && mappings.length > 0 && (
          <button
            type="button"
            onClick={saveMappings}
            disabled={saving}
            className="erix-flex erix-items-center erix-gap-1.5 erix-px-3 erix-py-1 erix-rounded erix-text-[11px] erix-font-semibold erix-transition-all erix-cursor-pointer erix-border-0"
            style={{
              background: saved ? "rgba(74,222,128,.15)" : "rgba(124,58,237,.2)",
              color: saved ? "#4ade80" : "#a78bfa",
            }}
          >
            {saving ? (
              <Loader2 className="erix-h-3 erix-w-3 erix-animate-spin" />
            ) : saved ? (
              <Check className="erix-h-3 erix-w-3" />
            ) : (
              <Save className="erix-h-3 erix-w-3" />
            )}
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="erix-flex-1 erix-overflow-y-auto erix-py-2" style={{ background: "#21212f" }}>
        {loadingConfig && (
          <div className="erix-flex erix-items-center erix-gap-2 erix-px-4 erix-py-3">
            <Loader2 className="erix-h-3.5 erix-w-3.5 erix-animate-spin" style={{ color: "#7c3aed" }} />
            <span className="erix-text-xs" style={{ color: "#64748b" }}>Loading CRM config…</span>
          </div>
        )}

        {tokens.length === 0 && !loadingConfig && (
          <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-py-12 erix-px-6 erix-text-center">
            <div
              className="erix-w-12 erix-h-12 erix-rounded-full erix-flex erix-items-center erix-justify-center"
              style={{ background: "rgba(124,58,237,.1)" }}
            >
              <Database className="erix-h-5 erix-w-5" style={{ color: "#6d28d9" }} />
            </div>
            <p className="erix-text-sm erix-font-medium" style={{ color: "#64748b" }}>No variables yet</p>
            <p className="erix-text-xs erix-leading-relaxed" style={{ color: "#475569" }}>
              Type <code className="erix-px-1 erix-rounded" style={{ background: "rgba(124,58,237,.15)", color: "#a78bfa", fontFamily: "monospace" }}>{`{{varName}}`}</code> in the HTML editor or subject line
            </p>
          </div>
        )}

        {mappings.map((mapping) => (
          <MappingRow
            key={mapping.originalIndex}
            mapping={mapping}
            collectionNames={collectionNames}
            collectionFields={collectionFields}
            onLoadFields={loadCollectionFields}
            onChange={(patch) => updateMapping(mapping.originalIndex, patch)}
          />
        ))}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      {!templateId && mappings.length > 0 && (
        <div
          className="erix-flex erix-shrink-0 erix-items-center erix-gap-2 erix-px-4 erix-py-2 erix-border-t"
          style={{ borderColor: "#2e2e3e", background: "#1a1a2a" }}
        >
          <RefreshCw className="erix-h-3 erix-w-3" style={{ color: "#475569" }} />
          <span className="erix-text-[10px]" style={{ color: "#475569" }}>
            Save the template first to persist mappings
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Single mapping row ───────────────────────────────────────────────────────

interface MappingRowProps {
  mapping: VariableMapping;
  collectionNames: { value: string; label: string }[];
  collectionFields: Record<string, { path: string; label: string }[]>;
  onLoadFields: (name: string) => void;
  onChange: (patch: Partial<VariableMapping>) => void;
}

function MappingRow({ mapping, collectionNames, collectionFields, onLoadFields, onChange }: MappingRowProps) {
  const [open, setOpen] = React.useState(false);
  const fields = collectionFields[mapping.collection ?? "leads"] ?? [];

  const sourceInfo = SOURCE_OPTIONS.find((s) => s.value === mapping.source) ?? SOURCE_OPTIONS[0];

  return (
    <div
      className="erix-border-b erix-cursor-pointer"
      style={{ borderColor: "#2e2e3e" }}
    >
      {/* Row header / collapsed view */}
      <button
        type="button"
        className="erix-w-full erix-flex erix-items-center erix-gap-2 erix-px-4 erix-py-2.5 erix-text-left erix-bg-transparent erix-border-0"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && mapping.source === "crm") onLoadFields(mapping.collection ?? "leads");
        }}
      >
        {/* Token pill */}
        <span
          className="erix-flex-shrink-0 erix-text-[11px] erix-font-mono erix-font-semibold erix-px-2 erix-py-0.5 erix-rounded"
          style={{ background: "rgba(124,58,237,.15)", color: "#c4b5fd" }}
        >
          {`{{${mapping.originalIndex}}}`}
        </span>

        {/* Source badge */}
        <span
          className="erix-flex erix-items-center erix-gap-1 erix-text-[10px] erix-font-semibold erix-px-1.5 erix-py-0.5 erix-rounded"
          style={{ background: "rgba(0,0,0,.3)", color: sourceInfo.color }}
        >
          {sourceInfo.icon}
          {sourceInfo.label}
        </span>

        {/* Current mapping summary */}
        <span className="erix-flex-1 erix-min-w-0 erix-truncate erix-text-[11px]" style={{ color: "#64748b" }}>
          {mapping.source === "crm" && mapping.collection && mapping.field
            ? `${mapping.collection}.${mapping.field}`
            : mapping.source === "custom" && mapping.staticValue
              ? `"${mapping.staticValue}"`
              : mapping.source === "ai"
                ? "AI generated"
                : "unconfigured"}
        </span>

        {/* Expand/collapse */}
        <ChevronDown
          className={cn("erix-h-3.5 erix-w-3.5 erix-flex-shrink-0 erix-transition-transform", open && "erix-rotate-180")}
          style={{ color: "#475569" }}
        />
      </button>

      {/* Expanded config */}
      {open && (
        <div className="erix-px-4 erix-pb-4 erix-flex erix-flex-col erix-gap-2.5" style={{ background: "#1a1a2a" }}>
          {/* Source selector */}
          <div className="erix-flex erix-gap-1.5 erix-pt-1">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange({ source: opt.value });
                  if (opt.value === "crm") onLoadFields(mapping.collection ?? "leads");
                }}
                className={cn(
                  "erix-flex erix-items-center erix-gap-1 erix-px-2.5 erix-py-1 erix-rounded erix-text-[10px] erix-font-semibold erix-border erix-transition-all erix-cursor-pointer",
                )}
                style={{
                  background: mapping.source === opt.value ? "rgba(124,58,237,.2)" : "rgba(0,0,0,.3)",
                  borderColor: mapping.source === opt.value ? "#7c3aed" : "#2e2e3e",
                  color: mapping.source === opt.value ? opt.color : "#64748b",
                }}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* CRM source fields */}
          {mapping.source === "crm" && (
            <>
              <FieldLabel>Collection</FieldLabel>
              <DarkSelect
                value={mapping.collection ?? "leads"}
                onChange={(v) => {
                  onChange({ collection: v, field: "" });
                  onLoadFields(v);
                }}
                options={collectionNames}
              />

              <FieldLabel>Field</FieldLabel>
              <DarkSelect
                value={mapping.field ?? ""}
                onChange={(v) => onChange({ field: v })}
                options={[
                  { value: "", label: "— select field —" },
                  ...fields.map((f) => ({ value: f.path, label: f.label })),
                ]}
              />
            </>
          )}

          {/* Custom static value */}
          {mapping.source === "custom" && (
            <>
              <FieldLabel>Static Value</FieldLabel>
              <DarkInput
                value={mapping.staticValue ?? ""}
                onChange={(v) => onChange({ staticValue: v })}
                placeholder="e.g. Acme Inc."
              />
            </>
          )}

          {/* AI note */}
          {mapping.source === "ai" && (
            <p className="erix-text-[11px] erix-leading-relaxed" style={{ color: "#64748b" }}>
              AI generation is resolved at campaign send-time based on lead context.
            </p>
          )}

          {/* Fallback (always shown) */}
          <FieldLabel>Fallback (if empty)</FieldLabel>
          <DarkInput
            value={mapping.fallback ?? ""}
            onChange={(v) => onChange({ fallback: v })}
            placeholder="e.g. there"
          />
        </div>
      )}
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="erix-text-[9px] erix-font-bold erix-uppercase erix-tracking-widest erix-block"
      style={{ color: "#475569" }}
    >
      {children}
    </span>
  );
}

function DarkInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="erix-w-full erix-rounded erix-text-xs erix-px-2.5 erix-py-1.5 erix-border erix-outline-none"
      style={{
        background: "#0f0f1a",
        borderColor: "#2e2e3e",
        color: "#cbd5e1",
        fontFamily: "'Fira Code', monospace",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#7c3aed";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(124,58,237,.15)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#2e2e3e";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function DarkSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="erix-w-full erix-rounded erix-text-xs erix-px-2.5 erix-py-1.5 erix-border erix-outline-none erix-cursor-pointer"
      style={{
        background: "#0f0f1a",
        borderColor: "#2e2e3e",
        color: "#cbd5e1",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "28px",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#2e2e3e")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#1a1a2a" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
