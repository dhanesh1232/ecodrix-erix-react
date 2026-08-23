/**
 * AccessibilityManager
 * 
 * Manages accessibility features for the ErixEditor including:
 * - ARIA label management
 * - Screen reader announcements
 * - Focus trap utilities
 * - Keyboard navigation event handlers
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.8
 */

export interface AccessibilityConfig {
  announceChanges: boolean;
  keyboardShortcuts: boolean;
  focusManagement: boolean;
  highContrastMode: boolean;
}

export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Default configuration for AccessibilityManager
 */
const DEFAULT_CONFIG: AccessibilityConfig = {
  announceChanges: true,
  keyboardShortcuts: true,
  focusManagement: true,
  highContrastMode: false,
};

/**
 * AccessibilityManager class
 * 
 * Provides comprehensive accessibility support for the editor including
 * ARIA attributes, screen reader announcements, focus management, and
 * keyboard navigation.
 */
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private liveRegion: HTMLElement | null = null;
  private focusTrapStack: Array<() => void> = [];
  private ariaLabelMap: WeakMap<HTMLElement, string> = new WeakMap();

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLiveRegion();
  }

  /**
   * Initialize the ARIA live region for screen reader announcements
   * Requirements: 2.3
   */
  private initializeLiveRegion(): void {
    if (typeof document === 'undefined') return;

    // Create a live region for announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'erix-sr-only';
    
    // Position off-screen but accessible to screen readers
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    });

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message to screen readers
   * Requirements: 2.3
   * 
   * @param message - The message to announce
   * @param priority - The announcement priority ('polite' or 'assertive')
   */
  announceToScreenReader(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (!this.config.announceChanges || !this.liveRegion) return;

    // Update the aria-live attribute based on priority
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set the message
    this.liveRegion.textContent = '';
    
    // Use setTimeout to ensure screen readers detect the change
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);

    // Clear the message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 3000);
  }

  /**
   * Manage focus trap within a container element
   * Requirements: 2.8
   * 
   * @param element - The container element to trap focus within
   * @returns A cleanup function to remove the focus trap
   */
  manageFocusTrap(element: HTMLElement): () => void {
    if (!this.config.focusManagement) {
      return () => {};
    }

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(element.querySelectorAll(focusableSelector)) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> focus last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> focus first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Cleanup function
    const cleanup = () => {
      element.removeEventListener('keydown', handleKeyDown);
    };

    this.focusTrapStack.push(cleanup);

    return cleanup;
  }

  /**
   * Apply ARIA labels to toolbar elements
   * Requirements: 2.1
   * 
   * @param toolbar - The toolbar element to apply ARIA labels to
   */
  applyAriaLabels(toolbar: HTMLElement): void {
    // Apply role to toolbar
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Editor formatting toolbar');

    // Find and label all buttons
    const buttons = toolbar.querySelectorAll('button');
    buttons.forEach((button) => {
      // Skip if already has aria-label
      if (button.hasAttribute('aria-label')) return;

      // Try to get label from title, text content, or data attribute
      const label = 
        button.getAttribute('title') ||
        button.getAttribute('data-label') ||
        button.textContent?.trim() ||
        'Button';

      button.setAttribute('aria-label', label);
      this.ariaLabelMap.set(button, label);

      // Add pressed state for toggle buttons
      if (button.hasAttribute('data-toggle')) {
        button.setAttribute('aria-pressed', 'false');
      }
    });

    // Find and label all input elements
    const inputs = toolbar.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      if (input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')) {
        return;
      }

      // Try to find associated label
      const id = input.getAttribute('id');
      if (id) {
        const label = toolbar.querySelector(`label[for="${id}"]`);
        if (label) return; // Already has associated label
      }

      // Add aria-label if no label exists
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    });
  }

  /**
   * Enable keyboard navigation for the editor
   * Requirements: 2.2
   * 
   * Sets up keyboard event handlers for common editor operations
   */
  enableKeyboardNavigation(): void {
    if (!this.config.keyboardShortcuts) return;

    // This method sets up the foundation for keyboard navigation
    // Specific shortcuts are registered through the KeyboardNavigationHandler
    // This ensures all interactive elements are keyboard accessible
    
    // Ensure all interactive elements have proper tabindex
    this.ensureKeyboardAccessibility();
  }

  /**
   * Ensure all interactive elements are keyboard accessible
   * Requirements: 2.2
   */
  private ensureKeyboardAccessibility(): void {
    if (typeof document === 'undefined') return;

    // This will be called on editor initialization
    // to ensure all custom interactive elements are keyboard accessible
    const customInteractiveElements = document.querySelectorAll(
      '[data-interactive]:not([tabindex])'
    );

    customInteractiveElements.forEach((element) => {
      element.setAttribute('tabindex', '0');
    });
  }

  /**
   * Update ARIA pressed state for toggle buttons
   * Requirements: 2.1
   * 
   * @param button - The button element
   * @param pressed - Whether the button is pressed
   */
  updateAriaPressed(button: HTMLElement, pressed: boolean): void {
    button.setAttribute('aria-pressed', pressed.toString());
  }

  /**
   * Update ARIA expanded state for expandable elements
   * Requirements: 2.1
   * 
   * @param element - The element
   * @param expanded - Whether the element is expanded
   */
  updateAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  /**
   * Set ARIA label for an element
   * Requirements: 2.1
   * 
   * @param element - The element
   * @param label - The label text
   */
  setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
    this.ariaLabelMap.set(element, label);
  }

  /**
   * Get ARIA label for an element
   * Requirements: 2.1
   * 
   * @param element - The element
   * @returns The label text or null
   */
  getAriaLabel(element: HTMLElement): string | null {
    return this.ariaLabelMap.get(element) || element.getAttribute('aria-label');
  }

  /**
   * Apply high contrast mode styles
   * Requirements: 2.4
   */
  applyHighContrastMode(): void {
    if (typeof document === 'undefined') return;

    if (this.config.highContrastMode) {
      document.documentElement.classList.add('erix-high-contrast');
    } else {
      document.documentElement.classList.remove('erix-high-contrast');
    }
  }

  /**
   * Set high contrast mode
   * Requirements: 2.4
   * 
   * @param enabled - Whether to enable high contrast mode
   */
  setHighContrastMode(enabled: boolean): void {
    this.config.highContrastMode = enabled;
    this.applyHighContrastMode();
  }

  /**
   * Announce formatting change to screen readers
   * Requirements: 2.3
   * 
   * @param formatType - The type of formatting applied
   * @param applied - Whether the format was applied or removed
   */
  announceFormattingChange(formatType: string, applied: boolean): void {
    const action = applied ? 'applied' : 'removed';
    this.announceToScreenReader(`${formatType} ${action}`, 'polite');
  }

  /**
   * Announce editor state change
   * Requirements: 2.3
   * 
   * @param state - The new editor state
   */
  announceEditorState(state: string): void {
    this.announceToScreenReader(`Editor ${state}`, 'polite');
  }

  /**
   * Announce error to screen readers
   * Requirements: 2.6
   * 
   * @param errorMessage - The error message
   */
  announceError(errorMessage: string): void {
    this.announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
  }

  /**
   * Clean up all focus traps
   */
  cleanupFocusTraps(): void {
    this.focusTrapStack.forEach((cleanup) => cleanup());
    this.focusTrapStack = [];
  }

  /**
   * Destroy the accessibility manager and clean up resources
   */
  destroy(): void {
    // Remove live region
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }

    // Clean up all focus traps
    this.cleanupFocusTraps();

    // Clear aria label map
    this.ariaLabelMap = new WeakMap();
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Re-apply high contrast mode if changed
    if ('highContrastMode' in config) {
      this.applyHighContrastMode();
    }
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }
}

/**
 * Create a singleton instance of AccessibilityManager
 */
let accessibilityManagerInstance: AccessibilityManager | null = null;

/**
 * Get or create the global AccessibilityManager instance
 * 
 * @param config - Optional configuration
 * @returns The AccessibilityManager instance
 */
export function getAccessibilityManager(
  config?: Partial<AccessibilityConfig>
): AccessibilityManager {
  if (!accessibilityManagerInstance) {
    accessibilityManagerInstance = new AccessibilityManager(config);
  } else if (config) {
    accessibilityManagerInstance.updateConfig(config);
  }
  return accessibilityManagerInstance;
}

/**
 * Reset the global AccessibilityManager instance
 * Useful for testing
 */
export function resetAccessibilityManager(): void {
  if (accessibilityManagerInstance) {
    accessibilityManagerInstance.destroy();
    accessibilityManagerInstance = null;
  }
}
