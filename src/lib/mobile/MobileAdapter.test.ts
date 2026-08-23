/**
 * Unit tests for MobileAdapter
 * 
 * Note: These tests require a test framework (Jest/Vitest) to be configured.
 * Run with: npm test or pnpm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MobileAdapter, isMobile, validateTouchTargetSize } from './MobileAdapter';

describe('MobileAdapter', () => {
  let adapter: MobileAdapter;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    adapter = new MobileAdapter();
  });

  afterEach(() => {
    adapter.destroy();
  });

  describe('isMobile()', () => {
    it('should return false for desktop viewport (>= 768px)', () => {
      window.innerWidth = 1024;
      expect(adapter.isMobile()).toBe(false);
    });

    it('should return true for mobile viewport (< 768px)', () => {
      window.innerWidth = 375;
      expect(adapter.isMobile()).toBe(true);
    });

    it('should respect custom breakpoint', () => {
      const customAdapter = new MobileAdapter({ breakpoint: 1024 });
      window.innerWidth = 800;
      expect(customAdapter.isMobile()).toBe(true);
      customAdapter.destroy();
    });
  });

  describe('getViewportWidth() and getViewportHeight()', () => {
    it('should return current viewport dimensions', () => {
      window.innerWidth = 1024;
      window.innerHeight = 768;
      expect(adapter.getViewportWidth()).toBe(1024);
      expect(adapter.getViewportHeight()).toBe(768);
    });
  });

  describe('isTouchDevice()', () => {
    it('should detect touch support', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });
      
      const touchAdapter = new MobileAdapter();
      expect(touchAdapter.isTouchDevice()).toBe(true);
      touchAdapter.destroy();
    });
  });

  describe('validateTouchTarget()', () => {
    it('should validate element meets minimum touch target size', () => {
      const element = document.createElement('button');
      element.style.width = '44px';
      element.style.height = '44px';
      document.body.appendChild(element);

      // Mock getBoundingClientRect
      element.getBoundingClientRect = vi.fn(() => ({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      expect(adapter.validateTouchTarget(element)).toBe(true);
      document.body.removeChild(element);
    });

    it('should fail validation for small touch targets', () => {
      const element = document.createElement('button');
      element.style.width = '20px';
      element.style.height = '20px';
      document.body.appendChild(element);

      element.getBoundingClientRect = vi.fn(() => ({
        width: 20,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      expect(adapter.validateTouchTarget(element)).toBe(false);
      document.body.removeChild(element);
    });
  });

  describe('getTouchTargetValidation()', () => {
    it('should return detailed validation result', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);

      element.getBoundingClientRect = vi.fn(() => ({
        width: 40,
        height: 50,
        top: 0,
        left: 0,
        bottom: 50,
        right: 40,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      const result = adapter.getTouchTargetValidation(element);
      expect(result).toEqual({
        valid: false,
        width: 40,
        height: 50,
        minSize: 44,
      });

      document.body.removeChild(element);
    });
  });

  describe('applyTouchOptimizations()', () => {
    it('should apply touch optimizations on mobile', () => {
      window.innerWidth = 375; // Mobile viewport
      const mobileAdapter = new MobileAdapter();
      
      const element = document.createElement('button');
      element.getBoundingClientRect = vi.fn(() => ({
        width: 30,
        height: 30,
        top: 0,
        left: 0,
        bottom: 30,
        right: 30,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      mobileAdapter.applyTouchOptimizations(element);

      expect(element.style.minWidth).toBe('44px');
      expect(element.style.minHeight).toBe('44px');
      expect(element.style.cursor).toBe('pointer');
      expect(element.style.touchAction).toBe('manipulation');

      mobileAdapter.destroy();
    });

    it('should not apply optimizations on desktop', () => {
      window.innerWidth = 1024; // Desktop viewport
      const element = document.createElement('button');
      
      adapter.applyTouchOptimizations(element);

      expect(element.style.minWidth).toBe('');
      expect(element.style.minHeight).toBe('');
    });
  });

  describe('adjustMenuPosition()', () => {
    it('should position menu below target when space available', () => {
      window.innerWidth = 375;
      const mobileAdapter = new MobileAdapter();

      const menu = document.createElement('div');
      const target = document.createElement('div');

      menu.getBoundingClientRect = vi.fn(() => ({
        width: 200,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      target.getBoundingClientRect = vi.fn(() => ({
        width: 100,
        height: 40,
        top: 100,
        left: 50,
        bottom: 140,
        right: 150,
        x: 50,
        y: 100,
        toJSON: () => {},
      }));

      mobileAdapter.adjustMenuPosition(menu, target, 'bottom');

      expect(menu.style.top).toBe('148px'); // 140 + 8
      mobileAdapter.destroy();
    });
  });

  describe('enableBottomSheet()', () => {
    it('should apply bottom sheet styles on mobile', () => {
      window.innerWidth = 375;
      const mobileAdapter = new MobileAdapter();

      const menu = document.createElement('div');
      mobileAdapter.enableBottomSheet(menu);

      expect(menu.style.position).toBe('fixed');
      expect(menu.style.bottom).toMatch(/^0(px)?$/);
      expect(menu.style.left).toMatch(/^0(px)?$/);
      expect(menu.style.right).toMatch(/^0(px)?$/);
      expect(menu.style.maxHeight).toBe('70vh');

      mobileAdapter.destroy();
    });
  });

  describe('preventViewportZoom()', () => {
    it('should set minimum font size to prevent iOS zoom', () => {
      window.innerWidth = 375;
      const mobileAdapter = new MobileAdapter();

      const input = document.createElement('input');
      input.style.fontSize = '12px';

      // Mock getComputedStyle
      window.getComputedStyle = vi.fn(() => ({
        fontSize: '12px',
      } as CSSStyleDeclaration));

      mobileAdapter.preventViewportZoom(input);

      expect(input.style.fontSize).toBe('16px');
      mobileAdapter.destroy();
    });
  });

  describe('subscribe()', () => {
    it('should notify subscribers on viewport change', () => {
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe(callback);

      // Simulate media query change by directly triggering the listener
      // MediaQueryListEvent is not available in jsdom, so we simulate via matchMedia mock
      const mql = window.matchMedia(`(max-width: 767px)`);
      const changeEvent = { matches: true, media: '(max-width: 767px)' } as MediaQueryListEvent;
      mql.dispatchEvent(new Event('change'));
      // Directly invoke the handler since jsdom doesn't support MediaQueryListEvent
      adapter['handleMediaChange'](changeEvent);

      expect(callback).toHaveBeenCalledWith(true);
      unsubscribe();
    });

    it('should unsubscribe correctly', () => {
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe(callback);
      unsubscribe();

      const changeEvent = { matches: true, media: '(max-width: 767px)' } as MediaQueryListEvent;
      adapter['handleMediaChange'](changeEvent);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration', () => {
      adapter.updateConfig({ touchTargetSize: 48 });
      const config = adapter.getConfig();
      expect(config.touchTargetSize).toBe(48);
    });

    it('should update media query when breakpoint changes', () => {
      adapter.updateConfig({ breakpoint: 1024 });
      const config = adapter.getConfig();
      expect(config.breakpoint).toBe(1024);
    });
  });
});

describe('Utility functions', () => {
  describe('isMobile()', () => {
    it('should check if viewport is mobile', () => {
      window.innerWidth = 375;
      expect(isMobile()).toBe(true);

      window.innerWidth = 1024;
      expect(isMobile()).toBe(false);
    });

    it('should respect custom breakpoint', () => {
      window.innerWidth = 800;
      expect(isMobile(1024)).toBe(true);
      expect(isMobile(768)).toBe(false);
    });
  });

  describe('validateTouchTargetSize()', () => {
    it('should validate touch target size', () => {
      const element = document.createElement('button');
      
      element.getBoundingClientRect = vi.fn(() => ({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      expect(validateTouchTargetSize(element)).toBe(true);

      element.getBoundingClientRect = vi.fn(() => ({
        width: 30,
        height: 30,
        top: 0,
        left: 0,
        bottom: 30,
        right: 30,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      expect(validateTouchTargetSize(element)).toBe(false);
    });
  });
});
