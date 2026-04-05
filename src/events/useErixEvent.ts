"use client";
// src/events/useErixEvent.ts — Subscribe to a typed bus event
import * as React from "react";
import { useEventBus } from "./EventBusContext";
import type { ErixEventMap, ErixEventName, ErixEventHandler } from "./types";

/**
 * Subscribe to a platform event emitted anywhere within the ErixProvider tree.
 * The handler is automatically cleaned up when the component unmounts.
 *
 * @example
 * ```tsx
 * useErixEvent("crm.lead.created", (payload) => {
 *   setLeads((prev) => [payload.lead, ...prev]);
 * });
 *
 * useErixEvent("wa.message.received", ({ conversationId, message }) => {
 *   if (conversationId === activeId) appendMessage(message);
 * });
 * ```
 */
export function useErixEvent<K extends ErixEventName>(
  event:   K,
  handler: ErixEventHandler<K>,
): void {
  const bus = useEventBus();
  // Stable ref so the effect doesn't re-subscribe on every render
  const handlerRef = React.useRef(handler);
  React.useLayoutEffect(() => { handlerRef.current = handler; });

  React.useEffect(() => {
    return bus.on(event, (...args: Parameters<ErixEventHandler<K>>) =>
      handlerRef.current(...args),
    );
  }, [bus, event]);
}
