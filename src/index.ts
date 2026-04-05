// src/index.ts — @ecodrix/erix-react public API
// Complete Ecodrix React SDK: Editor + CRM + Analytics + WhatsApp + Meetings + Dashboard

// ─── Styles ────────────────────────────────────────────────────────────────────
import "./app/globals.css";

// ─── Platform Provider ─────────────────────────────────────────────────────────
export { ErixProvider, useErix, useErixClient } from "./context/ErixProvider";
export type { ErixProviderProps } from "./context/ErixProvider";

// ─── Editor (existing) ─────────────────────────────────────────────────────────
export type { ErixEditorProps } from "./components/richtext/editor";
export { ErixEditor, RichtextEditor } from "./components/richtext/editor";
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

// ─── WhatsApp Components ─────────────────────────────────────────────────────
export { WhatsAppInbox } from "./components/whatsapp/WhatsAppInbox";
export { MessageBubble } from "./components/whatsapp/MessageBubble";
export { TemplateSelector } from "./components/whatsapp/TemplateSelector";

// ─── Meetings Components ──────────────────────────────────────────────────────
export { MeetingList } from "./components/meet/MeetingList";

// ─── Shared UI ────────────────────────────────────────────────────────────────
export { ErixBadge } from "./components/ui/erix-badge";
export { ErixSpinner, ErixLoadingOverlay } from "./components/ui/erix-spinner";

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

// ─── WhatsApp Hooks ───────────────────────────────────────────────────────────
export {
  useConversations,
  useMessages,
} from "./hooks/whatsapp/useConversations";
export { useTemplates, useTemplate } from "./hooks/whatsapp/useTemplates";

// ─── Meetings Hooks ───────────────────────────────────────────────────────────
export { useMeetings } from "./hooks/meet/useMeetings";

// ─── Types ────────────────────────────────────────────────────────────────────
export * from "./types/erix";
export * from "./types/platform";

// ─── Module Router ────────────────────────────────────────────────────────────
// The primary way to add URL-based module routing to any React app.
// No dependency on react-router — uses window.history + popstate.
//
// Usage (all-in-one):
//   <ErixModuleRouter routes={{ crm: "/admin/leads", analytics: "/admin/stats" }} />
//
// Usage (composable — consumer owns the shell):
//   <ErixRouterProvider routes={...}>
//     <MySidebar />        {/* uses useErixNavigate / useIsActive  */}
//     <ErixModuleView />   {/* the content "outlet"                */}
//   </ErixRouterProvider>
//
export { ErixModuleRouter } from "./components/ErixModuleRouter";
export type { ErixModuleRouterProps } from "./components/ErixModuleRouter";
export { ErixModuleView } from "./components/ErixModuleView";
export type { ErixModuleViewProps } from "./components/ErixModuleView";
export { ErixRouterProvider } from "./routing/RouterContext";
export type { ErixRouterProviderProps } from "./routing/RouterContext";
export { ErixLink } from "./routing/ErixLink";
export type { ErixLinkProps } from "./routing/ErixLink";

// ============================================================================
// NOTIFICATIONS MODULE
// ============================================================================
export { useErixNotifications } from "./notifications/NotificationsContext";
export type { NotificationsContextValue } from "./notifications/NotificationsContext";
export { ErixNotifications } from "./notifications/ErixNotifications";
export type {
  ErixNotification,
  ErixNotificationType,
  ErixNotificationStatus,
} from "./notifications/types";

// ─── Routing Hooks ────────────────────────────────────────────────────────────
export {
  useErixNavigate, // navigate(path, replace?) — absolute URL navigation
  useModuleNavigate, // navigateTo(module, subPath?) — navigate within a module
  useErixRoute, // { module, prefix, subPath, params, pathname }
  useErixBack, // () => history.back()
  useIsActive, // useIsActive("/admin/leads") → boolean
} from "./routing/RouterContext";

// ─── Routing Types ─────────────────────────────────────────────────────────
export type {
  ErixModuleName,
  ErixRouteConfig,
  ResolvedRoute,
} from "./routing/types";

// ═══════════════════════════════════════════════════════════════════════════════
export { ErixErrorBoundary } from "./components/ErixErrorBoundary";
export { ErixToastProvider, useToastContext } from "./toast/ToastContext";
export { ErixToaster } from "./toast/ErixToaster";
export { useErixToast } from "./toast/useErixToast";
export type {
  ErixToast,
  ToastVariant,
  ToastAPI,
  ErixToastAction,
} from "./toast/types";

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 2 — Core UX
// ═══════════════════════════════════════════════════════════════════════════════
export { optimistic } from "./lib/optimistic";
export { ErixPermissionsProvider } from "./permissions/PermissionsContext";
export type { ErixPermissionsProviderProps } from "./permissions/PermissionsContext";
export { ErixGuard, ErixAccessDenied } from "./permissions/ErixGuard";
export type { ErixGuardProps } from "./permissions/ErixGuard";
export { useErixPermission } from "./permissions/useErixPermission";
export type { ErixPermission, ErixRolePreset } from "./permissions/types";
export { ROLE_PERMISSION_MAP } from "./permissions/types";
export { ErixEventBusProvider } from "./events/EventBusContext";
export { useErixEvent } from "./events/useErixEvent";
export { useErixEmit } from "./events/useErixEmit";
export type { ErixEventMap, ErixEventName } from "./events/types";

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 3 — Real-time & Offline
// ═══════════════════════════════════════════════════════════════════════════════
export { ErixRealtimeProvider } from "./realtime/RealtimeContext";
export { useErixRealtime } from "./realtime/useErixRealtime";
export { useErixChannel } from "./realtime/useErixChannel";
export { useErixQueue } from "./offline/useErixQueue";
export type { QueuedOp, UseErixQueueReturn } from "./offline/useErixQueue";

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 4 — DX & Power
// ═══════════════════════════════════════════════════════════════════════════════
export { windowAdapter } from "./routing/adapters/window";
export { makeNextAdapter } from "./routing/adapters/next";
export { makeReactRouterAdapter } from "./routing/adapters/react-router";
export type { RouterAdapter } from "./routing/adapters/types";
export type {
  ErixLead,
  ErixPaginatedResult,
  ExtractCustomFields,
} from "./types/custom-fields";
export { ErixDevtools } from "./devtools/ErixDevtools";

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 5 — Power Features
// ═══════════════════════════════════════════════════════════════════════════════
export { ErixCommandPalette } from "./command-palette/ErixCommandPalette";
export type {
  CommandItem,
  ErixCommandPaletteProps,
} from "./command-palette/ErixCommandPalette";
export { useLeadsExport } from "./export/useLeadsExport";
export type { UseLeadsExportReturn } from "./export/useLeadsExport";
export { ErixI18nProvider } from "./i18n/I18nContext";
export type { ErixI18nProviderProps } from "./i18n/I18nContext";
export { useErixI18n } from "./i18n/useErixI18n";
export type { ErixLocale } from "./i18n/types";

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 6 — Platform
// ═══════════════════════════════════════════════════════════════════════════════
export {
  useLeadScore,
  useSmartReplies,
  useLeadAiSummary,
} from "./ai/useErixAi";
export type { SmartReplySuggestion } from "./ai/useErixAi";
export { LeadScoreBadge } from "./ai/LeadScoreBadge";
export { SmartReplySuggestions } from "./ai/SmartReplySuggestions";
export { WhatsAppBroadcast } from "./components/whatsapp/WhatsAppBroadcast";
export type { WhatsAppBroadcastProps } from "./components/whatsapp/WhatsAppBroadcast";
