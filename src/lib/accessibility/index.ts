/**
 * Accessibility Module
 * 
 * Provides comprehensive accessibility support for the ErixEditor
 * including ARIA management, screen reader support, focus management,
 * and keyboard navigation.
 */

export {
  AccessibilityManager,
  getAccessibilityManager,
  resetAccessibilityManager,
  type AccessibilityConfig,
  type AnnouncementPriority,
} from './AccessibilityManager';

export {
  KeyboardNavigationHandler,
  type KeyboardShortcut,
  type KeyboardModifier,
} from './KeyboardNavigationHandler';

export {
  FocusManager,
} from './FocusManager';

export {
  useAccessibility,
} from './useAccessibility';
