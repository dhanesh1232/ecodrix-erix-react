# Erix React SDK (@ecodrix/erix-react)

**Erix React SDK** is the professional toolkit for building next-generation SaaS dashboards and customer portals on the Ecodrix Platform.

It provides high-level hooks, context providers, and UI components that bridge the gap between your React application and the Ecodrix Full-Stack Backend.

## 🚀 Key Features

- **Full-Stack Parity**: 1:1 alignment with Ecodrix CRM, WhatsApp, and Marketing APIs.
- **Real-time Synchronicity**: Live updates for leads, messages, and system health via Socket.IO.
- **Dashboard in a Box**: Drop `<ErixDashboard />` into your app for a complete sales command center.
- **Enterprise RBAC**: Native support for module/resource-level permissions (e.g. `crm.leads.delete`).
- **Modern React**: Hooks-first, fully-typed (TypeScript), and performance-optimized.

## 📦 Installation

```bash
pnpm add @ecodrix/erix-react
```

```bash
npm install @ecodrix/erix-react
```

## 🛠️ Usage

```tsx
import { ErixProvider, ErixDashboard } from "@ecodrix/erix-react";

const config = {
  apiKey: "YOUR_API_KEY",
  clientCode: "YOUR_CLIENT_ID",
  theme: "dark",
  locale: "en",
};

export default function App() {
  return (
    <ErixProvider config={config}>
      <ErixDashboard modules={["crm", "whatsapp"]} />
    </ErixProvider>
  );
}
```

# Introduction to Erix SDK

**Erix SDK** is the official React toolkit for building enterprise-grade SaaS dashboards, customer portals, and internal tools on top of the Ecodrix Platform.

It provides a rich set of hooks, components, and real-time utilities that bridge the gap between your frontend and the Ecodrix Backend.

## Why Erix?

- **Real-time Synchronicity**: Out-of-the-box Socket.IO integration for live CRM updates, WhatsApp messages, and system alerts.
- **Optimistic UI**: Pre-registered mutations for CRM leads and stages, ensuring 0ms perceived latency.
- **RBAC by Default**: Role-Based Access Control integrated into every hook and component.
- **Enterprise Ready**: Full support for internationalization (i18n), theming, and dark mode.
- **Modular Architecture**: Only import what you need — CRM, Marketing, WhatsApp, or the full Dashboard experience.

## The Full-Stack SDK

Unlike traditional API wrappers, Erix SDK is built as a **Full-Stack Bridge**:

1. **`@ecodrix/erix-api`**: The typed core client (Node/Browser).
2. **`@ecodrix/erix-react`**: Hooks, context providers, and UI components.
3. **`ECOD/backend`**: The source of truth for all business logic.

Everything is kept in perfect alignment to ensure that your field definitions, resource paths, and permission gates match the backend 1:1.

## Key Modules

- **CRM**: Pipelines, Leads, Forecasts, and Activities.
- **WhatsApp**: Unified inbox, templates, and broadcast management.
- **Marketing**: Campaigns, automations, and tracking.
- **Meetings**: Scheduling, billing, and Google Meet integration.
- **Analytics**: Power BI-style dashboards with tiered business reporting.

---

# Getting Started with Erix SDK

Follow these steps to integrate Erix into your React application (Vite, Next.js, or Remix).

## 1. Installation

```bash
pnpm add @ecodrix/erix-react
```

```bash
npm install @ecodrix/erix-react
```

## 2. Configuration

Obtain your `apiKey` and `clientCode` from the Ecodrix Dashboard.

```tsx
import { ErixProvider } from "@ecodrix/erix-react";

const config = {
  apiKey: process.env.ERIX_API_KEY,
  clientCode: "YOUR_CLIENT_CODE",
  theme: "light",
  locale: "en",
};

export default function App({ children }) {
  return <ErixProvider config={config}>{children}</ErixProvider>;
}
```

## 3. Using Hooks (CRM)

Fetch leads from your CRM pipeline effortlessly.

```tsx
import { useLeads } from "@ecodrix/erix-react";

function LeadList() {
  const { data, loading, error, refetch } = useLeads({
    status: "active",
    limit: 10,
  });

  if (loading) return <div>Loading leads...</div>;
  if (error) return <div>Error loading leads</div>;

  return (
    <ul>
      {data.map((lead) => (
        <li key={lead._id}>
          {lead.firstName} {lead.lastName}
        </li>
      ))}
    </ul>
  );
}
```

## 4. Real-time Integration

Erix automatically connects to the backend's Socket.IO server when the provider mounts. You can listen for live events:

```tsx
import { useErixRealtime } from "@ecodrix/erix-react";

function LiveNotifications() {
  const { lastEvent } = useErixRealtime();

  React.useEffect(() => {
    if (lastEvent?.type === "crm.lead_created") {
      alert(`New lead: ${lastEvent.data.firstName}`);
    }
  }, [lastEvent]);

  return null;
}
```

---

# API Reference (Hooks)

Erix SDK provides a comprehensive collection of React hooks for all business-critical modules.

## CRM Module (`@ecodrix/erix-react/hooks/crm`)

- `useLeads(filters: LeadListFilters)`: Retrieve paginated leads for a specific tenant.
- `useLead(leadId: string)`: Get detailed information for a single lead.
- `usePipelines()`: List all CRM pipelines and their stages.
- `usePipelineForecast(pipelineId: string)`: Real-time revenue projection.
- `useLeadActivities(leadId: string)`: Complete chronological timeline.
- `useLeadNotes(leadId: string)`: Manage nested notes and pinned comments.
- `useAutomations()`: Control CRM automation rules and history.

## WhatsApp Module (`@ecodrix/erix-react/hooks/whatsapp`)

- `useConversations()`: Real-time WhatsApp inbox with unread counts.
- `useMessages(conversationId: string)`: Message history plus typed outbound methods.
- `useWhatsAppTemplates()`: Approved templates from Meta.
- `useWhatsAppBroadcasts()`: Track marketing blast progress.

## Marketing Module (`@ecodrix/erix-react/hooks/marketing`)

- `useMarketingCampaigns()`: List active and scheduled campaigns.
- `useMarketingAnalytics(campaignId: string)`: CTR, open rates, and conversion.

## Common Return Signature

Most data hooks follow this predictable pattern:

```ts
const {
  data,
  loading,
  error,
  refetch,
  updating, // True during an optimistic mutation
} = useLeads();
```

---

# Theming & Customization

Erix SDK uses a **CSS Variables**-based design system that adapts to your host application's appearance.

## 1. Dark Mode Support

Pass the `theme` prop to `ErixProvider` to sync the SDK with your app's global state.

```tsx
const [theme, setTheme] = useState("dark");

return (
  <ErixProvider config={{ theme }}>
    <App />
  </ErixProvider>
);
```

## 2. Branding (Whitelabeling)

The SDK supports custom branding for the `ErixDashboard` and `ErixCommandPalette`.

```tsx
const config = {
  branding: {
    logoUrl: "https://cdn.your-app.com/logo.png", // your logo url - logo path
    appName: "SaaS CRM Pro",
  },
};
```

## 3. UI Token Overrides

You can customize the SDK's look and feel by overriding the following CSS variables in your `index.css`:

```css
:root {
  /* Core brand colors */
  --erix-primary: #0070f3;
  --erix-primary-foreground: #ffffff;

  /* Borders and roundness */
  --erix-radius: 0.5rem;
  --erix-border: #e5e7eb;

  /* Fonts */
  --erix-font-sans: "Inter", sans-serif;
}

[data-erix-platform-theme="dark"] {
  --erix-background: #000000;
  --erix-foreground: #ffffff;
}
```

---

# RBAC & Permissions

**Erix SDK** is built with **Role-Based Access Control (RBAC)** at its core.

Permissions are defined in the form `{module}.{resource}.{action}`.

## Permission Presets

Most applications will use one of the predefined roles:

- `admin`: Full platform access (CRM, WhatsApp, Marketing, Settings).
- `agent`: CRM (View/Edit), WhatsApp (Send/View), Meetings (View).
- `viewer`: Read-only access to CRM and Analytics.
- `custom`: Explicitly provide a list of permission strings via `ErixProvider`.

## Component Level Security

Use the `<ErixGuard>` component to conditionally hide or reveal UI elements.

```tsx
import { ErixGuard } from "@ecodrix/erix-react";

function DeleteButton() {
  return (
    <ErixGuard permission="crm.leads.delete" fallback={<div>No access</div>}>
      <button onClick={handleDelete}>Delete Lead</button>
    </ErixGuard>
  );
}
```

## Hook Level Security

Use the `useErixPermission` hook to perform checks inside your logic.

```tsx
import { useErixPermission } from "@ecodrix/erix-react";

function ExportLeads() {
  const canExport = useErixPermission("crm.leads.export");

  if (!canExport) return null;

  return <button onClick={handleExport}>Download CSV</button>;
}
```

## Wildcards

Erix supports wildcard matches for complex authorization logic:

- `crm.*`: Both `crm.leads` and `crm.pipelines`.
- `crm.leads.*`: `crm.leads.view`, `crm.leads.edit`, etc.
- `*`: Total platform control (same as `admin`).

---

## ⚙️ Modules

| Module        | Resource                   | Features                                |
| :------------ | :------------------------- | :-------------------------------------- |
| **CRM**       | `leads`, `pipelines`       | Pipelines, Leads, Forecasts, Activities |
| **WhatsApp**  | `messages`, `templates`    | Unified inbox, broadcasts, templates    |
| **Marketing** | `campaigns`, `automations` | Drip sequences, flow tracking           |
| **Meetings**  | `schedule`, `billing`      | Google Meet, Stripe-tier payments       |
| **Email**     | `builder`, `templates`     | Drag and drop email builder             |

# CRM Lifecycle Hooks

Erix CRM hooks provide a high-level API for managing leads and sales pipelines.

## `useLeads`

The primary hook for lead management. It handles pagination, searching, and filtering.

```tsx
const { data, loading, error, refetch, hasMore } = useLeads({
  status: "active",
  pipelineId: "main-sales",
  stageId: "prospecting",
  limit: 20,
  page: 1,
});
```

### Filters

- `status`: "active" | "won" | "lost" | "archived"
- `source`: "website" | "whatsapp" | "referral" | "other"
- `assignedTo`: USER_ID
- `minScore`: 0-100
- `tags`: string[]

## `usePipelines`

Fetches all active pipelines for the current tenant.

```tsx
const { data: pipelines, loading } = usePipelines();
```

## `useLeadNotes`

Specific hook for lead timeline comments. Supports CRUD operations.

```tsx
const { data: notes, createNote, deleteNote, pinNote } = useLeadNotes(leadId);

return (
  <button onClick={() => createNote({ content: "Follow up tomorrow" })}>
    Add Note
  </button>
);
```

### Optimistic UI Strategy

Note creation is **optimistic**. The hook immediately adds the note to the local state with a temporary ID, updating it once the server responds.

---

# WhatsApp Integration Hooks

Erix SDK includes a powerful WhatsApp Cloud API wrapper that handles messages, templates, and marketing broadcasts.

## `useConversations`

Listen for live WhatsApp conversations across all your numbers.

```tsx
const {
  data: conversations,
  loading,
  error,
} = useConversations({
  status: "open",
  limit: 20,
});
```

### Real-time Sync

Conversations and their `unreadCount` are automatically synced with the Ecodrix Backend via Socket.IO. When a new message arrives, the hook updates its local state without a refetch.

## `useMessages`

Fetch the full message history for a specific phone number or conversation ID.

```tsx
const {
  data: messages,
  sendMessage,
  sendTemplate,
} = useMessages(conversationId);

return (
  <button onClick={() => sendMessage({ text: "Hello from Erix!" })}>
    Send Message
  </button>
);
```

### Resource Pattern

```ts
sendMessage(payload: { text?: string; mediaUrl?: string });
sendTemplate(payload: { name: string; language: string; components?: any });
```

## `useWhatsAppTemplates`

List and search for pre-approved templates from your Meta Business Suite.

```tsx
const { data: templates } = useWhatsAppTemplates();
```

## `useWhatsAppBroadcasts`

Track the real-time status of marketing broadcasts.

```tsx
const { data: broadcasts } = useWhatsAppBroadcasts();
```

---

# Email Builder — Architecture & Usage Guide

## Overview

A drag-and-drop email template builder built with React. No external
dependencies beyond `lucide-react` for icons.

### Core Files

| File                     | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `types.ts`               | Block, Document, and Editor state types                      |
| `blockDefs.tsx`          | Block catalog (names, icons, default factories)              |
| `useCanvasState.ts`      | **Single source of truth** — document state, undo/redo, CRUD |
| `EmailCanvasBuilder.tsx` | Main canvas component, drag-drop coordinator                 |
| `CanvasBlock.tsx`        | Renders individual blocks with inline editing                |
| `BlockLibraryPanel.tsx`  | Left sidebar: block palette + layers tree                    |
| `StylePanel.tsx`         | Right sidebar: style controls for selected block             |
| `htmlExport.ts`          | Converts document to email-safe HTML                         |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EmailCanvasBuilder                           │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ BlockLibrary │  │     Canvas       │  │   StylePanel     │   │
│  │   Panel      │  │  ┌────────────┐  │  │                  │   │
│  │              │  │  │CanvasBlock │  │  │ Typography       │   │
│  │  [Blocks]    │──│──│ BlockVisual│  │──│ Spacing          │   │
│  │  [Layers]    │  │  │ InlineEdit │  │  │ Background       │   │
│  │              │  │  └────────────┘  │  │ Border           │   │
│  └──────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                 │
│                    useCanvasState (hook)                        │
│                    ┌───────────────────┐                        │
│                    │ editorState       │                        │
│                    │ historyRef        │                        │
│                    │ CRUD actions      │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### State Flow

1. **`useCanvasState`** owns the `EmailDocument` and all mutations
2. Every mutation (insert, update, delete, reorder) pushes to the undo
   stack via `historyRef`
3. The canvas re-renders, and each `CanvasBlock` receives its data
4. **Two update channels**:
   - `onUpdate(id, patch)` — for content changes (text, image src, etc.)
   - `onStyleUpdate(id, stylePatch)` — for style changes (padding, colors)
5. Both channels push to undo history (so Ctrl+Z works for everything)

### Why `historyRef` instead of `useState`?

History is stored in a `useRef` to eliminate nested `setState` calls
(`setHistory` inside `setEditorState`). This caused **"Maximum update
depth exceeded"** errors when rapid-fire inputs (e.g., color pickers)
triggered cascading React updates.

---

## Block Types

| Type           | Description       | Content Field            | Children        |
| -------------- | ----------------- | ------------------------ | --------------- |
| `heading`      | H1–H3 heading     | `content` (HTML)         | —               |
| `text`         | Paragraph text    | `content` (HTML)         | —               |
| `button`       | CTA button        | `content` (text), `href` | —               |
| `image`        | Image block       | `src`, `alt`, `href`     | —               |
| `divider`      | Horizontal rule   | —                        | —               |
| `spacer`       | Vertical space    | `height` (px)            | —               |
| `html`         | Raw HTML          | `content` (HTML)         | —               |
| `variable`     | Template variable | `variableName`           | —               |
| `social`       | Social link row   | `content` (JSON array)   | —               |
| `section`      | Container block   | `content` or `children`  | ✅              |
| `twoColumns`   | 2-column layout   | —                        | ✅ (2 children) |
| `threeColumns` | 3-column layout   | —                        | ✅ (3 children) |

---

## Section & Layout Blocks

### Section

A single-width container. Can hold:

- **Inline text** (written directly via `content`)
- **Child blocks** (stored in `children[]`)

When `children` is empty, the section renders an editable text area.
When `children` has items, each child renders as a `ColumnCell`.

### Two Columns / Three Columns

Pre-split layouts. Each column is a child block with its own
`content` and `style`. The parent block's style controls:

- `padding` — outer spacing
- `backgroundColor` — background for the row
- `gap` — space between columns (via style)
- `borderRadius` — rounding on the container

Each column's text is edited inline. Style changes on the parent
block apply to the wrapper; child styles apply to individual cells.

---

## Style Manager Reference

The Style Manager (right panel) applies properties to the selected
block. All properties are stored in `block.style` and rendered on
canvas via `getWrapperStyle()` + `getContentStyle()`.

### Supported Properties

| Category       | Properties                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| **Background** | `backgroundColor`                                                                               |
| **Typography** | `color`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`, `textDecoration` |
| **Spacing**    | `padding` (4-side), `margin` (4-side)                                                           |
| **Border**     | `borderWidth`, `borderStyle`, `borderColor`, `borderRadius`                                     |
| **Dimensions** | `width`, `maxWidth`, `height`, `opacity`                                                        |

### How Styles Flow

```
StylePanel.onChange
  → onUpdateStyle(blockId, { fontSize: "18px" })
  → useCanvasState.updateBlockStyle
      → updateById(blocks, id, b => ({ ...b, style: { ...b.style, ...patch } }))
      → historyRef.current = pushHistory(...)
      → setEditorState({ document: next })
  → CanvasBlock re-renders
      → BlockVisual applies getWrapperStyle() + getContentStyle()
  → Canvas shows the change immediately
```

### Document-Level Settings

When **no block is selected**, the Style Manager shows document
settings:

| Setting           | Effect                                   |
| ----------------- | ---------------------------------------- |
| Background Colour | `EmailDocument.backgroundColor`          |
| Content Width     | `EmailDocument.contentWidth` (300–900px) |
| Font Family       | `EmailDocument.fontFamily`               |

---

## Keyboard Shortcuts

| Key                    | Action                |
| ---------------------- | --------------------- |
| `Ctrl/⌘ + Z`           | Undo                  |
| `Ctrl/⌘ + Shift + Z`   | Redo                  |
| `Delete` / `Backspace` | Remove selected block |
| `Escape`               | Deselect block        |

---

## Adding a New Block Type

1. **Define the type** in `types.ts`:

   ```ts
   export type BlockType = ... | "myBlock";
   ```

2. **Add the factory** in `blockDefs.tsx`:

   ```ts
   {
     type: "myBlock",
     label: "My Block",
     icon: <MyIcon size={16} />,
     category: "Content",
     create: () => ({
       id: uid(),
       type: "myBlock",
       content: "Default content",
       style: { padding: "16px 24px" },
     }),
   }
   ```

3. **Add the renderer** in `CanvasBlock.tsx` (`BlockVisual` switch):

   ```tsx
   case "myBlock":
     return (
       <div style={{ ...wrapStyle }}>
         <InlineEdit
           html={block.content ?? ""}
           style={{ ...contentStyle }}
           onCommit={(v) => onUpdate({ content: v })}
         />
       </div>
     );
   ```

4. **Add HTML export** in `htmlExport.ts` (`renderBlock` switch):
   ```ts
   case "myBlock":
     return `<div style="${getBlockStyle(block)}">${block.content}</div>`;
   ```

---

## HTML Export

`documentToHtml(doc)` generates email-safe HTML:

- Table-based layout for compatibility
- Inline styles only (no CSS classes)
- Responsive `@media` query for mobile
- All block styles are serialized via `getBlockStyle()`

`documentToPreviewHtml(doc)` generates a lighter version for the
preview iframe (uses `<div>` layout instead of tables).

---

## Common Patterns

### Accessing the current document

```tsx
const { editorState } = useCanvasState(initialDoc);
const doc = editorState.document;
const blocks = doc.blocks;
```

### Programmatic block insertion

```tsx
const { insertBlockAfterSelected } = useCanvasState();
insertBlockAfterSelected("text"); // inserts after selected, or appends
```

### Saving the template

The canvas component exposes `emailDoc` via a `syncDraft` memo:

```tsx
const syncDraft = {
  designJson: emailDoc, // JSON tree (for loading later)
  htmlBody: documentToHtml(emailDoc), // rendered HTML
};
```

## 🛡️ License

© 2026 Ecodrix. All rights reserved.
Proprietary software for Ecodrix Enterprise customers.

---

[Changelog](./CHANGELOG.md) →
