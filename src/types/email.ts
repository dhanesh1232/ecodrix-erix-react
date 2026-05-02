// src/types/email.ts — Email Template Builder Type Definitions
// Mirrors the Mongoose EmailTemplateSchema in @ecodrix/backend

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmailTemplateCategory = "marketing" | "transactional" | "sequence";
export type EmailTemplateStatus = "draft" | "published" | "archived";
export type EmailTemplateType = "standard" | "layout";
export type VariableSource = "crm" | "custom" | "ai";
export type SyncStatusValue = "idle" | "saving" | "saved" | "error";

// ─── Core Models ──────────────────────────────────────────────────────────────

/**
 * A single variable mapping entry.
 * Describes how a {{varName}} token in the template body is resolved at send-time.
 */
export interface VariableMapping {
  /** 1-based positional index (used internally) */
  position: number;
  /** Human-readable label shown in the UI, e.g. "FIRST NAME" */
  label: string;
  /** The raw token key, e.g. "first_name" for {{first_name}} */
  originalIndex: string;
  /** Where the value comes from */
  source: VariableSource;
  /** CRM collection name, e.g. "leads", "orders" (source = 'crm') */
  collection?: string;
  /** Dot-path field within the collection, e.g. "name", "metadata.city" */
  field?: string;
  /** Static value override (source = 'custom') */
  staticValue?: string;
  /** Fallback if the resolved value is empty */
  fallback?: string;
}

/** Full email template document as returned by the API */
export interface IEmailTemplate {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody?: string;
  /**
   * Reserved for future block-based design editor.
   * Do not use in the current HTML-only MVP.
   */
  designJson?: unknown;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  type: EmailTemplateType;
  /** Reference to a layout template whose {{body}} slot wraps this template's htmlBody */
  layoutId?: string;
  thumbnail?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
  allowUnsubscribe: boolean;
  variableMapping: VariableMapping[];
  /** Monotonically incrementing save counter */
  version: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

/** Fields accepted by POST / and PUT /:id */
export type EmailTemplatePayload = Omit<
  IEmailTemplate,
  "_id" | "createdAt" | "updatedAt" | "lastUsedAt" | "version" | "variableMapping"
> & {
  variableMapping?: VariableMapping[];
};

/** Query filters for list endpoint */
export interface EmailTemplateFilters {
  status?: EmailTemplateStatus;
  category?: EmailTemplateCategory;
  type?: EmailTemplateType;
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export interface EmailPreviewResult {
  template: IEmailTemplate;
  resolvedHtml: string;
  resolvedSubject: string;
  resolvedPreheader: string;
  resolvedSenderName: string;
  resolvedSenderEmail: string;
  resolvedReplyTo: string;
}

// ─── CRM Discovery ────────────────────────────────────────────────────────────

export interface CuratedMappingConfig {
  [collection: string]: {
    label: string;
    fields: Array<{ path: string; label: string; type?: string }>;
  };
}
