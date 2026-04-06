// src/types/platform.ts — Ecodrix platform-wide type definitions

// ─── Config & Provider ─────────────────────────────────────────────────────

export type ErixModule =
  | "editor"
  | "crm"
  | "analytics"
  | "whatsapp"
  | "marketing"
  | "meetings";

import type { ErixPermission, ErixRolePreset } from "../permissions/types";

export type { ErixPermission, ErixRolePreset };

export type ErixLocale = "en" | "ar" | "es" | "fr" | "hi" | "pt";

export interface ErixPlatformConfig {
  /** Ecodrix API key */
  apiKey: string;
  /** Base URL of the Ecodrix backend, e.g. https://api.ecodrix.com */
  baseUrl?: string;
  /** Client/tenant code */
  clientCode: string;
  /** Enabled modules — defaults to all */
  modules?: ErixModule[];
  /** Theme override */
  theme?: "light" | "dark";
  /** Optional branding */
  branding?: {
    logoUrl?: string;
    appName?: string;
  };
  /**
   * RBAC role preset.
   * Defaults to "admin" if permissions are not provided, or "custom" if they are.
   */
  role?: ErixRolePreset;
  /**
   * RBAC permission strings granted to the current user.
   * When provided, ErixGuard and useErixPermission work without a separate
   * ErixPermissionsProvider wrapper.
   * Supports wildcards: "crm.*" → all CRM permissions.
   */
  permissions?: ErixPermission[];

  /**
   * UI locale for built-in Erix strings.
   * Defaults to "en". Passes through to ErixI18nProvider automatically.
   */
  locale?: ErixLocale;
}

// ─── CRM Types ──────────────────────────────────────────────────────────────

export type LeadStatus = "active" | "won" | "lost" | "archived";
export type LeadSource =
  | "website"
  | "whatsapp"
  | "referral"
  | "cold_outreach"
  | "social"
  | "ad"
  | "event"
  | "other";

export interface Lead {
  _id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  source?: LeadSource;
  pipelineId?: string;
  stageId?: string;
  score?: number;
  tags?: string[];
  assignedTo?: string;
  value?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    refs?: Record<string, string>;
    extra?: Record<string, unknown>;
  };
}

export interface PipelineStage {
  _id: string;
  name: string;
  color?: string;
  probability?: number;
  order: number;
  isWon?: boolean;
  isLost?: boolean;
}

export interface Pipeline {
  _id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: PipelineStage[];
}

export interface KanbanColumn {
  stage: PipelineStage;
  leads: Lead[];
  total: number;
}

export interface KanbanBoard {
  pipeline: Pipeline;
  columns: KanbanColumn[];
}

export interface PipelineForecast {
  /** Total value of all active leads in the pipeline */
  revenue: number;
  /** Probability-weighted expected revenue */
  expected: number;
  /** Revenue already won */
  wonRevenue: number;
  stages: Array<{
    stageId: string;
    stageName: string;
    count: number;
    value: number;
    probability: number;
  }>;
}

export interface LeadActivity {
  _id: string;
  leadId: string;
  type: "note" | "call" | "email" | "stage_change" | "system" | "whatsapp";
  title: string;
  body?: string;
  performedBy?: string;
  createdAt: string;
}

export interface LeadNote {
  _id: string;
  leadId: string;
  content: string;
  isPinned?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics Types ────────────────────────────────────────────────────────

export type AnalyticsRange = "24h" | "7d" | "30d" | "60d" | "90d" | "365d";

export interface OverviewKPIs {
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  avgScore: number;
  pipelineValue: number;
  wonRevenue: number;
}

export interface FunnelStage {
  stageId: string;
  stageName: string;
  count: number;
  conversionRate: number;
  value: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  conversionRate: number;
  totalValue: number;
}

export interface TeamMember {
  name: string;
  wonDeals: number;
  revenue: number;
  activityCount: number;
  conversionRate: number;
}

export interface WhatsAppAnalytics {
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
  dailyVolume: Array<{ date: string; sent: number; received: number }>;
}

// ─── WhatsApp Types ─────────────────────────────────────────────────────────

export type ConversationStatus = "open" | "resolved" | "waiting";

export interface Conversation {
  _id: string;
  phone: string;
  userName?: string;
  status: ConversationStatus;
  channel: "whatsapp";
  unreadCount: number;
  lastMessageAt?: string;
  leadId?: string;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "template";

export interface Message {
  _id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  templateName?: string;
  isStarred?: boolean;
  reaction?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  replyTo?: Message;
}

export type TemplateStatus = "approved" | "pending" | "rejected";

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
}

export interface WhatsAppTemplate {
  _id: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: string;
  bodyText?: string;
  components?: TemplateComponent[];
  variableMapping?: unknown[];
  mappingStatus?: "mapped" | "unmapped" | "partial";
}

export interface Broadcast {
  _id: string;
  name: string;
  templateId: string;
  templateName?: string;
  status: "draft" | "scheduled" | "processing" | "completed" | "failed";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Meetings Types ──────────────────────────────────────────────────────────

export type MeetingStatus = "pending" | "scheduled" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Meeting {
  _id: string;
  leadId: string;
  participantName: string;
  participantPhone: string;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  paymentStatus?: PaymentStatus;
  meetLink?: string;
  duration?: number;
  createdAt: string;
}

// ─── Automation Types ───────────────────────────────────────────────────────

export type AutomationTrigger =
  | "lead_created"
  | "stage_enter"
  | "stage_exit"
  | "score_below"
  | "score_above"
  | "tag_added"
  | "custom";

export type AutomationActionType =
  | "send_whatsapp"
  | "send_email"
  | "add_tag"
  | "move_stage"
  | "assign_lead"
  | "create_task";

export interface AutomationAction {
  type: AutomationActionType;
  delayMinutes: number;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  _id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  triggerConfig?: Record<string, unknown>;
  condition?: {
    field: string;
    operator: "eq" | "ne" | "gt" | "lt" | "contains";
    value: unknown;
  };
  actions: AutomationAction[];
  isActive: boolean;
  runCount?: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Health / System Types ───────────────────────────────────────────────────

export interface ClientHealth {
  clientCode: string;
  services: {
    whatsapp: "connected" | "not_configured";
    email: "configured" | "not_configured";
    googleMeet: "configured" | "not_configured";
  };
  activeAutomations: number;
  queueDepth: number;
  timestamp: string;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ListFilters {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeadListFilters extends ListFilters {
  status?: LeadStatus;
  pipelineId?: string;
  stageId?: string;
  source?: LeadSource;
  assignedTo?: string;
  minScore?: number;
  tags?: string[];
}
