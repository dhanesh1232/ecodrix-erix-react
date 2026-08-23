# Integration Guide - Zero Style Conflicts

## Quick Start (3 Steps)

### 1. Install the Package

```bash
npm install @ecodrix/erix-react @ecodrix/erix-api
# or
pnpm add @ecodrix/erix-react @ecodrix/erix-api
# or
yarn add @ecodrix/erix-react @ecodrix/erix-api
```

### 2. Import Styles Once

```tsx
// In your root layout or main entry file
import '@ecodrix/erix-react/styles';
```

### 3. Use with ErixContainer

```tsx
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

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

## Why ErixContainer?

`ErixContainer` automatically:
- ✅ Applies the `.erix-app` isolation class
- ✅ Handles dark mode switching
- ✅ Ensures proper CSS scoping
- ✅ Prevents style leakage

## Alternative: Manual Wrapping

If you prefer manual control:

```tsx
<div className="erix-app">
  <ErixDashboard />
</div>

{/* With dark mode */}
<div className="erix-app dark">
  <ErixDashboard />
</div>
```

## Real-World Examples

### Example 1: Next.js with Tailwind CSS

```tsx
// app/layout.tsx
import '@ecodrix/erix-react/styles';
import './globals.css'; // Your own Tailwind styles

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="bg-gray-50"> {/* Your styles work normally */}
        {children}
      </body>
    </html>
  );
}

// app/dashboard/page.tsx
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

export default function DashboardPage() {
  return (
    <div className="p-8"> {/* Your Tailwind classes */}
      <h1 className="text-3xl font-bold mb-4">My Dashboard</h1>
      
      <ErixProvider apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY}>
        <ErixContainer> {/* Erix styles isolated here */}
          <ErixDashboard />
        </ErixContainer>
      </ErixProvider>
      
      <footer className="mt-8 text-gray-600"> {/* Your styles again */}
        © 2024 Your Company
      </footer>
    </div>
  );
}
```

### Example 2: React with Bootstrap

```tsx
// main.tsx
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap
import '@ecodrix/erix-react/styles'; // Erix styles
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

function App() {
  return (
    <div className="container"> {/* Bootstrap container */}
      <nav className="navbar navbar-light bg-light"> {/* Bootstrap navbar */}
        <span className="navbar-brand">My App</span>
      </nav>
      
      <div className="row mt-4">
        <div className="col-12">
          <ErixProvider apiKey="your-api-key">
            <ErixContainer> {/* Erix isolated */}
              <ErixDashboard />
            </ErixContainer>
          </ErixProvider>
        </div>
      </div>
    </div>
  );
}
```

### Example 3: Multiple Erix Components

```tsx
import { 
  ErixProvider, 
  ErixContainer, 
  ErixDashboard,
  WhatsAppInbox,
  ErixEditor 
} from '@ecodrix/erix-react';

function App() {
  return (
    <ErixProvider apiKey="your-api-key">
      <div className="my-app-layout">
        
        {/* Editor in light mode */}
        <section className="editor-section">
          <ErixContainer>
            <ErixEditor />
          </ErixContainer>
        </section>
        
        {/* Dashboard in dark mode */}
        <section className="dashboard-section">
          <ErixContainer darkMode>
            <ErixDashboard />
          </ErixContainer>
        </section>
        
        {/* WhatsApp in light mode */}
        <section className="chat-section">
          <ErixContainer>
            <WhatsAppInbox />
          </ErixContainer>
        </section>
        
      </div>
    </ErixProvider>
  );
}
```

### Example 4: Conditional Dark Mode

```tsx
import { useState } from 'react';
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

function App() {
  const [isDark, setIsDark] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle Dark Mode
      </button>
      
      <ErixProvider apiKey="your-api-key">
        <ErixContainer darkMode={isDark}>
          <ErixDashboard />
        </ErixContainer>
      </ErixProvider>
    </div>
  );
}
```

### Example 5: Custom Styling the Container

```tsx
import { ErixProvider, ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

function App() {
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer 
        className="my-custom-wrapper rounded-lg shadow-xl p-4"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        <ErixDashboard />
      </ErixContainer>
    </ErixProvider>
  );
}
```

## Advanced: Using Different Components

### CRM Module

```tsx
import { ErixProvider, ErixContainer, KanbanBoard } from '@ecodrix/erix-react';

function CRMPage() {
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer>
        <KanbanBoard />
      </ErixContainer>
    </ErixProvider>
  );
}
```

### WhatsApp Module

```tsx
import { ErixProvider, ErixContainer, WhatsAppInbox } from '@ecodrix/erix-react';

function WhatsAppPage() {
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer className="h-screen">
        <WhatsAppInbox />
      </ErixContainer>
    </ErixProvider>
  );
}
```

### Rich Text Editor

```tsx
import { ErixProvider, ErixContainer, ErixEditor } from '@ecodrix/erix-react';

function EditorPage() {
  const [content, setContent] = useState('');
  
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer>
        <ErixEditor 
          value={content}
          onChange={setContent}
        />
      </ErixContainer>
    </ErixProvider>
  );
}
```

## Peer Dependencies

The package requires these peer dependencies (install them in your project):

```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "next": ">=16.0.0",
  "framer-motion": ">=12.0.0",
  "lucide-react": "^0.552.0",
  "@radix-ui/react-*": "latest"
}
```

Most are likely already in your project. Install missing ones:

```bash
npm install react react-dom framer-motion lucide-react
```

## TypeScript Support

Full TypeScript support is included:

```tsx
import type { ErixContainerProps, ErixDashboardProps } from '@ecodrix/erix-react';

const containerProps: ErixContainerProps = {
  darkMode: true,
  className: 'my-wrapper'
};
```

## Performance Tips

### 1. Import Styles Once

```tsx
// ✅ Good - Import once at root
// app/layout.tsx
import '@ecodrix/erix-react/styles';

// ❌ Bad - Don't import in every component
// components/Dashboard.tsx
import '@ecodrix/erix-react/styles'; // Don't do this
```

### 2. Code Splitting

```tsx
// Lazy load Erix components for better performance
import { lazy, Suspense } from 'react';
import { ErixProvider, ErixContainer } from '@ecodrix/erix-react';

const ErixDashboard = lazy(() => 
  import('@ecodrix/erix-react').then(mod => ({ default: mod.ErixDashboard }))
);

function App() {
  return (
    <ErixProvider apiKey="your-api-key">
      <ErixContainer>
        <Suspense fallback={<div>Loading...</div>}>
          <ErixDashboard />
        </Suspense>
      </ErixContainer>
    </ErixProvider>
  );
}
```

### 3. Module-Specific Imports

Import only what you need:

```tsx
// ✅ Good - Import specific modules
import { KanbanBoard } from '@ecodrix/erix-react/crm';
import { WhatsAppInbox } from '@ecodrix/erix-react/whatsapp';
import { ErixEditor } from '@ecodrix/erix-react/editor';

// ❌ Less optimal - Import everything
import { KanbanBoard, WhatsAppInbox, ErixEditor } from '@ecodrix/erix-react';
```

## Troubleshooting

### Issue: Styles not applying

**Solution**: Make sure you imported styles and used ErixContainer

```tsx
// Add this to your root file
import '@ecodrix/erix-react/styles';

// Wrap components
<ErixContainer>
  <YourComponent />
</ErixContainer>
```

### Issue: Styles conflicting with my app

**Solution**: This shouldn't happen. Verify:
1. You're using `ErixContainer` or `.erix-app` wrapper
2. You're on the latest version: `npm install @ecodrix/erix-react@latest`
3. Clear your build cache: `rm -rf .next` or `rm -rf dist`

### Issue: Dark mode not working

**Solution**: Use the `darkMode` prop

```tsx
<ErixContainer darkMode>
  <YourComponent />
</ErixContainer>
```

### Issue: TypeScript errors

**Solution**: Install type definitions

```bash
npm install --save-dev @types/react @types/react-dom
```

## Migration from Old Versions

If upgrading from v0.1.x or v0.2.0-0.2.2:

```tsx
// Old way (had style conflicts)
<ErixDashboard />

// New way (isolated)
<ErixContainer>
  <ErixDashboard />
</ErixContainer>
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android latest

## Bundle Size

- Core: ~45KB gzipped
- Styles: ~12KB gzipped
- Total: ~57KB gzipped (with tree-shaking)

## Need Help?

- 📖 [Full Documentation](https://docs.ecodrix.com)
- 💬 [Discord Community](https://discord.gg/ecodrix)
- 🐛 [Report Issues](https://github.com/ecodrix/erix-react/issues)
- 📧 [Email Support](mailto:support@ecodrix.com)
