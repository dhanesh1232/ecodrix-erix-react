/**
 * useContentCounter - React hook for real-time content counting
 * 
 * Provides real-time character count, word count, and reading time estimation
 * with debouncing for performance optimization.
 * 
 * @example
 * ```typescript
 * function MyEditor() {
 *   const [content, setContent] = useState('');
 *   const { characters, words, readingTime, isAtLimit } = useContentCounter({
 *     content,
 *     maxCharacters: 1000,
 *     debounceMs: 300,
 *   });
 * 
 *   return (
 *     <div>
 *       <textarea value={content} onChange={e => setContent(e.target.value)} />
 *       <div>
 *         {characters} / {maxCharacters} characters
 *         {words} words · {readingTime}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { ContentCounter, ContentCountResult, ContentCounterConfig } from '../lib/content/ContentCounter';

/**
 * Configuration for useContentCounter hook
 */
export interface UseContentCounterConfig extends ContentCounterConfig {
  /**
   * Content to count
   */
  content: string;

  /**
   * Maximum character limit (optional)
   * Used to calculate remaining characters and limit status
   */
  maxCharacters?: number;

  /**
   * Maximum word limit (optional)
   * Used to calculate remaining words and limit status
   */
  maxWords?: number;

  /**
   * Debounce delay in milliseconds
   * Default: 300ms
   * Set to 0 to disable debouncing
   */
  debounceMs?: number;

  /**
   * Whether to enable real-time counting
   * Default: true
   * Set to false to only count on demand
   */
  enabled?: boolean;
}

/**
 * Result from useContentCounter hook
 */
export interface UseContentCounterResult extends ContentCountResult {
  /**
   * Remaining characters before hitting limit
   * Undefined if no maxCharacters set
   */
  remainingCharacters?: number;

  /**
   * Remaining words before hitting limit
   * Undefined if no maxWords set
   */
  remainingWords?: number;

  /**
   * Whether character limit has been reached
   */
  isAtCharacterLimit: boolean;

  /**
   * Whether word limit has been reached
   */
  isAtWordLimit: boolean;

  /**
   * Whether any limit has been reached
   */
  isAtLimit: boolean;

  /**
   * Percentage of character limit used (0-100)
   * Undefined if no maxCharacters set
   */
  characterLimitPercentage?: number;

  /**
   * Percentage of word limit used (0-100)
   * Undefined if no maxWords set
   */
  wordLimitPercentage?: number;

  /**
   * Whether counting is currently in progress
   */
  isCounting: boolean;

  /**
   * Force immediate recount (bypasses debounce)
   */
  recount: () => void;
}

/**
 * React hook for real-time content counting with debouncing
 * 
 * @param config - Configuration options
 * @returns Content count result with limit tracking
 */
export function useContentCounter(config: UseContentCounterConfig): UseContentCounterResult {
  const {
    content,
    maxCharacters,
    maxWords,
    debounceMs = 300,
    enabled = true,
    ...counterConfig
  } = config;

  // Create counter instance (memoized)
  const counter = useMemo(() => new ContentCounter(counterConfig), [
    counterConfig.readingSpeed,
    counterConfig.countHtmlTags,
    counterConfig.countWhitespace,
  ]);

  // State for count results
  const [countResult, setCountResult] = useState<ContentCountResult>(() => 
    counter.count(content)
  );

  // State for counting status
  const [isCounting, setIsCounting] = useState(false);

  // Ref for debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Ref to track if component is mounted
  const isMounted = useRef(true);

  /**
   * Perform counting operation
   */
  const performCount = (contentToCount: string) => {
    if (!isMounted.current) return;

    setIsCounting(true);
    
    // Use requestIdleCallback for non-blocking counting if available
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        if (!isMounted.current) return;
        const result = counter.count(contentToCount);
        setCountResult(result);
        setIsCounting(false);
      }, { timeout: 100 });
    } else {
      // Fallback to immediate execution
      const result = counter.count(contentToCount);
      setCountResult(result);
      setIsCounting(false);
    }
  };

  /**
   * Force immediate recount (bypasses debounce)
   */
  const recount = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    performCount(content);
  };

  // Effect to handle content changes with debouncing
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If no debounce, count immediately
    if (debounceMs === 0) {
      performCount(content);
      return;
    }

    // Set up debounced counting
    debounceTimer.current = setTimeout(() => {
      performCount(content);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, enabled, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Calculate limit-related values
  const remainingCharacters = maxCharacters !== undefined 
    ? Math.max(0, maxCharacters - countResult.characters)
    : undefined;

  const remainingWords = maxWords !== undefined
    ? Math.max(0, maxWords - countResult.words)
    : undefined;

  const isAtCharacterLimit = maxCharacters !== undefined 
    ? countResult.characters >= maxCharacters
    : false;

  const isAtWordLimit = maxWords !== undefined
    ? countResult.words >= maxWords
    : false;

  const isAtLimit = isAtCharacterLimit || isAtWordLimit;

  const characterLimitPercentage = maxCharacters !== undefined
    ? Math.min(100, (countResult.characters / maxCharacters) * 100)
    : undefined;

  const wordLimitPercentage = maxWords !== undefined
    ? Math.min(100, (countResult.words / maxWords) * 100)
    : undefined;

  return {
    ...countResult,
    remainingCharacters,
    remainingWords,
    isAtCharacterLimit,
    isAtWordLimit,
    isAtLimit,
    characterLimitPercentage,
    wordLimitPercentage,
    isCounting,
    recount,
  };
}

/**
 * Simplified hook for character counting only
 * 
 * @param content - Content to count
 * @param maxCharacters - Optional character limit
 * @returns Character count and limit info
 */
export function useCharacterCount(content: string, maxCharacters?: number) {
  const result = useContentCounter({ 
    content, 
    maxCharacters,
    debounceMs: 100, // Faster for character-only counting
  });

  return {
    characters: result.characters,
    remaining: result.remainingCharacters,
    isAtLimit: result.isAtCharacterLimit,
    percentage: result.characterLimitPercentage,
  };
}

/**
 * Simplified hook for word counting only
 * 
 * @param content - Content to count
 * @param maxWords - Optional word limit
 * @returns Word count and limit info
 */
export function useWordCount(content: string, maxWords?: number) {
  const result = useContentCounter({ 
    content, 
    maxWords,
    debounceMs: 300,
  });

  return {
    words: result.words,
    remaining: result.remainingWords,
    isAtLimit: result.isAtWordLimit,
    percentage: result.wordLimitPercentage,
  };
}

/**
 * Hook for reading time estimation only
 * 
 * @param content - Content to analyze
 * @param readingSpeed - Words per minute (default: 225)
 * @returns Reading time info
 */
export function useReadingTime(content: string, readingSpeed = 225) {
  const result = useContentCounter({ 
    content,
    readingSpeed,
    debounceMs: 500, // Slower debounce for reading time
  });

  return {
    minutes: result.readingTimeMinutes,
    formatted: result.readingTimeFormatted,
    words: result.words,
  };
}
