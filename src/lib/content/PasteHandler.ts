/**
 * Enhanced PasteHandler for processing rich content from various sources
 * 
 * Handles:
 * - Microsoft Word content with formatting preservation
 * - Google Docs content conversion
 * - Code block detection with language identification
 * - Link preview fetching
 * - Async processing for large pastes
 * 
 * Requirements: 5.1, 5.2, 5.6, 5.7, 3.4
 */

import { ContentSanitizer } from '../security/ContentSanitizer';

export interface PasteHandlerConfig {
  /** Whether to preserve formatting from source */
  preserveFormatting: boolean;
  /** Whether to sanitize pasted content */
  sanitize: boolean;
  /** Maximum paste size in bytes before async processing */
  maxSize: number;
  /** API endpoint for link preview fetching */
  linkPreviewApiUrl?: string;
  /** API key for link preview service */
  apiKey?: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  siteName?: string;
  favicon?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
}

export interface ParsedContent {
  html: string;
  type: 'word' | 'google-docs' | 'code' | 'link' | 'text' | 'html';
  metadata?: {
    codeBlock?: CodeBlock;
    linkPreview?: LinkPreview;
  };
}

/**
 * Enhanced paste handler for rich content processing
 */
export class PasteHandler {
  private config: PasteHandlerConfig;
  private sanitizer: ContentSanitizer;

  constructor(config: Partial<PasteHandlerConfig> = {}) {
    this.config = {
      preserveFormatting: config.preserveFormatting ?? true,
      sanitize: config.sanitize ?? true,
      maxSize: config.maxSize ?? 1024 * 1024, // 1MB default
      linkPreviewApiUrl: config.linkPreviewApiUrl,
      apiKey: config.apiKey,
    };
    
    // Initialize ContentSanitizer for secure content processing
    this.sanitizer = new ContentSanitizer();
  }

  /**
   * Main paste handler - processes clipboard event
   * Requirement 3.4: Process large content asynchronously without blocking UI
   */
  async handlePaste(event: ClipboardEvent): Promise<ParsedContent> {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      throw new Error('No clipboard data available');
    }

    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    const size = (htmlData?.length || 0) + (textData?.length || 0);

    // Requirement 3.4: Async processing for large pastes
    if (size > this.config.maxSize) {
      return this.processLargePasteAsync(htmlData, textData);
    }

    return this.processPaste(htmlData, textData);
  }

  /**
   * Process paste content synchronously
   */
  private async processPaste(htmlData: string, textData: string): Promise<ParsedContent> {
    // Check for Word content
    if (this.isWordContent(htmlData)) {
      const parsed = this.parseWordContent(htmlData);
      return {
        html: this.config.sanitize ? this.sanitizeHTML(parsed) : parsed,
        type: 'word',
      };
    }

    // Check for Google Docs content
    if (this.isGoogleDocsContent(htmlData)) {
      const parsed = this.parseGoogleDocsContent(htmlData);
      return {
        html: this.config.sanitize ? this.sanitizeHTML(parsed) : parsed,
        type: 'google-docs',
      };
    }

    // Check for code block
    const codeBlock = this.detectCodeBlock(textData);
    if (codeBlock) {
      return {
        html: this.formatCodeBlock(codeBlock),
        type: 'code',
        metadata: { codeBlock },
      };
    }

    // Check for URL
    if (this.isURL(textData.trim())) {
      const linkPreview = await this.fetchLinkPreview(textData.trim());
      return {
        html: this.formatLink(textData.trim(), linkPreview),
        type: 'link',
        metadata: { linkPreview },
      };
    }

    // Default: process as HTML or plain text
    if (htmlData && this.config.preserveFormatting) {
      return {
        html: this.config.sanitize ? this.sanitizeHTML(htmlData) : htmlData,
        type: 'html',
      };
    }

    return {
      html: this.formatPlainText(textData),
      type: 'text',
    };
  }

  /**
   * Process large paste content asynchronously
   * Requirement 3.4: Async processing without blocking UI
   */
  private async processLargePasteAsync(
    htmlData: string,
    textData: string
  ): Promise<ParsedContent> {
    return new Promise((resolve) => {
      // Use setTimeout to defer processing and avoid blocking UI
      setTimeout(async () => {
        const result = await this.processPaste(htmlData, textData);
        resolve(result);
      }, 0);
    });
  }

  /**
   * Detect if content is from Microsoft Word
   */
  private isWordContent(html: string): boolean {
    if (!html) return false;
    return (
      html.includes('urn:schemas-microsoft-com:office:word') ||
      html.includes('mso-') ||
      html.includes('MsoNormal') ||
      html.includes('xmlns:w=') ||
      html.includes('xmlns:o=')
    );
  }

  /**
   * Parse Microsoft Word content
   * Requirement 5.1: Preserve formatting from Microsoft Word (headings, lists, tables)
   */
  parseWordContent(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove Word-specific XML and metadata
    div.querySelectorAll('xml, meta, link, style').forEach((el) => el.remove());

    // Convert Word headings to standard HTML headings BEFORE cleaning formatting
    this.convertWordHeadings(div);

    // Clean up Word-specific classes and styles
    this.cleanWordFormatting(div);

    // Clean up Word lists
    this.convertWordLists(div);

    // Clean up Word tables
    this.convertWordTables(div);

    return div.innerHTML;
  }

  /**
   * Clean Word-specific formatting
   */
  private cleanWordFormatting(element: HTMLElement): void {
    // Remove Word-specific classes
    element.querySelectorAll('[class*="Mso"]').forEach((el) => {
      el.removeAttribute('class');
    });

    // Clean up inline styles
    element.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      // Keep only essential styles
      const cleanStyle = style
        .split(';')
        .filter((s) => {
          const prop = s.trim().split(':')[0];
          return ['font-weight', 'font-style', 'text-decoration', 'color'].includes(prop);
        })
        .join(';');
      
      if (cleanStyle) {
        el.setAttribute('style', cleanStyle);
      } else {
        el.removeAttribute('style');
      }
    });

    // Remove empty spans and divs
    element.querySelectorAll('span, div').forEach((el) => {
      if (!el.hasAttributes() && el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
        el.replaceWith(el.textContent || '');
      }
    });
  }

  /**
   * Convert Word headings to standard HTML headings
   */
  private convertWordHeadings(element: HTMLElement): void {
    // Word often uses <p class="MsoHeading1"> or similar
    element.querySelectorAll('p').forEach((el) => {
      const className = el.getAttribute('class') || '';
      const match = className.match(/Heading(\d)/);
      if (match) {
        const level = Math.min(parseInt(match[1], 10), 6);
        const heading = document.createElement(`h${level}`);
        heading.innerHTML = el.innerHTML;
        el.replaceWith(heading);
      }
    });
  }

  /**
   * Convert Word lists to standard HTML lists
   */
  private convertWordLists(element: HTMLElement): void {
    // Word lists often use <p> with special markers
    const listItems = element.querySelectorAll('p[style*="mso-list"]');
    if (listItems.length === 0) return;

    let currentList: HTMLUListElement | HTMLOListElement | null = null;
    let listType: 'ul' | 'ol' = 'ul';

    listItems.forEach((item) => {
      const style = item.getAttribute('style') || '';
      const isOrdered = style.includes('mso-list:') && /\d+\./.test(item.textContent || '');
      
      if (!currentList || (isOrdered && listType === 'ul') || (!isOrdered && listType === 'ol')) {
        currentList = document.createElement(isOrdered ? 'ol' : 'ul');
        listType = isOrdered ? 'ol' : 'ul';
        item.parentNode?.insertBefore(currentList, item);
      }

      const li = document.createElement('li');
      // Remove list markers from text
      li.textContent = (item.textContent || '').replace(/^[·•\-\d+\.]\s*/, '');
      currentList.appendChild(li);
      item.remove();
    });
  }

  /**
   * Convert Word tables to clean HTML tables
   */
  private convertWordTables(element: HTMLElement): void {
    element.querySelectorAll('table').forEach((table) => {
      // Remove Word-specific attributes
      table.removeAttribute('class');
      table.removeAttribute('border');
      table.removeAttribute('cellspacing');
      table.removeAttribute('cellpadding');
      
      // Clean up table cells
      table.querySelectorAll('td, th').forEach((cell) => {
        cell.removeAttribute('class');
        cell.removeAttribute('style');
      });
    });
  }

  /**
   * Detect if content is from Google Docs
   */
  private isGoogleDocsContent(html: string): boolean {
    if (!html) return false;
    return (
      html.includes('docs-internal-guid') ||
      html.includes('id="docs-internal-guid') ||
      html.includes('google-docs')
    );
  }

  /**
   * Parse Google Docs content
   * Requirement 5.2: Convert Google Docs styles to editor-compatible formatting
   */
  parseGoogleDocsContent(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Google Docs uses <b> tags with specific IDs
    div.querySelectorAll('b[id*="docs-internal-guid"]').forEach((b) => {
      // Unwrap the <b> tag but keep its contents
      const parent = b.parentNode;
      while (b.firstChild) {
        parent?.insertBefore(b.firstChild, b);
      }
      b.remove();
    });

    // Convert Google Docs spans to semantic HTML
    div.querySelectorAll('span[style]').forEach((span) => {
      const style = span.getAttribute('style') || '';
      
      // Convert font-weight to <strong>
      if (style.includes('font-weight: 700') || style.includes('font-weight:700')) {
        const strong = document.createElement('strong');
        strong.innerHTML = span.innerHTML;
        span.replaceWith(strong);
      }
      // Convert font-style to <em>
      else if (style.includes('font-style: italic') || style.includes('font-style:italic')) {
        const em = document.createElement('em');
        em.innerHTML = span.innerHTML;
        span.replaceWith(em);
      }
      // Convert text-decoration to <u> or <s>
      else if (style.includes('text-decoration: underline') || style.includes('text-decoration:underline')) {
        const u = document.createElement('u');
        u.innerHTML = span.innerHTML;
        span.replaceWith(u);
      }
      else if (style.includes('text-decoration: line-through') || style.includes('text-decoration:line-through')) {
        const s = document.createElement('s');
        s.innerHTML = span.innerHTML;
        span.replaceWith(s);
      }
    });

    // Clean up empty spans
    div.querySelectorAll('span').forEach((span) => {
      if (!span.hasAttributes()) {
        span.replaceWith(...Array.from(span.childNodes));
      }
    });

    return div.innerHTML;
  }

  /**
   * Detect code blocks in pasted text
   * Requirement 5.7: Detect programming language and create code blocks with syntax highlighting
   */
  detectCodeBlock(text: string): CodeBlock | null {
    if (!text) return null;

    // Check for triple backtick code blocks
    const fencedMatch = text.match(/^```(\w+)?\n([\s\S]+)\n```$/);
    if (fencedMatch) {
      return {
        language: fencedMatch[1] || 'plaintext',
        code: fencedMatch[2],
      };
    }

    // Check for indented code blocks (4 spaces or tab)
    const lines = text.split('\n');
    const allIndented = lines.every((line) => line.startsWith('    ') || line.startsWith('\t') || line.trim() === '');
    if (allIndented && lines.length > 2) {
      const code = lines.map((line) => line.replace(/^    |\t/, '')).join('\n');
      return {
        language: this.detectLanguage(code),
        code,
      };
    }

    // Check for common code patterns
    if (this.looksLikeCode(text)) {
      return {
        language: this.detectLanguage(text),
        code: text,
      };
    }

    return null;
  }

  /**
   * Detect programming language from code content
   */
  private detectLanguage(code: string): string {
    // HTML patterns (check before JavaScript since HTML can contain class/function keywords)
    if (/<\/?[a-z][\s\S]*>/i.test(code)) {
      return 'html';
    }

    // TypeScript patterns (check before JavaScript)
    if (
      /\b(interface|type)\b/.test(code) &&
      (/:\s*(string|number|boolean|any|void|unknown)/.test(code) || /\{[\s\S]*:\s*[^:]+;/.test(code))
    ) {
      return 'typescript';
    }

    // JavaScript/TypeScript patterns
    if (
      /\b(const|let|var|function|class|import|export|async|await)\b/.test(code) ||
      /=>/.test(code) ||
      /\bconsole\.log\b/.test(code)
    ) {
      return 'javascript';
    }

    // Python patterns
    if (
      /\b(def|class|import|from|if __name__|print)\b/.test(code) ||
      /:$/.test(code.split('\n')[0])
    ) {
      return 'python';
    }

    // Java patterns
    if (
      /\b(public|private|protected|class|interface|void|static)\b/.test(code) &&
      /\{/.test(code)
    ) {
      return 'java';
    }

    // C/C++ patterns
    if (
      /#include|int main\(|printf\(|std::/.test(code)
    ) {
      return code.includes('std::') ? 'cpp' : 'c';
    }

    // CSS patterns
    if (/\{[\s\S]*:[^:]+;[\s\S]*\}/.test(code) && !code.includes('function')) {
      return 'css';
    }

    // JSON patterns
    if (/^\s*[\[{]/.test(code) && /[\]}]\s*$/.test(code)) {
      try {
        JSON.parse(code);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // SQL patterns
    if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|FROM|WHERE|JOIN)\b/i.test(code)) {
      return 'sql';
    }

    // Ruby patterns
    if (/\b(def|end|class|module|require|puts)\b/.test(code)) {
      return 'ruby';
    }

    // PHP patterns
    if (/<\?php|<\?/.test(code)) {
      return 'php';
    }

    // Go patterns
    if (/\b(func|package|import|type|struct)\b/.test(code) && /\{/.test(code)) {
      return 'go';
    }

    // Rust patterns
    if (/\b(fn|let|mut|impl|trait|struct)\b/.test(code) && /->/.test(code)) {
      return 'rust';
    }

    // Shell/Bash patterns
    if (/^#!\/bin\/(bash|sh)|^\$\s/.test(code)) {
      return 'bash';
    }

    return 'plaintext';
  }

  /**
   * Check if text looks like code
   */
  private looksLikeCode(text: string): boolean {
    // Check for common code indicators
    const codeIndicators = [
      /[{}\[\]();]/, // Brackets and parentheses
      /\b(function|class|const|let|var|def|public|private|interface|type)\b/, // Keywords
      /=>|->|::/, // Operators
      /^\s{2,}/m, // Indentation
      /\/\/|\/\*|\*\/|#/, // Comments
      /<\/?[a-z][\s\S]*>/i, // HTML tags
      /\{[\s\S]*:[^:]+;[\s\S]*\}/, // CSS-like syntax
      /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i, // SQL keywords
    ];

    let matches = 0;
    for (const pattern of codeIndicators) {
      if (pattern.test(text)) matches++;
    }

    // If 2 or more indicators, likely code (lowered threshold)
    return matches >= 2;
  }

  /**
   * Format code block as HTML
   */
  private formatCodeBlock(codeBlock: CodeBlock): string {
    const escapedCode = this.escapeHTML(codeBlock.code);
    return `<pre><code class="language-${codeBlock.language}">${escapedCode}</code></pre>`;
  }

  /**
   * Check if text is a URL
   */
  private isURL(text: string): boolean {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Fetch link preview metadata
   * Requirement 5.6: Fetch and display link previews with title, description, thumbnail
   */
  async fetchLinkPreview(url: string): Promise<LinkPreview | undefined> {
    if (!this.config.linkPreviewApiUrl) {
      return undefined;
    }

    try {
      const response = await fetch(this.config.linkPreviewApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        console.warn('Failed to fetch link preview:', response.statusText);
        return undefined;
      }

      const data = await response.json();
      return {
        url,
        title: data.title || url,
        description: data.description || '',
        thumbnail: data.thumbnail || data.image,
        siteName: data.siteName || data.site_name,
        favicon: data.favicon,
      };
    } catch (error) {
      console.error('Error fetching link preview:', error);
      return undefined;
    }
  }

  /**
   * Format link with optional preview
   */
  private formatLink(url: string, preview?: LinkPreview): string {
    if (!preview) {
      return `<a href="${this.escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${this.escapeHTML(url)}</a>`;
    }

    // Create rich link preview
    return `
      <div class="link-preview" data-url="${this.escapeHTML(url)}">
        ${preview.thumbnail ? `<img src="${this.escapeHTML(preview.thumbnail)}" alt="${this.escapeHTML(preview.title)}" class="link-preview-thumbnail" />` : ''}
        <div class="link-preview-content">
          <h4 class="link-preview-title">
            <a href="${this.escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${this.escapeHTML(preview.title)}</a>
          </h4>
          ${preview.description ? `<p class="link-preview-description">${this.escapeHTML(preview.description)}</p>` : ''}
          ${preview.siteName ? `<span class="link-preview-site">${this.escapeHTML(preview.siteName)}</span>` : ''}
        </div>
      </div>
    `.trim();
  }

  /**
   * Format plain text as HTML paragraphs
   */
  private formatPlainText(text: string): string {
    const lines = text.split('\n');
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<p><br></p>';
        return `<p>${this.escapeHTML(trimmed)}</p>`;
      })
      .join('');
  }

  /**
   * Sanitize HTML content using ContentSanitizer
   */
  private sanitizeHTML(html: string): string {
    return this.sanitizer.sanitize(html);
  }

  /**
   * Validate URL for security using ContentSanitizer
   */
  private isValidURL(url: string): boolean {
    return this.sanitizer.validateURL(url);
  }

  /**
   * Escape HTML entities using ContentSanitizer
   */
  private escapeHTML(text: string): string {
    return this.sanitizer.escapeHTML(text);
  }
}
