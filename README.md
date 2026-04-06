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
pnpm add @ecodrix/erix-react @ecodrix/erix-api
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

## 📚 Documentation

For complete integration guides, check the `docs/` folder:

1. [**Introduction**](./docs/INTRODUCTION.md) — Why Erix?
2. [**Getting Started**](./docs/GETTING_STARTED.md) — 5-minute setup.
3. [**API Reference**](./docs/API_REFERENCE.md) — All hooks and options.
4. [**Theming & Branding**](./docs/THEMING.md) — Dark mode & whitelabeling.
5. [**Permissions (RBAC)**](./docs/PERMISSIONS.md) — Securing your dashboard.

## ⚙️ Modules

| Module        | Resource                   | Features                                |
| :------------ | :------------------------- | :-------------------------------------- |
| **CRM**       | `leads`, `pipelines`       | Pipelines, Leads, Forecasts, Activities |
| **WhatsApp**  | `messages`, `templates`    | Unified inbox, broadcasts, templates    |
| **Marketing** | `campaigns`, `automations` | Drip sequences, flow tracking           |
| **Meetings**  | `schedule`, `billing`      | Google Meet, Stripe-tier payments       |

## 🛡️ License

© 2026 Ecodrix. All rights reserved.
Proprietary software for Ecodrix Enterprise customers.

---

[Changelog](./CHANGELOG.md) →
