"use client";
// src/realtime/useErixChannel.ts
// Subscribe to real-time updates for a specific entity (conversation, lead, etc.)
import { useErixEvent } from "@/events/useErixEvent";
import type { ErixEventName, ErixEventHandler, ErixEventMap } from "@/events/types";

/**
 * Subscribe to a specific real-time event channel.
 * Equivalent to `useErixEvent`, but semantically signals real-time intent.
 *
 * The handler receives the typed payload for the event.
 *
 * @example
 * ```tsx
 * // Auto-append inbound messages to the chat
 * useErixChannel("wa.message.received", ({ conversationId, message }) => {
 *   if (conversationId === activeConversationId) appendMessage(message);
 * });
 *
 * // React to lead stage changes in the Kanban board
 * useErixChannel("crm.lead.moved", ({ leadId, stageId }) => {
 *   moveCardOptimistically(leadId, stageId);
 * });
 * ```
 */
export function useErixChannel<K extends ErixEventName>(
  event:   K,
  handler: ErixEventHandler<K>,
): void {
  useErixEvent(event, handler);
}
