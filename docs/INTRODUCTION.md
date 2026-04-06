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

[Getting Started](./GETTING_STARTED.md) →
