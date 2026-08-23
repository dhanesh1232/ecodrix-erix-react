# Style Isolation Guide for @ecodrix/erix-react

## Overview

This package is designed to be **completely style-isolated** from host projects. All styles are scoped to the `.erix-app` container class and use the `erix-` prefix for Tailwind utilities.

## Key Features

✅ **No Global Style Pollution**: All styles are scoped to `.erix-app` container  
✅ **Prefixed Utilities**: All Tailwind classes use `erix-` prefix  
✅ **Scoped CSS Variables**: All CSS variables are scoped to `.erix-app`  
✅ **No Preflight Reset**: Tailwind's global reset is disabled  
✅ **Isolated Context**: Uses CSS `isolation: isolate` for stacking context  
✅ **Portal Support**: Radix UI portals are properly scoped  

## Usage in Host Projects

### Basic Setup

```tsx
import { ErixProvider, ErixDashboard } from '@ecodrix/erix-react';
import '@ecodrix/erix-react/styles'; // Import styles once in your app

function App() {
  return (
    <ErixProvider apiKey="your-api-key">
      {/* Wrap components in .erix-app container */}
      <div className="erix-app">
        <ErixDashboard />
      </div>
    </ErixProvider>
  );
}
```

### Important: Always Use `.erix-app` Container

**❌ Wrong - Will not work correctly:**
```tsx
<ErixDashboard />
```

**✅ Correct - Properly scoped:**
```tsx
<div className="erix-app">
  <ErixDashboard />
</div>
```

### Dark Mode Support

```tsx
{/* Light mode */}
<div className="erix-app">
  <ErixDashboard />
</div>

{/* Dark mode */}
<div className="erix-app dark">
  <ErixDashboard />
</div>
```

### Multiple Instances

You can have multiple isolated instances on the same page:

```tsx
<div className="erix-app">
  <ErixEditor />
</div>

<div className="erix-app dark">
  <WhatsAppInbox />
</div>
```

## How It Works

### 1. Tailwind Configuration

```js
{
  prefix: "erix-",                    // All utilities: erix-flex, erix-p-4, etc.
  important: ".erix-app",             // Increase specificity
  darkMode: ["selector", ".erix-app.dark"],
  corePlugins: {
    preflight: false                  // Disable global reset
  }
}
```

### 2. CSS Variable Scoping

All CSS variables are scoped to `.erix-app`:

```css
.erix-app {
  --erix-background: 0 0% 100%;
  --erix-foreground: 222.2 84% 4.9%;
  /* ... all other variables */
}
```

### 3. Base Styles Scoping

All reset styles are scoped:

```css
.erix-app * {
  box-sizing: border-box;
  /* ... */
}

.erix-app button {
  /* ... */
}
```

## Compatibility

### Works With Any Framework

- ✅ Next.js (App Router & Pages Router)
- ✅ React (Create React App, Vite)
- ✅ Remix
- ✅ Gatsby
- ✅ Any React-based framework

### Works With Any CSS Framework

- ✅ Tailwind CSS (any version)
- ✅ Bootstrap
- ✅ Material-UI
- ✅ Chakra UI
- ✅ Vanilla CSS
- ✅ CSS Modules
- ✅ Styled Components
- ✅ Emotion

## Troubleshooting

### Styles Not Applying

**Problem**: Components look unstyled  
**Solution**: Make sure you've imported the styles and wrapped components in `.erix-app`

```tsx
import '@ecodrix/erix-react/styles'; // Add this

<div className="erix-app"> {/* Add this wrapper */}
  <YourComponent />
</div>
```

### Styles Conflicting with Host

**Problem**: Erix styles affecting host project  
**Solution**: This shouldn't happen if properly configured. Check:

1. Styles are imported only once
2. All components are wrapped in `.erix-app`
3. You're using the latest version of the package

### Dark Mode Not Working

**Problem**: Dark mode styles not applying  
**Solution**: Add `dark` class to `.erix-app` container

```tsx
<div className="erix-app dark">
  <YourComponent />
</div>
```

### Radix UI Portals (Dialogs, Popovers, etc.)

Radix UI components that use portals (Dialog, Popover, Tooltip, etc.) are automatically scoped. No additional configuration needed.

## Performance

- **Bundle Size**: Styles are tree-shaken and minified
- **CSS Specificity**: Optimized with `important: ".erix-app"`
- **Runtime**: Zero runtime overhead for style isolation
- **Loading**: Styles are loaded once and cached

## Migration from Previous Versions

If you're upgrading from a version that had style conflicts:

1. **Update the package**: `npm install @ecodrix/erix-react@latest`
2. **Rebuild your project**: Clear cache and rebuild
3. **Verify wrapping**: Ensure all components are wrapped in `.erix-app`
4. **Test thoroughly**: Check for any style regressions

## Best Practices

### ✅ Do

- Always wrap components in `.erix-app`
- Import styles once at the app root
- Use the provided dark mode class
- Keep the wrapper as close to components as possible

### ❌ Don't

- Don't modify `.erix-app` styles in your project
- Don't override `--erix-*` CSS variables globally
- Don't remove the `.erix-app` wrapper
- Don't import styles multiple times

## Example Implementations

### Next.js App Router

```tsx
// app/layout.tsx
import '@ecodrix/erix-react/styles';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// app/dashboard/page.tsx
import { ErixProvider, ErixDashboard } from '@ecodrix/erix-react';

export default function DashboardPage() {
  return (
    <ErixProvider apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY}>
      <div className="erix-app">
        <ErixDashboard />
      </div>
    </ErixProvider>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import '@ecodrix/erix-react/styles';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// pages/dashboard.tsx
import { ErixProvider, ErixDashboard } from '@ecodrix/erix-react';

export default function Dashboard() {
  return (
    <ErixProvider apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY}>
      <div className="erix-app">
        <ErixDashboard />
      </div>
    </ErixProvider>
  );
}
```

### Vite/CRA

```tsx
// main.tsx / index.tsx
import '@ecodrix/erix-react/styles';
import { ErixProvider, ErixDashboard } from '@ecodrix/erix-react';

function App() {
  return (
    <ErixProvider apiKey={import.meta.env.VITE_ERIX_API_KEY}>
      <div className="erix-app">
        <ErixDashboard />
      </div>
    </ErixProvider>
  );
}
```

## Support

If you encounter any style isolation issues:

1. Check this guide first
2. Verify you're using the latest version
3. Open an issue on GitHub with:
   - Your framework and version
   - CSS framework you're using
   - Minimal reproduction example

## Technical Details

### CSS Cascade Layers

We don't use `@layer` for maximum compatibility with different CSS frameworks.

### Specificity Strategy

- Base specificity: `.erix-app .erix-component`
- Utility specificity: `.erix-app .erix-flex` (with `important`)
- Portal specificity: `[data-radix-portal] .erix-portal-content`

### Build Output

The package exports:
- `dist/es/index.css` - All styles bundled and minified
- Imported via `@ecodrix/erix-react/styles`

## Version History

- **v0.2.3+**: Complete style isolation with scoped base styles
- **v0.2.0-0.2.2**: Partial isolation (had some conflicts)
- **v0.1.x**: No isolation (not recommended)
