// src/notifications/types.ts
// Aligned with backend CRM notification.model.ts

/**
 * Matches backend `type` enum: "action_required" | "alert" | "info"
 * Used to categorise notifications for routing and icon display.
 */
export type ErixNotificationType = "action_required" | "alert" | "info";

/**
 * Matches backend `status` enum: "unread" | "resolved" | "dismissed"
 * - "unread"    → new / unseen
 * - "resolved"  → retry succeeded
 * - "dismissed" → user dismissed
 */
export type ErixNotificationStatus = "unread" | "resolved" | "dismissed";

/**
 * Shape of a CRM notification document as returned by the backend.
 * Maps to: GET /api/crm/notifications
 */
export interface ErixNotification {
  _id: string;
  /** Alias for _id for convenience */
  id: string;
  clientCode: string;
  title: string;
  /** Backend field is "message" — aliased below too */
  message: string;
  type: ErixNotificationType;
  status: ErixNotificationStatus;
  actionData?: {
    leadId?: string;
    actionType?: string;
    actionConfig?: any;
    error?: string;
    contextSnapshot?: any;
  };
  createdAt: string;
  updatedAt?: string;
}
