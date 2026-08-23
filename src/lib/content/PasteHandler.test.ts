/**
 * Unit tests for PasteHandler
 * 
 * Tests cover:
 * - Word content parsing (Requirement 5.1)
 * - Google Docs content parsing (Requirement 5.2)
 * - Code block detection (Requirement 5.7)
 * - Link preview fetching (Requirement 5.6)
 * - Async processing (Requirement 3.4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PasteHandler } from './PasteHandler';

describe('PasteHandler', () => {
  let pasteHandler: PasteHandler;

  beforeEach(() => {
    pasteHandler = new PasteHandler({
      preserveFormatting: true,
      sanitize: true,
      maxSize: 1024 * 1024,
    });
  });

  describe('Word Content Parsing (Requirement 5.1)', () => {
    it('should detect Word content', () => {
      const wordHTML = '<html xmlns:w="urn:schemas-microsoft-com:office:word"><p>Test</p></html>';
      const result = pasteHandler.parseWordContent(wordHTML);
      expect(result).toContain('<p>Test</p>');
    });

    it('should preserve Word headings', () => {
      const wordHTML = `
        <html xmlns:w="urn:schemas-microsoft-com:office:word">
          <p class="MsoHeading1">Heading 1</p>
          <p class="MsoHeading2">Heading 2</p>
        </html>
      `;
      const result = pasteHandler.parseWordContent(wordHTML);
      expect(result).toContain('<h1>Heading 1</h1>');
      expect(result).toContain('<h2>Heading 2</h2>');
    });

    it('should clean Word-specific classes', () => {
      const wordHTML = `
        <html xmlns:w="urn:schemas-microsoft-com:office:word">
          <p class="MsoNormal">Normal text</p>
        </html>
      `;
      const result = pasteHandler.parseWordContent(wordHTML);
      expect(result).not.toContain('MsoNormal');
    });

    it('should preserve tables from Word', () => {
      const wordHTML = `
        <html xmlns:w="urn:schemas-microsoft-com:office:word">
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </table>
        </html>
      `;
      const result = pasteHandler.parseWordContent(wordHTML);
      expect(result).toContain('<table>');
      expect(result).toContain('<td>Cell 1</td>');
    });
  });

  describe('Google Docs Content Parsing (Requirement 5.2)', () => {
    it('should detect Google Docs content', () => {
      const docsHTML = '<b id="docs-internal-guid-123"><span>Test</span></b>';
      const result = pasteHandler.parseGoogleDocsContent(docsHTML);
      expect(result).toBeTruthy();
    });

    it('should convert bold spans to strong tags', () => {
      const docsHTML = '<span style="font-weight: 700">Bold text</span>';
      const result = pasteHandler.parseGoogleDocsContent(docsHTML);
      expect(result).toContain('<strong>Bold text</strong>');
    });

    it('should convert italic spans to em tags', () => {
      const docsHTML = '<span style="font-style: italic">Italic text</span>';
      const result = pasteHandler.parseGoogleDocsContent(docsHTML);
      expect(result).toContain('<em>Italic text</em>');
    });

    it('should convert underline spans to u tags', () => {
      const docsHTML = '<span style="text-decoration: underline">Underlined text</span>';
      const result = pasteHandler.parseGoogleDocsContent(docsHTML);
      expect(result).toContain('<u>Underlined text</u>');
    });

    it('should convert strikethrough spans to s tags', () => {
      const docsHTML = '<span style="text-decoration: line-through">Strikethrough text</span>';
      const result = pasteHandler.parseGoogleDocsContent(docsHTML);
      expect(result).toContain('<s>Strikethrough text</s>');
    });
  });

  describe('Code Block Detection (Requirement 5.7)', () => {
    it('should detect fenced code blocks', () => {
      const code = '```javascript\nconst x = 1;\n```';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result).toEqual({
        language: 'javascript',
        code: 'const x = 1;',
      });
    });

    it('should detect fenced code blocks without language', () => {
      const code = '```\nconst x = 1;\n```';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result).toEqual({
        language: 'plaintext',
        code: 'const x = 1;',
      });
    });

    it('should detect JavaScript code', () => {
      const code = 'const hello = () => console.log("world");';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('javascript');
    });

    it('should detect TypeScript code', () => {
      const code = 'interface User { name: string; }';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('typescript');
    });

    it('should detect Python code', () => {
      const code = 'def hello():\n    print("world")';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('python');
    });

    it('should detect HTML code', () => {
      const code = '<div class="container"><p>Hello</p></div>';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('html');
    });

    it('should detect CSS code', () => {
      const code = '.container { display: flex; }';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('css');
    });

    it('should detect SQL code', () => {
      const code = 'SELECT * FROM users WHERE id = 1;';
      const result = pasteHandler.detectCodeBlock(code);
      expect(result?.language).toBe('sql');
    });

    it('should not detect regular text as code', () => {
      const text = 'This is just regular text without code patterns.';
      const result = pasteHandler.detectCodeBlock(text);
      expect(result).toBeNull();
    });
  });

  describe('Link Preview Fetching (Requirement 5.6)', () => {
    it('should detect URLs', () => {
      const pasteHandler = new PasteHandler();
      expect(pasteHandler['isURL']('https://example.com')).toBe(true);
      expect(pasteHandler['isURL']('http://example.com')).toBe(true);
      expect(pasteHandler['isURL']('not a url')).toBe(false);
    });

    it('should fetch link preview', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Example Site',
          description: 'An example website',
          thumbnail: 'https://example.com/image.jpg',
          siteName: 'Example',
        }),
      });

      const pasteHandler = new PasteHandler({
        linkPreviewApiUrl: 'https://api.example.com/preview',
        apiKey: 'test-key',
      });

      const preview = await pasteHandler.fetchLinkPreview('https://example.com');
      expect(preview).toEqual({
        url: 'https://example.com',
        title: 'Example Site',
        description: 'An example website',
        thumbnail: 'https://example.com/image.jpg',
        siteName: 'Example',
        favicon: undefined,
      });
    });

    it('should handle link preview fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      const pasteHandler = new PasteHandler({
        linkPreviewApiUrl: 'https://api.example.com/preview',
      });

      const preview = await pasteHandler.fetchLinkPreview('https://example.com');
      expect(preview).toBeUndefined();
    });

    it('should return undefined when no API URL is configured', async () => {
      const pasteHandler = new PasteHandler();
      const preview = await pasteHandler.fetchLinkPreview('https://example.com');
      expect(preview).toBeUndefined();
    });
  });

  describe('Content Sanitization', () => {
    it('should remove script tags', () => {
      const malicious = '<p>Hello<script>alert("XSS")</script></p>';
      const sanitized = pasteHandler['sanitizeHTML'](malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const malicious = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = pasteHandler['sanitizeHTML'](malicious);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<p>Click me</p>');
    });

    it('should remove dangerous elements', () => {
      const malicious = '<p>Safe</p><iframe src="evil.com"></iframe>';
      const sanitized = pasteHandler['sanitizeHTML'](malicious);
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).toContain('<p>Safe</p>');
    });

    it('should validate URLs', () => {
      const pasteHandler = new PasteHandler();
      expect(pasteHandler['isValidURL']('https://example.com')).toBe(true);
      expect(pasteHandler['isValidURL']('http://example.com')).toBe(true);
      expect(pasteHandler['isValidURL']('mailto:test@example.com')).toBe(true);
      expect(pasteHandler['isValidURL']('javascript:alert(1)')).toBe(false);
    });

    it('should preserve safe HTML', () => {
      const safe = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const sanitized = pasteHandler['sanitizeHTML'](safe);
      expect(sanitized).toContain('<strong>Bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
    });
  });

  describe('Async Processing (Requirement 3.4)', () => {
    it('should process small pastes synchronously', async () => {
      const smallHTML = '<p>Small content</p>';
      const event = createMockClipboardEvent(smallHTML, 'Small text');

      const result = await pasteHandler.handlePaste(event);
      expect(result.html).toBeTruthy();
    });

    it('should process large pastes asynchronously', async () => {
      const largeHTML = '<p>' + 'x'.repeat(2 * 1024 * 1024) + '</p>';
      const pasteHandler = new PasteHandler({ maxSize: 1024 * 1024 });
      const event = createMockClipboardEvent(largeHTML, '');

      const startTime = Date.now();
      const result = await pasteHandler.handlePaste(event);
      const duration = Date.now() - startTime;

      expect(result.html).toBeTruthy();
      // Async processing should not block
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Plain Text Formatting', () => {
    it('should format plain text as paragraphs', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const formatted = pasteHandler['formatPlainText'](text);
      expect(formatted).toContain('<p>Line 1</p>');
      expect(formatted).toContain('<p>Line 2</p>');
      expect(formatted).toContain('<p>Line 3</p>');
    });

    it('should handle empty lines', () => {
      const text = 'Line 1\n\nLine 3';
      const formatted = pasteHandler['formatPlainText'](text);
      expect(formatted).toContain('<p>Line 1</p>');
      expect(formatted).toContain('<p><br></p>');
      expect(formatted).toContain('<p>Line 3</p>');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML entities', () => {
      const text = '<script>alert("XSS")</script>';
      const escaped = pasteHandler['escapeHTML'](text);
      expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should escape special characters', () => {
      const text = 'A & B < C > D';
      const escaped = pasteHandler['escapeHTML'](text);
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });
  });
});

// Helper function to create mock clipboard events
function createMockClipboardEvent(html: string, text: string): ClipboardEvent {
  const dataTransfer = {
    getData: (type: string) => {
      if (type === 'text/html') return html;
      if (type === 'text/plain') return text;
      return '';
    },
  } as DataTransfer;

  return {
    clipboardData: dataTransfer,
    preventDefault: () => {},
  } as ClipboardEvent;
}
