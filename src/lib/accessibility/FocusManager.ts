/**
 * FocusManager
 * 
 * Manages focus states and visual indicators for the editor.
 * Provides utilities for focus trapping, focus restoration, and
 * custom focus indicator styling.
 * 
 * Requirements: 2.5, 2.8
 */

import type { CSSProperties } from 'react';

/**
 * FocusManager class
 * 
 * Handles focus management including focus indicators, focus trapping,
 * and focus restoration for the editor.
 */
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private focusIndicatorStyle: CSSProperties = {};
  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    this.initializeDefaultStyles();
  }

  /**
   * Initialize default focus indicator styles
   * Requirements: 2.5
   */
  private initializeDefaultStyles(): void {
    if (typeof document === 'undefined') return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'erix-focus-manager-styles';
    
    // Default focus indicator: 2px solid border with high contrast
    const defaultStyles = `
      .erix-focus-indicator:focus,
      .erix-focus-indicator:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
        border-radius: 2px;
      }

      .erix-focus-indicator:focus:not(:focus-visible) {
        outline: none;
      }

      /* High contrast mode focus indicators */
      .erix-high-contrast .erix-focus-indicator:focus,
      .erix-high-contrast .erix-focus-indicator:focus-visible {
        outline: 3px solid currentColor;
        outline-offset: 3px;
      }
    `;

    this.styleElement.textContent = defaultStyles;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Set custom focus indicator style
   * Requirements: 2.5
   * 
   * @param style - CSS properties for the focus indicator
   */
  setFocusIndicatorStyle(style: CSSProperties): void {
    this.focusIndicatorStyle = style;
    this.updateFocusIndicatorStyles();
  }

  /**
   * Update the focus indicator styles in the DOM
   */
  private updateFocusIndicatorStyles(): void {
    if (!this.styleElement) return;

    const cssProperties = Object.entries(this.focusIndicatorStyle)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join('\n        ');

    const customStyles = `
      .erix-focus-indicator:focus,
      .erix-focus-indicator:focus-visible {
        ${cssProperties}
      }
    `;

    this.styleElement.textContent = customStyles;
  }

  /**
   * Trap focus within a container element
   * Requirements: 2.8
   * 
   * @param container - The container element to trap focus within
   * @returns A cleanup function to remove the focus trap
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift + Tab on first element -> focus last element
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> focus first element
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Store the currently focused element
    const previouslyFocused = document.activeElement as HTMLElement;
    if (previouslyFocused) {
      this.focusHistory.push(previouslyFocused);
    }

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Restore focus to a previously focused element
   * Requirements: 2.8
   * 
   * @param element - The element to restore focus to (optional)
   */
  restoreFocus(element?: HTMLElement): void {
    const targetElement = element || this.focusHistory.pop();
    
    if (targetElement && typeof targetElement.focus === 'function') {
      // Use setTimeout to ensure the element is ready to receive focus
      setTimeout(() => {
        targetElement.focus();
      }, 0);
    }
  }

  /**
   * Add focus indicator class to an element
   * Requirements: 2.5
   * 
   * @param element - The element to add the focus indicator to
   */
  addFocusIndicator(element: HTMLElement): void {
    element.classList.add('erix-focus-indicator');
  }

  /**
   * Remove focus indicator class from an element
   * 
   * @param element - The element to remove the focus indicator from
   */
  removeFocusIndicator(element: HTMLElement): void {
    element.classList.remove('erix-focus-indicator');
  }

  /**
   * Check if an element has focus
   * 
   * @param element - The element to check
   * @returns True if the element has focus
   */
  hasFocus(element: HTMLElement): boolean {
    return document.activeElement === element;
  }

  /**
   * Get the currently focused element
   * 
   * @returns The currently focused element or null
   */
  getFocusedElement(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  }

  /**
   * Move focus to the next focusable element
   * 
   * @param container - Optional container to limit the search
   */
  focusNext(container?: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (focusableElements.length > 0) {
      // Wrap to first element
      focusableElements[0].focus();
    }
  }

  /**
   * Move focus to the previous focusable element
   * 
   * @param container - Optional container to limit the search
   */
  focusPrevious(container?: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (focusableElements.length > 0) {
      // Wrap to last element
      focusableElements[focusableElements.length - 1].focus();
    }
  }

  /**
   * Get all focusable elements within a container
   * 
   * @param container - The container to search within (defaults to document)
   * @returns Array of focusable elements
   */
  private getFocusableElements(container?: HTMLElement): HTMLElement[] {
    const root = container || document.body;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(root.querySelectorAll(focusableSelector)) as HTMLElement[];
  }

  /**
   * Clear focus history
   */
  clearFocusHistory(): void {
    this.focusHistory = [];
  }

  /**
   * Get focus history
   * 
   * @returns Array of previously focused elements
   */
  getFocusHistory(): HTMLElement[] {
    return [...this.focusHistory];
  }

  /**
   * Destroy the focus manager and clean up resources
   */
  destroy(): void {
    // Remove style element
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }

    // Clear focus history
    this.clearFocusHistory();
  }
}

/**
 * Create a singleton instance of FocusManager
 */
let focusManagerInstance: FocusManager | null = null;

/**
 * Get or create the global FocusManager instance
 * 
 * @returns The FocusManager instance
 */
export function getFocusManager(): FocusManager {
  if (!focusManagerInstance) {
    focusManagerInstance = new FocusManager();
  }
  return focusManagerInstance;
}

/**
 * Reset the global FocusManager instance
 * Useful for testing
 */
export function resetFocusManager(): void {
  if (focusManagerInstance) {
    focusManagerInstance.destroy();
    focusManagerInstance = null;
  }
}
