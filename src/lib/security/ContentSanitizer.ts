/**
 * ContentSanitizer - Security-focused HTML content sanitization
 * 
 * This class provides comprehensive XSS protection and content sanitization
 * for the ErixEditor. It implements a whitelist-based approach to ensure
 * only safe HTML tags and attributes are allowed.
 * 
 * Features:
 * - HTML tag whitelisting
 * - Attribute sanitization
 * - URL protocol validation
 * - XSS prevention (script tags, event handlers, etc.)
 * - Configurable whitelist system
 * 
 * Requirements: 19.1, 19.2, 19.4, 19.5, 19.7
 */

/**
 * Configuration for content sanitization
 */
export interface SanitizationConfig {
  /** List of allowed HTML tags */
  allowedTags: string[];
  /** Map of tag names to allowed attributes */
  allowedAttributes: Record<string, string[]>;
  /** List of allowed URL protocols */
  allowedProtocols: string[];
  /** Whether to strip script tags (default: true) */
  stripScripts: boolean;
  /** Whether to strip inline styles (default: false) */
  stripStyles: boolean;
}

/**
 * Default sanitization configuration
 * Provides a secure baseline for content sanitization
 */
export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  allowedTags: [
    // Text formatting
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li', 'blockquote',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Media and links
    'img', 'a',
    // Containers
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    code: ['class'],
    pre: ['class'],
    div: ['class', 'data-url', 'data-type'],
    span: ['class', 'style'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedProtocols: ['http:', 'https:', 'mailto:', 'data:'],
  stripScripts: true,
  stripStyles: false,
};

/**
 * ContentSanitizer class
 * 
 * Provides comprehensive HTML sanitization to prevent XSS attacks
 * and ensure only safe content is rendered in the editor.
 */
export class ContentSanitizer {
  private config: SanitizationConfig;

  /**
   * Create a new ContentSanitizer instance
   * @param config - Sanitization configuration (optional, uses defaults if not provided)
   */
  constructor(config?: Partial<SanitizationConfig>) {
    this.config = {
      ...DEFAULT_SANITIZATION_CONFIG,
      ...config,
      // Merge allowedAttributes to preserve defaults
      allowedAttributes: {
        ...DEFAULT_SANITIZATION_CONFIG.allowedAttributes,
        ...(config?.allowedAttributes || {}),
      },
    };
  }

  /**
   * Sanitize HTML content
   * 
   * Removes dangerous elements, validates attributes, and ensures
   * only whitelisted tags and attributes are present.
   * 
   * @param html - Raw HTML string to sanitize
   * @returns Sanitized HTML string
   * 
   * Requirements: 19.1, 19.2, 19.5
   */
  sanitize(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a temporary DOM element for parsing
    const div = document.createElement('div');
    div.innerHTML = html;

    // Step 1: Remove dangerous elements (Requirement 19.1)
    this.removeDangerousElements(div);

    // Step 2: Remove non-whitelisted tags (Requirement 19.2)
    this.removeNonWhitelistedTags(div);

    // Step 3: Sanitize attributes (Requirement 19.2, 19.4)
    this.sanitizeAttributes(div);

    return div.innerHTML;
  }

  /**
   * Remove dangerous elements that could execute scripts
   * 
   * Removes script tags, event handlers, and other potentially
   * dangerous elements from the DOM.
   * 
   * @param container - DOM element to clean
   * 
   * Requirement: 19.1 - Remove all script tags and event handlers
   */
  private removeDangerousElements(container: HTMLElement): void {
    // List of dangerous elements to remove
    const dangerousElements = [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'meta',
      'link',
      'base',
      'form',
      'input',
      'button',
      'textarea',
      'select',
    ];

    // Add style to dangerous elements if stripStyles is enabled
    if (this.config.stripStyles) {
      dangerousElements.push('style');
    }

    // Remove all dangerous elements
    dangerousElements.forEach((tagName) => {
      container.querySelectorAll(tagName).forEach((el) => {
        el.remove();
      });
    });
  }

  /**
   * Remove tags that are not in the whitelist
   * 
   * Replaces non-whitelisted tags with their child nodes,
   * preserving the text content while removing the tag.
   * 
   * @param container - DOM element to clean
   * 
   * Requirement: 19.2 - Whitelist only safe HTML tags
   */
  private removeNonWhitelistedTags(container: HTMLElement): void {
    const allElements = Array.from(container.querySelectorAll('*'));

    allElements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();

      if (!this.config.allowedTags.includes(tagName)) {
        // Replace the element with its children
        const parent = el.parentNode;
        if (parent) {
          // Move all child nodes to the parent
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          // Remove the element itself
          parent.removeChild(el);
        }
      }
    });
  }

  /**
   * Sanitize attributes on all elements
   * 
   * Removes non-whitelisted attributes and validates URLs
   * in href and src attributes.
   * 
   * @param container - DOM element to clean
   * 
   * Requirements: 19.2, 19.4 - Whitelist attributes and validate URLs
   */
  sanitizeAttributes(container: HTMLElement): void {
    container.querySelectorAll('*').forEach((el) => {
      const tagName = el.tagName.toLowerCase();
      const allowedAttrs = this.config.allowedAttributes[tagName] || [];

      // Get all attributes
      const attributes = Array.from(el.attributes);

      attributes.forEach((attr) => {
        const attrName = attr.name.toLowerCase();

        // Remove event handler attributes (Requirement 19.1)
        if (attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }

        // Remove non-whitelisted attributes (Requirement 19.2)
        if (!allowedAttrs.includes(attrName)) {
          el.removeAttribute(attr.name);
          return;
        }

        // Validate URL attributes (Requirement 19.4)
        if (attrName === 'href' || attrName === 'src') {
          const url = attr.value;
          if (!this.validateURL(url)) {
            el.removeAttribute(attr.name);
          }
        }

        // Sanitize style attributes if present
        if (attrName === 'style') {
          const sanitizedStyle = this.sanitizeStyleAttribute(attr.value);
          if (sanitizedStyle) {
            el.setAttribute('style', sanitizedStyle);
          } else {
            el.removeAttribute('style');
          }
        }
      });
    });
  }

  /**
   * Validate URL protocol
   * 
   * Ensures URLs use only allowed protocols (http, https, mailto, data)
   * to prevent javascript: and other dangerous protocols.
   * 
   * @param url - URL string to validate
   * @returns true if URL is valid, false otherwise
   * 
   * Requirement: 19.4 - Validate URL protocol
   */
  validateURL(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Trim whitespace
    url = url.trim();

    // Empty URLs are invalid
    if (url.length === 0) {
      return false;
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
    for (const protocol of dangerousProtocols) {
      if (url.toLowerCase().startsWith(protocol)) {
        // Allow data: URLs for images only
        if (protocol === 'data:text/html') {
          return false;
        }
        if (protocol === 'javascript:' || protocol === 'vbscript:') {
          return false;
        }
      }
    }

    try {
      // Parse URL (relative URLs will be resolved against current location)
      const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      
      // Check if protocol is in allowed list
      return this.config.allowedProtocols.includes(parsed.protocol);
    } catch {
      // If URL parsing fails, it might be a relative URL
      // Allow relative URLs that don't start with dangerous protocols
      return !url.includes(':') || url.startsWith('mailto:');
    }
  }

  /**
   * Sanitize style attribute
   * 
   * Removes dangerous CSS properties that could be used for attacks
   * (e.g., expression, behavior, -moz-binding)
   * 
   * @param style - Style attribute value
   * @returns Sanitized style string or empty string if invalid
   */
  private sanitizeStyleAttribute(style: string): string {
    if (!style || typeof style !== 'string') {
      return '';
    }

    // List of dangerous CSS properties
    const dangerousProperties = [
      'expression',
      'behavior',
      '-moz-binding',
      'javascript:',
      'vbscript:',
    ];

    // Check for dangerous properties
    const lowerStyle = style.toLowerCase();
    for (const prop of dangerousProperties) {
      if (lowerStyle.includes(prop)) {
        return '';
      }
    }

    return style;
  }

  /**
   * Escape HTML entities
   * 
   * Converts special characters to HTML entities to prevent
   * them from being interpreted as HTML.
   * 
   * @param text - Text to escape
   * @returns Escaped text
   * 
   * Requirement: 19.5 - Escape user-generated content
   */
  escapeHTML(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update sanitization configuration
   * 
   * Allows runtime configuration updates for the sanitizer.
   * Useful for different contexts requiring different security levels.
   * 
   * @param config - Partial configuration to merge with existing config
   * 
   * Requirement: 19.7 - Configurable whitelist
   */
  updateConfig(config: Partial<SanitizationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      // Merge allowedAttributes to preserve existing ones
      allowedAttributes: {
        ...this.config.allowedAttributes,
        ...(config.allowedAttributes || {}),
      },
    };
  }

  /**
   * Get current configuration
   * 
   * @returns Current sanitization configuration
   */
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }

  /**
   * Create a sanitizer with strict configuration
   * 
   * Returns a sanitizer instance with minimal allowed tags and attributes
   * for maximum security.
   * 
   * @returns ContentSanitizer instance with strict configuration
   */
  static createStrict(): ContentSanitizer {
    return new ContentSanitizer({
      allowedTags: ['p', 'br', 'strong', 'em', 'u'],
      allowedAttributes: {},
      allowedProtocols: ['https:'],
      stripScripts: true,
      stripStyles: true,
    });
  }

  /**
   * Create a sanitizer with permissive configuration
   * 
   * Returns a sanitizer instance with more allowed tags and attributes
   * for rich content editing.
   * 
   * @returns ContentSanitizer instance with permissive configuration
   */
  static createPermissive(): ContentSanitizer {
    return new ContentSanitizer({
      allowedTags: [
        ...DEFAULT_SANITIZATION_CONFIG.allowedTags,
        'section', 'article', 'aside', 'header', 'footer', 'nav',
        'figure', 'figcaption', 'details', 'summary',
      ],
      allowedAttributes: {
        ...DEFAULT_SANITIZATION_CONFIG.allowedAttributes,
        div: ['class', 'data-url', 'data-type', 'id'],
        span: ['class', 'style', 'id'],
        section: ['class', 'id'],
        article: ['class', 'id'],
      },
      stripStyles: false,
    });
  }
}
