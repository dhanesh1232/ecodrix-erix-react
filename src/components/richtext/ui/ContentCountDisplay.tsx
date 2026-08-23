/**
 * ContentCountDisplay - UI component for displaying content statistics
 * 
 * Displays character count, word count, and reading time with optional limits.
 * Integrates with useContentCounter hook for real-time updates.
 * 
 * @example
 * ```typescript
 * <ContentCountDisplay
 *   content={editorContent}
 *   maxCharacters={1000}
 *   showWords
 *   showReadingTime
 * />
 * ```
 */

import React from 'react';
import { useContentCounter } from '../../../hooks/useContentCounter';
import { cn } from '../../../lib/utils';

/**
 * Props for ContentCountDisplay component
 */
export interface ContentCountDisplayProps {
  /**
   * Content to count
   */
  content: string;

  /**
   * Maximum character limit (optional)
   */
  maxCharacters?: number;

  /**
   * Maximum word limit (optional)
   */
  maxWords?: number;

  /**
   * Whether to show character count
   * Default: true
   */
  showCharacters?: boolean;

  /**
   * Whether to show word count
   * Default: true
   */
  showWords?: boolean;

  /**
   * Whether to show reading time
   * Default: false
   */
  showReadingTime?: boolean;

  /**
   * Whether to show remaining count instead of current count
   * Default: false
   */
  showRemaining?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Separator between count items
   * Default: ' · '
   */
  separator?: string;

  /**
   * Whether to show warning when approaching limit
   * Default: true
   */
  showWarning?: boolean;

  /**
   * Percentage threshold for showing warning (0-100)
   * Default: 90
   */
  warningThreshold?: number;

  /**
   * Custom render function for character count
   */
  renderCharacters?: (count: number, remaining?: number, max?: number) => React.ReactNode;

  /**
   * Custom render function for word count
   */
  renderWords?: (count: number, remaining?: number, max?: number) => React.ReactNode;

  /**
   * Custom render function for reading time
   */
  renderReadingTime?: (formatted: string, minutes: number) => React.ReactNode;
}

/**
 * ContentCountDisplay component
 */
export const ContentCountDisplay: React.FC<ContentCountDisplayProps> = ({
  content,
  maxCharacters,
  maxWords,
  showCharacters = true,
  showWords = true,
  showReadingTime = false,
  showRemaining = false,
  className,
  separator = ' · ',
  showWarning = true,
  warningThreshold = 90,
  renderCharacters,
  renderWords,
  renderReadingTime,
}) => {
  const {
    characters,
    words,
    readingTimeFormatted,
    readingTimeMinutes,
    remainingCharacters,
    remainingWords,
    isAtCharacterLimit,
    isAtWordLimit,
    characterLimitPercentage,
    wordLimitPercentage,
  } = useContentCounter({
    content,
    maxCharacters,
    maxWords,
    debounceMs: 300,
  });

  // Determine if we should show warning
  const isCharacterWarning = showWarning && 
    characterLimitPercentage !== undefined && 
    characterLimitPercentage >= warningThreshold;

  const isWordWarning = showWarning && 
    wordLimitPercentage !== undefined && 
    wordLimitPercentage >= warningThreshold;

  // Build display items
  const items: React.ReactNode[] = [];

  // Character count
  if (showCharacters) {
    const charDisplay = renderCharacters ? (
      renderCharacters(characters, remainingCharacters, maxCharacters)
    ) : (
      <span
        className={cn(
          'transition-colors',
          isAtCharacterLimit && 'text-red-600 dark:text-red-400 font-medium',
          isCharacterWarning && !isAtCharacterLimit && 'text-orange-600 dark:text-orange-400'
        )}
      >
        {showRemaining && remainingCharacters !== undefined ? (
          <>
            {remainingCharacters} character{remainingCharacters !== 1 ? 's' : ''} remaining
          </>
        ) : (
          <>
            {characters.toLocaleString()}
            {maxCharacters !== undefined && ` / ${maxCharacters.toLocaleString()}`}
            {' '}character{characters !== 1 ? 's' : ''}
          </>
        )}
      </span>
    );
    items.push(charDisplay);
  }

  // Word count
  if (showWords) {
    const wordDisplay = renderWords ? (
      renderWords(words, remainingWords, maxWords)
    ) : (
      <span
        className={cn(
          'transition-colors',
          isAtWordLimit && 'text-red-600 dark:text-red-400 font-medium',
          isWordWarning && !isAtWordLimit && 'text-orange-600 dark:text-orange-400'
        )}
      >
        {showRemaining && remainingWords !== undefined ? (
          <>
            {remainingWords} word{remainingWords !== 1 ? 's' : ''} remaining
          </>
        ) : (
          <>
            {words.toLocaleString()}
            {maxWords !== undefined && ` / ${maxWords.toLocaleString()}`}
            {' '}word{words !== 1 ? 's' : ''}
          </>
        )}
      </span>
    );
    items.push(wordDisplay);
  }

  // Reading time
  if (showReadingTime) {
    const readingDisplay = renderReadingTime ? (
      renderReadingTime(readingTimeFormatted, readingTimeMinutes)
    ) : (
      <span className="text-muted-foreground">
        {readingTimeFormatted}
      </span>
    );
    items.push(readingDisplay);
  }

  // If no items to display, return null
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'text-sm text-muted-foreground flex items-center gap-1',
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item}
          {index < items.length - 1 && (
            <span className="text-muted-foreground/50">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Compact version for minimal UI (e.g., focus mode footer)
 */
export const ContentCountCompact: React.FC<ContentCountDisplayProps> = (props) => {
  return (
    <ContentCountDisplay
      {...props}
      showCharacters={false}
      showWords={true}
      showReadingTime={true}
      separator=" · "
      className={cn('text-xs', props.className)}
    />
  );
};

/**
 * Progress bar variant showing visual limit progress
 */
export interface ContentCountProgressProps extends ContentCountDisplayProps {
  /**
   * Whether to show progress bar
   * Default: true
   */
  showProgressBar?: boolean;

  /**
   * Height of progress bar in pixels
   * Default: 4
   */
  progressBarHeight?: number;
}

export const ContentCountProgress: React.FC<ContentCountProgressProps> = ({
  showProgressBar = true,
  progressBarHeight = 4,
  ...props
}) => {
  const {
    characterLimitPercentage,
    isAtCharacterLimit,
  } = useContentCounter({
    content: props.content,
    maxCharacters: props.maxCharacters,
    debounceMs: 300,
  });

  return (
    <div className="space-y-2">
      <ContentCountDisplay {...props} />
      
      {showProgressBar && characterLimitPercentage !== undefined && (
        <div 
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          style={{ height: progressBarHeight }}
        >
          <div
            className={cn(
              'h-full transition-all duration-300',
              isAtCharacterLimit 
                ? 'bg-red-500' 
                : characterLimitPercentage >= 90 
                  ? 'bg-orange-500' 
                  : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(100, characterLimitPercentage)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ContentCountDisplay;
