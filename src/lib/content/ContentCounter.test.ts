/**
 * Unit tests for ContentCounter
 * 
 * Tests Unicode-aware character counting, word counting, and reading time estimation
 * 
 * Requirements: 8.4, 11.7, 12.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentCounter } from './ContentCounter';

describe('ContentCounter', () => {
  let counter: ContentCounter;

  beforeEach(() => {
    counter = new ContentCounter();
  });

  describe('countCharacters', () => {
    it('should count basic ASCII characters correctly', () => {
      expect(counter.countCharacters('Hello World')).toBe(11);
      expect(counter.countCharacters('abc123')).toBe(6);
    });

    it('should handle emojis as single characters', () => {
      expect(counter.countCharacters('Hello 👋')).toBe(7);
      expect(counter.countCharacters('🎉🎊🎈')).toBe(3);
      expect(counter.countCharacters('I ❤️ coding')).toBe(10); // Heart emoji with variation selector = 1 grapheme
    });

    it('should handle multi-byte Unicode characters', () => {
      expect(counter.countCharacters('café')).toBe(4);
      expect(counter.countCharacters('你好世界')).toBe(4);
      expect(counter.countCharacters('مرحبا')).toBe(5);
    });

    it('should handle combining characters correctly', () => {
      // é can be represented as e + combining acute accent
      const combining = 'e\u0301'; // e + combining acute
      expect(counter.countCharacters(combining)).toBe(1);
    });

    it('should handle empty and whitespace strings', () => {
      expect(counter.countCharacters('')).toBe(0);
      expect(counter.countCharacters('   ')).toBe(3);
      expect(counter.countCharacters('\n\t')).toBe(2);
    });

    it('should strip HTML tags by default', () => {
      expect(counter.countCharacters('<p>Hello</p>')).toBe(5);
      expect(counter.countCharacters('<strong>Bold</strong> text')).toBe(9);
      expect(counter.countCharacters('<div><p>Test</p></div>')).toBe(4);
    });

    it('should count HTML tags when configured', () => {
      const htmlCounter = new ContentCounter({ countHtmlTags: true });
      expect(htmlCounter.countCharacters('<p>Hi</p>')).toBeGreaterThan(2);
    });

    it('should handle whitespace counting configuration', () => {
      const noWhitespaceCounter = new ContentCounter({ countWhitespace: false });
      expect(noWhitespaceCounter.countCharacters('Hello World')).toBe(10);
      expect(noWhitespaceCounter.countCharacters('a b c')).toBe(3);
    });
  });

  describe('countWords', () => {
    it('should count basic English words correctly', () => {
      expect(counter.countWords('Hello World')).toBe(2);
      expect(counter.countWords('The quick brown fox')).toBe(4);
    });

    it('should handle punctuation correctly', () => {
      expect(counter.countWords("Hello, World!")).toBe(2);
      expect(counter.countWords("It's a beautiful day.")).toBe(4);
    });

    it('should handle CJK characters (each character is a word)', () => {
      expect(counter.countWords('你好世界')).toBe(4);
      expect(counter.countWords('こんにちは')).toBe(5);
      expect(counter.countWords('안녕하세요')).toBe(5);
    });

    it('should handle mixed scripts', () => {
      expect(counter.countWords('Hello 世界')).toBe(3);
      expect(counter.countWords('I love 寿司')).toBe(4);
    });

    it('should handle empty and whitespace strings', () => {
      expect(counter.countWords('')).toBe(0);
      expect(counter.countWords('   ')).toBe(0);
      expect(counter.countWords('\n\t')).toBe(0);
    });

    it('should strip HTML tags', () => {
      expect(counter.countWords('<p>Hello World</p>')).toBe(2);
      expect(counter.countWords('<div><strong>One</strong> <em>Two</em></div>')).toBe(2);
    });

    it('should handle numbers as words', () => {
      expect(counter.countWords('I have 3 apples')).toBe(4);
      expect(counter.countWords('123 456')).toBe(2);
    });

    it('should handle hyphenated words', () => {
      expect(counter.countWords('state-of-the-art')).toBe(4);
      expect(counter.countWords('twenty-one')).toBe(2);
    });
  });

  describe('countSentences', () => {
    it('should count sentences with period', () => {
      expect(counter.countSentences('Hello. World.')).toBe(2);
      expect(counter.countSentences('This is a test.')).toBe(1);
    });

    it('should count sentences with various punctuation', () => {
      expect(counter.countSentences('Hello! How are you? I am fine.')).toBe(3);
    });

    it('should handle text without sentence endings', () => {
      expect(counter.countSentences('Hello World')).toBe(1);
    });

    it('should handle empty strings', () => {
      expect(counter.countSentences('')).toBe(0);
      expect(counter.countSentences('   ')).toBe(0);
    });

    it('should handle CJK sentence endings', () => {
      expect(counter.countSentences('你好。世界。')).toBe(2);
      expect(counter.countSentences('こんにちは！元気ですか？')).toBe(2);
    });
  });

  describe('countParagraphs', () => {
    it('should count paragraphs in plain text', () => {
      expect(counter.countParagraphs('Para 1\n\nPara 2')).toBe(2);
      expect(counter.countParagraphs('One\n\nTwo\n\nThree')).toBe(3);
    });

    it('should count <p> tags in HTML', () => {
      expect(counter.countParagraphs('<p>One</p><p>Two</p>')).toBe(2);
      expect(counter.countParagraphs('<div><p>Test</p></div>')).toBe(1);
    });

    it('should handle single paragraph', () => {
      expect(counter.countParagraphs('Single paragraph')).toBe(1);
    });

    it('should handle empty strings', () => {
      expect(counter.countParagraphs('')).toBe(0);
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time correctly', () => {
      // Default reading speed is 225 words per minute
      const text = 'word '.repeat(225); // 225 words
      expect(counter.estimateReadingTime(text)).toBe(1);
    });

    it('should round up to nearest minute', () => {
      const text = 'word '.repeat(250); // 250 words
      expect(counter.estimateReadingTime(text)).toBe(2);
    });

    it('should return 0 for empty content', () => {
      expect(counter.estimateReadingTime('')).toBe(0);
    });

    it('should handle custom reading speed', () => {
      const fastCounter = new ContentCounter({ readingSpeed: 300 });
      const text = 'word '.repeat(300); // 300 words
      expect(fastCounter.estimateReadingTime(text)).toBe(1);
    });

    it('should return at least 1 minute for short content', () => {
      expect(counter.estimateReadingTime('Hello World')).toBe(1);
    });
  });

  describe('formatReadingTime', () => {
    it('should format reading time correctly', () => {
      expect(counter.formatReadingTime(0)).toBe('0 min read');
      expect(counter.formatReadingTime(1)).toBe('1 min read');
      expect(counter.formatReadingTime(5)).toBe('5 min read');
    });

    it('should handle less than 1 minute', () => {
      expect(counter.formatReadingTime(0.5)).toBe('< 1 min read');
    });
  });

  describe('count', () => {
    it('should return comprehensive count result', () => {
      const text = 'Hello World. This is a test.';
      const result = counter.count(text);

      expect(result.characters).toBeGreaterThan(0);
      expect(result.words).toBe(6);
      expect(result.sentences).toBe(2);
      expect(result.paragraphs).toBe(1);
      expect(result.readingTimeMinutes).toBe(1);
      expect(result.readingTimeFormatted).toBe('< 1 min read');
    });

    it('should handle complex content', () => {
      const html = '<p>Hello 👋 World</p><p>你好世界</p>';
      const result = counter.count(html);

      expect(result.characters).toBeGreaterThan(0);
      expect(result.words).toBeGreaterThan(0);
      expect(result.paragraphs).toBe(2);
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = counter.countCharacters(html);
      expect(result).toBe(11); // "Hello World"
    });

    it('should remove script and style tags', () => {
      const html = '<p>Text</p><script>alert("XSS")</script><style>.test{}</style>';
      const result = counter.countCharacters(html);
      expect(result).toBe(4); // "Text"
    });

    it('should decode HTML entities', () => {
      const html = 'Hello&nbsp;World&amp;Test';
      const result = counter.countCharacters(html);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should allow updating configuration', () => {
      counter.updateConfig({ readingSpeed: 300 });
      const config = counter.getConfig();
      expect(config.readingSpeed).toBe(300);
    });

    it('should preserve other config when updating', () => {
      counter.updateConfig({ readingSpeed: 300 });
      const config = counter.getConfig();
      expect(config.countHtmlTags).toBe(false); // Default value preserved
    });
  });

  describe('edge cases', () => {
    it('should handle very long content', () => {
      const longText = 'word '.repeat(10000);
      const result = counter.count(longText);
      expect(result.words).toBe(10000);
    });

    it('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = counter.countCharacters(text);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle mixed line endings', () => {
      const text = 'Line 1\nLine 2\r\nLine 3\rLine 4';
      const result = counter.countWords(text);
      expect(result).toBe(8);
    });

    it('should handle zero-width characters', () => {
      const text = 'Hello\u200BWorld'; // Zero-width space
      const result = counter.countWords(text);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('convenience functions', () => {
  it('should export convenience functions', async () => {
    const { countCharacters, countWords, estimateReadingTime, formatReadingTime, count } = 
      await import('./ContentCounter');

    expect(typeof countCharacters).toBe('function');
    expect(typeof countWords).toBe('function');
    expect(typeof estimateReadingTime).toBe('function');
    expect(typeof formatReadingTime).toBe('function');
    expect(typeof count).toBe('function');
  });
});
