"use client";
// src/devtools/ErixDevtools.tsx
// Developer panel — Router state, event log, permissions, connection status.
// Import from "@ecodrix/erix-react/devtools". Never renders in production builds.

import * as React from "react";
import { useErixRoute } from "@/routing/RouterContext";
import { useErixRealtime } from "@/realtime/useErixRealtime";
import { useErixPermission } from "@/permissions/useErixPermission";
import { useErixEvent } from "@/events/useErixEvent";

// Guard — render nothing in production
const IS_DEV = typeof process !== "undefined"
  ? (process as any).env?.NODE_ENV !== "production"
  : true;

interface EventLogEntry {
  id:        string;
  event:     string;
  payload:   unknown;
  timestamp: number;
}

const MAX_LOG = 50;

export function ErixDevtools() {
  const [open, setOpen]   = React.useState(false);
  const [tab, setTab]     = React.useState<"router" | "events" | "permissions" | "realtime">("router");
  const [log, setLog]     = React.useState<EventLogEntry[]>([]);

  const route             = useErixRoute();
  const realtime          = useErixRealtime();
  const { permissions, role } = useErixPermission();

  // Capture all events into the log
  useErixEvent("crm.lead.created", (p)   => appendLog("crm.lead.created", p));
  useErixEvent("crm.lead.updated", (p)   => appendLog("crm.lead.updated", p));
  useErixEvent("wa.message.sent", (p)    => appendLog("wa.message.sent", p));
  useErixEvent("wa.message.received", (p)=> appendLog("wa.message.received", p));
  useErixEvent("meet.scheduled", (p)     => appendLog("meet.scheduled", p));

  function appendLog(event: string, payload: unknown) {
    setLog((prev) => {
      const entry: EventLogEntry = { id: Math.random().toString(36).slice(2), event, payload, timestamp: Date.now() };
      return [entry, ...prev].slice(0, MAX_LOG);
    });
  }

  if (!IS_DEV) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 99999,
          background: "#6366f1", color: "#fff", border: "none",
          borderRadius: 8, padding: "6px 12px", fontSize: 12,
          fontFamily: "monospace", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.3)",
        }}
      >
        ⚡ Erix DevTools
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: 56, right: 16, zIndex: 99998,
          width: 420, maxHeight: 520, overflow: "hidden",
          background: "#0f172a", color: "#e2e8f0",
          borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 14px", background: "#1e293b", display: "flex", gap: 8 }}>
            {(["router", "events", "permissions", "realtime"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "#6366f1" : "transparent",
                  color: tab === t ? "#fff" : "#94a3b8",
                  border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                  fontSize: 11, textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
            <button type="button" onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
            {tab === "router" && (
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(route, null, 2)}
              </pre>
            )}

            {tab === "realtime" && (
              <div>
                <Row label="Status" value={realtime.status} />
                <Row label="Connected" value={String(realtime.isConnected)} />
              </div>
            )}

            {tab === "permissions" && (
              <div>
                <Row label="Role" value={role} />
                <div style={{ marginTop: 8, color: "#94a3b8" }}>Permissions ({permissions.size}):</div>
                {[...permissions].map((p) => (
                  <div key={p} style={{ color: "#86efac", padding: "1px 0" }}>✓ {p}</div>
                ))}
              </div>
            )}

            {tab === "events" && (
              <div>
                {log.length === 0 && <div style={{ color: "#64748b" }}>No events yet.</div>}
                {log.map((entry) => (
                  <div key={entry.id} style={{ borderBottom: "1px solid #1e293b", paddingBottom: 6, marginBottom: 6 }}>
                    <div style={{ color: "#818cf8" }}>{entry.event} <span style={{ color: "#64748b" }}>{new Date(entry.timestamp).toLocaleTimeString()}</span></div>
                    <pre style={{ margin: 0, color: "#94a3b8", fontSize: 10, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "2px 0" }}>
      <span style={{ color: "#64748b", minWidth: 80 }}>{label}:</span>
      <span style={{ color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}
