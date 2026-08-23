# Quick Reference - Style Isolation

## Installation

```bash
npm install @ecodrix/erix-react @ecodrix/erix-api
```

## Basic Usage

```tsx
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';
import '@ecodrix/erix-react/styles';

function App() {
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
    </ErixProvider>
  );
}
```

## Dark Mode

```tsx
<ErixContainer darkMode>
  <ErixDashboard />
</ErixContainer>
```

## Multiple Instances

```tsx
<ErixContainer>
  <ErixEditor />
</ErixContainer>

<ErixContainer darkMode>
  <WhatsAppInbox />
</ErixContainer>
```

## Custom Styling

```tsx
<ErixContainer className="my-wrapper" style={{ maxWidth: '1200px' }}>
  <ErixDashboard />
</ErixContainer>
```

## Module-Specific Imports

```tsx
import { KanbanBoard } from '@ecodrix/erix-react/crm';
import { WhatsAppInbox } from '@ecodrix/erix-react/whatsapp';
import { ErixEditor } from '@ecodrix/erix-react/editor';
```

## Manual Wrapping (Alternative)

```tsx
<div className="erix-app">
  <ErixDashboard />
</div>

{/* With dark mode */}
<div className="erix-app dark">
  <ErixDashboard />
</div>
```

## Common Patterns

### Next.js App Router

```tsx
// app/layout.tsx
import '@ecodrix/erix-react/styles';

// app/dashboard/page.tsx
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

export default function Page() {
  return (
    <ErixProvider apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY}>
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
    </ErixProvider>
  );
}
```

### Vite/CRA

```tsx
// main.tsx
import '@ecodrix/erix-react/styles';
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

function App() {
  return (
    <ErixProvider apiKey={import.meta.env.VITE_ERIX_API_KEY}>
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
    </ErixProvider>
  );
}
```

## Troubleshooting

### Styles not applying?
✅ Import styles: `import '@ecodrix/erix-react/styles';`  
✅ Use `ErixContainer` or `.erix-app` wrapper

### Styles conflicting?
✅ Update to latest version  
✅ Clear build cache  
✅ Verify proper wrapping

### Dark mode not working?
✅ Use `darkMode` prop: `<ErixContainer darkMode>`

## Key Rules

1. ✅ Always wrap components in `ErixContainer` or `.erix-app`
2. ✅ Import styles once at app root
3. ✅ Use `darkMode` prop for dark mode
4. ✅ Don't modify `.erix-app` styles
5. ✅ Don't override `--erix-*` variables

## Documentation

- 📖 [Style Isolation Guide](./STYLE-ISOLATION.md)
- 📖 [Integration Guide](./INTEGRATION-GUIDE.md)
- 📖 [Testing Guide](./TESTING-STYLE-ISOLATION.md)
- 📖 [Implementation Summary](./STYLE-ISOLATION-SUMMARY.md)

## Support

- 💬 [Discord](https://discord.gg/ecodrix)
- 🐛 [GitHub Issues](https://github.com/ecodrix/erix-react/issues)
- 📧 [Email](mailto:support@ecodrix.com)
