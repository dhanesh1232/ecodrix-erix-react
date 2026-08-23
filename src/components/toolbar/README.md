# ResponsiveToolbar Component

A mobile-responsive toolbar component with adaptive layout, touch-friendly button sizing, and overflow menu support.

## Features

- **Mobile Detection**: Automatically detects mobile viewports using the `useMobileDetection` hook
- **Touch-Friendly Sizing**: Buttons are 44x44px on mobile (WCAG compliant) and smaller on desktop
- **Overflow Strategies**: Three strategies for handling overflow:
  - `dropdown` (default): Collapses overflow items into a "More" menu
  - `scroll`: Horizontal scrolling for all items
  - `collapse`: Wraps items to multiple rows
- **Priority-Based Display**: Controls can be prioritized (high/medium/low) for mobile display
- **Responsive Measurement**: Uses ResizeObserver to dynamically calculate visible controls

## Usage

### Basic Example

```tsx
import { ResponsiveToolbar, ResponsiveToolbarControl } from '@ecodrix/erix-react';
import { Bold, Italic, Underline, Link } from 'lucide-react';

const controls: ResponsiveToolbarControl[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: <Bold size={16} />,
    onClick: () => console.log('Bold clicked'),
    priority: 'high',
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: <Italic size={16} />,
    onClick: () => console.log('Italic clicked'),
    priority: 'high',
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: <Underline size={16} />,
    onClick: () => console.log('Underline clicked'),
    priority: 'medium',
  },
  {
    id: 'link',
    label: 'Insert Link',
    icon: <Link size={16} />,
    onClick: () => console.log('Link clicked'),
    priority: 'low',
  },
];

function MyEditor() {
  return (
    <div>
      <ResponsiveToolbar
        controls={controls}
        overflowStrategy="dropdown"
        minVisibleControls={2}
      />
      {/* Editor content */}
    </div>
  );
}
```

### With Custom Breakpoints

```tsx
<ResponsiveToolbar
  controls={controls}
  breakpoints={{
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  }}
  overflowStrategy="dropdown"
/>
```

### Scroll Strategy (Mobile-Friendly)

```tsx
<ResponsiveToolbar
  controls={controls}
  overflowStrategy="scroll"
/>
```

### Collapse Strategy (Multi-Row)

```tsx
<ResponsiveToolbar
  controls={controls}
  overflowStrategy="collapse"
/>
```

## Props

### ResponsiveToolbarProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `controls` | `ResponsiveToolbarControl[]` | Required | Array of toolbar controls to display |
| `breakpoints` | `{ mobile: number; tablet: number; desktop: number }` | `{ mobile: 768, tablet: 1024, desktop: 1280 }` | Breakpoints for responsive behavior |
| `overflowStrategy` | `'collapse' \| 'scroll' \| 'dropdown'` | `'dropdown'` | Strategy for handling overflow |
| `minVisibleControls` | `number` | `3` | Minimum number of controls to always show |
| `className` | `string` | - | Custom className for the toolbar container |
| `style` | `React.CSSProperties` | - | Custom styles for the toolbar container |
| `ariaLabel` | `string` | `'Responsive toolbar'` | ARIA label for the toolbar |

### ResponsiveToolbarControl

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the control |
| `label` | `string` | Yes | Accessible label for the control |
| `icon` | `React.ReactNode` | Yes | Icon to display in the button |
| `onClick` | `() => void` | No | Click handler for the control |
| `active` | `boolean` | No | Whether the control is in active state |
| `disabled` | `boolean` | No | Whether the control is disabled |
| `priority` | `'high' \| 'medium' \| 'low'` | No | Priority for mobile display (default: `'medium'`) |

## Priority System

On mobile viewports, controls are sorted by priority before being displayed:

- **high**: Always visible if possible (e.g., Bold, Italic)
- **medium**: Visible if space allows (e.g., Underline, Strikethrough)
- **low**: First to be moved to overflow menu (e.g., Advanced formatting)

## Overflow Strategies

### Dropdown (Default)

Best for most use cases. Measures available space and shows as many controls as possible, with overflow items in a "More" menu.

**Pros:**
- Clean, compact interface
- Predictable behavior
- Works well on all screen sizes

**Cons:**
- Requires extra click for overflow items

### Scroll

Allows horizontal scrolling through all controls.

**Pros:**
- All controls visible without extra clicks
- Good for touch devices
- Simple implementation

**Cons:**
- May not be obvious that scrolling is available
- Can be awkward on desktop

### Collapse

Wraps controls to multiple rows when needed.

**Pros:**
- All controls always visible
- No hidden items

**Cons:**
- Takes more vertical space
- Can look cluttered on small screens

## Touch Target Sizing

The component automatically adjusts button sizes based on viewport:

- **Mobile**: 44x44px (WCAG 2.1 Level AA compliant)
- **Desktop**: 26-34px (compact for mouse/trackpad use)

This ensures comfortable touch interaction on mobile devices while maintaining a compact interface on desktop.

## Integration with ErixEditor

The ResponsiveToolbar can be used as a replacement for or alongside the existing ToolbarChain component:

```tsx
import { ErixEditor, ResponsiveToolbar } from '@ecodrix/erix-react';
import { useErixEditor } from '@ecodrix/erix-react';

function MyEditor() {
  const { engine, ctx } = useErixEditor();
  
  const controls = [
    {
      id: 'bold',
      label: 'Bold',
      icon: <Bold size={16} />,
      onClick: () => engine?.bold(),
      active: ctx.bold,
      priority: 'high',
    },
    // ... more controls
  ];

  return (
    <ErixEditor>
      <ResponsiveToolbar controls={controls} />
    </ErixEditor>
  );
}
```

## Accessibility

The ResponsiveToolbar follows WCAG 2.1 Level AA guidelines:

- ✅ Touch targets are at least 44x44px on mobile
- ✅ All controls have accessible labels
- ✅ Keyboard navigation supported
- ✅ ARIA attributes for toolbar and buttons
- ✅ Focus indicators visible
- ✅ Screen reader compatible

## Requirements Satisfied

This component satisfies the following requirements from the editor-real-world-improvements spec:

- **Requirement 1.1**: Mobile viewport detection and responsive layout
- **Requirement 1.8**: Overflow menu for collapsed controls on mobile

## Related Components

- `ToolbarChain`: Existing toolbar with overflow support
- `ToolbarBtn`: Individual toolbar button component
- `useMobileDetection`: Hook for mobile detection and utilities

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

Requires ResizeObserver support (available in all modern browsers).
