// src/index.ts — @ecodrix/erix-react public API
// Complete Ecodrix React SDK: Editor + CRM + Analytics + WhatsApp + Meetings + Dashboard

// ─── Styles ────────────────────────────────────────────────────────────────────
import "./app/globals.css";

// ─── Platform Provider ─────────────────────────────────────────────────────────
export { ErixProvider, useErix, useErixClient } from "./context/ErixProvider";
export type { ErixProviderProps } from "./context/ErixProvider";

// ─── Editor ────────────────────────────────────────────────────────────────────
export type { ErixEditorProps } from "./components/richtext/editor";
export { ErixEditor, RichtextEditor } from "./components/richtext/editor";
export { ErixRenderer } from "./components/richtext/ErixRenderer";
export type { ErixRendererProps } from "./components/richtext/ErixRenderer";
export { AiMenu } from "./components/richtext/menus/AiMenu";
export { BubbleMenu } from "./components/richtext/menus/BubbleMenu";
export {
  DEFAULT_SLASH_COMMANDS,
  SlashMenu,
} from "./components/richtext/menus/SlashMenu";
export {
  ToolbarBtn,
  type ToolbarBtnProps,
  ToolbarGroup,
  ToolbarSep,
  ToolbarWrapper,
  type ToolbarWrapperProps,
} from "./components/richtext/toolbar/Toolbar";
export { ToolbarChain } from "./components/richtext/toolbar/ToolbarChain";
export type { ErixEditorProviderProps } from "./context/editor";
export { useErixEditor } from "./context/editor";
export { ErixChain } from "./core/chain";
export { ErixEngine } from "./core/engine";

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
export { ErixDashboard } from "./components/dashboard/ErixDashboard";
export type { ErixDashboardProps } from "./components/dashboard/ErixDashboard";

// ─── CRM Components ───────────────────────────────────────────────────────────
export { KanbanBoard } from "./components/crm/KanbanBoard";
export { LeadCard } from "./components/crm/LeadCard";

// ─── Analytics Components ─────────────────────────────────────────────────────
export { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
export { StatCard } from "./components/analytics/StatCard";

// ─── WhatsApp Components ──────────────────────────────────────────────────────
export { WhatsappInbox as WhatsAppInbox } from "./components/whatsapp/inbox/WhatsappInbox";
export { MessageBubble } from "./components/whatsapp/MessageBubble";
export { TemplateSelector } from "./components/whatsapp/TemplateSelector";
export { WhatsAppBroadcast } from "./components/whatsapp/WhatsAppBroadcast";
export type { WhatsAppBroadcastProps } from "./components/whatsapp/WhatsAppBroadcast";

// ─── Meetings Components ──────────────────────────────────────────────────────
export { MeetingList } from "./components/meet/MeetingList";

// ─── Shared UI ────────────────────────────────────────────────────────────────
export { ErixBadge } from "./components/ui/erix-badge";
export { ErixSpinner, ErixLoadingOverlay } from "./components/ui/erix-spinner";
export { ImagePickerNative } from "./components/ui/ImagePickerNative";
export type { ImageFormat } from "./components/ui/ImagePickerNative";

// ─── CRM Hooks ───────────────────────────────────────────────────────────────
export { useLeads, useLead } from "./hooks/crm/useLeads";
export {
  usePipelines,
  usePipelineBoard,
  usePipelineForecast,
} from "./hooks/crm/usePipeline";
export {
  useAnalyticsOverview,
  useAnalyticsFunnel,
  useAnalyticsSources,
  useAnalyticsTeam,
  useWhatsAppAnalytics,
  useAnalyticsSummary,
} from "./hooks/crm/useAnalytics";
export { useLeadActivities, useLeadNotes } from "./hooks/crm/useLeadActivity";
export { useAutomations } from "./hooks/crm/useAutomations";

// ─── WhatsApp Hooks ───────────────────────────────────────────────────────────
export {
  useConversations,
  useMessages,
} from "./hooks/whatsapp/useConversations";
export { useTemplates, useTemplate } from "./hooks/whatsapp/useTemplates";
export { useMarketingCampaigns } from "./hooks/whatsapp/useMarketingCampaigns";

// ─── Meetings Hooks ───────────────────────────────────────────────────────────
export { useMeetings } from "./hooks/meet/useMeetings";

// ─── Types ────────────────────────────────────────────────────────────────────
export * from "./types/erix";
export * from "./types/platform";
export type {
  ErixLead,
  ErixPaginatedResult,
  ExtractCustomFields,
} from "./types/custom-fields";

// ─── Module Router ────────────────────────────────────────────────────────────
export { ErixModuleRouter } from "./components/ErixModuleRouter";
export type { ErixModuleRouterProps } from "./components/ErixModuleRouter";
export { ErixModuleView } from "./components/ErixModuleView";
export type { ErixModuleViewProps } from "./components/ErixModuleView";
export { ErixRouterProvider } from "./routing/RouterContext";
export type { ErixRouterProviderProps } from "./routing/RouterContext";
export { ErixLink } from "./routing/ErixLink";
export type { ErixLinkProps } from "./routing/ErixLink";

// ─── Routing Hooks ────────────────────────────────────────────────────────────
export {
  useErixNavigate,
  useModuleNavigate,
  useErixRoute,
  useErixBack,
  useIsActive,
} from "./routing/RouterContext";

// ─── Routing Types ─────────────────────────────────────────────────────────
export type {
  ErixModuleName,
  ErixRouteConfig,
  ResolvedRoute,
} from "./routing/types";

// ─── Router Adapters ──────────────────────────────────────────────────────────
export { windowAdapter } from "./routing/adapters/window";
export { makeNextAdapter } from "./routing/adapters/next";
export { makeReactRouterAdapter } from "./routing/adapters/react-router";
export type { RouterAdapter } from "./routing/adapters/types";

// ─── Error Boundary ──────────────────────────────────────────────────────────
export { ErixErrorBoundary } from "./components/ErixErrorBoundary";

// ─── Toast ────────────────────────────────────────────────────────────────────
export { ErixToastProvider, useToastContext } from "./toast/ToastContext";
export { ErixToaster } from "./toast/ErixToaster";
export { useErixToast } from "./toast/useErixToast";
export type {
  ErixToast,
  ToastVariant,
  ToastAPI,
  ErixToastAction,
} from "./toast/types";

// ─── Notifications ────────────────────────────────────────────────────────────
export { useErixNotifications } from "./notifications/NotificationsContext";
export type { NotificationsContextValue } from "./notifications/NotificationsContext";
export {
  ErixNotifications,
  type ErixNotificationsProps,
} from "./notifications/ErixNotifications";
export type {
  ErixNotification,
  ErixNotificationType,
  ErixNotificationStatus,
} from "./notifications/types";

// ─── Optimistic Mutations ─────────────────────────────────────────────────────
export { optimistic } from "./lib/optimistic";

// ─── RBAC / Permissions ───────────────────────────────────────────────────────
export { ErixPermissionsProvider } from "./permissions/PermissionsContext";
export type { ErixPermissionsProviderProps } from "./permissions/PermissionsContext";
export { ErixGuard, ErixAccessDenied } from "./permissions/ErixGuard";
export type { ErixGuardProps } from "./permissions/ErixGuard";
export { useErixPermission } from "./permissions/useErixPermission";
export type {
  ErixPermission as ErixPermissionString,
  ErixRolePreset,
} from "./permissions/types";
export { ROLE_PERMISSION_MAP } from "./permissions/types";

// ─── Event Bus ────────────────────────────────────────────────────────────────
export { ErixEventBusProvider } from "./events/EventBusContext";
export { useErixEvent } from "./events/useErixEvent";
export { useErixEmit } from "./events/useErixEmit";
export type { ErixEventMap, ErixEventName } from "./events/types";

// ─── Real-time ────────────────────────────────────────────────────────────────
export { ErixRealtimeProvider } from "./realtime/RealtimeContext";
export { useErixRealtime } from "./realtime/useErixRealtime";
export { useErixChannel } from "./realtime/useErixChannel";

// ─── Offline Queue ────────────────────────────────────────────────────────────
export { useErixQueue } from "./offline/useErixQueue";
export type { QueuedOp, UseErixQueueReturn } from "./offline/useErixQueue";

// ─── Command Palette ─────────────────────────────────────────────────────────
export {
  ErixCommandPalette,
  ErixCommandPaletteTrigger,
} from "./command-palette/ErixCommandPalette";
export type {
  CommandItem,
  ErixCommandPaletteProps,
  ErixCommandPaletteTriggerProps,
} from "./command-palette/ErixCommandPalette";

// ─── Export / Download ────────────────────────────────────────────────────────
export { useLeadsExport } from "./export/useLeadsExport";
export type { UseLeadsExportReturn } from "./export/useLeadsExport";

// ─── i18n ─────────────────────────────────────────────────────────────────────
export { ErixI18nProvider } from "./i18n/I18nContext";
export type { ErixI18nProviderProps } from "./i18n/I18nContext";
export { useErixI18n } from "./i18n/useErixI18n";
export type { ErixLocale } from "./i18n/types";

// ─── Devtools ─────────────────────────────────────────────────────────────────
export { ErixDevtools } from "./devtools/ErixDevtools";

// ─── AI ───────────────────────────────────────────────────────────────────────
export {
  useLeadScore,
  useSmartReplies,
  useLeadAiSummary,
} from "./ai/useErixAi";
export type { SmartReplySuggestion } from "./ai/useErixAi";
export { LeadScoreBadge } from "./ai/LeadScoreBadge";
export { SmartReplySuggestions } from "./ai/SmartReplySuggestions";
