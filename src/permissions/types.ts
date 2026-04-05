// src/permissions/types.ts

/** All granular permissions in the Erix platform. */
export type ErixPermission =
  // CRM
  | "crm.leads.view"
  | "crm.leads.create"
  | "crm.leads.edit"
  | "crm.leads.delete"
  | "crm.leads.export"
  | "crm.pipelines.view"
  | "crm.pipelines.manage"
  | "crm.analytics.view"
  // WhatsApp
  | "whatsapp.conversations.view"
  | "whatsapp.messages.send"
  | "whatsapp.templates.view"
  | "whatsapp.templates.manage"
  | "whatsapp.broadcasts.send"
  // Meetings
  | "meetings.view"
  | "meetings.schedule"
  | "meetings.cancel"
  // Marketing
  | "marketing.campaigns.view"
  | "marketing.campaigns.manage"
  // Admin
  | "admin.settings"
  | "admin.users"
  | "admin.billing";

/** Predefined convenience role presets. Pass `permissions` to override individually. */
export type ErixRolePreset = "admin" | "agent" | "viewer" | "custom";

export const ROLE_PERMISSION_MAP: Record<ErixRolePreset, ErixPermission[]> = {
  admin: [
    "crm.leads.view", "crm.leads.create", "crm.leads.edit", "crm.leads.delete", "crm.leads.export",
    "crm.pipelines.view", "crm.pipelines.manage", "crm.analytics.view",
    "whatsapp.conversations.view", "whatsapp.messages.send", "whatsapp.templates.view",
    "whatsapp.templates.manage", "whatsapp.broadcasts.send",
    "meetings.view", "meetings.schedule", "meetings.cancel",
    "marketing.campaigns.view", "marketing.campaigns.manage",
    "admin.settings", "admin.users", "admin.billing",
  ],
  agent: [
    "crm.leads.view", "crm.leads.create", "crm.leads.edit",
    "crm.pipelines.view", "crm.analytics.view",
    "whatsapp.conversations.view", "whatsapp.messages.send", "whatsapp.templates.view",
    "meetings.view", "meetings.schedule",
    "marketing.campaigns.view",
  ],
  viewer: [
    "crm.leads.view", "crm.pipelines.view", "crm.analytics.view",
    "whatsapp.conversations.view", "whatsapp.templates.view",
    "meetings.view",
    "marketing.campaigns.view",
  ],
  custom: [],
};
