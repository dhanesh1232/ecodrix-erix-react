# ContentCounter - Unicode-Aware Content Counting

## Overview

The ContentCounter provides accurate, Unicode-aware character counting, word counting, and reading time estimation for the ErixEditor. It properly handles emojis, multi-byte characters, combining characters, and different language scripts.

## Features

- ✅ **Unicode-Aware Character Counting**: Properly counts emojis, combining characters, and multi-byte Unicode
- ✅ **Multi-Language Word Counting**: Handles Latin, CJK (Chinese, Japanese, Korean), and other scripts
- ✅ **Reading Time Estimation**: Calculates estimated reading time based on word count
- ✅ **HTML Content Support**: Strips HTML tags to count only visible text
- ✅ **Real-Time Tracking**: React hooks with debouncing for performance
- ✅ **Validation Integration**: Works seamlessly with ValidationEngine for limit enforcement
- ✅ **Customizable**: Configurable reading speed, whitespace handling, and more

## Requirements Satisfied

- **Requirement 8.4**: Character count updates in real-time and displays remaining characters if limit exists
- **Requirement 11.7**: Use Unicode-aware algorithms for word count and character count calculations
- **Requirement 12.8**: Display word count and reading time in focus mode minimal footer

## Installation

The ContentCounter is included in the `@ecodrix/erix-react` package:

```typescript
import { 
  ContentCounter, 
  useContentCounter,
  ContentCountDisplay 
} from '@ecodrix/erix-react/editor';
```

## Basic Usage

### Using the ContentCounter Class

```typescript
import { ContentCounter } from '@ecodrix/erix-react/editor';

const counter = new ContentCounter();

// Count characters (Unicode-aware)
const charCount = counter.countCharacters('Hello 👋 World'); // 13

// Count words (handles multiple languages)
const wordCount = counter.countWords('Hello World'); // 2
const cjkWords = counter.countWords('你好世界'); // 4

// Estimate reading time
const readingTime = counter.estimateReadingTime(content); // minutes

// Get comprehensive stats
const stats = counter.count(content);
console.log(stats);
// {
//   characters: 150,
//   words: 25,
//   readingTimeMinutes: 1,
//   readingTimeFormatted: '< 1 min read',
//   sentences: 3,
//   paragraphs: 2
// }
```

### Using React Hooks

```typescript
import { useContentCounter } from '@ecodrix/erix-react/editor';

function MyEditor() {
  const [content, setContent] = useState('');
  
  const {
    characters,
    words,
    readingTimeFormatted,
    remainingCharacters,
    isAtCharacterLimit,
  } = useContentCounter({
    content,
    maxCharacters: 1000,
    debounceMs: 300,
  });

  return (
    <div>
      <textarea 
        value={content} 
        onChange={e => setContent(e.target.value)}
        disabled={isAtCharacterLimit}
      />
      <div>
        {characters} / 1000 characters
        {words} words · {readingTimeFormatted}
      </div>
    </div>
  );
}
```

### Using UI Components

```typescript
import { ContentCountDisplay } from '@ecodrix/erix-react/editor';

function MyEditor() {
  const [content, setContent] = useState('');

  return (
    <div>
      <textarea value={content} onChange={e => setContent(e.target.value)} />
      
      <ContentCountDisplay
        content={content}
        maxCharacters={1000}
        showCharacters
        showWords
        showReadingTime
      />
    </div>
  );
}
```

## API Reference

### ContentCounter Class

#### Constructor

```typescript
new ContentCounter(config?: ContentCounterConfig)
```

**Config Options:**
- `readingSpeed?: number` - Words per minute (default: 225)
- `countHtmlTags?: boolean` - Count HTML tags as characters (default: false)
- `countWhitespace?: boolean` - Count whitespace characters (default: true)
- `wordBoundaryPattern?: RegExp` - Custom word boundary pattern

#### Methods

##### countCharacters(content: string): number

Counts characters using Unicode-aware algorithm. Properly handles:
- Emojis (counted as single characters)
- Combining characters (e.g., é as e + accent)
- Multi-byte Unicode characters
- HTML content (strips tags by default)

```typescript
counter.countCharacters('Hello 👋'); // 7 (not 8)
counter.countCharacters('café'); // 4
counter.countCharacters('<p>Hi</p>'); // 2
```

##### countWords(content: string): number

Counts words with multi-language support:
- Latin scripts: words separated by spaces/punctuation
- CJK scripts: each character is typically a word
- Mixed scripts: combines both approaches

```typescript
counter.countWords('Hello World'); // 2
counter.countWords('你好世界'); // 4
counter.countWords('Hello 世界'); // 3
```

##### estimateReadingTime(content: string): number

Estimates reading time in minutes based on word count and reading speed.

```typescript
counter.estimateReadingTime(content); // 2 (minutes)
```

##### formatReadingTime(minutes: number): string

Formats reading time as human-readable string.

```typescript
counter.formatReadingTime(2); // "2 min read"
counter.formatReadingTime(0.5); // "< 1 min read"
```

##### count(content: string): ContentCountResult

Returns comprehensive statistics:

```typescript
const result = counter.count(content);
// {
//   characters: number,
//   words: number,
//   readingTimeMinutes: number,
//   readingTimeFormatted: string,
//   sentences: number,
//   paragraphs: number
// }
```

### React Hooks

#### useContentCounter(config: UseContentCounterConfig)

Main hook for real-time content counting with debouncing.

**Config:**
- `content: string` - Content to count (required)
- `maxCharacters?: number` - Character limit
- `maxWords?: number` - Word limit
- `debounceMs?: number` - Debounce delay (default: 300ms)
- `enabled?: boolean` - Enable/disable counting (default: true)
- Plus all ContentCounterConfig options

**Returns:**
```typescript
{
  characters: number,
  words: number,
  readingTimeMinutes: number,
  readingTimeFormatted: string,
  remainingCharacters?: number,
  remainingWords?: number,
  isAtCharacterLimit: boolean,
  isAtWordLimit: boolean,
  isAtLimit: boolean,
  characterLimitPercentage?: number,
  wordLimitPercentage?: number,
  isCounting: boolean,
  recount: () => void
}
```

#### useCharacterCount(content: string, maxCharacters?: number)

Simplified hook for character counting only.

```typescript
const { characters, remaining, isAtLimit, percentage } = useCharacterCount(content, 1000);
```

#### useWordCount(content: string, maxWords?: number)

Simplified hook for word counting only.

```typescript
const { words, remaining, isAtLimit, percentage } = useWordCount(content, 500);
```

#### useReadingTime(content: string, readingSpeed?: number)

Hook for reading time estimation only.

```typescript
const { minutes, formatted, words } = useReadingTime(content, 225);
```

### UI Components

#### ContentCountDisplay

Displays content statistics with optional limits.

**Props:**
- `content: string` - Content to count (required)
- `maxCharacters?: number` - Character limit
- `maxWords?: number` - Word limit
- `showCharacters?: boolean` - Show character count (default: true)
- `showWords?: boolean` - Show word count (default: true)
- `showReadingTime?: boolean` - Show reading time (default: false)
- `showRemaining?: boolean` - Show remaining instead of current (default: false)
- `className?: string` - Custom CSS class
- `separator?: string` - Separator between items (default: ' · ')
- `showWarning?: boolean` - Show warning when approaching limit (default: true)
- `warningThreshold?: number` - Warning threshold percentage (default: 90)

**Custom Rendering:**
- `renderCharacters?: (count, remaining, max) => ReactNode`
- `renderWords?: (count, remaining, max) => ReactNode`
- `renderReadingTime?: (formatted, minutes) => ReactNode`

```typescript
<ContentCountDisplay
  content={content}
  maxCharacters={1000}
  showCharacters
  showWords
  showReadingTime
  showWarning
  warningThreshold={90}
/>
```

#### ContentCountProgress

Displays content statistics with visual progress bar.

```typescript
<ContentCountProgress
  content={content}
  maxCharacters={1000}
  showProgressBar
  progressBarHeight={4}
/>
```

#### ContentCountCompact

Compact version for minimal UI (e.g., focus mode footer).

```typescript
<ContentCountCompact
  content={content}
  showWords
  showReadingTime
/>
```

## Integration with ValidationEngine

The ContentCounter integrates seamlessly with the ValidationEngine for enforcing content limits:

```typescript
import { ValidationEngine, ValidationRuleType } from '@ecodrix/erix-react/editor';
import { useContentCounter } from '@ecodrix/erix-react/editor';

function EditorWithValidation() {
  const [content, setContent] = useState('');
  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine();
    
    // Add character limit rule
    engine.addRule({
      id: 'max-chars',
      type: ValidationRuleType.MAX_LENGTH,
      value: 1000,
      message: 'Content must not exceed 1000 characters',
      realTime: true,
    });
    
    // Add custom word limit rule
    engine.addRule({
      id: 'max-words',
      type: ValidationRuleType.CUSTOM,
      message: 'Content must not exceed 500 words',
      realTime: true,
      validator: (text) => {
        const { countWords } = require('./ContentCounter');
        return countWords(text) <= 500;
      },
    });
    
    return engine;
  });

  const counter = useContentCounter({
    content,
    maxCharacters: 1000,
    maxWords: 500,
  });

  useEffect(() => {
    validationEngine.validateRealTime(content);
  }, [content]);

  return (
    <div>
      <textarea 
        value={content} 
        onChange={e => setContent(e.target.value)}
        disabled={counter.isAtLimit}
      />
      <ContentCountDisplay
        content={content}
        maxCharacters={1000}
        maxWords={500}
        showCharacters
        showWords
      />
    </div>
  );
}
```

## Unicode Handling

### Emojis

Emojis are correctly counted as single characters:

```typescript
counter.countCharacters('Hello 👋'); // 7 (not 8)
counter.countCharacters('🎉🎊🎈'); // 3
counter.countCharacters('I ❤️ coding'); // 11
```

### Combining Characters

Combining characters (diacritics) are handled correctly:

```typescript
counter.countCharacters('café'); // 4
counter.countCharacters('e\u0301'); // 1 (e + combining acute accent)
```

### Multi-Byte Characters

Multi-byte Unicode characters are counted correctly:

```typescript
counter.countCharacters('你好世界'); // 4
counter.countCharacters('مرحبا'); // 5
```

### CJK Word Counting

CJK characters are counted as individual words:

```typescript
counter.countWords('你好世界'); // 4
counter.countWords('こんにちは'); // 5
counter.countWords('안녕하세요'); // 5
```

## Performance Optimization

### Debouncing

The `useContentCounter` hook includes built-in debouncing to prevent excessive counting operations:

```typescript
const counter = useContentCounter({
  content,
  debounceMs: 300, // Wait 300ms after last change
});
```

### Idle Callback

When available, counting operations use `requestIdleCallback` to avoid blocking the main thread:

```typescript
// Automatically uses requestIdleCallback if available
const counter = useContentCounter({ content });
```

### Disable When Not Needed

Disable counting when not visible:

```typescript
const counter = useContentCounter({
  content,
  enabled: isVisible, // Only count when visible
});
```

## Testing

The ContentCounter includes comprehensive unit tests covering:

- Basic ASCII character counting
- Emoji and Unicode handling
- Multi-language word counting
- HTML stripping
- Reading time estimation
- Edge cases and special characters

Run tests:

```bash
npm test ContentCounter.test.ts
```

## Browser Compatibility

The ContentCounter uses modern browser APIs with fallbacks:

- **Intl.Segmenter**: Used for accurate grapheme cluster counting (Chrome 87+, Safari 14.1+)
- **Fallback**: Spread operator for Unicode support in older browsers
- **requestIdleCallback**: Used for non-blocking counting with fallback to immediate execution

## Examples

See `ContentCounterIntegration.example.tsx` for complete integration examples including:

1. Basic character limit with validation
2. Word limit with validation
3. Combined character and word limits with progress bar
4. Focus mode footer with minimal stats
5. Real-time validation with error display
6. Custom rendering with icons
7. Preventing input when limit reached

## Best Practices

1. **Use Debouncing**: Always use debouncing for real-time counting to avoid performance issues
2. **Choose Appropriate Debounce Delay**: 
   - Character count: 100-200ms
   - Word count: 300ms
   - Reading time: 500ms
3. **Disable When Hidden**: Disable counting when the editor is not visible
4. **Integrate with Validation**: Use ValidationEngine for enforcing limits
5. **Show Visual Feedback**: Use progress bars and warnings when approaching limits
6. **Handle Limits Gracefully**: Disable input or show clear messages when limits are reached

## Troubleshooting

### Character count seems incorrect

Make sure you're using the Unicode-aware counting, not `.length`:

```typescript
// ❌ Wrong - counts UTF-16 code units
const count = content.length;

// ✅ Correct - counts grapheme clusters
const count = counter.countCharacters(content);
```

### Word count doesn't match expectations

The word counter handles multiple languages. For CJK text, each character is typically counted as a word:

```typescript
counter.countWords('Hello World'); // 2 (Latin)
counter.countWords('你好世界'); // 4 (CJK - each character)
```

### Performance issues with large documents

Increase the debounce delay or disable real-time counting:

```typescript
const counter = useContentCounter({
  content,
  debounceMs: 1000, // Longer delay
  enabled: false, // Disable real-time, count on demand
});

// Count manually when needed
counter.recount();
```

## License

MIT License - Part of @ecodrix/erix-react package
