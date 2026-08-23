/**
 * MobileAdapter - Viewport detection and mobile optimization utilities
 * 
 * Provides mobile detection, touch target validation, and mobile-specific
 * optimizations for the ErixEditor.
 */

export interface MobileAdapterConfig {
  /** Breakpoint for mobile detection in pixels (default: 768) */
  breakpoint: number;
  /** Minimum touch target size in pixels (default: 44) */
  touchTargetSize: number;
  /** Enable haptic feedback for touch interactions (default: true) */
  enableHaptics: boolean;
  /** Prevent viewport zoom on input focus (default: true) */
  preventZoom: boolean;
}

export const DEFAULT_MOBILE_CONFIG: MobileAdapterConfig = {
  breakpoint: 768,
  touchTargetSize: 44,
  enableHaptics: true,
  preventZoom: true,
};

/**
 * MobileAdapter class for managing mobile-specific behavior
 */
export class MobileAdapter {
  private config: MobileAdapterConfig;
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<(isMobile: boolean) => void> = new Set();

  constructor(config: Partial<MobileAdapterConfig> = {}) {
    this.config = { ...DEFAULT_MOBILE_CONFIG, ...config };
    
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia(`(max-width: ${this.config.breakpoint - 1}px)`);
      this.mediaQuery.addEventListener('change', this.handleMediaChange);
    }
  }

  /**
   * Check if current viewport is mobile
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < this.config.breakpoint;
  }

  /**
   * Get current viewport width
   */
  getViewportWidth(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    return window.innerWidth;
  }

  /**
   * Get current viewport height
   */
  getViewportHeight(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    return window.innerHeight;
  }

  /**
   * Check if device supports touch
   */
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - legacy property
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Validate if an element meets minimum touch target size
   */
  validateTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const minSize = this.config.touchTargetSize;
    return rect.width >= minSize && rect.height >= minSize;
  }

  /**
   * Get touch target validation result with details
   */
  getTouchTargetValidation(element: HTMLElement): {
    valid: boolean;
    width: number;
    height: number;
    minSize: number;
  } {
    const rect = element.getBoundingClientRect();
    const minSize = this.config.touchTargetSize;
    return {
      valid: rect.width >= minSize && rect.height >= minSize,
      width: rect.width,
      height: rect.height,
      minSize,
    };
  }

  /**
   * Apply touch optimizations to an element
   */
  applyTouchOptimizations(element: HTMLElement): void {
    if (!this.isMobile() || !this.isTouchDevice()) {
      return;
    }

    // Ensure minimum touch target size
    const validation = this.getTouchTargetValidation(element);
    if (!validation.valid) {
      element.style.minWidth = `${this.config.touchTargetSize}px`;
      element.style.minHeight = `${this.config.touchTargetSize}px`;
    }

    // Add touch-friendly cursor
    element.style.cursor = 'pointer';

    // Prevent text selection on touch
    element.style.userSelect = 'none';
    // @ts-ignore - vendor prefix
    element.style.webkitUserSelect = 'none';
    // @ts-ignore - vendor prefix
    element.style.msUserSelect = 'none';

    // Prevent callout on long press (iOS)
    // @ts-ignore - vendor prefix
    element.style.webkitTouchCallout = 'none';

    // Improve tap responsiveness
    element.style.touchAction = 'manipulation';
  }

  /**
   * Adjust menu position to avoid covering content on mobile
   */
  adjustMenuPosition(
    menu: HTMLElement,
    targetElement: HTMLElement,
    preferredPosition: 'top' | 'bottom' | 'auto' = 'auto'
  ): void {
    if (!this.isMobile()) {
      return;
    }

    const menuRect = menu.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const viewportHeight = this.getViewportHeight();
    const viewportWidth = this.getViewportWidth();

    let position = preferredPosition;

    // Auto-detect best position
    if (position === 'auto') {
      const spaceAbove = targetRect.top;
      const spaceBelow = viewportHeight - targetRect.bottom;
      position = spaceBelow >= menuRect.height || spaceBelow > spaceAbove ? 'bottom' : 'top';
    }

    // Position menu
    if (position === 'bottom') {
      menu.style.top = `${targetRect.bottom + 8}px`;
    } else {
      menu.style.top = `${targetRect.top - menuRect.height - 8}px`;
    }

    // Center horizontally, but keep within viewport
    const centerX = targetRect.left + targetRect.width / 2 - menuRect.width / 2;
    const maxX = viewportWidth - menuRect.width - 16;
    const minX = 16;
    menu.style.left = `${Math.max(minX, Math.min(centerX, maxX))}px`;
  }

  /**
   * Enable bottom sheet positioning for mobile menus
   */
  enableBottomSheet(menu: HTMLElement): void {
    if (!this.isMobile()) {
      return;
    }

    menu.style.position = 'fixed';
    menu.style.bottom = '0';
    menu.style.left = '0';
    menu.style.right = '0';
    menu.style.maxHeight = '70vh';
    menu.style.borderRadius = '16px 16px 0 0';
    menu.style.overflowY = 'auto';
    menu.style.zIndex = '1000';
  }

  /**
   * Prevent viewport zoom on input focus (mobile Safari)
   */
  preventViewportZoom(input: HTMLInputElement | HTMLTextAreaElement): void {
    if (!this.config.preventZoom || !this.isMobile()) {
      return;
    }

    // Set font size to at least 16px to prevent iOS zoom
    const computedStyle = window.getComputedStyle(input);
    const fontSize = parseFloat(computedStyle.fontSize);
    if (fontSize < 16) {
      input.style.fontSize = '16px';
    }
  }

  /**
   * Trigger haptic feedback (if supported)
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.config.enableHaptics || !this.isMobile()) {
      return;
    }

    // Check for Vibration API support
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * Subscribe to mobile state changes
   */
  subscribe(callback: (isMobile: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Handle media query changes
   */
  private handleMediaChange = (event: MediaQueryListEvent): void => {
    const isMobile = event.matches;
    this.listeners.forEach(callback => callback(isMobile));
  };

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleMediaChange);
    }
    this.listeners.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): MobileAdapterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MobileAdapterConfig>): void {
    const oldBreakpoint = this.config.breakpoint;
    this.config = { ...this.config, ...config };

    // Update media query if breakpoint changed
    if (config.breakpoint && config.breakpoint !== oldBreakpoint && typeof window !== 'undefined') {
      if (this.mediaQuery) {
        this.mediaQuery.removeEventListener('change', this.handleMediaChange);
      }
      this.mediaQuery = window.matchMedia(`(max-width: ${this.config.breakpoint - 1}px)`);
      this.mediaQuery.addEventListener('change', this.handleMediaChange);
    }
  }
}

/**
 * Utility function to create a MobileAdapter instance
 */
export function createMobileAdapter(config?: Partial<MobileAdapterConfig>): MobileAdapter {
  return new MobileAdapter(config);
}

/**
 * Utility function to check if viewport is mobile (standalone)
 */
export function isMobile(breakpoint = 768): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < breakpoint;
}

/**
 * Utility function to validate touch target size
 */
export function validateTouchTargetSize(
  element: HTMLElement,
  minSize = 44
): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= minSize && rect.height >= minSize;
}
