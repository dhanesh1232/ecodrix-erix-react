"use client";
// src/events/useErixEmit.ts — Emit typed bus events
import * as React from "react";
import { useEventBus } from "./EventBusContext";
import type { ErixEventMap, ErixEventName } from "./types";

/**
 * Returns a stable `emit` function for publishing typed events to the bus.
 *
 * @example
 * ```tsx
 * const emit = useErixEmit();
 *
 * const create = async (data) => {
 *   const lead = await sdk.crm.leads.create(data);
 *   emit("crm.lead.created", { lead });   // notifies other modules
 * };
 * ```
 */
export function useErixEmit() {
  const bus = useEventBus();
  return React.useCallback(
    <K extends ErixEventName>(event: K, payload: ErixEventMap[K]) =>
      bus.emit(event, payload),
    [bus],
  );
}
