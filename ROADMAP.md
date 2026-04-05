# `@ecodrix/erix-react` — Implementation Roadmap

> Technical design document for all planned enhancements.  
> Each feature covers: Problem → API Design → File Structure → Approach.

---

## Priority order

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 1 | [Real-time WebSocket](#1-real-time-websocket) | 🔴 Critical | High |
| 2 | [Optimistic mutations](#2-optimistic-mutations) | 🔴 Critical | Medium |
| 3 | [Per-module error boundaries](#3-per-module-error-boundaries) | 🔴 Critical | Low |
| 4 | [Lazy loading / code splitting](#4-lazy-loading--code-splitting) | 🔴 Critical | Medium |
| 5 | [RBAC permission guards](#5-rbac-permission-guards) | 🔴 Critical | Medium |
| 6 | [Toast / notification system](#6-toast--notification-system) | 🟠 DX | Low |
| 7 | [Framework router adapters](#7-framework-router-adapters) | 🟠 DX | Medium |
| 8 | [Global event bus](#8-global-event-bus) | 🟠 DX | Low |
| 9 | [Command palette ⌘K](#9-command-palette-k) | 🟡 UX | High |
| 10 | [Export — CSV / PDF](#10-export--csv--pdf) | 🟡 UX | Medium |
| 11 | [Offline queue](#11-offline-queue) | 🟡 UX | High |
| 12 | [i18n support](#12-i18n-support) | 🟡 UX | Medium |
| 13 | [Typed custom fields](#13-typed-custom-fields) | 🟠 DX | Low |
| 14 | [ErixDevtools panel](#14-erixdevtools-panel) | 🟠 DX | Medium |
| 15 | [Marketing / Email composer](#15-marketing--email-composer) | 🟢 Platform | High |
| 16 | [WhatsApp broadcast campaigns](#16-whatsapp-broadcast-campaigns) | 🟢 Platform | High |
| 17 | [AI surfacing](#17-ai-surfacing) | 🟢 Platform | High |

---

## 1. Real-time WebSocket

### Problem
`WhatsAppInbox` and CRM pipeline need live updates. Current fetch-on-mount approach means users miss new messages and lead movements unless they manually refresh.

### Proposed API

```tsx
// Provider-level — declared once
<ErixProvider
  config={{
    apiKey:     "...",
    clientCode: "...",
    realtime: {
      url:            "wss://api.ecodrix.com/ws",
      reconnectDelay: 2000,   // ms, exponential back-off applied
      maxRetries:     10,
    },
  }}
>
  {children}
</ErixProvider>

// Connection status
const { status, latency } = useErixRealtime();
// status: "connecting" | "connected" | "disconnected" | "error"

// Subscribe to a channel
useErixChannel("whatsapp:conversations", (event) => {
  if (event.type === "message:received") appendMessage(event.payload);
});

useErixChannel("crm:leads", (event) => {
  if (event.type === "lead:moved") refetchBoard();
});
```

### Wire protocol

```ts
interface ErixRealtimeEvent {
  channel: string;   // "whatsapp:conversations" | "crm:leads" | ...
  type:    string;   // "message:received" | "lead:moved" | ...
  payload: unknown;
  ts:      number;   // unix ms
}

// Auth frame sent on connect
interface ErixRealtimeAuth {
  type:       "auth";
  apiKey:     string;
  clientCode: string;
}
```

### File structure

```
src/
  realtime/
    types.ts              ← ErixRealtimeEvent, channel name union
    RealtimeContext.tsx   ← context + provider + reconnect logic
    useErixRealtime.ts    ← status + latency hook
    useErixChannel.ts     ← subscribe/unsubscribe hook
  context/
    ErixProvider.tsx      ← add realtimeConfig to ErixPlatformConfig
```

### Technical approach
1. `RealtimeContext` owns one `WebSocket` instance.
2. Exponential backoff: delays = `[2s, 4s, 8s, 16s, 30s, 30s…]`.
3. Message fan-out via `Map<channel, Set<listener>>`.
4. Ping/pong heartbeat every 30s to detect silent drops.
5. Auth frame sent immediately after `onopen`.

### Hooks that benefit
- `useMessages(conversationId)` — subscribe + filter + `appendMessage`
- `usePipelineBoard(pipelineId)` — subscribe + refetch on `lead:moved`

---

## 2. Optimistic mutations

### Problem
`send()` in `useMessages` waits 200–800ms before the user sees their message. Standard UX: show it instantly, rollback on failure.

### Proposed API

```tsx
// No API change — hooks handle it internally
const { messages, send } = useMessages("conv_abc123");

// messages[] now includes optimistic entries:
// { ...msg, _optimistic: true, _status: "pending" | "failed" }
await send("Hello!");
// → bubble appears instantly
// → on ACK: _optimistic removed, real _id applied
// → on error: _status = "failed", retry button shown
```

### Types

```ts
interface ErixOptimisticMessage extends Message {
  _optimistic: true;
  _status:     "pending" | "sent" | "failed";
  _localId:    string;    // temp UUID
  retry:       () => void;
}
```

### Affected hooks

| Hook | Mutation | Optimistic behaviour |
|---|---|---|
| `useMessages.send()` | POST `/messages` | Prepend bubble with pending state |
| `useLeads.create()` | POST `/leads` | Prepend card to list |
| `usePipelineBoard.move()` | PATCH `/leads/:id/stage` | Move card locally |
| `useLeads.update()` | PATCH `/leads/:id` | Apply field changes locally |

### File structure

```
src/
  lib/
    optimistic.ts            ← createOptimisticEntry(), reconcile(), rollback()
  hooks/
    crm/useLeads.ts          ← add optimistic create/update
    whatsapp/useMessages.ts  ← add optimistic send
```

---

## 3. Per-module error boundaries

### Problem
An unhandled throw in `AnalyticsDashboard` crashes the entire app tree. Modules should fail independently with a recoverable UI.

### Proposed API

```tsx
// Automatic — ErixModuleView wraps each router
// Consumers can override:
<ErixModuleView
  errorFallback={(error, reset) => (
    <MyCustomError error={error} onRetry={reset} />
  )}
/>
```

### Default fallback UI

```
┌──────────────────────────────────────┐
│  ⚠  Something went wrong             │
│  Failed to load the CRM module.      │
│  [Try again]   [Report issue]        │
└──────────────────────────────────────┘
```

### File structure

```
src/
  components/
    ErixErrorBoundary.tsx   ← class component
    ErixModuleView.tsx      ← wrap each ModuleRouter in boundary
```

### Implementation

```tsx
class ErixErrorBoundary extends React.Component<{
  moduleName: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}, { error: Error | null }> {
  static getDerivedStateFromError = (error: Error) => ({ error });

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError({ error, info, module: this.props.moduleName });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback?.(this.state.error, this.reset)
        ?? <DefaultModuleError error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}
```

---

## 4. Lazy loading / code splitting

### Problem
All 6 modules bundle together. A host using only the editor loads ~400kB of unused code.

### Change to `ErixModuleView.tsx`

```tsx
const CrmRouter       = React.lazy(() => import("./router/CrmRouter"));
const AnalyticsRouter = React.lazy(() => import("./router/AnalyticsRouter"));
const WhatsAppRouter  = React.lazy(() => import("./router/WhatsAppRouter"));
const MeetingsRouter  = React.lazy(() => import("./router/MeetingsRouter"));

<React.Suspense fallback={<ErixModuleSpinner />}>
  <ModuleRouter />
</React.Suspense>
```

### `tsup.config.ts` — Multiple entry points

```ts
entry: {
  index:     "src/index.ts",
  editor:    "src/entries/editor.ts",
  crm:       "src/entries/crm.ts",
  analytics: "src/entries/analytics.ts",
  whatsapp:  "src/entries/whatsapp.ts",
  meetings:  "src/entries/meetings.ts",
  router:    "src/entries/router.ts",
}
```

### Consumer benefit

```ts
import { KanbanBoard } from "@ecodrix/erix-react/crm";     // ← only CRM code
import { ErixEditor }  from "@ecodrix/erix-react/editor";  // ← only editor code
```

---

## 5. RBAC permission guards

### Problem
No field-level or action-level access control. Consumers must implement their own checks around every Erix component.

### Proposed API

```tsx
<ErixProvider
  config={{
    permissions: [
      "crm.leads.read",
      "crm.leads.write",
      "whatsapp.messages.send",
      // "crm.leads.delete" ← not granted → delete button hidden
    ],
  }}
>

// Guard component
<ErixGuard permission="crm.leads.write" fallback={<ReadOnlyBadge />}>
  <LeadEditForm />
</ErixGuard>

// Guard hook
const canDelete = useErixPermission("crm.leads.delete");
const { all, any } = useErixPermissions(["crm.*", "whatsapp.messages.send"]);
```

### Permission namespace

```
{module}.{resource}.{action}

crm.leads.read         crm.leads.write       crm.leads.delete
crm.pipeline.manage    analytics.view
whatsapp.messages.send whatsapp.templates.manage
meetings.create        meetings.cancel
editor.publish

// Wildcard
crm.*   → all CRM permissions
```

### File structure

```
src/
  permissions/
    types.ts               ← ErixPermission (branded string)
    PermissionsContext.tsx  ← integrates into ErixProvider
    useErixPermission.ts   ← single + multi-permission hooks
    ErixGuard.tsx          ← component wrapper
```

---

## 6. Toast / notification system

### Problem
Hooks swallow errors silently. Modules have no way to surface success or failure feedback.

### Proposed API

```tsx
const toast = useErixToast();

toast.success("Lead marked as won");
toast.error("Failed to send message", {
  action: { label: "Retry", onClick: retry },
});
toast.info("Syncing pipeline…", { duration: 3000 });

// Promise shorthand
await toast.promise(sendMessage(payload), {
  loading: "Sending…",
  success: "Message sent!",
  error:   (err) => `Failed: ${err.message}`,
});
```

### File structure

```
src/
  toast/
    types.ts         ← ErixToast, ErixToastAction, ToastVariant
    ToastContext.tsx  ← queue state
    ErixToaster.tsx  ← portal, fixed-position stack
    useErixToast.ts  ← hook
```

### Visual spec
- Portal at `document.body`.
- Max 5 toasts; oldest auto-dismissed first.
- Durations: `success` 3s · `error` 8s · `info` 4s.
- Bottom-right (desktop), bottom-center (mobile).
- Swipe-to-dismiss on touch.

---

## 7. Framework router adapters

### Problem
`window.history.pushState` breaks in Next.js App Router, React Router v6, TanStack Router.

### Proposed API

```tsx
interface ErixRouterAdapter {
  push:        (path: string) => void;
  replace:     (path: string) => void;
  back:        () => void;
  usePathname: () => string;
}

// Next.js App Router
import { createNextAdapter } from "@ecodrix/erix-react/adapters/next";
"use client";
import { useRouter, usePathname } from "next/navigation";
const adapter = createNextAdapter({ useRouter, usePathname });
<ErixRouterProvider routes={routes} adapter={adapter}>

// React Router v6
import { createReactRouterAdapter } from "@ecodrix/erix-react/adapters/react-router";
import { useNavigate, useLocation } from "react-router-dom";
const adapter = createReactRouterAdapter({ useNavigate, useLocation });
<ErixRouterProvider routes={routes} adapter={adapter}>

// No adapter = window.history (Vite SPA, CRA)
<ErixRouterProvider routes={routes}>
```

### File structure

```
src/
  routing/
    RouterContext.tsx        ← accept optional adapter prop
    adapters/
      window.ts             ← default adapter (current behaviour)
      next.ts               ← createNextAdapter
      react-router.ts       ← createReactRouterAdapter
      tanstack-router.ts    ← createTanstackAdapter
```

---

## 8. Global event bus

### Problem
Modules can't communicate without prop drilling or lifting state to the host app.

### Proposed API

```tsx
// Listen — auto-unsubscribes on unmount
useErixEvent("lead:converted", (lead) => showConfetti(lead));
useErixEvent("message:received", (msg) => incrementBadge());

// Emit
const emit = useErixEmit();
emit("lead:converted", lead);
emit("custom:my-app-event", { anything: true });
```

### Built-in events

| Event | Payload | Emitted by |
|---|---|---|
| `lead:created` | `Lead` | `useLeads.create()` |
| `lead:updated` | `Lead` | `useLeads.update()` |
| `lead:converted` | `Lead` | `useLeads.markWon()` |
| `message:received` | `Message` | WebSocket + `useMessages` |
| `message:sent` | `Message` | `useMessages.send()` |
| `module:activated` | `{ module }` | `ErixModuleView` |
| `pipeline:moved` | `{ lead, from, to }` | `usePipelineBoard.move()` |

### File structure

```
src/
  events/
    types.ts             ← ErixEventMap (typed name → payload)
    EventBusContext.tsx  ← EventEmitter singleton in context
    useErixEvent.ts      ← subscribe (auto-unsubscribe)
    useErixEmit.ts       ← emit
```

---

## 9. Command palette ⌘K

### Problem
Power users spend too much time navigating. A command palette reduces every action to a keystroke.

### Proposed API

```tsx
<ErixCommandPalette
  open={open}
  onOpenChange={setOpen}
  commands={[
    {
      id:       "go-pipeline",
      label:    "Open Pipeline View",
      group:    "Navigation",
      icon:     <KanbanSquare size={14} />,
      shortcut: "⌘⇧P",
      action:   () => go("crm", "pipeline"),
    },
  ]}
  searchProviders={[
    useLeadsSearchProvider(),
    useConversationsSearchProvider(),
  ]}
/>
```

### UX spec

```
┌─────────────────────────────────────────────────┐
│ 🔍  Search or type a command…                   │
├─────────────────────────────────────────────────┤
│ Navigation                                      │
│  ⊞  Open Pipeline View                 ⌘⇧P    │
│  📊 Analytics Dashboard                         │
├─────────────────────────────────────────────────┤
│ Search results for "acme"                       │
│  👤 Acme Corp (Lead — Active)                   │
│  💬 Conversation with Acme (+91 9999…)          │
└─────────────────────────────────────────────────┘
```

- `↑↓` navigate · `Enter` execute · `Esc` close.
- `⌘K` global `keydown` listener.
- 200ms debounced async search.
- Search providers return `ErixCommandItem[]`.

### File structure

```
src/
  command-palette/
    types.ts                       ← ErixCommandItem, ErixSearchProvider
    CommandPaletteContext.tsx      ← open state + global shortcut
    ErixCommandPalette.tsx         ← portal UI
    providers/
      leadsSearchProvider.ts       ← GET /api/saas/crm/leads?q=
      conversationsSearchProvider.ts
```

---

## 10. Export — CSV / PDF

### Problem
Analytics and lead lists are view-only. Ops teams need to export data.

### Proposed API

```tsx
const { exportCsv, exportPdf, exporting } = useLeadsExport({
  filters: { pipelineId, status: "active" },
  columns: ["name", "email", "phone", "stage", "value", "createdAt"],
});

const { exportPdf: exportReport } = useAnalyticsExport({ range: "last30days" });

// Drop-in buttons
<LeadExportButton pipelineId="pipeline_abc" format="csv" />
<AnalyticsExportButton range="last30days" format="pdf" />
```

### CSV — client-side (no server needed)

```ts
function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body   = rows.map((r) =>
    columns.map((c) => JSON.stringify(r[c] ?? "")).join(",")
  );
  return [header, ...body].join("\n");
}
```

PDF: `GET /api/saas/crm/leads/export?format=pdf` → blob download.

### File structure

```
src/
  export/
    types.ts
    csv.ts
    useLeadsExport.ts
    useAnalyticsExport.ts
    LeadExportButton.tsx
    AnalyticsExportButton.tsx
```

---

## 11. Offline queue

### Problem
WhatsApp messages sent during network drops are lost. Lead edits on flaky connections silently fail.

### Proposed API

```tsx
// Transparent — automatic in hooks
const { send, queue } = useMessages("conv_abc123");
// queue: ErixQueuedOperation[] — pending items

// Global queue UI
const { total, flush, clear } = useErixQueue();
// "3 operations pending — will sync when back online"
```

### Technical approach
1. **Store** — IndexedDB (via `idb`, ~2kB). Persists across reloads.
2. **Enqueue** — every mutation writes to queue before network call.
3. **Flush** — flush queue in order on `navigator.onLine = true`.
4. **Dequeue** — remove on server ACK.
5. **Conflict** — `last-write-wins` by default; `manual` callback option.

### File structure

```
src/
  offline/
    types.ts             ← ErixQueuedOperation
    queue.ts             ← enqueue, dequeue, flush (IndexedDB)
    OfflineContext.tsx   ← online status + queue state
    useErixQueue.ts
```

---

## 12. i18n support

### Problem
All strings are hardcoded in English. Ecodrix serves global markets.

### Proposed API

```tsx
import { ErixI18nProvider } from "@ecodrix/erix-react";
import ar from "@ecodrix/erix-react/locales/ar";

<ErixI18nProvider locale="ar" messages={ar} dir="rtl">
  <ErixModuleRouter routes={routes} />
</ErixI18nProvider>

const { t, locale, dir } = useErixI18n();
t("crm.leads.empty")           // → "لا توجد عملاء محتملون"
t("toast.lead.won", { name })  // → "تم إغلاق الصفقة: Acme Corp"
```

### String key convention

```
{module}.{component}.{key}

crm.kanban.empty            "No leads in this stage"
whatsapp.inbox.empty        "No conversations yet"
toolbar.bold                "Bold"
common.loading              "Loading…"
common.error.retry          "Something went wrong. Try again."
```

### Bundled locales
`en` (default) · `ar` · `es` · `fr` · `hi` · `pt`

### File structure

```
src/
  i18n/
    types.ts
    I18nContext.tsx
    useErixI18n.ts
    locales/
      en.ts  ar.ts  es.ts  fr.ts  hi.ts  pt.ts
```

---

## 13. Typed custom fields

### Problem
`Lead` has hardcoded fields. Enterprise tenants configure custom fields per workspace.

### Proposed API

```ts
interface AcmeLeadFields {
  industry:      string;
  deal_size:     number;
  referral_code: string | null;
}

const { leads } = useLeads<AcmeLeadFields>();
leads[0].customFields.industry;    // string ✅
leads[0].customFields.deal_size;   // number ✅
leads[0].customFields.nonExistent; // TS error ✅
```

### Implementation

```ts
// Non-breaking — defaults to Record<string, unknown>
export interface Lead<TCustom extends Record<string, unknown> = Record<string, unknown>> {
  _id:          string;
  name:         string;
  // ... existing fields unchanged
  customFields: TCustom;
}

export function useLeads<TCustom extends Record<string, unknown> = Record<string, unknown>>(
  options?: UseLeadsOptions,
): UseLeadsResult<TCustom>
```

---

## 14. ErixDevtools panel

### Problem
No visibility into route, module, WebSocket status, API calls, queue, permissions during development.

### Proposed API

```tsx
import { ErixDevtools } from "@ecodrix/erix-react/devtools";

// Development only — zero bytes in prod (separate entry point)
{process.env.NODE_ENV === "development" && <ErixDevtools />}
```

### Panel tabs

| Tab | Content |
|---|---|
| **Router** | pathname, module, subPath, params |
| **Network** | Last 20 API calls — URL, status, latency |
| **Realtime** | WebSocket status, latency, last 20 events |
| **Queue** | Offline queue contents, flush/clear |
| **Permissions** | Granted permissions, `hasModule()` state |

### File structure

```
src/
  devtools/
    index.tsx           ← ErixDevtools
    DevtoolsContext.tsx ← aggregates all internal state
    tabs/
      RouterTab.tsx  NetworkTab.tsx  RealtimeTab.tsx
      QueueTab.tsx   PermissionsTab.tsx
```

---

## 15. Marketing / Email composer

### Problem
`marketing` module exists in `ErixModule` enum and package exports but has no UI.

### Proposed API

```tsx
<EmailComposer
  to={[{ email: "user@example.com", name: "John" }]}
  onSend={(campaign) => scheduleCampaign(campaign)}
  onSaveDraft={(draft) => saveDraft(draft)}
/>

<BroadcastComposer
  segment={filteredLeads}
  onSchedule={(broadcast) => scheduleBroadcast(broadcast)}
/>
```

### Features
- `ErixEditor` as the body (full rich text)
- Variable insertion: `{{first_name}}`, `{{company}}` — auto-completed
- Subject line with emoji picker
- Send-time scheduler
- Preview mode (email client rendering)
- Unsubscribe footer templating

---

## 16. WhatsApp broadcast campaigns

### Problem
Sending a template to a lead segment manually one-by-one is the most common operator request.

### Proposed API

```tsx
<WhatsAppBroadcast
  steps={["select-template", "pick-segment", "preview", "schedule"]}
  onConfirm={(broadcast) => submitBroadcast(broadcast)}
/>
```

### Wizard steps
1. **Select template** — approved templates from `useTemplates()`
2. **Fill variables** — map `{{1}}`, `{{2}}` → lead fields
3. **Pick segment** — filter by pipeline / status / tag / date
4. **Preview** — render final message for one sample lead
5. **Schedule** — send now or pick datetime

---

## 17. AI surfacing

### Planned surfaces

```tsx
// Lead scoring badge
<LeadScoreBadge leadId={lead._id} />
// "Hot Lead 🔥 87/100" with score breakdown tooltip

// Smart reply suggestions (WhatsApp)
<SmartReplySuggestions
  conversationId={conversationId}
  onSelect={(text) => setDraft(text)}
/>

// Activity timeline summary
<LeadAiSummary leadId={lead._id} />
// "Inactive 14 days. Recommended: follow-up call."

// Editor AI (streaming)
const { improve, summarize, translate, generating } = useErixAi();
await improve(selectedText);      // rewritten text
await summarize(fullContent);     // 2-sentence summary
await translate(text, "es");      // translated text
```

### File structure

```
src/
  ai/
    types.ts
    useErixAi.ts           ← improve, summarize, translate (SSE streaming)
    LeadScoreBadge.tsx
    SmartReplySuggestions.tsx
    LeadAiSummary.tsx
```

---

## Implementation sequence

```
Sprint 1 — Stability (3 days)
  ├── [3] Error boundaries
  ├── [6] Toast system
  └── [4] Lazy loading

Sprint 2 — Core UX (6 days)
  ├── [2] Optimistic mutations
  ├── [5] RBAC guards
  └── [8] Event bus

Sprint 3 — Real-time (7 days)
  ├── [1] WebSocket
  └── [11] Offline queue

Sprint 4 — DX (6 days)
  ├── [7] Router adapters
  ├── [13] Typed custom fields
  └── [14] Devtools panel

Sprint 5 — Power features (9 days)
  ├── [9] Command palette
  ├── [10] Export CSV/PDF
  └── [12] i18n

Sprint 6 — Platform (14 days)
  ├── [15] Email composer
  ├── [16] WA broadcasts
  └── [17] AI surfacing

Total: ~45 engineering days
```
