# Mobile Detection and Optimization Module

This module provides comprehensive mobile detection, touch target validation, and mobile-specific UI optimizations for the ErixEditor.

## Features

- **Viewport Detection**: Detect mobile viewports with configurable breakpoints
- **Touch Device Detection**: Identify devices with touch capabilities
- **Touch Target Validation**: Ensure interactive elements meet accessibility standards (44x44px minimum)
- **Mobile Optimizations**: Apply touch-friendly styles and behaviors
- **Menu Positioning**: Smart positioning for mobile menus and popovers
- **Bottom Sheet Support**: Convert menus to bottom sheets on mobile
- **Viewport Zoom Prevention**: Prevent unwanted zoom on input focus (iOS Safari)
- **Haptic Feedback**: Trigger vibration feedback for touch interactions
- **React Hooks**: Easy integration with React components

## Installation

The mobile module is part of `@ecodrix/erix-react`. Import from the package:

```typescript
import { useMobileDetection, MobileAdapter } from '@ecodrix/erix-react/lib/mobile';
```

## Usage

### React Hooks

#### `useMobileDetection()`

The main hook for mobile detection and utilities:

```tsx
import { useMobileDetection } from '@ecodrix/erix-react/lib/mobile';

function MyComponent() {
  const {
    isMobile,
    isTouchDevice,
    viewportWidth,
    viewportHeight,
    validateTouchTarget,
    applyTouchOptimizations,
    adjustMenuPosition,
    enableBottomSheet,
    preventViewportZoom,
    triggerHaptic,
  } = useMobileDetection();

  return (
    <div>
      {isMobile ? <MobileMenu /> : <DesktopMenu />}
    </div>
  );
}
```

#### `useIsMobile()`

Simplified hook that only returns mobile state:

```tsx
import { useIsMobile } from '@ecodrix/erix-react/lib/mobile';

function MyComponent() {
  const isMobile = useIsMobile(); // Default breakpoint: 768px
  const isTablet = useIsMobile(1024); // Custom breakpoint
  
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

#### `useIsTouchDevice()`

Detect touch-capable devices:

```tsx
import { useIsTouchDevice } from '@ecodrix/erix-react/lib/mobile';

function MyComponent() {
  const isTouch = useIsTouchDevice();
  
  return <div>{isTouch ? 'Touch enabled' : 'Mouse/keyboard'}</div>;
}
```

#### `useViewportSize()`

Get current viewport dimensions:

```tsx
import { useViewportSize } from '@ecodrix/erix-react/lib/mobile';

function MyComponent() {
  const { width, height } = useViewportSize();
  
  return <div>Viewport: {width}x{height}</div>;
}
```

### MobileAdapter Class

For more advanced usage, use the `MobileAdapter` class directly:

```typescript
import { MobileAdapter } from '@ecodrix/erix-react/lib/mobile';

const adapter = new MobileAdapter({
  breakpoint: 768,
  touchTargetSize: 44,
  enableHaptics: true,
  preventZoom: true,
});

// Check if mobile
if (adapter.isMobile()) {
  console.log('Mobile viewport detected');
}

// Validate touch target
const button = document.querySelector('button');
if (!adapter.validateTouchTarget(button)) {
  console.warn('Button is too small for touch');
}

// Apply touch optimizations
adapter.applyTouchOptimizations(button);

// Subscribe to viewport changes
const unsubscribe = adapter.subscribe((isMobile) => {
  console.log('Mobile state changed:', isMobile);
});

// Clean up
unsubscribe();
adapter.destroy();
```

## Configuration

### MobileAdapterConfig

```typescript
interface MobileAdapterConfig {
  /** Breakpoint for mobile detection in pixels (default: 768) */
  breakpoint: number;
  
  /** Minimum touch target size in pixels (default: 44) */
  touchTargetSize: number;
  
  /** Enable haptic feedback for touch interactions (default: true) */
  enableHaptics: boolean;
  
  /** Prevent viewport zoom on input focus (default: true) */
  preventZoom: boolean;
}
```

## API Reference

### MobileAdapter Methods

#### `isMobile(): boolean`
Check if current viewport is mobile.

#### `getViewportWidth(): number`
Get current viewport width in pixels.

#### `getViewportHeight(): number`
Get current viewport height in pixels.

#### `isTouchDevice(): boolean`
Check if device supports touch.

#### `validateTouchTarget(element: HTMLElement): boolean`
Validate if element meets minimum touch target size (44x44px).

#### `getTouchTargetValidation(element: HTMLElement)`
Get detailed validation result with dimensions.

```typescript
const result = adapter.getTouchTargetValidation(button);
// { valid: false, width: 30, height: 30, minSize: 44 }
```

#### `applyTouchOptimizations(element: HTMLElement): void`
Apply touch-friendly styles to an element:
- Ensures minimum touch target size
- Adds touch-friendly cursor
- Prevents text selection
- Improves tap responsiveness

#### `adjustMenuPosition(menu: HTMLElement, target: HTMLElement, position?: 'top' | 'bottom' | 'auto'): void`
Position menu relative to target element, avoiding viewport edges.

#### `enableBottomSheet(menu: HTMLElement): void`
Convert menu to bottom sheet on mobile (fixed to bottom of viewport).

#### `preventViewportZoom(input: HTMLInputElement | HTMLTextAreaElement): void`
Prevent iOS Safari zoom on input focus by ensuring font size >= 16px.

#### `triggerHaptic(type?: 'light' | 'medium' | 'heavy'): void`
Trigger haptic feedback (vibration) if supported.

#### `subscribe(callback: (isMobile: boolean) => void): () => void`
Subscribe to mobile state changes. Returns unsubscribe function.

#### `updateConfig(config: Partial<MobileAdapterConfig>): void`
Update adapter configuration.

#### `getConfig(): MobileAdapterConfig`
Get current configuration.

#### `destroy(): void`
Clean up resources and event listeners.

## Utility Functions

### `isMobile(breakpoint?: number): boolean`
Standalone function to check if viewport is mobile.

```typescript
import { isMobile } from '@ecodrix/erix-react/lib/mobile';

if (isMobile()) {
  console.log('Mobile viewport');
}

if (isMobile(1024)) {
  console.log('Viewport < 1024px');
}
```

### `validateTouchTargetSize(element: HTMLElement, minSize?: number): boolean`
Standalone function to validate touch target size.

```typescript
import { validateTouchTargetSize } from '@ecodrix/erix-react/lib/mobile';

const button = document.querySelector('button');
if (!validateTouchTargetSize(button, 44)) {
  console.warn('Button too small');
}
```

## Examples

### Responsive Toolbar

```tsx
import { useMobileDetection } from '@ecodrix/erix-react/lib/mobile';

function Toolbar() {
  const { isMobile, applyTouchOptimizations } = useMobileDetection();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      applyTouchOptimizations(buttonRef.current);
    }
  }, [applyTouchOptimizations]);

  return (
    <div className={isMobile ? 'toolbar-mobile' : 'toolbar-desktop'}>
      <button ref={buttonRef}>Format</button>
    </div>
  );
}
```

### Mobile Menu with Bottom Sheet

```tsx
import { useMobileDetection } from '@ecodrix/erix-react/lib/mobile';

function Menu({ isOpen, onClose }) {
  const { isMobile, enableBottomSheet } = useMobileDetection();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && isMobile && menuRef.current) {
      enableBottomSheet(menuRef.current);
    }
  }, [isOpen, isMobile, enableBottomSheet]);

  return (
    <div ref={menuRef} className="menu">
      {/* Menu content */}
    </div>
  );
}
```

### Touch Target Validation

```tsx
import { useMobileDetection } from '@ecodrix/erix-react/lib/mobile';

function Button({ children }) {
  const { validateTouchTarget, getTouchTargetValidation } = useMobileDetection();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      const validation = getTouchTargetValidation(buttonRef.current);
      if (!validation.valid) {
        console.warn(
          `Button too small: ${validation.width}x${validation.height}px ` +
          `(minimum: ${validation.minSize}px)`
        );
      }
    }
  }, [getTouchTargetValidation]);

  return <button ref={buttonRef}>{children}</button>;
}
```

### Haptic Feedback

```tsx
import { useMobileDetection } from '@ecodrix/erix-react/lib/mobile';

function InteractiveButton({ onClick }) {
  const { triggerHaptic } = useMobileDetection();

  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Accessibility

This module helps meet WCAG 2.1 Level AA requirements:

- **Touch Target Size**: Ensures interactive elements are at least 44x44px (WCAG 2.5.5)
- **Viewport Zoom**: Prevents unwanted zoom while maintaining user control
- **Focus Management**: Works with keyboard navigation and screen readers

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 80+
- Server-side rendering (SSR) compatible

## Performance

- Lightweight: ~2KB gzipped
- Uses native `matchMedia` API for efficient viewport detection
- Minimal re-renders with React hooks
- Automatic cleanup of event listeners

## Testing

Unit tests are provided in `MobileAdapter.test.ts`. Run tests with:

```bash
npm test
# or
pnpm test
```

## Related

- [Requirements Document](../../../.kiro/specs/editor-real-world-improvements/requirements.md) - Requirement 1: Enhanced Mobile Experience
- [Design Document](../../../.kiro/specs/editor-real-world-improvements/design.md) - Mobile Experience Components
