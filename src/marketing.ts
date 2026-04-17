// Re-export WhatsApp Broadcasts for Marketing UI
export * from "./components/whatsapp/WhatsAppBroadcast";
export * from "./hooks/whatsapp/useMarketingCampaigns";

// ─── Email Template Builder ────────────────────────────────────────────────────
// Components
export * from "./components/email";

// Hooks
export { useEmailTemplates, useEmailTemplate } from "./hooks/email/useEmailTemplates";
export { useEmailTemplateSync } from "./hooks/email/useEmailTemplateSync";
export { useEmailVariables } from "./hooks/email/useEmailVariables";

// Types
export type {
  IEmailTemplate,
  VariableMapping,
  EmailTemplatePayload,
  EmailTemplateFilters,
  EmailTemplateCategory,
  EmailTemplateStatus,
  EmailTemplateType,
  VariableSource,
  SyncStatusValue,
  EmailPreviewResult,
  CuratedMappingConfig,
} from "./types/email";
