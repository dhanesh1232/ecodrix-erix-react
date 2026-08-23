/**
 * Unit tests for AccessibilityManager
 * 
 * Note: These tests require Vitest to be configured.
 * Run with: npm test or pnpm test
 * 
 * Requirements: 2.1, 2.3, 2.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AccessibilityManager,
  getAccessibilityManager,
  resetAccessibilityManager,
} from './AccessibilityManager';

describe('AccessibilityManager', () => {
  let manager: AccessibilityManager;

  beforeEach(() => {
    // Reset singleton before each test
    resetAccessibilityManager();
    manager = new AccessibilityManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const config = manager.getConfig();
      expect(config.announceChanges).toBe(true);
      expect(config.keyboardShortcuts).toBe(true);
      expect(config.focusManagement).toBe(true);
      expect(config.highContrastMode).toBe(false);
    });

    it('should create instance with custom config', () => {
      const customManager = new AccessibilityManager({
        announceChanges: false,
        highContrastMode: true,
      });
      const config = customManager.getConfig();
      expect(config.announceChanges).toBe(false);
      expect(config.highContrastMode).toBe(true);
      customManager.destroy();
    });

    it('should initialize live region for announcements', () => {
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('announceToScreenReader()', () => {
    it('should announce message with polite priority', () => {
      vi.useFakeTimers();
      manager.announceToScreenReader('Test message', 'polite');
      
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('Test message');
      
      vi.useRealTimers();
    });

    it('should announce message with assertive priority', () => {
      vi.useFakeTimers();
      manager.announceToScreenReader('Error message', 'assertive');
      
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('Error message');
      
      vi.useRealTimers();
    });

    it('should clear message after 3 seconds', () => {
      vi.useFakeTimers();
      manager.announceToScreenReader('Test message', 'polite');
      
      vi.advanceTimersByTime(100);
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.textContent).toBe('Test message');
      
      vi.advanceTimersByTime(3000);
      expect(liveRegion?.textContent).toBe('');
      
      vi.useRealTimers();
    });

    it('should not announce when announceChanges is disabled', () => {
      const quietManager = new AccessibilityManager({ announceChanges: false });
      vi.useFakeTimers();
      
      quietManager.announceToScreenReader('Test message', 'polite');
      vi.advanceTimersByTime(100);
      
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.textContent).toBe('');
      
      vi.useRealTimers();
      quietManager.destroy();
    });
  });

  describe('manageFocusTrap()', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      const cleanup = manager.manageFocusTrap(container);
      
      // Focus should be on first button
      expect(document.activeElement).toBe(button1);
      
      cleanup();
      document.body.removeChild(container);
    });

    it('should cycle focus from last to first element on Tab', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = manager.manageFocusTrap(container);
      
      // Focus last button
      button2.focus();
      
      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      container.dispatchEvent(event);
      
      cleanup();
      document.body.removeChild(container);
    });

    it('should cycle focus from first to last element on Shift+Tab', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = manager.manageFocusTrap(container);
      
      // Focus first button
      button1.focus();
      
      // Simulate Shift+Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      container.dispatchEvent(event);
      
      cleanup();
      document.body.removeChild(container);
    });

    it('should return cleanup function', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = manager.manageFocusTrap(container);
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      document.body.removeChild(container);
    });
  });

  describe('applyAriaLabels()', () => {
    it('should apply role to toolbar', () => {
      const toolbar = document.createElement('div');
      manager.applyAriaLabels(toolbar);
      
      expect(toolbar.getAttribute('role')).toBe('toolbar');
      expect(toolbar.getAttribute('aria-label')).toBe('Editor formatting toolbar');
    });

    it('should apply aria-label to buttons', () => {
      const toolbar = document.createElement('div');
      const button = document.createElement('button');
      button.setAttribute('title', 'Bold');
      toolbar.appendChild(button);
      
      manager.applyAriaLabels(toolbar);
      
      expect(button.getAttribute('aria-label')).toBe('Bold');
    });

    it('should not override existing aria-label', () => {
      const toolbar = document.createElement('div');
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Custom Label');
      toolbar.appendChild(button);
      
      manager.applyAriaLabels(toolbar);
      
      expect(button.getAttribute('aria-label')).toBe('Custom Label');
    });

    it('should add aria-pressed to toggle buttons', () => {
      const toolbar = document.createElement('div');
      const button = document.createElement('button');
      button.setAttribute('data-toggle', 'true');
      button.setAttribute('title', 'Bold');
      toolbar.appendChild(button);
      
      manager.applyAriaLabels(toolbar);
      
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });

    it('should apply aria-label to inputs with placeholder', () => {
      const toolbar = document.createElement('div');
      const input = document.createElement('input');
      input.setAttribute('placeholder', 'Search');
      toolbar.appendChild(input);
      
      manager.applyAriaLabels(toolbar);
      
      expect(input.getAttribute('aria-label')).toBe('Search');
    });
  });

  describe('updateAriaPressed()', () => {
    it('should update aria-pressed attribute', () => {
      const button = document.createElement('button');
      
      manager.updateAriaPressed(button, true);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      
      manager.updateAriaPressed(button, false);
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('updateAriaExpanded()', () => {
    it('should update aria-expanded attribute', () => {
      const element = document.createElement('div');
      
      manager.updateAriaExpanded(element, true);
      expect(element.getAttribute('aria-expanded')).toBe('true');
      
      manager.updateAriaExpanded(element, false);
      expect(element.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('setAriaLabel() and getAriaLabel()', () => {
    it('should set and get aria-label', () => {
      const element = document.createElement('div');
      
      manager.setAriaLabel(element, 'Test Label');
      expect(element.getAttribute('aria-label')).toBe('Test Label');
      expect(manager.getAriaLabel(element)).toBe('Test Label');
    });
  });

  describe('setHighContrastMode()', () => {
    it('should enable high contrast mode', () => {
      manager.setHighContrastMode(true);
      
      expect(document.documentElement.classList.contains('erix-high-contrast')).toBe(true);
      expect(manager.getConfig().highContrastMode).toBe(true);
    });

    it('should disable high contrast mode', () => {
      manager.setHighContrastMode(true);
      manager.setHighContrastMode(false);
      
      expect(document.documentElement.classList.contains('erix-high-contrast')).toBe(false);
      expect(manager.getConfig().highContrastMode).toBe(false);
    });
  });

  describe('announceFormattingChange()', () => {
    it('should announce formatting applied', () => {
      vi.useFakeTimers();
      manager.announceFormattingChange('bold', true);
      
      vi.advanceTimersByTime(100);
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.textContent).toBe('bold applied');
      
      vi.useRealTimers();
    });

    it('should announce formatting removed', () => {
      vi.useFakeTimers();
      manager.announceFormattingChange('italic', false);
      
      vi.advanceTimersByTime(100);
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.textContent).toBe('italic removed');
      
      vi.useRealTimers();
    });
  });

  describe('announceEditorState()', () => {
    it('should announce editor state', () => {
      vi.useFakeTimers();
      manager.announceEditorState('ready');
      
      vi.advanceTimersByTime(100);
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.textContent).toBe('Editor ready');
      
      vi.useRealTimers();
    });
  });

  describe('announceError()', () => {
    it('should announce error with assertive priority', () => {
      vi.useFakeTimers();
      manager.announceError('Something went wrong');
      
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('Error: Something went wrong');
      
      vi.useRealTimers();
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration', () => {
      manager.updateConfig({ announceChanges: false });
      expect(manager.getConfig().announceChanges).toBe(false);
    });

    it('should re-apply high contrast mode when changed', () => {
      manager.updateConfig({ highContrastMode: true });
      expect(document.documentElement.classList.contains('erix-high-contrast')).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('should remove live region', () => {
      manager.destroy();
      const liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion).toBeFalsy();
    });

    it('should clean up focus traps', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      manager.manageFocusTrap(container);
      manager.destroy();
      
      // Focus traps should be cleaned up
      expect(manager['focusTrapStack'].length).toBe(0);
      
      document.body.removeChild(container);
    });
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetAccessibilityManager();
  });

  describe('getAccessibilityManager()', () => {
    it('should return singleton instance', () => {
      const instance1 = getAccessibilityManager();
      const instance2 = getAccessibilityManager();
      expect(instance1).toBe(instance2);
    });

    it('should create instance with config on first call', () => {
      const instance = getAccessibilityManager({ announceChanges: false });
      expect(instance.getConfig().announceChanges).toBe(false);
    });

    it('should update config on subsequent calls', () => {
      const instance1 = getAccessibilityManager({ announceChanges: true });
      const instance2 = getAccessibilityManager({ highContrastMode: true });
      
      expect(instance1).toBe(instance2);
      expect(instance2.getConfig().announceChanges).toBe(true);
      expect(instance2.getConfig().highContrastMode).toBe(true);
    });
  });

  describe('resetAccessibilityManager()', () => {
    it('should destroy and reset singleton instance', () => {
      const instance1 = getAccessibilityManager();
      resetAccessibilityManager();
      const instance2 = getAccessibilityManager();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});
