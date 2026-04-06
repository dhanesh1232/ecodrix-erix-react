# UI Components Reference

Erix SDK offers high-level components for embedding full CRM and Marketing experiences.

## `ErixDashboard`

The primary dashboard component that includes advanced CRM, WhatsApp, and Analytics views.

```tsx
import { ErixDashboard } from "@ecodrix/erix-react";

export default function MyDashboard() {
  return (
    <div style={{ height: "100vh" }}>
      <ErixDashboard 
        modules={["crm", "whatsapp", "analytics"]} 
        brandName="Salesforce Pro"
      />
    </div>
  );
}
```

### Props

- `modules`: `ErixModule[]` (default: all)
- `brandName`: `string`
- `logoUrl`: `string`
- `onEvent`: `(event: ErixPlatformEvent) => void` (callback)

## `ErixCommandPalette` (⌘K)

A global search and command palette for rapid navigation.

```tsx
import { ErixCommandPalette } from "@ecodrix/erix-react";

function Layout() {
  return (
    <>
      <ErixCommandPalette />
      {/* ... rest of your layout */}
    </>
  );
}
```

## `ErixGuard`

Conditionally render children based on user permissions.

```tsx
<ErixGuard permission="crm.leads.delete">
  <button>Delete</button>
</ErixGuard>
```

---

[Introduction](./INTRODUCTION.md) →
