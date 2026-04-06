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

[Theming](./THEMING.md) →
