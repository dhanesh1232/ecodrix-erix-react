/**
 * useAccessibility Hook
 *
 * React hook for integrating accessibility features into components.
 * Provides easy access to AccessibilityManager, KeyboardNavigationHandler,
 * and FocusManager functionality.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.8
 */

import { useEffect, useRef, useCallback } from "react";
import {
  getAccessibilityManager,
  type AccessibilityConfig,
  type AnnouncementPriority,
} from "./AccessibilityManager";
import {
  getKeyboardNavigationHandler,
  type KeyboardShortcut,
} from "./KeyboardNavigationHandler";
import { getFocusManager } from "./FocusManager";

export interface UseAccessibilityOptions {
  /**
   * Configuration for the accessibility manager
   */
  config?: Partial<AccessibilityConfig>;

  /**
   * Whether to apply ARIA labels to the element
   */
  applyAriaLabels?: boolean;

  /**
   * Whether to enable focus trap on the element
   */
  enableFocusTrap?: boolean;

  /**
   * Keyboard shortcuts to register
   */
  shortcuts?: KeyboardShortcut[];
}

export interface UseAccessibilityReturn {
  /**
   * Announce a message to screen readers
   */
  announce: (message: string, priority?: AnnouncementPriority) => void;

  /**
   * Announce a formatting change
   */
  announceFormatting: (formatType: string, applied: boolean) => void;

  /**
   * Announce an error
   */
  announceError: (errorMessage: string) => void;

  /**
   * Register a keyboard shortcut
   */
  registerShortcut: (shortcut: KeyboardShortcut) => void;

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut: (key: string) => void;

  /**
   * Get all registered shortcuts
   */
  getShortcuts: () => KeyboardShortcut[];

  /**
   * Trap focus within the element
   */
  trapFocus: () => () => void;

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus: () => void;

  /**
   * Ref to attach to the element
   */
  ref: React.RefObject<HTMLElement | null>;
}

/**
 * React hook for accessibility features
 *
 * @param options - Configuration options
 * @returns Accessibility utilities and ref
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce, registerShortcut, ref } = useAccessibility({
 *     applyAriaLabels: true,
 *     shortcuts: [
 *       {
 *         key: 'b',
 *         modifiers: ['ctrl'],
 *         action: () => console.log('Bold'),
 *         description: 'Format: Bold',
 *       },
 *     ],
 *   });
 *
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useAccessibility(
  options: UseAccessibilityOptions = {},
): UseAccessibilityReturn {
  const {
    config,
    applyAriaLabels = false,
    enableFocusTrap = false,
    shortcuts = [],
  } = options;

  const ref = useRef<HTMLElement>(null);
  const focusTrapCleanupRef = useRef<(() => void) | null>(null);

  // Get manager instances
  const accessibilityManager = getAccessibilityManager(config);
  const keyboardHandler = getKeyboardNavigationHandler();
  const focusManager = getFocusManager();

  // Apply ARIA labels when element is mounted
  useEffect(() => {
    if (applyAriaLabels && ref.current) {
      accessibilityManager.applyAriaLabels(ref.current);
    }
  }, [applyAriaLabels, accessibilityManager]);

  // Enable focus trap when requested
  useEffect(() => {
    if (enableFocusTrap && ref.current) {
      focusTrapCleanupRef.current = accessibilityManager.manageFocusTrap(
        ref.current,
      );
    }

    return () => {
      if (focusTrapCleanupRef.current) {
        focusTrapCleanupRef.current();
        focusTrapCleanupRef.current = null;
      }
    };
  }, [enableFocusTrap, accessibilityManager]);

  // Register shortcuts on mount
  useEffect(() => {
    shortcuts.forEach((shortcut) => {
      keyboardHandler.registerShortcut(shortcut);
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        const key = [...shortcut.modifiers, shortcut.key.toLowerCase()].join(
          "+",
        );
        keyboardHandler.unregisterShortcut(key);
      });
    };
  }, [shortcuts, keyboardHandler]);

  // Memoized callback functions
  const announce = useCallback(
    (message: string, priority?: AnnouncementPriority) => {
      accessibilityManager.announceToScreenReader(message, priority);
    },
    [accessibilityManager],
  );

  const announceFormatting = useCallback(
    (formatType: string, applied: boolean) => {
      accessibilityManager.announceFormattingChange(formatType, applied);
    },
    [accessibilityManager],
  );

  const announceError = useCallback(
    (errorMessage: string) => {
      accessibilityManager.announceError(errorMessage);
    },
    [accessibilityManager],
  );

  const registerShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      keyboardHandler.registerShortcut(shortcut);
    },
    [keyboardHandler],
  );

  const unregisterShortcut = useCallback(
    (key: string) => {
      keyboardHandler.unregisterShortcut(key);
    },
    [keyboardHandler],
  );

  const getShortcuts = useCallback(() => {
    return keyboardHandler.getShortcuts();
  }, [keyboardHandler]);

  const trapFocus = useCallback(() => {
    if (!ref.current) {
      return () => {};
    }
    return focusManager.trapFocus(ref.current);
  }, [focusManager]);

  const restoreFocus = useCallback(() => {
    focusManager.restoreFocus();
  }, [focusManager]);

  return {
    announce,
    announceFormatting,
    announceError,
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    trapFocus,
    restoreFocus,
    ref,
  };
}
