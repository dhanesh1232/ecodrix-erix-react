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

[Theming & Customization](./THEMING.md) →
