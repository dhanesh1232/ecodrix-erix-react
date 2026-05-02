# @ecodrix/erix-react — Project Analysis

**Path:** `ECOD/packages/erix-react`  
**NPM:** `@ecodrix/erix-react` (public, MIT)  
**As of:** April 2026  

This document describes the **embeddable React SDK** for ECODrIx: prebuilt CRM, WhatsApp, analytics, meetings, marketing/email builders, rich text, dashboard shell, routing adapters, permissions, realtime, and i18n—built on **`@ecodrix/erix-api`** and Radix-based UI.

---

## 1. Executive summary

**`erix-react`** is a **library package** (tsup → `dist/`) with optional **Next.js** app under `src/app/` for local dev/preview (`pnpm dev` uses `next dev --webpack`). It exposes a root **`ErixProvider`** that constructs a shared **`Ecodrix`** SDK client and wraps children with toast, event bus, realtime, notifications, permissions, and i18n providers. Public exports include **Kanban**, **WhatsApp inbox**, **analytics dashboards**, **meeting lists**, **email template builder** (including GrapesJS newsletter preset), **TipTap-style rich editor** (`ErixEditor`, `ErixRenderer`), **command palette**, **RBAC guards**, and **router adapters** for Next.js, window history, and React Router.

---

## 2. Package metadata

| Field | Value |
|-------|--------|
| Version | 0.1.9 (see `package.json` for current) |
| `main` / `module` / `types` | `dist/cjs`, `dist/es`, `dist/types` |
| Side effects | `**/*.css` (global styles) |

### 2.1 Conditional exports (`package.json`)

Subpath entry points for tree-shaking / lazy loading:

- `@ecodrix/erix-react` (root)
- `@ecodrix/erix-react/styles`
- `@ecodrix/erix-react/crm`
- `@ecodrix/erix-react/analytics`
- `@ecodrix/erix-react/whatsapp`
- `@ecodrix/erix-react/marketing`
- `@ecodrix/erix-react/meetings`
- `@ecodrix/erix-react/dashboard`
- `@ecodrix/erix-react/editor`

---

## 3. Peer vs bundled dependencies

**Peer (host must provide):** `react`, `react-dom`, `next` (>=16), `framer-motion`, `gsap`, `@gsap/react`, `recharts`.

**Bundled highlights:** `@ecodrix/erix-api`, Radix UI primitives, **`@dnd-kit`**, **`cmdk`**, **`grapesjs`** + **`grapesjs-preset-newsletter`**, **`lucide-react`**, **`zod`**, **`tailwind-merge`**, **`date-fns`**, **`emoji-picker-react`**, **`react-phone-number-input`**, **`next-themes`**, etc.

---

## 4. Public API (`src/index.ts` — overview)

Grouped exports include:

| Category | Examples |
|----------|----------|
| Provider | `ErixProvider`, `useErix`, `useErixClient` |
| Rich text | `ErixEditor`, `RichtextEditor`, `ErixRenderer`, menus, toolbar, `ErixEngine`, `ErixChain` |
| Dashboard | `ErixDashboard` |
| CRM UI | `KanbanBoard`, `LeadCard`; hooks `useLeads`, `usePipeline`, `useAutomations`, … |
| Analytics | `AnalyticsDashboard`, `StatCard`; hooks `useAnalyticsOverview`, `useWhatsAppAnalytics`, … |
| WhatsApp | `WhatsAppInbox`, `TemplateSelector`, `WhatsAppBroadcast`, message hooks |
| Email / marketing | `TemplateBuilder`, `TemplateList`, `TemplateEditor`, variable hooks, sync hooks |
| Meetings | `MeetingList`, `useMeetings` |
| Routing | `ErixModuleRouter`, `ErixModuleView`, `ErixRouterProvider`, `ErixLink`, `makeNextAdapter`, `windowAdapter`, `makeReactRouterAdapter` |
| Cross-cutting | `ErixErrorBoundary`, toast system, `ErixNotifications`, permissions (`ErixGuard`, `ErixPermissionsProvider`), `ErixRealtimeProvider`, `ErixEventBusProvider`, offline `useErixQueue`, i18n, `ErixDevtools`, AI hooks (`useLeadScore`, `useSmartReplies`, …) |

Full list: see **`src/index.ts`** (200+ export lines).

---

## 5. Architecture notes

### 5.1 `ErixProvider` (`src/context/ErixProvider.tsx`)

- Memoizes **`new Ecodrix({ apiKey, clientCode, baseUrl })`** when credentials change; default **`baseUrl`** aligns with production API host.
- Composes: **`ErixToastProvider`**, **`ErixEventBusProvider`**, **`ErixRealtimeProvider`**, **`NotificationsProvider`**, **`ErixPermissionsProvider`**, **`ErixI18nProvider`**, **`TooltipProvider`**.
- Exposes **`useErix()`** (full platform context: `config`, `sdk`, module flags, health) and **`useErixClient()`** (shortcut to `sdk`).

### 5.2 Modules

**`config.modules`** defaults to all: `editor`, `crm`, `analytics`, `whatsapp`, `marketing`, `meetings` — used to enable/disable product surfaces.

### 5.3 Supporting layers

| Directory | Role |
|-----------|------|
| `src/components/` | Feature UI (whatsapp/, crm/, analytics/, email/, richtext/, ui/) |
| `src/hooks/` | Data hooks wrapping SDK calls |
| `src/context/`, `src/realtime/`, `src/events/` | Cross-cutting React state |
| `src/permissions/` | RBAC presets (`ROLE_PERMISSION_MAP`, guards) |
| `src/routing/` | SPA / Next adapters and URL matching |
| `src/core/` | `engine`, `chain`, iframe template utilities |
| `src/lib/` | Schemas, fetch helpers, optimistic updates |

---

## 6. Build and dev workflow

| Script | Purpose |
|--------|---------|
| `pnpm build` | `prepublishOnly` → `build:final` |
| `pnpm build:lib` | tsup (`tsconfig.build.json`) → `dist/es`, `dist/cjs`, UMD |
| `pnpm build:types` | `@microsoft/api-extractor` |
| `pnpm dev` | Next dev server for the package’s demo `src/app` |
| `pnpm lint` / `check` / `types` | Biome + tsc |

**Styles:** Root import in `src/index.ts` pulls **`./app/globals.css`**; subpath **`/styles`** maps to bundled CSS for consumers who import styles separately.

---

## 7. Relationship to `erix-api` and backend

- All network IO goes through the **`Ecodrix`** instance from **`@ecodrix/erix-api`**, which targets the **ECODrIx backend** REST + Socket APIs.
- **Nirvisham** and similar apps may use a thinner custom `ErixAPI` class; **`erix-react`** is the **full-fidelity UI SDK** for embedding ECODrIx modules inside Next/React apps with consistent design tokens and behavior.

---

## 8. Integration checklist for host apps

1. Install peers: **React 18+**, **Next 16+** (per `peerDependencies`), Framer Motion, GSAP, Recharts.
2. Add **`@ecodrix/erix-react`** and import **`@ecodrix/erix-react/styles`** (or root entry which pulls globals) so Tailwind/Radix styles apply.
3. Wrap the segment of the app that needs ECODrIx with **`ErixProvider`** and pass **`ErixPlatformConfig`** (`apiKey`, `clientCode`, optional `baseUrl`, `modules`).
4. If you use **`ErixModuleRouter`** inside **Next.js App Router**, see §9.8 for pathname sync (`key` + `initialPathname`) or wire **`makeNextAdapter`** from adapters when you build a deeper router bridge.
5. Use **`useErixClient()`** in custom components when you need raw SDK access beyond provided hooks.

---

## 9. Usage examples (TSX / TS)

### 9.1 Next.js App Router — root layout with provider + styles

Use a **client** layout wrapper because `ErixProvider` is a client component.

```tsx
// app/erix-layout-client.tsx
"use client";

import "@ecodrix/erix-react/styles";
import { ErixProvider } from "@ecodrix/erix-react";

export function ErixLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErixProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ERIX_CLIENT_API_KEY!,
        clientCode: process.env.NEXT_PUBLIC_ERIX_CLIENT_CODE!,
        baseUrl: process.env.NEXT_PUBLIC_ERIX_SOCKET_URL ?? "https://api.ecodrix.com",
        modules: ["crm", "whatsapp", "analytics", "meetings", "marketing", "editor"],
        locale: "en",
        role: "admin",
      }}
    >
      {children}
    </ErixProvider>
  );
}
```

```tsx
// app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { ErixLayoutClient } from "../erix-layout-client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ErixLayoutClient>{children}</ErixLayoutClient>;
}
```

### 9.2 `useErix` / `useErixClient` in a custom panel

```tsx
"use client";

import { useErix, useErixClient } from "@ecodrix/erix-react";
import { useEffect, useState } from "react";

export function TenantHealthChip() {
  const { health, healthLoading, refreshHealth } = useErix();
  const sdk = useErixClient();
  const [leadSampleTotal, setLeadSampleTotal] = useState<number | null>(null);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = (await sdk.crm.leads.list({ limit: 1, page: 1 })) as {
        pagination?: { total?: number };
      };
      if (!cancelled) setLeadSampleTotal(res?.pagination?.total ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return (
    <div className="text-sm text-muted-foreground">
      {healthLoading ? "Checking tenant…" : health?.status ?? "unknown"}
      {leadSampleTotal !== null && ` · Leads (tenant total): ${leadSampleTotal}`}
    </div>
  );
}
```

### 9.3 CRM Kanban (lazy subpath import)

```tsx
"use client";

import dynamic from "next/dynamic";

const KanbanBoard = dynamic(
  () => import("@ecodrix/erix-react/crm").then((m) => m.KanbanBoard),
  { ssr: false },
);

export function CrmBoardPage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <KanbanBoard />
    </div>
  );
}
```

### 9.4 WhatsApp inbox (full module)

```tsx
"use client";

import { WhatsAppInbox } from "@ecodrix/erix-react";

export function InboxPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <WhatsAppInbox />
    </div>
  );
}
```

### 9.5 Analytics dashboard

```tsx
"use client";

import { AnalyticsDashboard } from "@ecodrix/erix-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <AnalyticsDashboard />
    </div>
  );
}
```

### 9.6 Rich text editor + renderer

`ErixEditor` validates **`apiKey`** (and optional `apiUrl` / `clientCode`) for media services. `onChange` receives a **string** whose shape depends on **`format`**: `"html"` (default), `"json"`, `"markdown"`, or `"text"`.

```tsx
"use client";

import { useState } from "react";
import { ErixEditor, ErixRenderer } from "@ecodrix/erix-react";

export function NotesEditor() {
  const [html, setHtml] = useState("<p>Start typing…</p>");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ErixEditor
        apiKey={process.env.NEXT_PUBLIC_ERIX_CLIENT_API_KEY!}
        clientCode={process.env.NEXT_PUBLIC_ERIX_CLIENT_CODE!}
        initialContent={html}
        format="html"
        onChange={setHtml}
        loader="skeleton"
        style={{ height: 420 }}
      />
      <div className="rounded-md border p-4">
        <ErixRenderer content={html} format="html" />
      </div>
    </div>
  );
}
```

JSON pipeline (string in / string out):

```tsx
"use client";

import { useState } from "react";
import { ErixEditor, ErixRenderer } from "@ecodrix/erix-react";

export function JsonNotesEditor() {
  const [jsonString, setJsonString] = useState<string>("[]");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ErixEditor
        apiKey={process.env.NEXT_PUBLIC_ERIX_CLIENT_API_KEY!}
        format="json"
        initialContent={jsonString}
        onChange={setJsonString}
        loader="none"
      />
      <ErixRenderer content={JSON.parse(jsonString) as Record<string, unknown>[]} format="json" />
    </div>
  );
}
```

### 9.7 Meetings list

```tsx
"use client";

import { MeetingList } from "@ecodrix/erix-react";

export function MeetingsPage() {
  return (
    <div className="p-6">
      <MeetingList />
    </div>
  );
}
```

### 9.8 `ErixModuleRouter` (module → URL prefix)

`routes` is an **`ErixRouteConfig` object**: keys are module ids (`crm`, `whatsapp`, `analytics`, …), values are **URL prefixes** in your app that activate that module (see `src/routing/types.ts`).

```tsx
"use client";

import { ErixModuleRouter } from "@ecodrix/erix-react";

const routes = {
  crm: "/embed/crm",
  whatsapp: "/embed/whatsapp",
  analytics: "/embed/analytics",
  meetings: "/embed/meetings",
};

export function ErixShell() {
  return (
    <ErixModuleRouter
      routes={routes}
      fallback={<p className="p-6 text-sm text-muted-foreground">No Erix module matches this URL.</p>}
    />
  );
}
```

**Next.js App Router:** `ErixRouterProvider` tracks pathname via `popstate` + `history.pushState`. After **`router.push()`** from `next/navigation`, the browser URL updates but **no `popstate` fires**, so the internal pathname can lag until a full remount. A pragmatic pattern is to key the router off **`usePathname()`** so it re-resolves when the segment changes:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { ErixModuleRouter } from "@ecodrix/erix-react";

const routes = {
  crm: "/app/crm",
  whatsapp: "/app/chat",
};

export function ErixNextShell() {
  const pathname = usePathname();
  return <ErixModuleRouter key={pathname} initialPathname={pathname} routes={routes} />;
}
```

The package also exports **`makeNextAdapter`**, **`makeReactRouterAdapter`**, and **`windowAdapter`** (`src/routing/adapters/*`) for custom navigation wiring when you integrate deeply with your host router.

### 9.9 Permissions: guard a button or section

```tsx
"use client";

import { ErixGuard } from "@ecodrix/erix-react";

export function DangerZone() {
  return (
    <ErixGuard permission="crm.leads.delete">
      <button type="button" className="text-destructive">
        Delete lead
      </button>
    </ErixGuard>
  );
}
```

### 9.10 Data hooks (CRM + WhatsApp)

`useLeads` / `useConversations` return **`loading`** (not `isLoading`) and domain arrays **`leads`** / **`conversations`**, plus helpers like **`refetch`**, **`create`**, **`markRead`**.

```tsx
"use client";

import { useLeads, useConversations } from "@ecodrix/erix-react";

export function HookDemo() {
  const {
    leads,
    total,
    loading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useLeads({ status: "new", limit: 10 });

  const {
    conversations,
    loading: convosLoading,
    error: convosError,
    markRead,
    refetch: refetchConvos,
  } = useConversations();

  if (leadsLoading || convosLoading) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Leads (new): {total}</span>
        <button type="button" onClick={() => refetchLeads()}>
          Refetch leads
        </button>
        <button type="button" onClick={() => refetchConvos()}>
          Refetch chats
        </button>
      </div>
      {(leadsError || convosError) && (
        <p className="text-sm text-destructive">{leadsError ?? convosError}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <pre className="max-h-64 overflow-auto rounded border p-2 text-xs">
          {JSON.stringify(leads, null, 2)}
        </pre>
        <pre className="max-h-64 overflow-auto rounded border p-2 text-xs">
          {JSON.stringify(conversations, null, 2)}
        </pre>
      </div>
      {conversations[0] && (
        <button type="button" onClick={() => void markRead(conversations[0]._id)}>
          Mark first conversation read
        </button>
      )}
    </div>
  );
}
```

### 9.11 Error boundary around a heavy module

`ErixProvider` already includes toast/realtime wiring. Wrap fragile subtrees so one failed chart does not blank the whole app. **`ErixErrorBoundary`** requires a **`moduleName`** label for logs.

```tsx
"use client";

import { ErixErrorBoundary, KanbanBoard } from "@ecodrix/erix-react";

export function SafeCrmBoard() {
  return (
    <ErixErrorBoundary
      moduleName="crm-kanban"
      fallback={(err, reset) => (
        <div className="space-y-2 p-4 text-sm">
          <p>CRM board error: {err.message}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    >
      <KanbanBoard />
    </ErixErrorBoundary>
  );
}
```

### 9.12 Vite / CRA (non-Next) entry

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@ecodrix/erix-react/styles";
import { ErixProvider, ErixDashboard } from "@ecodrix/erix-react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErixProvider
      config={{
        apiKey: import.meta.env.VITE_ERIX_API_KEY,
        clientCode: import.meta.env.VITE_ERIX_CLIENT_CODE,
      }}
    >
      <ErixDashboard />
    </ErixProvider>
  </StrictMode>,
);
```

---

*Analysis derived from `package.json`, `src/index.ts`, `src/context/ErixProvider.tsx`, and `src/` module layout.*
