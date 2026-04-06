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

[WhatsApp Conversations](../hooks/WHATSAPP.md) →
