"use client";
// src/events/EventBusContext.tsx — Lightweight, typed in-process event bus
import * as React from "react";
import type { ErixEventMap, ErixEventName, ErixEventHandler } from "./types";

// ── Internal event bus (non-React, singleton per provider) ───────────────────
class EventBus {
  private readonly listeners = new Map<string, Set<(...args: any[]) => void>>();

  on<K extends ErixEventName>(
    event: K,
    handler: ErixEventHandler<K>,
  ): () => void {
    const key = String(event);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(handler as any);
    return () => this.off(event, handler);
  }

  off<K extends ErixEventName>(event: K, handler: ErixEventHandler<K>): void {
    this.listeners.get(String(event))?.delete(handler as any);
  }

  emit<K extends ErixEventName>(event: K, payload: ErixEventMap[K]): void {
    this.listeners.get(String(event))?.forEach((h) => {
      try {
        h(payload);
      } catch (err) {
        console.error(
          `[ErixEventBus] Handler error for "${String(event)}":`,
          err,
        );
      }
    });
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const EventBusCtx = React.createContext<EventBus | null>(null);

export function useEventBus(): EventBus {
  const ctx = React.useContext(EventBusCtx);
  if (!ctx) throw new Error("useErixEvent must be inside ErixProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ErixEventBusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single stable instance per provider mount
  const bus = React.useRef(new EventBus()).current;
  return <EventBusCtx.Provider value={bus}>{children}</EventBusCtx.Provider>;
}
