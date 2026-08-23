/**
 * Unit tests for KeyboardNavigationHandler
 * 
 * Tests keyboard shortcut registration, execution, conflict detection,
 * and keyboard event handling.
 * 
 * Requirements: 2.2, 2.7, 17.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyboardNavigationHandler,
  getKeyboardNavigationHandler,
  resetKeyboardNavigationHandler,
  type KeyboardShortcut,
} from './KeyboardNavigationHandler';

describe('KeyboardNavigationHandler', () => {
  let handler: KeyboardNavigationHandler;

  beforeEach(() => {
    // Reset singleton before each test
    resetKeyboardNavigationHandler();
    handler = new KeyboardNavigationHandler();
  });

  afterEach(() => {
    handler.destroy();
  });

  describe('constructor', () => {
    it('should create instance with keyboard navigation enabled', () => {
      expect(handler.isNavigationEnabled()).toBe(true);
    });

    it('should create instance with vim mode disabled', () => {
      expect(handler.isVimModeEnabled()).toBe(false);
    });

    it('should initialize with no shortcuts registered', () => {
      expect(handler.getShortcuts()).toHaveLength(0);
    });
  });

  describe('registerShortcut() - Shortcut Registration', () => {
    it('should register a simple shortcut', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      expect(handler.getShortcuts()).toHaveLength(1);
      expect(handler.hasShortcut('ctrl+b')).toBe(true);
    });

    it('should register shortcut with multiple modifiers', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: ['ctrl', 'shift'],
        action,
        description: 'Save As',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut('ctrl+shift+s')).toBe(true);
    });

    it('should register shortcut with all modifiers', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'x',
        modifiers: ['ctrl', 'shift', 'alt', 'meta'],
        action,
        description: 'Complex shortcut',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut('ctrl+shift+alt+meta+x')).toBe(true);
    });

    it('should register shortcut without modifiers', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'escape',
        modifiers: [],
        action,
        description: 'Close',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut('escape')).toBe(true);
    });

    it('should normalize key to lowercase', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'B',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut('ctrl+b')).toBe(true);
    });

    it('should register multiple different shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'b', modifiers: ['ctrl'], action: vi.fn(), description: 'Bold' },
        { key: 'i', modifiers: ['ctrl'], action: vi.fn(), description: 'Italic' },
        { key: 'u', modifiers: ['ctrl'], action: vi.fn(), description: 'Underline' },
      ];

      shortcuts.forEach((s) => handler.registerShortcut(s));

      expect(handler.getShortcuts()).toHaveLength(3);
    });
  });

  describe('registerShortcut() - Conflict Detection', () => {
    it('should warn when registering conflicting shortcut', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const shortcut1: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };
      
      const shortcut2: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Different Bold',
      };

      handler.registerShortcut(shortcut1);
      handler.registerShortcut(shortcut2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Keyboard shortcut conflict detected: ctrl+b')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Existing: "Bold"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('New: "Different Bold"')
      );

      consoleSpy.mockRestore();
    });

    it('should override existing shortcut with new one', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      
      const shortcut1: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: action1,
        description: 'Bold',
      };
      
      const shortcut2: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: action2,
        description: 'Different Bold',
      };

      handler.registerShortcut(shortcut1);
      handler.registerShortcut(shortcut2);

      const registered = handler.getShortcut('ctrl+b');
      expect(registered?.action).toBe(action2);
      expect(registered?.description).toBe('Different Bold');
    });

    it('should not warn when registering different shortcuts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const shortcut1: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };
      
      const shortcut2: KeyboardShortcut = {
        key: 'i',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Italic',
      };

      handler.registerShortcut(shortcut1);
      handler.registerShortcut(shortcut2);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('unregisterShortcut()', () => {
    it('should unregister shortcut by key string', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      expect(handler.hasShortcut('ctrl+b')).toBe(true);

      handler.unregisterShortcut('ctrl+b');
      expect(handler.hasShortcut('ctrl+b')).toBe(false);
    });

    it('should unregister shortcut by shortcut object', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      expect(handler.hasShortcut('ctrl+b')).toBe(true);

      handler.unregisterShortcut({ key: 'b', modifiers: ['ctrl'] });
      expect(handler.hasShortcut('ctrl+b')).toBe(false);
    });

    it('should handle unregistering non-existent shortcut', () => {
      expect(() => {
        handler.unregisterShortcut('ctrl+z');
      }).not.toThrow();
    });
  });

  describe('getShortcuts()', () => {
    it('should return empty array when no shortcuts registered', () => {
      expect(handler.getShortcuts()).toEqual([]);
    });

    it('should return all registered shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'b', modifiers: ['ctrl'], action: vi.fn(), description: 'Bold' },
        { key: 'i', modifiers: ['ctrl'], action: vi.fn(), description: 'Italic' },
      ];

      shortcuts.forEach((s) => handler.registerShortcut(s));

      const registered = handler.getShortcuts();
      expect(registered).toHaveLength(2);
      expect(registered.map((s) => s.description)).toContain('Bold');
      expect(registered.map((s) => s.description)).toContain('Italic');
    });
  });

  describe('getShortcut()', () => {
    it('should get shortcut by key string', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const retrieved = handler.getShortcut('ctrl+b');
      expect(retrieved).toBeDefined();
      expect(retrieved?.description).toBe('Bold');
      expect(retrieved?.action).toBe(action);
    });

    it('should get shortcut by shortcut object', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const retrieved = handler.getShortcut({ key: 'b', modifiers: ['ctrl'] });
      expect(retrieved).toBeDefined();
      expect(retrieved?.description).toBe('Bold');
    });

    it('should return undefined for non-existent shortcut', () => {
      const retrieved = handler.getShortcut('ctrl+z');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('hasShortcut()', () => {
    it('should return true for registered shortcut', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut('ctrl+b')).toBe(true);
    });

    it('should return false for non-existent shortcut', () => {
      expect(handler.hasShortcut('ctrl+z')).toBe(false);
    });

    it('should work with shortcut object', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      expect(handler.hasShortcut({ key: 'b', modifiers: ['ctrl'] })).toBe(true);
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should execute shortcut action on matching keyboard event', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(event);
    });

    it('should execute shortcut with multiple modifiers', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: ['ctrl', 'shift'],
        action,
        description: 'Save As',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should not execute shortcut when modifiers do not match', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        shiftKey: true, // Wrong modifier
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should not execute shortcut when key does not match', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'i', // Wrong key
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive key matching', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'B', // Uppercase
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b', // Lowercase
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation on shortcut execution', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should not execute disabled shortcut', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
        enabled: false,
      };

      handler.registerShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('setShortcutEnabled()', () => {
    it('should enable shortcut', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
        enabled: false,
      };

      handler.registerShortcut(shortcut);
      handler.setShortcutEnabled('ctrl+b', true);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should disable shortcut', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.setShortcutEnabled('ctrl+b', false);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should work with shortcut object', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.setShortcutEnabled({ key: 'b', modifiers: ['ctrl'] }, false);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('enable() and disable()', () => {
    it('should disable all keyboard navigation', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.disable();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
      expect(handler.isNavigationEnabled()).toBe(false);
    });

    it('should re-enable keyboard navigation', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.disable();
      handler.enable();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).toHaveBeenCalledTimes(1);
      expect(handler.isNavigationEnabled()).toBe(true);
    });
  });

  describe('Vim Mode', () => {
    it('should enable vim mode', () => {
      handler.enableVimMode();

      expect(handler.isVimModeEnabled()).toBe(true);
      expect(handler.hasShortcut('h')).toBe(true);
      expect(handler.hasShortcut('j')).toBe(true);
      expect(handler.hasShortcut('k')).toBe(true);
      expect(handler.hasShortcut('l')).toBe(true);
    });

    it('should disable vim mode', () => {
      handler.enableVimMode();
      handler.disableVimMode();

      expect(handler.isVimModeEnabled()).toBe(false);
      expect(handler.hasShortcut('h')).toBe(false);
      expect(handler.hasShortcut('j')).toBe(false);
      expect(handler.hasShortcut('k')).toBe(false);
      expect(handler.hasShortcut('l')).toBe(false);
    });

    it('should execute vim shortcuts when enabled', () => {
      handler.enableVimMode();

      // Mock document.execCommand since it's not available in jsdom
      (document as any).execCommand = vi.fn(() => true);

      const event = new KeyboardEvent('keydown', {
        key: 'h',
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(document.execCommand).toHaveBeenCalledWith('moveLeft');

      // Clean up
      delete (document as any).execCommand;
    });
  });

  describe('formatShortcut()', () => {
    it('should format shortcut for display', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      const formatted = handler.formatShortcut(shortcut);
      expect(formatted).toMatch(/Ctrl\+B|⌃B/); // Windows/Linux or Mac
    });

    it('should format shortcut with multiple modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: ['ctrl', 'shift'],
        action: vi.fn(),
        description: 'Save As',
      };

      const formatted = handler.formatShortcut(shortcut);
      expect(formatted).toMatch(/Ctrl\+Shift\+S|⌃⇧S/);
    });

    it('should format shortcut with meta key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'k',
        modifiers: ['meta'],
        action: vi.fn(),
        description: 'Command Palette',
      };

      const formatted = handler.formatShortcut(shortcut);
      expect(formatted).toMatch(/Win\+K|⌘K/);
    });
  });

  describe('getShortcutsByCategory()', () => {
    it('should group shortcuts by category', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'b', modifiers: ['ctrl'], action: vi.fn(), description: 'Format: Bold' },
        { key: 'i', modifiers: ['ctrl'], action: vi.fn(), description: 'Format: Italic' },
        { key: 's', modifiers: ['ctrl'], action: vi.fn(), description: 'File: Save' },
        { key: 'o', modifiers: ['ctrl'], action: vi.fn(), description: 'File: Open' },
      ];

      shortcuts.forEach((s) => handler.registerShortcut(s));

      const grouped = handler.getShortcutsByCategory();

      expect(grouped['Format']).toHaveLength(2);
      expect(grouped['File']).toHaveLength(2);
    });

    it('should use "General" category for shortcuts without category', () => {
      const shortcut: KeyboardShortcut = {
        key: 'escape',
        modifiers: [],
        action: vi.fn(),
        description: 'Close',
      };

      handler.registerShortcut(shortcut);

      const grouped = handler.getShortcutsByCategory();

      expect(grouped['General']).toHaveLength(1);
    });
  });

  describe('searchShortcuts()', () => {
    beforeEach(() => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'b', modifiers: ['ctrl'], action: vi.fn(), description: 'Format: Bold' },
        { key: 'i', modifiers: ['ctrl'], action: vi.fn(), description: 'Format: Italic' },
        { key: 's', modifiers: ['ctrl'], action: vi.fn(), description: 'File: Save' },
      ];

      shortcuts.forEach((s) => handler.registerShortcut(s));
    });

    it('should search shortcuts by description', () => {
      const results = handler.searchShortcuts('bold');

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Format: Bold');
    });

    it('should search case-insensitively', () => {
      const results = handler.searchShortcuts('ITALIC');

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Format: Italic');
    });

    it('should return multiple matching shortcuts', () => {
      const results = handler.searchShortcuts('format');

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no matches', () => {
      const results = handler.searchShortcuts('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('clearShortcuts()', () => {
    it('should clear all registered shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'b', modifiers: ['ctrl'], action: vi.fn(), description: 'Bold' },
        { key: 'i', modifiers: ['ctrl'], action: vi.fn(), description: 'Italic' },
      ];

      shortcuts.forEach((s) => handler.registerShortcut(s));
      expect(handler.getShortcuts()).toHaveLength(2);

      handler.clearShortcuts();
      expect(handler.getShortcuts()).toHaveLength(0);
    });
  });

  describe('destroy()', () => {
    it('should remove event listener', () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action,
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.destroy();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should clear all shortcuts', () => {
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };

      handler.registerShortcut(shortcut);
      handler.destroy();

      expect(handler.getShortcuts()).toHaveLength(0);
    });
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetKeyboardNavigationHandler();
  });

  describe('getKeyboardNavigationHandler()', () => {
    it('should return singleton instance', () => {
      const instance1 = getKeyboardNavigationHandler();
      const instance2 = getKeyboardNavigationHandler();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getKeyboardNavigationHandler();
      resetKeyboardNavigationHandler();
      const instance2 = getKeyboardNavigationHandler();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('resetKeyboardNavigationHandler()', () => {
    it('should destroy and reset singleton instance', () => {
      const instance1 = getKeyboardNavigationHandler();
      
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifiers: ['ctrl'],
        action: vi.fn(),
        description: 'Bold',
      };
      instance1.registerShortcut(shortcut);

      resetKeyboardNavigationHandler();
      const instance2 = getKeyboardNavigationHandler();

      expect(instance2.getShortcuts()).toHaveLength(0);
    });

    it('should handle reset when no instance exists', () => {
      expect(() => {
        resetKeyboardNavigationHandler();
      }).not.toThrow();
    });
  });
});
