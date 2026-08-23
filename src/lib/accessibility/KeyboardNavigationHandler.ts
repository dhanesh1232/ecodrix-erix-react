/**
 * KeyboardNavigationHandler
 * 
 * Manages keyboard shortcuts and navigation for the editor.
 * Provides a centralized system for registering, managing, and executing
 * keyboard shortcuts with conflict detection.
 * 
 * Requirements: 2.2, 2.7, 17.1, 17.2
 */

export type KeyboardModifier = 'ctrl' | 'shift' | 'alt' | 'meta';

export interface KeyboardShortcut {
  key: string;
  modifiers: KeyboardModifier[];
  action: (event: KeyboardEvent) => void;
  description: string;
  enabled?: boolean;
}

interface ShortcutKey {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * KeyboardNavigationHandler class
 * 
 * Handles keyboard shortcuts and navigation for the editor.
 * Supports shortcut registration, conflict detection, and execution.
 */
export class KeyboardNavigationHandler {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;
  private vimModeEnabled: boolean = false;
  private eventListener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.initializeEventListener();
  }

  /**
   * Initialize the global keyboard event listener
   * Requirements: 2.2
   */
  private initializeEventListener(): void {
    if (typeof window === 'undefined') return;

    this.eventListener = (event: KeyboardEvent) => {
      if (!this.isEnabled) return;

      const shortcutKey = this.createShortcutKey(event);
      const keyString = this.shortcutKeyToString(shortcutKey);
      const shortcut = this.shortcuts.get(keyString);

      if (shortcut && shortcut.enabled !== false) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action(event);
      }
    };

    window.addEventListener('keydown', this.eventListener);
  }

  /**
   * Create a shortcut key object from a keyboard event
   * 
   * @param event - The keyboard event
   * @returns The shortcut key object
   */
  private createShortcutKey(event: KeyboardEvent): ShortcutKey {
    return {
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
  }

  /**
   * Convert a shortcut key object to a string representation
   * 
   * @param shortcutKey - The shortcut key object
   * @returns The string representation
   */
  private shortcutKeyToString(shortcutKey: ShortcutKey): string {
    const parts: string[] = [];
    
    if (shortcutKey.ctrl) parts.push('ctrl');
    if (shortcutKey.shift) parts.push('shift');
    if (shortcutKey.alt) parts.push('alt');
    if (shortcutKey.meta) parts.push('meta');
    parts.push(shortcutKey.key);

    return parts.join('+');
  }

  /**
   * Convert a KeyboardShortcut to a string key
   * 
   * @param shortcut - The keyboard shortcut
   * @returns The string key
   */
  private shortcutToKey(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): string {
    const parts: string[] = [];
    
    if (shortcut.modifiers.includes('ctrl')) parts.push('ctrl');
    if (shortcut.modifiers.includes('shift')) parts.push('shift');
    if (shortcut.modifiers.includes('alt')) parts.push('alt');
    if (shortcut.modifiers.includes('meta')) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Register a keyboard shortcut
   * Requirements: 17.1
   * 
   * @param shortcut - The keyboard shortcut to register
   * @throws Error if a conflicting shortcut already exists
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.shortcutToKey(shortcut);

    // Check for conflicts
    if (this.shortcuts.has(key)) {
      const existing = this.shortcuts.get(key);
      console.warn(
        `Keyboard shortcut conflict detected: ${key}. ` +
        `Existing: "${existing?.description}", New: "${shortcut.description}". ` +
        `The new shortcut will override the existing one.`
      );
    }

    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   * Requirements: 17.1
   * 
   * @param key - The key string or shortcut object
   */
  unregisterShortcut(key: string | Omit<KeyboardShortcut, 'action' | 'description'>): void {
    const keyString = typeof key === 'string' ? key : this.shortcutToKey(key);
    this.shortcuts.delete(keyString);
  }

  /**
   * Get all registered shortcuts
   * Requirements: 17.3
   * 
   * @returns Array of all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get a specific shortcut by key
   * 
   * @param key - The key string or shortcut object
   * @returns The keyboard shortcut or undefined
   */
  getShortcut(key: string | Omit<KeyboardShortcut, 'action' | 'description'>): KeyboardShortcut | undefined {
    const keyString = typeof key === 'string' ? key : this.shortcutToKey(key);
    return this.shortcuts.get(keyString);
  }

  /**
   * Check if a shortcut exists
   * 
   * @param key - The key string or shortcut object
   * @returns True if the shortcut exists
   */
  hasShortcut(key: string | Omit<KeyboardShortcut, 'action' | 'description'>): boolean {
    const keyString = typeof key === 'string' ? key : this.shortcutToKey(key);
    return this.shortcuts.has(keyString);
  }

  /**
   * Enable or disable a specific shortcut
   * 
   * @param key - The key string or shortcut object
   * @param enabled - Whether to enable the shortcut
   */
  setShortcutEnabled(
    key: string | Omit<KeyboardShortcut, 'action' | 'description'>,
    enabled: boolean
  ): void {
    const keyString = typeof key === 'string' ? key : this.shortcutToKey(key);
    const shortcut = this.shortcuts.get(keyString);
    
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  /**
   * Enable vim-style keybindings
   * Requirements: 17.6
   */
  enableVimMode(): void {
    this.vimModeEnabled = true;
    this.registerVimShortcuts();
  }

  /**
   * Disable vim-style keybindings
   */
  disableVimMode(): void {
    this.vimModeEnabled = false;
    this.unregisterVimShortcuts();
  }

  /**
   * Check if vim mode is enabled
   * 
   * @returns True if vim mode is enabled
   */
  isVimModeEnabled(): boolean {
    return this.vimModeEnabled;
  }

  /**
   * Register vim-style shortcuts
   * Requirements: 17.6
   */
  private registerVimShortcuts(): void {
    // Basic vim navigation shortcuts
    const vimShortcuts: KeyboardShortcut[] = [
      {
        key: 'h',
        modifiers: [],
        action: () => {
          // Move cursor left
          document.execCommand('moveLeft');
        },
        description: 'Vim: Move cursor left',
      },
      {
        key: 'j',
        modifiers: [],
        action: () => {
          // Move cursor down
          document.execCommand('moveDown');
        },
        description: 'Vim: Move cursor down',
      },
      {
        key: 'k',
        modifiers: [],
        action: () => {
          // Move cursor up
          document.execCommand('moveUp');
        },
        description: 'Vim: Move cursor up',
      },
      {
        key: 'l',
        modifiers: [],
        action: () => {
          // Move cursor right
          document.execCommand('moveRight');
        },
        description: 'Vim: Move cursor right',
      },
    ];

    vimShortcuts.forEach((shortcut) => {
      this.registerShortcut(shortcut);
    });
  }

  /**
   * Unregister vim-style shortcuts
   */
  private unregisterVimShortcuts(): void {
    const vimKeys = ['h', 'j', 'k', 'l'];
    vimKeys.forEach((key) => {
      this.unregisterShortcut(key);
    });
  }

  /**
   * Enable keyboard navigation
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable keyboard navigation
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Check if keyboard navigation is enabled
   * 
   * @returns True if enabled
   */
  isNavigationEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Format a shortcut for display
   * 
   * @param shortcut - The keyboard shortcut
   * @returns Formatted string (e.g., "Ctrl+Shift+B")
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    // Use platform-specific modifier names
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    
    if (shortcut.modifiers.includes('ctrl')) {
      parts.push(isMac ? '⌃' : 'Ctrl');
    }
    if (shortcut.modifiers.includes('shift')) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.modifiers.includes('alt')) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.modifiers.includes('meta')) {
      parts.push(isMac ? '⌘' : 'Win');
    }
    
    // Capitalize the key
    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
  }

  /**
   * Get shortcuts grouped by category
   * 
   * @returns Object with shortcuts grouped by category
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const shortcuts = this.getShortcuts();
    const categories: Record<string, KeyboardShortcut[]> = {};

    shortcuts.forEach((shortcut) => {
      // Extract category from description (e.g., "Format: Bold" -> "Format")
      const match = shortcut.description.match(/^([^:]+):/);
      const category = match ? match[1] : 'General';

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(shortcut);
    });

    return categories;
  }

  /**
   * Search shortcuts by description
   * 
   * @param query - The search query
   * @returns Array of matching shortcuts
   */
  searchShortcuts(query: string): KeyboardShortcut[] {
    const lowerQuery = query.toLowerCase();
    return this.getShortcuts().filter((shortcut) =>
      shortcut.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all registered shortcuts
   */
  clearShortcuts(): void {
    this.shortcuts.clear();
  }

  /**
   * Destroy the keyboard navigation handler and clean up
   */
  destroy(): void {
    if (this.eventListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.eventListener);
      this.eventListener = null;
    }
    this.clearShortcuts();
  }
}

/**
 * Create a singleton instance of KeyboardNavigationHandler
 */
let keyboardNavigationHandlerInstance: KeyboardNavigationHandler | null = null;

/**
 * Get or create the global KeyboardNavigationHandler instance
 * 
 * @returns The KeyboardNavigationHandler instance
 */
export function getKeyboardNavigationHandler(): KeyboardNavigationHandler {
  if (!keyboardNavigationHandlerInstance) {
    keyboardNavigationHandlerInstance = new KeyboardNavigationHandler();
  }
  return keyboardNavigationHandlerInstance;
}

/**
 * Reset the global KeyboardNavigationHandler instance
 * Useful for testing
 */
export function resetKeyboardNavigationHandler(): void {
  if (keyboardNavigationHandlerInstance) {
    keyboardNavigationHandlerInstance.destroy();
    keyboardNavigationHandlerInstance = null;
  }
}
