"use client";
// src/components/whatsapp/WhatsAppBroadcast.tsx
// 5-step wizard for sending a WhatsApp broadcast to a filtered lead segment.

import * as React from "react";
import { Check, ChevronRight, ChevronLeft, Loader2, Send } from "lucide-react";
import { useErixClient } from "@/context/ErixProvider";
import { useErixToast } from "@/toast/useErixToast";
import { useTemplates } from "@/hooks/whatsapp/useTemplates";

type Step = "audience" | "template" | "variables" | "schedule" | "review";

const STEPS: Step[] = [
  "audience",
  "template",
  "variables",
  "schedule",
  "review",
];
const STEP_LABELS: Record<Step, string> = {
  audience: "1. Audience",
  template: "2. Template",
  variables: "3. Variables",
  schedule: "4. Schedule",
  review: "5. Review & Send",
};

export interface WhatsAppBroadcastProps {
  /** Called after a successful broadcast launch */
  onSuccess?: (broadcastId: string) => void;
  /** Called when the user cancels */
  onCancel?: () => void;
}

export function WhatsAppBroadcast({
  onSuccess,
  onCancel,
}: WhatsAppBroadcastProps) {
  const sdk = useErixClient();
  const toast = useErixToast();
  const { templates } = useTemplates("APPROVED");

  const [step, setStep] = React.useState<Step>("audience");
  const [sending, setSending] = React.useState(false);

  // Wizard state
  const [audience, setAudience] = React.useState<{
    filter: string;
    estimatedCount: number;
  }>({ filter: "all", estimatedCount: 0 });
  const [template, setTemplate] = React.useState<string>("");
  const [variables, setVariables] = React.useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = React.useState<string>("");

  const currentIdx = STEPS.indexOf(step);

  const next = () => setStep(STEPS[currentIdx + 1]);
  const prev = () => setStep(STEPS[currentIdx - 1]);

  const send = React.useCallback(async () => {
    setSending(true);
    try {
      const res: any = await toast.promise(
        sdk.request("POST", "/api/saas/whatsapp/broadcasts", {
          templateName: template,
          variables,
          filter: audience.filter,
          scheduledAt: scheduledAt || undefined,
        }),
        {
          loading: "Launching broadcast…",
          success: "Broadcast scheduled!",
          error: (e) => `Failed: ${e.message}`,
        },
      );
      onSuccess?.(res?.data?._id ?? "");
    } finally {
      setSending(false);
    }
  }, [sdk, toast, template, variables, audience, scheduledAt, onSuccess]);

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 580, margin: "0 auto" }}>
      {/* Step tabs */}
      <div style={{ display: "erix-flex", gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < currentIdx && setStep(s)}
            style={{
              flex: 1,
              padding: "6px 4px",
              fontSize: 11,
              borderRadius: 6,
              border: "none",
              background:
                s === step ? "#6366f1" : i < currentIdx ? "#1e293b" : "#0f172a",
              color:
                s === step ? "#fff" : i < currentIdx ? "#94a3b8" : "#475569",
              cursor: i < currentIdx ? "pointer" : "default",
            }}
          >
            {i < currentIdx && <Check size={10} style={{ marginRight: 3 }} />}
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div
        style={{
          background: "#0f172a",
          borderRadius: 10,
          padding: 20,
          minHeight: 200,
        }}
      >
        {step === "audience" && (
          <AudienceStep value={audience} onChange={setAudience} sdk={sdk} />
        )}
        {step === "template" && (
          <TemplateStep
            templates={templates}
            selected={template}
            onSelect={setTemplate}
          />
        )}
        {step === "variables" && (
          <VariablesStep
            template={template}
            templates={templates}
            values={variables}
            onChange={setVariables}
          />
        )}
        {step === "schedule" && (
          <ScheduleStep value={scheduledAt} onChange={setScheduledAt} />
        )}
        {step === "review" && (
          <ReviewStep
            audience={audience}
            template={template}
            variables={variables}
            scheduledAt={scheduledAt}
          />
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "erix-flex",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={currentIdx === 0 ? onCancel : prev}
          style={{
            display: "erix-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "#1e293b",
            border: "none",
            borderRadius: 8,
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <ChevronLeft size={14} /> {currentIdx === 0 ? "Cancel" : "Back"}
        </button>

        {step !== "review" ? (
          <button
            type="button"
            onClick={next}
            disabled={step === "template" && !template}
            style={{
              display: "erix-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#6366f1",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={sending}
            style={{
              display: "erix-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#22c55e",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {sending ? (
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Sending…" : "Launch Broadcast"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────────
function AudienceStep({ value, onChange, sdk }: any) {
  const [estimating, setEstimating] = React.useState(false);
  const estimate = async (filter: string) => {
    setEstimating(true);
    try {
      const res: any = await sdk.crm.leads.list({
        status: filter === "all" ? undefined : filter,
        limit: 1,
      });
      onChange({ filter, estimatedCount: res?.pagination?.total ?? 0 });
    } finally {
      setEstimating(false);
    }
  };
  return (
    <div>
      <Label>Target audience</Label>
      {[
        { label: "All active leads", value: "all" },
        { label: "Hot leads (score ≥ 70)", value: "hot" },
        { label: "New leads (last 7 days)", value: "new" },
      ].map((opt) => (
        <label
          key={opt.value}
          style={{
            display: "erix-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 0",
            cursor: "pointer",
            color: "#e2e8f0",
            fontSize: 13,
          }}
        >
          <input
            type="radio"
            value={opt.value}
            checked={value.filter === opt.value}
            onChange={() => estimate(opt.value)}
          />
          {opt.label}
        </label>
      ))}
      {estimating && <small style={{ color: "#64748b" }}>Counting…</small>}
      {!estimating && value.estimatedCount > 0 && (
        <div style={{ marginTop: 8, color: "#6366f1", fontSize: 13 }}>
          ≈ {value.estimatedCount} recipients
        </div>
      )}
    </div>
  );
}

function TemplateStep({ templates, selected, onSelect }: any) {
  return (
    <div>
      <Label>Select an approved template</Label>
      <div
        style={{
          display: "erix-flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 250,
          overflowY: "auto",
        }}
      >
        {templates.map((t: any) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onSelect(t.name)}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 8,
              border:
                selected === t.name ? "1px solid #6366f1" : "1px solid #1e293b",
              background: selected === t.name ? "#1e293b" : "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <strong>{t.name}</strong>
            {t.category && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "#6366f1" }}>
                {t.category}
              </span>
            )}
          </button>
        ))}
        {templates.length === 0 && (
          <div style={{ color: "#64748b" }}>No approved templates found.</div>
        )}
      </div>
    </div>
  );
}

function VariablesStep({ template, templates, values, onChange }: any) {
  const tpl = templates.find((t: any) => t.name === template);
  const count = tpl?.variableCount ?? 0;
  return (
    <div>
      <Label>
        Fill in template variables (
        {count > 0 ? `${count} required` : "none required"})
      </Label>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: "#64748b" }}>
            Variable {i + 1}
          </label>
          <input
            value={values[i] ?? ""}
            onChange={(e) => {
              const v = [...values];
              v[i] = e.target.value;
              onChange(v);
            }}
            placeholder={`{{${i + 1}}}`}
            style={{
              width: "100%",
              padding: "8px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#e2e8f0",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>
      ))}
      {count === 0 && (
        <p style={{ color: "#64748b", fontSize: 13 }}>
          This template has no variables.
        </p>
      )}
    </div>
  );
}

function ScheduleStep({ value, onChange }: any) {
  return (
    <div>
      <Label>Schedule (optional)</Label>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
        Leave empty to send immediately.
      </p>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 10px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 6,
          color: "#e2e8f0",
          fontSize: 13,
        }}
      />
    </div>
  );
}

function ReviewStep({ audience, template, variables, scheduledAt }: any) {
  return (
    <div style={{ fontSize: 13 }}>
      <Label>Review before launch</Label>
      <Row label="Audience" value={audience.filter} />
      <Row label="Est. recipients" value={String(audience.estimatedCount)} />
      <Row label="Template" value={template || "—"} />
      <Row label="Variables" value={variables.join(", ") || "none"} />
      <Row label="Send at" value={scheduledAt || "Immediately"} />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 600,
        color: "#94a3b8",
        fontSize: 12,
        textTransform: "erix-uppercase",
        letterSpacing: 1,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "erix-flex",
        gap: 8,
        padding: "4px 0",
        borderBottom: "1px solid #1e293b",
      }}
    >
      <span style={{ color: "#64748b", width: 120, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{ color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}
