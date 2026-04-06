# Getting Started with Erix SDK

Follow these steps to integrate Erix into your React application (Vite, Next.js, or Remix).

## 1. Installation

```bash
pnpm add @ecodrix/erix-react @ecodrix/erix-api
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
  return (
    <ErixProvider config={config}>
      {children}
    </ErixProvider>
  );
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
  if (error)   return <div>Error loading leads</div>;

  return (
    <ul>
      {data.map(lead => (
        <li key={lead._id}>{lead.firstName} {lead.lastName}</li>
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

## 5. Next Steps

- [API Reference](./API_REFERENCE.md)
- [Theming & Customization](./THEMING.md)
- [Managing Permissions](./PERMISSIONS.md)
