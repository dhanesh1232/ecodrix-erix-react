# WhatsApp Integration Hooks

Erix SDK includes a powerful WhatsApp Cloud API wrapper that handles messages, templates, and marketing broadcasts.

## `useConversations`

Listen for live WhatsApp conversations across all your numbers.

```tsx
const { data: conversations, loading, error } = useConversations({
  status: "open",
  limit: 20,
});
```

### Real-time Sync

Conversations and their `unreadCount` are automatically synced with the Ecodrix Backend via Socket.IO. When a new message arrives, the hook updates its local state without a refetch.

## `useMessages`

Fetch the full message history for a specific phone number or conversation ID.

```tsx
const { data: messages, sendMessage, sendTemplate } = useMessages(conversationId);

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

[UI Components](../COMPONENTS.md) →
