/**
 * ContentCounter - Unicode-aware character and word counting utilities
 * 
 * Provides accurate counting algorithms that properly handle:
 * - Emojis and multi-byte Unicode characters
 * - Combining characters and diacritics
 * - Different languages and scripts
 * - HTML content (counts visible text only)
 * - Reading time estimation
 * 
 * @example
 * ```typescript
 * const counter = new ContentCounter();
 * 
 * const charCount = counter.countCharacters('Hello 👋 World');
 * const wordCount = counter.countWords('Hello World');
 * const readingTime = counter.estimateReadingTime('Hello World');
 * ```
 */

/**
 * Configuration for content counting
 */
export interface ContentCounterConfig {
  /**
   * Average reading speed in words per minute
   * Default: 225 (average adult reading speed)
   */
  readingSpeed?: number;

  /**
   * Whether to count HTML tags as characters
   * Default: false (counts only visible text)
   */
  countHtmlTags?: boolean;

  /**
   * Whether to count whitespace characters
   * Default: true
   */
  countWhitespace?: boolean;

  /**
   * Word boundary patterns for different languages
   * Default: supports Latin, CJK, and other scripts
   */
  wordBoundaryPattern?: RegExp;
}

/**
 * Result of content counting operations
 */
export interface ContentCountResult {
  /**
   * Number of characters (Unicode-aware)
   */
  characters: number;

  /**
   * Number of words
   */
  words: number;

  /**
   * Estimated reading time in minutes
   */
  readingTimeMinutes: number;

  /**
   * Formatted reading time string (e.g., "2 min read")
   */
  readingTimeFormatted: string;

  /**
   * Number of sentences (approximate)
   */
  sentences?: number;

  /**
   * Number of paragraphs
   */
  paragraphs?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ContentCounterConfig> = {
  readingSpeed: 225,
  countHtmlTags: false,
  countWhitespace: true,
  // Word boundary pattern that handles:
  // - Latin scripts (spaces, punctuation)
  // - CJK characters (each character is a word)
  // - Other scripts with word boundaries
  // Uses character ranges instead of \p{Script=...} for broader compatibility
  wordBoundaryPattern: /\b[\w]+(?:[''][\w]+)*\b|[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/gu,
};

/**
 * ContentCounter class - provides Unicode-aware counting utilities
 */
export class ContentCounter {
  private config: Required<ContentCounterConfig>;

  /**
   * Create a new ContentCounter instance
   * @param config - Configuration options
   */
  constructor(config: Partial<ContentCounterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Count characters in content (Unicode-aware)
   * Properly handles emojis, combining characters, and multi-byte characters
   * 
   * @param content - Content to count (plain text or HTML)
   * @returns Number of characters
   * 
   * @example
   * ```typescript
   * counter.countCharacters('Hello 👋'); // 7 (not 8)
   * counter.countCharacters('café'); // 4 (not 5 with combining accent)
   * ```
   */
  countCharacters(content: string): number {
    if (!content) return 0;

    // Strip HTML if configured
    const text = this.config.countHtmlTags ? content : this.stripHtml(content);

    // Remove whitespace if not counting it
    const processedText = this.config.countWhitespace ? text : text.replace(/\s/g, '');

    // Use Intl.Segmenter for accurate grapheme cluster counting
    // This properly handles emojis, combining characters, etc.
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(processedText)).length;
    }

    // Fallback: Use spread operator which handles surrogate pairs correctly
    return [...processedText].length;
  }

  /**
   * Count words in content (Unicode-aware)
   * Handles different languages and scripts:
   * - Latin scripts: words separated by spaces/punctuation
   * - CJK scripts: each character is typically a word
   * - Mixed scripts: combines both approaches
   * 
   * @param content - Content to count (plain text or HTML)
   * @returns Number of words
   * 
   * @example
   * ```typescript
   * counter.countWords('Hello World'); // 2
   * counter.countWords('你好世界'); // 4 (CJK characters)
   * counter.countWords('Hello 世界'); // 3 (mixed)
   * ```
   */
  countWords(content: string): number {
    if (!content) return 0;

    // Strip HTML
    const text = this.stripHtml(content);

    // Remove extra whitespace
    const trimmedText = text.trim();
    if (!trimmedText) return 0;

    // Match words using the configured pattern
    const matches = trimmedText.match(this.config.wordBoundaryPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count sentences in content (approximate)
   * Uses common sentence-ending punctuation
   * 
   * @param content - Content to count (plain text or HTML)
   * @returns Number of sentences
   */
  countSentences(content: string): number {
    if (!content) return 0;

    const text = this.stripHtml(content);
    if (!text.trim()) return 0;
    
    // Match sentence-ending punctuation
    // Handles: . ! ? and their Unicode/CJK variants (。！？)
    // CJK endings don't need whitespace after them
    const sentencePattern = /[.!?]+[\s\n\r]+|[.!?]+$|[。！？]+/g;
    const matches = text.match(sentencePattern);
    
    // If no sentence endings found but text exists, count as 1 sentence
    return matches ? matches.length : (text.trim() ? 1 : 0);
  }

  /**
   * Count paragraphs in content
   * Paragraphs are separated by double line breaks or <p> tags
   * 
   * @param content - Content to count (plain text or HTML)
   * @returns Number of paragraphs
   */
  countParagraphs(content: string): number {
    if (!content) return 0;

    // For HTML, count <p> tags
    if (/<p[^>]*>/i.test(content)) {
      const matches = content.match(/<p[^>]*>/gi);
      return matches ? matches.length : 0;
    }

    // For plain text, split by double line breaks
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.length;
  }

  /**
   * Estimate reading time based on word count
   * Uses average reading speed (default: 225 words per minute)
   * 
   * @param content - Content to analyze (plain text or HTML)
   * @returns Reading time in minutes (rounded up)
   * 
   * @example
   * ```typescript
   * counter.estimateReadingTime('...450 words...'); // 2 minutes
   * ```
   */
  estimateReadingTime(content: string): number {
    const wordCount = this.countWords(content);
    const minutes = wordCount / this.config.readingSpeed;
    
    // Round up to nearest minute, minimum 1 minute if content exists
    return wordCount > 0 ? Math.ceil(minutes) : 0;
  }

  /**
   * Format reading time as a human-readable string
   * 
   * @param minutes - Reading time in minutes
   * @returns Formatted string (e.g., "2 min read", "< 1 min read")
   */
  formatReadingTime(minutes: number): string {
    if (minutes === 0) return '0 min read';
    if (minutes < 1) return '< 1 min read';
    return `${minutes} min read`;
  }

  /**
   * Get comprehensive count statistics for content
   * 
   * @param content - Content to analyze (plain text or HTML)
   * @returns Complete count result with all metrics
   * 
   * @example
   * ```typescript
   * const result = counter.count('Hello World...');
   * console.log(result.characters); // 12
   * console.log(result.words); // 2
   * console.log(result.readingTimeFormatted); // "< 1 min read"
   * ```
   */
  count(content: string): ContentCountResult {
    const characters = this.countCharacters(content);
    const words = this.countWords(content);
    const sentences = this.countSentences(content);
    const paragraphs = this.countParagraphs(content);
    const rawMinutes = words > 0 ? words / this.config.readingSpeed : 0;
    const readingTimeMinutes = words > 0 ? Math.ceil(rawMinutes) : 0;
    const readingTimeFormatted = this.formatReadingTime(rawMinutes);

    return {
      characters,
      words,
      readingTimeMinutes,
      readingTimeFormatted,
      sentences,
      paragraphs,
    };
  }

  /**
   * Strip HTML tags from content
   * Preserves text content and converts common entities
   * 
   * @param html - HTML content
   * @returns Plain text content
   */
  private stripHtml(html: string): string {
    // If no HTML tags, return as-is (preserve whitespace, just decode entities)
    if (!html.includes('<')) {
      return html
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }

    // Remove script and style tags with their content
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Normalize whitespace and trim for HTML content
    text = text.replace(/\s+/g, ' ');
    return text.trim();
  }

  /**
   * Update configuration
   * @param config - Partial configuration updates
   */
  updateConfig(config: Partial<ContentCounterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ContentCounterConfig {
    return { ...this.config };
  }
}

/**
 * Create a singleton instance for convenience
 */
export const defaultCounter = new ContentCounter();

/**
 * Convenience functions using the default counter
 */
export const countCharacters = (content: string): number => 
  defaultCounter.countCharacters(content);

export const countWords = (content: string): number => 
  defaultCounter.countWords(content);

export const estimateReadingTime = (content: string): number => 
  defaultCounter.estimateReadingTime(content);

export const formatReadingTime = (minutes: number): string => 
  defaultCounter.formatReadingTime(minutes);

export const count = (content: string): ContentCountResult => 
  defaultCounter.count(content);
