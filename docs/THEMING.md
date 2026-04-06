# Theming & Customization

Erix SDK uses a **CSS Variables**-based design system that adapts to your host application's appearance.

## 1. Dark Mode Support

Pass the `theme` prop to `ErixProvider` to sync the SDK with your app's global state.

```tsx
const [theme, setTheme] = useState("dark");

return (
  <ErixProvider config={{ theme }}>
    <App />
  </ErixProvider>
);
```

## 2. Branding (Whitelabeling)

The SDK supports custom branding for the `ErixDashboard` and `ErixCommandPalette`.

```tsx
const config = {
  branding: {
    logoUrl: "https://cdn.your-app.com/logo.png",
    appName: "SaaS CRM Pro",
  },
};
```

## 3. UI Token Overrides

You can customize the SDK's look and feel by overriding the following CSS variables in your `index.css`:

```css
:root {
  /* Core brand colors */
  --erix-primary: #0070f3;
  --erix-primary-foreground: #ffffff;
  
  /* Borders and roundness */
  --erix-radius: 0.5rem;
  --erix-border: #e5e7eb;
  
  /* Fonts */
  --erix-font-sans: "Inter", sans-serif;
}

[data-erix-platform-theme="dark"] {
  --erix-background: #000000;
  --erix-foreground: #ffffff;
}
```

---

[Lead Lifecycle](./hooks/CRM.md) →
