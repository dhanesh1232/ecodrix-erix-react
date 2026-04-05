# `@ecodrix/erix-react`

> **Complete Ecodrix React SDK** — RichText Editor · CRM · Analytics · WhatsApp · Meetings · Module Router

[![npm version](https://img.shields.io/npm/v/@ecodrix/erix-react.svg)](https://www.npmjs.com/package/@ecodrix/erix-react)
[![license](https://img.shields.io/npm/l/@ecodrix/erix-react.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)

---

## Table of contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick start](#quick-start)
- [ErixProvider — platform config](#erixprovider--platform-config)
- [Enterprise Features (Sprints 1-6)](#enterprise-features)
  - [Stability: Error Boundaries & Toasts](#stability-error-boundaries--toasts)
  - [DX: Optimistic Updates & Devtools](#dx-optimistic-updates--devtools)
  - [Power Users: Command Palette & Exports](#power-users-command-palette--exports)
  - [Security: RBAC & Permissions](#security-rbac--permissions)
  - [Data: Real-time & Offline Queue](#data-real-time--offline-queue)
  - [Global: Event Bus & i18n](#global-event-bus--i18n)
  - [AI & Broadcating](#ai--broadcasting)
- [Module Router](#module-router)
  - [All-in-one · ErixModuleRouter](#all-in-one--erixmodulerouter)
  - [Composable · ErixRouterProvider + ErixModuleView](#composable--erixrouterprovider--erixmoduleview)
  - [Routing adapters](#routing-adapters)
- [Rich Text Editor](#rich-text-editor)
  - [ErixEditor / RichtextEditor](#erixeditor--richtexteditor)
  - [Toolbar — ToolbarChain](#toolbar--toolbarchain)
- [CRM module](#crm-module)
- [Analytics module](#analytics-module)
- [WhatsApp module](#whatsapp-module)
- [Meetings module](#meetings-module)
- [Dashboard shell · ErixDashboard](#dashboard-shell--erixdashboard)
- [TypeScript reference](#typescript-reference)
- [License](#license)

---

## Enterprise Features

The SDK includes powerful global features that wrap your application to provide an enterprise-grade SaaS experience out of the box. All these are integrated automatically inside `<ErixProvider>`.

### Stability: Error Boundaries & Toasts

```tsx
import { ErixToaster, useErixToast, ErixErrorBoundary } from "@ecodrix/erix-react";

// Wrap risky trees (module layouts do this automatically)
<ErixErrorBoundary>
  <MyBuggyComponent />
</ErixErrorBoundary>

// In your app root:
<ErixToaster position="bottom-right" />

// In components:
const toast = useErixToast();
toast.success("Lead created!");
toast.promise(saveData(), {
  loading: "Saving...",
  success: "Done!",
  error: "Failed to save."
});
```

### Security: RBAC & Permissions

Declaratively hide or show UI based on user roles (Admin, Agent, Viewer) or specific permissions.

```tsx
import { ErixGuard, useErixPermission } from "@ecodrix/erix-react";

<ErixGuard require={["crm.delete"]} fallback={<p>No access</p>}>
  <button onClick={deleteLead}>Delete</button>
</ErixGuard>;

const canExport = useErixPermission("crm.export");
```

### Data: Real-time & Offline Queue

Real-time WebSocket events and IndexedDB offline queuing are handled transparently.

```tsx
import { useErixChannel, useErixQueue } from "@ecodrix/erix-react";

// Listen to specific server events globally
useErixChannel("leads", (event) => {
  if (event.action === "created") {
    toast.info("A new lead just arrived!");
  }
});

// Mutate data safely even when device is offline
const queue = useErixQueue();
queue.addMutation("POST", "/api/saas/crm/leads", { name: "John Doe" });
```

### DX: Optimistic Updates & Devtools

```tsx
import { optimistic, ErixDevtools } from "@ecodrix/erix-react";

// Instantly update UI, auto-rollback if the server call fails.
await optimistic({
  updateUi: () => setName("New Name"),
  rollback: () => setName("Old Name"),
  apiCall: () => sdk.crm.leads.update("id", { name: "New Name" }),
});

// Mount the devtools anywhere to inspect events, queue, and router state
<ErixDevtools />;
```

### Global: Event Bus & i18n

```tsx
import {
  useErixEmit,
  useErixEvent,
  useErixI18n,
  ErixI18nProvider,
} from "@ecodrix/erix-react";

// Type-safe cross-module pub/sub
const emit = useErixEmit();
emit("lead.selected", { leadId: "123" });

useErixEvent("lead.selected", (payload) => console.log(payload));

// Type-safe translations with lazy-loaded locales
<ErixI18nProvider locale="es">
  <MyApp />
</ErixI18nProvider>;

const { t } = useErixI18n();
<h1>{t("crm.leads")}</h1>;
```

### Power Users: Command Palette & Exports

```tsx
import { ErixCommandPalette, useLeadsExport } from "@ecodrix/erix-react";

// Hit ⌘K anywhere
<ErixCommandPalette />;

// Auto-paginating background exporter
const { exportData, exporting } = useLeadsExport();
<button onClick={() => exportData("csv", { pipelineId: "..." })}>
  Export all leads
</button>;
```

### AI & Broadcasting

We offer intelligent hooks for scoring and messaging:

```tsx
import {
  useLeadScore,
  useSmartReplies,
  WhatsAppBroadcast,
} from "@ecodrix/erix-react";

const { score } = useLeadScore(leadId);
const { replies } = useSmartReplies(conversationId);

// Full 5-step wizard for Marketing
<WhatsAppBroadcast onSuccess={handleSuccess} />;
```

---

## Overview

`@ecodrix/erix-react` is a single embeddable React package that brings every Ecodrix platform capability into your app:

| Module        | What you get                                                          |
| ------------- | --------------------------------------------------------------------- |
| **Editor**    | Production-grade rich-text editor, responsive overflow toolbar, menus |
| **CRM**       | Lead pipeline kanban, lead cards, searchable lead list                |
| **Analytics** | Dashboard charts, funnel, source breakdown, team stats                |
| **WhatsApp**  | Full inbox, conversation thread, template sender                      |
| **Meetings**  | Meeting list, scheduler form                                          |
| **Router**    | URL-based module router — no react-router dependency                  |

---

## Installation

```bash
pnpm add @ecodrix/erix-react
```

Import the stylesheet once in your app root:

```ts
import "@ecodrix/erix-react/styles";
```

---

## Quick start

```tsx
import { ErixProvider, ErixModuleRouter } from "@ecodrix/erix-react";

export default function AdminApp() {
  return (
    <ErixProvider
      config={{
        apiKey: "your-api-key",
        clientCode: "your-client-code",
        baseUrl: "https://api.ecodrix.com",
      }}
    >
      {/* Each route value is YOUR app's URL prefix for that module */}
      <ErixModuleRouter
        routes={{
          crm: "/admin/leads",
          analytics: "/admin/analytics",
          whatsapp: "/admin/chat",
          meetings: "/admin/meetings",
        }}
        fallback={<p>Select a module from the sidebar.</p>}
      />
    </ErixProvider>
  );
}
```

Visit `/admin/leads` → CRM loads. `/admin/leads/pipeline` → Kanban loads. No configuration beyond the prefix mapping.

---

## ErixProvider — platform config

Every component and hook in this package must be rendered inside `<ErixProvider>`. It supplies the API key, client identity, and feature flags to all descendants.

```tsx
import { ErixProvider } from "@ecodrix/erix-react";

<ErixProvider config={config}>{children}</ErixProvider>;
```

### `ErixPlatformConfig`

| Prop               | Type                | Required | Description                                                |
| ------------------ | ------------------- | -------- | ---------------------------------------------------------- |
| `apiKey`           | `string`            | ✅       | Ecodrix API key                                            |
| `clientCode`       | `string`            | ✅       | Tenant / client code                                       |
| `baseUrl`          | `string`            | —        | Override API endpoint (default: `https://api.ecodrix.com`) |
| `modules`          | `ErixModule[]`      | —        | Enable specific modules only (default: all)                |
| `theme`            | `"light" \| "dark"` | —        | Force light or dark mode                                   |
| `branding.logoUrl` | `string`            | —        | Logo URL shown in the dashboard shell                      |
| `branding.appName` | `string`            | —        | App name shown in the header                               |

```tsx
const config: ErixPlatformConfig = {
  apiKey: "ek_live_...",
  clientCode: "acme-corp",
  modules: ["crm", "analytics", "whatsapp"],
  theme: "dark",
  branding: { appName: "Acme Admin", logoUrl: "/logo.svg" },
};
```

### `useErix()` hook

```tsx
import { useErix } from "@ecodrix/erix-react";

function MyComponent() {
  const { baseUrl, headers, hasModule, health } = useErix();

  if (!hasModule("crm")) return null;
  // headers: { "Content-Type": "application/json", "x-api-key": "...", "x-client-code": "..." }
}
```

---

## Module Router

The Erix module router handles URL-based navigation **without any dependency on react-router, Next.js router, or any other routing library**. It uses `window.history.pushState` + `popstate` events and is compatible with any host framework.

### All-in-one · `ErixModuleRouter`

The simplest integration. Wraps provider + view in one component.

```tsx
<ErixModuleRouter
  routes={{
    crm: "/admin/leads", // /admin/leads, /admin/leads/pipeline, /admin/leads/:id
    analytics: "/admin/analytics",
    whatsapp: "/admin/chat",
    meetings: "/admin/meetings",
  }}
  fallback={<EmptyState />} // rendered when no prefix matches
  className="erix-h-full" // optional wrapper class
/>
```

### Composable · `ErixRouterProvider` + `ErixModuleView`

Use this when your app controls the layout and you just need the content outlet:

```tsx
import {
  ErixRouterProvider,
  ErixModuleView,
  useErixNavigate,
  useIsActive,
} from "@ecodrix/erix-react";

export default function AdminLayout() {
  return (
    <ErixProvider config={config}>
      <ErixRouterProvider
        routes={{
          crm: "/admin/leads",
          analytics: "/admin/analytics",
        }}
      >
        <div className="flex h-screen">
          <Sidebar /> {/* your sidebar — uses hooks below */}
          <main className="flex-1 overflow-auto">
            <ErixModuleView fallback={<WelcomeScreen />} />
          </main>
        </div>
      </ErixRouterProvider>
    </ErixProvider>
  );
}

function Sidebar() {
  const navigate = useErixNavigate();
  const crmActive = useIsActive("/admin/leads");

  return (
    <nav>
      <button
        onClick={() => navigate("/admin/leads")}
        className={crmActive ? "active" : ""}
      >
        CRM
      </button>
    </nav>
  );
}
```

### Routing hooks

| Hook                | Signature                                                  | Description                               |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `useErixNavigate`   | `() => (path: string, replace?: boolean) => void`          | Navigate to any absolute URL              |
| `useModuleNavigate` | `() => (module: ErixModuleName, subPath?: string) => void` | Navigate within a module by name          |
| `useErixRoute`      | `() => ResolvedRoute & { pathname }`                       | Current module, subPath, params, pathname |
| `useErixBack`       | `() => () => void`                                         | `history.back()`                          |
| `useIsActive`       | `(path: string, exact?: boolean) => boolean`               | True if pathname matches prefix           |

#### `useErixNavigate`

```tsx
const navigate = useErixNavigate();

navigate("/admin/leads"); // push
navigate("/admin/leads/pipeline"); // push to sub-route
navigate("/admin/leads", true); // replace (no history entry)
```

#### `useModuleNavigate`

Resolves the correct full URL from your route config automatically:

```tsx
const go = useModuleNavigate();

go("crm"); // → navigate("/admin/leads")
go("crm", "pipeline"); // → navigate("/admin/leads/pipeline")
go("crm", "abc123"); // → navigate("/admin/leads/abc123")
go("meetings", "new"); // → navigate("/admin/meetings/new")
```

#### `useErixRoute`

```tsx
const { module, prefix, subPath, params, pathname } = useErixRoute();

// URL: /admin/leads/pipeline
// module   → "crm"
// prefix   → "/admin/leads"
// subPath  → "pipeline"
// params   → {}

// URL: /admin/leads/abc123
// module   → "crm"
// subPath  → "abc123"
```

#### `useIsActive`

```tsx
// Current URL: /admin/leads/pipeline

useIsActive("/admin/leads"); // → true  (prefix match)
useIsActive("/admin/leads", true); // → false (exact — path has /pipeline suffix)
useIsActive("/admin/leads/pipeline"); // → true
useIsActive("/admin/analytics"); // → false
```

### `ErixLink`

A drop-in `<a>` replacement that uses the Erix router. Modifier keys (⌘/Ctrl/Shift) still open new tabs normally.

```tsx
import { ErixLink } from "@ecodrix/erix-react";

<ErixLink
  to="/admin/leads"
  activeClass="font-bold text-primary border-l-2 border-primary"
>
  CRM
</ErixLink>

<ErixLink to="/admin/leads" exact activeClass="text-primary">
  Leads (exact match only)
</ErixLink>
```

| Prop          | Type      | Description                                       |
| ------------- | --------- | ------------------------------------------------- |
| `to`          | `string`  | Destination path                                  |
| `replace`     | `boolean` | Use `history.replaceState` instead of `pushState` |
| `activeClass` | `string`  | Extra CSS class when path is active               |
| `exact`       | `boolean` | Only active on exact path match (default: prefix) |

### Sub-routes per module

Routes inside each module are handled automatically.

#### CRM

| URL                     | View                                    |
| ----------------------- | --------------------------------------- |
| `/admin/leads`          | Lead list                               |
| `/admin/leads/pipeline` | Kanban board (first available pipeline) |
| `/admin/leads/:id`      | Lead detail                             |

#### WhatsApp

| URL           | View           |
| ------------- | -------------- |
| `/admin/chat` | WhatsApp inbox |

#### Analytics

| URL                | View                |
| ------------------ | ------------------- |
| `/admin/analytics` | Analytics dashboard |

#### Meetings

| URL                   | View          |
| --------------------- | ------------- |
| `/admin/meetings`     | Meeting list  |
| `/admin/meetings/new` | Schedule form |

---

## Rich Text Editor

### `ErixEditor` / `RichtextEditor`

Full-featured rich text editor with iframe isolation, toolbar, bubble menu, slash commands, and AI menu.

```tsx
import { ErixEditor } from "@ecodrix/erix-react";

<ErixEditor
  value="<p>Hello world</p>"
  onChange={(html) => console.log(html)}
  placeholder="Start writing…"
  toolbar={<ToolbarChain />}
  minHeight={400}
/>;
```

| Prop          | Type                     | Default            | Description                |
| ------------- | ------------------------ | ------------------ | -------------------------- |
| `value`       | `string`                 | —                  | HTML content (controlled)  |
| `onChange`    | `(html: string) => void` | —                  | Called on every change     |
| `placeholder` | `string`                 | `"Start writing…"` | Empty state placeholder    |
| `toolbar`     | `ReactNode`              | `<ToolbarChain />` | Toolbar component          |
| `minHeight`   | `number`                 | `300`              | Minimum editor height (px) |
| `readOnly`    | `boolean`                | `false`            | Disable editing            |
| `className`   | `string`                 | —                  | Container class            |

### Toolbar — `ToolbarChain`

The default responsive toolbar. Buttons collapse into a **"…" overflow popover** automatically when the container width decreases.

```tsx
import { ToolbarChain } from "@ecodrix/erix-react";

// All groups enabled (default)
<ToolbarChain />

// Selective groups
<ToolbarChain
  history
  textFormat
  headings
  colors
  lists
  alignment
  indent
  link
  image
  fonts={false}
  table={false}
  ai
  onAiClick={() => openAiPanel()}
/>
```

| Prop         | Type         | Default | Description                                     |
| ------------ | ------------ | ------- | ----------------------------------------------- |
| `history`    | `boolean`    | `true`  | Undo / Redo                                     |
| `textFormat` | `boolean`    | `true`  | Bold, Italic, Underline, Strike, Code, Clear    |
| `headings`   | `boolean`    | `true`  | Block type picker (P, H1–H6, Quote, Code block) |
| `fonts`      | `boolean`    | `true`  | Font family + font size mini-dropdowns          |
| `colors`     | `boolean`    | `true`  | Text color + highlight color                    |
| `lists`      | `boolean`    | `true`  | Bullet, ordered, task lists                     |
| `alignment`  | `boolean`    | `true`  | Left, center, right, justify                    |
| `indent`     | `boolean`    | `true`  | Indent / outdent                                |
| `link`       | `boolean`    | `true`  | Insert / edit hyperlink                         |
| `image`      | `boolean`    | `true`  | Insert image (upload or URL)                    |
| `table`      | `boolean`    | `true`  | Insert table, columns, callout, toggle, divider |
| `ai`         | `boolean`    | `false` | AI enhance button (hidden by default)           |
| `onAiClick`  | `() => void` | —       | Handler for AI button click                     |

#### How overflow works

`ToolbarChain` uses a **ghost-layer measurement strategy**:

1. All toolbar sections render in a `visibility:hidden` absolute row first.
2. `ResizeObserver` reads section widths before the visible row paints — zero first-frame flash.
3. Sections that don't fit move into the **`…`** overflow popover, with a labelled, grouped layout.

### Custom toolbar

Build a fully custom toolbar using the primitive components:

```tsx
import {
  ToolbarWrapper,
  ToolbarGroup,
  ToolbarBtn,
  ToolbarSep,
  useErixEditor,
} from "@ecodrix/erix-react";
import { Bold, Italic } from "lucide-react";

function MyToolbar() {
  const { engine, ctx } = useErixEditor();

  return (
    <ToolbarWrapper alwaysVisible={1}>
      <ToolbarGroup>
        <ToolbarBtn
          tooltip="Bold  ⌘B"
          active={ctx.bold}
          onClick={() => engine?.bold()}
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          tooltip="Italic  ⌘I"
          active={ctx.italic}
          onClick={() => engine?.italic()}
        >
          <Italic size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarSep />
    </ToolbarWrapper>
  );
}
```

#### `ToolbarBtn` props

| Prop       | Type                   | Default | Description                         |
| ---------- | ---------------------- | ------- | ----------------------------------- |
| `active`   | `boolean`              | —       | Highlight with primary accent color |
| `tooltip`  | `string`               | —       | Tooltip text on hover               |
| `size`     | `"xs" \| "sm" \| "md"` | `"sm"`  | Button size (22 / 26 / 30 px)       |
| `disabled` | `boolean`              | —       | Standard disabled state             |

> **Important:** `ToolbarBtn` calls `e.preventDefault()` on `mousedown` to preserve the editor text selection. This is correct — never replace it with a `div`.

### Menus — BubbleMenu · AiMenu · SlashMenu

```tsx
import {
  ErixEditor,
  BubbleMenu,
  AiMenu,
  SlashMenu,
  DEFAULT_SLASH_COMMANDS,
} from "@ecodrix/erix-react";

<ErixEditor
  toolbar={<ToolbarChain />}
  bubbleMenu={<BubbleMenu />}
  aiMenu={<AiMenu onRequest={handleAiRequest} />}
  slashMenu={<SlashMenu commands={DEFAULT_SLASH_COMMANDS} />}
/>;
```

---

## CRM module

### `KanbanBoard`

Drag-and-drop kanban pipeline board.

```tsx
import { KanbanBoard } from "@ecodrix/erix-react";

<KanbanBoard
  pipelineId="pipeline_abc123"
  onLeadOpen={(lead) => openDetailPanel(lead)}
/>;
```

| Prop         | Type                   | Description                             |
| ------------ | ---------------------- | --------------------------------------- |
| `pipelineId` | `string`               | Required. Get IDs from `usePipelines()` |
| `onLeadOpen` | `(lead: Lead) => void` | Called when a card is clicked           |

### `LeadCard`

Compact card for a single lead.

```tsx
import { LeadCard } from "@ecodrix/erix-react";

<LeadCard
  lead={lead}
  onOpen={(l) => setActive(l)}
  onConvert={(l) => markWon(l)}
  onArchive={(l) => archiveLead(l)}
/>;
```

### CRM hooks

#### `useLeads(options?)`

```tsx
import { useLeads } from "@ecodrix/erix-react";

const { leads, loading, total, page, setPage, search, setSearch, refetch } =
  useLeads({ pipelineId: "pipeline_abc123", status: "active" });
```

#### `useLead(id)`

```tsx
const { lead, loading, update } = useLead("lead_id");
```

#### `usePipelines()`

```tsx
const { pipelines, loading, refetch } = usePipelines();
// pipelines[0]._id → use as pipelineId for KanbanBoard
```

#### `usePipelineBoard(pipelineId)`

```tsx
const { board, loading } = usePipelineBoard("pipeline_abc123");
// board.stages[] → { stage, leads[] }
```

#### `usePipelineForecast(pipelineId)`

```tsx
const { forecast, loading } = usePipelineForecast("pipeline_abc123");
// forecast.revenue, forecast.expected, forecast.stages[]
```

---

## Analytics module

### `AnalyticsDashboard`

Full analytics dashboard — stat cards, funnel, traffic sources, team performance.

```tsx
import { AnalyticsDashboard } from "@ecodrix/erix-react";

<AnalyticsDashboard />;
```

### `StatCard`

```tsx
import { StatCard } from "@ecodrix/erix-react";

<StatCard
  label="Total Leads"
  value={overview.totalLeads}
  trend={overview.leadsGrowth}
  icon={<Users size={16} />}
/>;
```

### Analytics hooks

| Hook                     | Returns                | Description                                         |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| `useAnalyticsOverview()` | `{ data, loading }`    | Platform-wide overview (leads, conversion, revenue) |
| `useAnalyticsFunnel()`   | `{ stages, loading }`  | Lead conversion funnel                              |
| `useAnalyticsSources()`  | `{ sources, loading }` | Traffic source breakdown                            |
| `useAnalyticsTeam()`     | `{ members, loading }` | Per-agent performance                               |
| `useWhatsAppAnalytics()` | `{ data, loading }`    | WhatsApp-specific metrics                           |
| `useAnalyticsSummary()`  | `{ summary, loading }` | Aggregated summary                                  |

---

## WhatsApp module

### `WhatsAppInbox`

Full split-pane WhatsApp inbox — conversation list + chat thread.

```tsx
import { WhatsAppInbox } from "@ecodrix/erix-react";

<WhatsAppInbox onLeadOpen={(lead) => openCrmPanel(lead)} />;
```

| Prop         | Type                   | Description                               |
| ------------ | ---------------------- | ----------------------------------------- |
| `onLeadOpen` | `(lead: Lead) => void` | Callback when user opens a lead from chat |

### `MessageBubble`

```tsx
import { MessageBubble } from "@ecodrix/erix-react";

<MessageBubble message={message} />;
```

### `TemplateSelector`

```tsx
import { TemplateSelector } from "@ecodrix/erix-react";

<TemplateSelector
  onSelect={(template) => sendTemplate(conversationId, template)}
/>;
```

### WhatsApp hooks

#### `useConversations()`

```tsx
const { conversations, loading, search, setSearch, refetch } =
  useConversations();
```

#### `useMessages(conversationId)`

```tsx
const { messages, loading, send, appendMessage, loadBefore, hasMore } =
  useMessages("conv_abc123");
```

#### `useTemplates()` / `useTemplate(id)`

```tsx
const { templates, loading } = useTemplates();
const { template, loading } = useTemplate("template_id");
```

---

## Meetings module

### `MeetingList`

```tsx
import { MeetingList } from "@ecodrix/erix-react";

<MeetingList />;
```

### Meetings hooks

#### `useMeetings()`

```tsx
import { useMeetings } from "@ecodrix/erix-react";

const { meetings, loading, create, cancel, refetch } = useMeetings();
```

---

## Dashboard shell · `ErixDashboard`

A complete admin dashboard shell with responsive sidebar, header, and module routing — ready to embed.

```tsx
import { ErixProvider, ErixDashboard } from "@ecodrix/erix-react";

<ErixProvider config={config}>
  <ErixDashboard modules={["crm", "analytics", "whatsapp", "meetings"]} />
</ErixProvider>;
```

| Prop      | Type           | Description                         |
| --------- | -------------- | ----------------------------------- |
| `modules` | `ErixModule[]` | Which modules appear in the sidebar |

---

## Shared UI components

### `ErixBadge`

```tsx
import { ErixBadge } from "@ecodrix/erix-react";

<ErixBadge variant="success">Active</ErixBadge>
<ErixBadge variant="warning">Pending</ErixBadge>
<ErixBadge variant="destructive">Overdue</ErixBadge>
```

### `ErixSpinner` / `ErixLoadingOverlay`

```tsx
import { ErixSpinner, ErixLoadingOverlay } from "@ecodrix/erix-react";

<ErixSpinner size="sm" />
<ErixLoadingOverlay loading={isFetching} />
```

---

## TypeScript reference

### Routing types

```ts
import type {
  ErixModuleName, // "crm" | "analytics" | "whatsapp" | "meetings" | "richtext"
  ErixRouteConfig, // { crm?: string; analytics?: string; whatsapp?: string; meetings?: string }
  ResolvedRoute, // { module, prefix, subPath, params }
} from "@ecodrix/erix-react";
```

### Platform types

```ts
import type {
  ErixPlatformConfig,
  ErixModule, // "editor" | "crm" | "analytics" | "whatsapp" | "marketing" | "meetings"
} from "@ecodrix/erix-react";
```

### CRM types

```ts
import type {
  Lead,
  LeadStatus, // "active" | "won" | "lost" | "archived"
  LeadSource,
  Pipeline,
  PipelineStage,
  KanbanBoard,
} from "@ecodrix/erix-react";
```

---

## Peer dependencies

```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0"
}
```

No react-router-dom, no Next.js, no CSS framework required.

---

## License

MIT © [ECODrIx Team](https://ecodrix.com)
