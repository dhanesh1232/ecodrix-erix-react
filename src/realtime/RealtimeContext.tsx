"use client";
// src/realtime/RealtimeContext.tsx
// Bridges the Ecodrix SDK's built-in Socket.io connection to React hooks.
import * as React from "react";
import { useErix } from "@/context/ErixProvider";
import { useEventBus } from "@/events/EventBusContext";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface RealtimeContextValue {
  status: ConnectionStatus;
  /** Whether the socket is currently connected. */
  isConnected: boolean;
}

const RealtimeCtx = React.createContext<RealtimeContextValue | null>(null);

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = React.useContext(RealtimeCtx);
  if (!ctx) throw new Error("useErixRealtime must be inside ErixProvider");
  return ctx;
}

/**
 * Internal provider: wires the SDK socket to the React event bus.
 * Mounted automatically by ErixProvider — consumers do not need to add this.
 */
export function ErixRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { sdk } = useErix();
  const bus     = useEventBus();
  const [status, setStatus] = React.useState<ConnectionStatus>("connecting");

  React.useEffect(() => {
    // ── Wire SDK socket events → internal event bus ─────────────────────────
    const handlers: Array<{ event: string; fn: (...args: any[]) => void }> = [
      // Connection lifecycle
      { event: "connect",    fn: () => setStatus("connected") },
      { event: "disconnect", fn: () => setStatus("disconnected") },
      { event: "connect_error", fn: () => setStatus("error") },

      // WhatsApp
      {
        event: "whatsapp.message_received",
        fn: (data: any) => bus.emit("wa.message.received", { conversationId: data.conversationId, message: data }),
      },
      {
        event: "whatsapp.message_sent",
        fn: (data: any) => bus.emit("wa.message.sent", { conversationId: data.conversationId, message: data }),
      },

      // CRM
      {
        event: "crm.lead_created",
        fn: (data: any) => bus.emit("crm.lead.created", { lead: data }),
      },
      {
        event: "crm.lead_updated",
        fn: (data: any) => bus.emit("crm.lead.updated", { leadId: data._id ?? data.leadId, changes: data }),
      },

      // Meetings
      {
        event: "meet.scheduled",
        fn: (data: any) => bus.emit("meet.scheduled", { meeting: data }),
      },
    ];

    for (const { event, fn } of handlers) {
      sdk.on(event, fn);
    }

    // SDK socket is managed by the Ecodrix client lifecycle (disconnected on sdk change)
    return () => {
      // No off() API on Ecodrix — the socket is cleaned up when sdk changes
      // (see ErixProvider: useEffect(() => () => sdk.disconnect(), [sdk]))
    };
  }, [sdk, bus]);

  const value = React.useMemo<RealtimeContextValue>(
    () => ({ status, isConnected: status === "connected" }),
    [status],
  );

  return (
    <RealtimeCtx.Provider value={value}>
      {children}
    </RealtimeCtx.Provider>
  );
}
