# Accessibility Module

Comprehensive accessibility support for the ErixEditor, providing WCAG 2.1 Level AA compliance through ARIA management, screen reader support, focus management, and keyboard navigation.

## Features

- **ARIA Label Management**: Automatic and manual ARIA attribute management
- **Screen Reader Announcements**: Queue-based announcement system with priority levels
- **Focus Management**: Focus trapping, restoration, and visual indicators
- **Keyboard Navigation**: Comprehensive keyboard shortcut system with conflict detection
- **High Contrast Mode**: Support for high contrast visual themes
- **Vim Mode**: Optional vim-style keybindings

## Components

### AccessibilityManager

Core class managing accessibility features.

```typescript
import { AccessibilityManager } from '@ecodrix/erix-react/lib/accessibility';

const manager = new AccessibilityManager({
  announceChanges: true,
  keyboardShortcuts: true,
  focusManagement: true,
  highContrastMode: false,
});

// Announce to screen readers
manager.announceToScreenReader('Content saved', 'polite');

// Apply ARIA labels to toolbar
manager.applyAriaLabels(toolbarElement);

// Manage focus trap
const cleanup = manager.manageFocusTrap(dialogElement);
// Later: cleanup();

// Announce formatting changes
manager.announceFormattingChange('bold', true);
```

### KeyboardNavigationHandler

Manages keyboard shortcuts and navigation.

```typescript
import { KeyboardNavigationHandler } from '@ecodrix/erix-react/lib/accessibility';

const handler = new KeyboardNavigationHandler();

// Register a shortcut
handler.registerShortcut({
  key: 'b',
  modifiers: ['ctrl'],
  action: () => console.log('Bold applied'),
  description: 'Format: Bold',
});

// Get all shortcuts
const shortcuts = handler.getShortcuts();

// Enable vim mode
handler.enableVimMode();

// Format shortcut for display
const formatted = handler.formatShortcut(shortcut); // "Ctrl+B" or "⌘B"
```

### FocusManager

Manages focus states and visual indicators.

```typescript
import { FocusManager } from '@ecodrix/erix-react/lib/accessibility';

const focusManager = new FocusManager();

// Set custom focus indicator style
focusManager.setFocusIndicatorStyle({
  outline: '3px solid blue',
  outlineOffset: '2px',
});

// Trap focus in a container
const cleanup = focusManager.trapFocus(containerElement);

// Restore focus to previous element
focusManager.restoreFocus();

// Navigate focus
focusManager.focusNext();
focusManager.focusPrevious();
```

### useAccessibility Hook

React hook for easy integration.

```typescript
import { useAccessibility } from '@ecodrix/erix-react/lib/accessibility';

function MyComponent() {
  const {
    announce,
    announceFormatting,
    registerShortcut,
    trapFocus,
    ref,
  } = useAccessibility({
    applyAriaLabels: true,
    enableFocusTrap: false,
    shortcuts: [
      {
        key: 'b',
        modifiers: ['ctrl'],
        action: () => applyBold(),
        description: 'Format: Bold',
      },
    ],
  });

  const applyBold = () => {
    // Apply bold formatting
    announceFormatting('bold', true);
  };

  return (
    <div ref={ref}>
      <button onClick={applyBold}>Bold</button>
    </div>
  );
}
```

## Usage Examples

### Basic Setup

```typescript
import { getAccessibilityManager } from '@ecodrix/erix-react/lib/accessibility';

// Get singleton instance
const manager = getAccessibilityManager({
  announceChanges: true,
  keyboardShortcuts: true,
});

// Use throughout your application
manager.announceToScreenReader('Editor loaded', 'polite');
```

### Toolbar with ARIA Labels

```typescript
import { useAccessibility } from '@ecodrix/erix-react/lib/accessibility';

function Toolbar() {
  const { ref } = useAccessibility({
    applyAriaLabels: true,
  });

  return (
    <div ref={ref}>
      <button data-label="Bold">B</button>
      <button data-label="Italic">I</button>
      <button data-label="Underline">U</button>
    </div>
  );
}
```

### Modal with Focus Trap

```typescript
import { useAccessibility } from '@ecodrix/erix-react/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const { ref, restoreFocus } = useAccessibility({
    enableFocusTrap: isOpen,
  });

  const handleClose = () => {
    onClose();
    restoreFocus();
  };

  if (!isOpen) return null;

  return (
    <div ref={ref} role="dialog" aria-modal="true">
      <h2>Modal Title</h2>
      <button onClick={handleClose}>Close</button>
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
import { useAccessibility } from '@ecodrix/erix-react/lib/accessibility';

function Editor() {
  const { registerShortcut, announce } = useAccessibility({
    shortcuts: [
      {
        key: 'b',
        modifiers: ['ctrl'],
        action: () => {
          applyBold();
          announce('Bold applied', 'polite');
        },
        description: 'Format: Bold',
      },
      {
        key: 's',
        modifiers: ['ctrl'],
        action: (e) => {
          e.preventDefault();
          save();
          announce('Document saved', 'polite');
        },
        description: 'Save document',
      },
    ],
  });

  return <div>Editor content</div>;
}
```

### High Contrast Mode

```typescript
import { getAccessibilityManager } from '@ecodrix/erix-react/lib/accessibility';

function ThemeToggle() {
  const manager = getAccessibilityManager();

  const toggleHighContrast = () => {
    const currentMode = manager.getConfig().highContrastMode;
    manager.setHighContrastMode(!currentMode);
  };

  return (
    <button onClick={toggleHighContrast}>
      Toggle High Contrast
    </button>
  );
}
```

## Requirements Mapping

This module implements the following requirements:

- **2.1**: ARIA label attributes for all interactive controls
- **2.2**: Keyboard navigation for all editor features
- **2.3**: Screen reader announcements for formatting changes and editor state
- **2.4**: High contrast mode support
- **2.5**: Visible focus indicators with at least 2px border
- **2.6**: Error announcements to screen readers
- **2.7**: Keyboard shortcut alternatives for all mouse operations
- **2.8**: Focus trap for menus and dialogs

## API Reference

### AccessibilityManager

#### Constructor

```typescript
constructor(config?: Partial<AccessibilityConfig>)
```

#### Methods

- `announceToScreenReader(message: string, priority?: AnnouncementPriority): void`
- `manageFocusTrap(element: HTMLElement): () => void`
- `applyAriaLabels(toolbar: HTMLElement): void`
- `enableKeyboardNavigation(): void`
- `updateAriaPressed(button: HTMLElement, pressed: boolean): void`
- `updateAriaExpanded(element: HTMLElement, expanded: boolean): void`
- `setAriaLabel(element: HTMLElement, label: string): void`
- `getAriaLabel(element: HTMLElement): string | null`
- `setHighContrastMode(enabled: boolean): void`
- `announceFormattingChange(formatType: string, applied: boolean): void`
- `announceEditorState(state: string): void`
- `announceError(errorMessage: string): void`
- `destroy(): void`

### KeyboardNavigationHandler

#### Methods

- `registerShortcut(shortcut: KeyboardShortcut): void`
- `unregisterShortcut(key: string): void`
- `getShortcuts(): KeyboardShortcut[]`
- `getShortcut(key: string): KeyboardShortcut | undefined`
- `hasShortcut(key: string): boolean`
- `setShortcutEnabled(key: string, enabled: boolean): void`
- `enableVimMode(): void`
- `disableVimMode(): void`
- `formatShortcut(shortcut: KeyboardShortcut): string`
- `searchShortcuts(query: string): KeyboardShortcut[]`
- `destroy(): void`

### FocusManager

#### Methods

- `setFocusIndicatorStyle(style: CSSProperties): void`
- `trapFocus(container: HTMLElement): () => void`
- `restoreFocus(element?: HTMLElement): void`
- `addFocusIndicator(element: HTMLElement): void`
- `removeFocusIndicator(element: HTMLElement): void`
- `hasFocus(element: HTMLElement): boolean`
- `getFocusedElement(): HTMLElement | null`
- `focusNext(container?: HTMLElement): void`
- `focusPrevious(container?: HTMLElement): void`
- `destroy(): void`

## Testing

The accessibility module includes comprehensive unit tests. Run tests with:

```bash
npm test -- AccessibilityManager.test.ts
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Screen readers: NVDA, JAWS, VoiceOver

## Contributing

When adding new accessibility features:

1. Ensure WCAG 2.1 Level AA compliance
2. Add appropriate ARIA attributes
3. Test with screen readers
4. Document keyboard shortcuts
5. Add unit tests

## License

MIT
