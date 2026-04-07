// src/events/types.ts
// Typed event bus for cross-module communication within the Erix SDK.

/** All events emittable within the Erix platform. */
export interface ErixEventMap {
  // CRM
  "crm.lead.created":    { lead: any };
  "crm.lead.updated":    { leadId: string; changes: Record<string, any> };
  "crm.lead.deleted":    { leadId: string };
  "crm.lead.moved":      { leadId: string; stageId: string };
  "crm.lead.converted":  { leadId: string; outcome: "won" | "lost" };
  // WhatsApp
  "wa.message.sent":      { conversationId: string; message: any };
  "wa.message.received":  { conversationId: string; message: any };
  "wa.conversation.read": { conversationId: string };
  // Meetings
  "meet.scheduled":  { meeting: any };
  "meet.cancelled":  { meetingId: string };
  "meet.rescheduled":{ meetingId: string; startTime: string; endTime: string };
  // Command Palette
  "cmd_palette.toggle":   void | undefined;
  "cmd_palette.open":     void | undefined;
  "cmd_palette.close":    void | undefined;

  // Generic / escape-hatch
  [key: string]: unknown;
}

export type ErixEventName = keyof ErixEventMap;
export type ErixEventHandler<K extends ErixEventName> = (payload: ErixEventMap[K]) => void;
