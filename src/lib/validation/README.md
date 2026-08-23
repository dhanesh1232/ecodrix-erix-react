# Content Validation Engine

The ValidationEngine provides a flexible, rule-based content validation system for the ErixEditor with support for real-time validation, async validators, and event-driven architecture.

## Features

- **Multiple Validation Types**: Max/min length, required fields, pattern matching, allowed formats, custom validators
- **Real-time Validation**: Debounced validation as users type
- **Async Validators**: Support for async validation rules (e.g., checking uniqueness via API)
- **Priority-based Execution**: Control the order of rule execution
- **Event System**: Listen to validation lifecycle events
- **Field-level & Document-level**: Validate specific fields or entire documents
- **Performance Optimized**: Debouncing, early exit on first error, execution time tracking

## Basic Usage

```typescript
import { ValidationEngine, createMaxLengthRule, createRequiredRule } from '@ecodrix/erix-react';

// Create engine instance
const engine = new ValidationEngine({
  enableRealTime: true,
  realTimeDebounce: 300,
});

// Add validation rules
engine.addRule(createRequiredRule('Content is required'));
engine.addRule(createMaxLengthRule(1000, 'Content must not exceed 1000 characters'));

// Validate content
const result = await engine.validate(content);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Validation Rules

### Built-in Rule Creators

#### Max Length
```typescript
engine.addRule(createMaxLengthRule(
  1000, // max length
  'Content too long', // error message
  { realTime: true, priority: 10 } // options
));
```

#### Min Length
```typescript
engine.addRule(createMinLengthRule(
  10,
  'Content too short',
  { realTime: false }
));
```

#### Required Field
```typescript
engine.addRule(createRequiredRule(
  'This field is required',
  { priority: 100 } // High priority
));
```

#### Pattern Matching
```typescript
engine.addRule(createPatternRule(
  /^[A-Z][a-z]+$/,
  'Must start with capital letter',
  { realTime: false }
));
```

#### Allowed Formats
```typescript
engine.addRule(createAllowedFormatsRule(
  ['p', 'strong', 'em', 'a'], // allowed HTML tags
  'Only basic formatting allowed'
));
```

#### Custom Validator
```typescript
engine.addRule(createCustomRule(
  'no-profanity',
  (content) => !content.includes('badword'),
  'Content contains inappropriate language'
));
```

### Async Validators

```typescript
engine.addRule(createCustomRule(
  'unique-title',
  async (content) => {
    const response = await fetch(`/api/check-unique?title=${content}`);
    const data = await response.json();
    return data.isUnique;
  },
  'Title must be unique'
));
```

## Real-time Validation

Real-time validation runs as the user types, with debouncing to avoid excessive validation calls:

```typescript
const engine = new ValidationEngine({
  enableRealTime: true,
  realTimeDebounce: 300, // Wait 300ms after user stops typing
});

// Mark rules for real-time validation
engine.addRule(createMaxLengthRule(1000, 'Too long', { realTime: true }));

// Validate in real-time
const result = await engine.validateRealTime(content);
```

## Event System

Listen to validation lifecycle events:

```typescript
engine.on((event) => {
  switch (event.type) {
    case ValidationEventType.VALIDATION_START:
      console.log('Validation started');
      break;
    case ValidationEventType.VALIDATION_COMPLETE:
      console.log('Validation completed:', event.result);
      break;
    case ValidationEventType.VALIDATION_ERROR:
      console.log('Validation error:', event.result?.errors);
      break;
    case ValidationEventType.RULE_ADDED:
      console.log('Rule added:', event.rule);
      break;
  }
});
```

## Configuration

```typescript
const engine = new ValidationEngine({
  enableRealTime: true,
  realTimeDebounce: 300,
  validateOnBlur: true,
  validateOnSubmit: true,
  asyncTimeout: 5000,
  stopOnFirstError: false,
  errorFormatter: (error) => `Error: ${error.message}`,
});

// Update configuration later
engine.updateConfig({ realTimeDebounce: 500 });
```

## Rule Management

```typescript
// Add rule
engine.addRule(rule);

// Remove rule
engine.removeRule('rule-id');

// Update rule
engine.updateRule('rule-id', { value: 2000 });

// Get rule
const rule = engine.getRule('rule-id');

// Get all rules
const allRules = engine.getAllRules();

// Clear all rules
engine.clearRules();
```

## Validation Results

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  timestamp: number;
  executionTime?: number;
}

interface ValidationError {
  ruleId: string;
  ruleType: ValidationRuleType;
  message: string;
  field?: string;
  position?: number;
  suggestion?: string;
}
```

## Pre-built Validators

```typescript
import {
  emailValidator,
  urlValidator,
  noHtmlValidator,
  createWordCountValidator,
  createProfanityValidator,
  createUniqueValidator,
} from '@ecodrix/erix-react';

// Email validation
engine.addRule(createCustomRule('email', emailValidator, 'Invalid email'));

// URL validation
engine.addRule(createCustomRule('url', urlValidator, 'Invalid URL'));

// Word count limit
engine.addRule(createCustomRule(
  'word-count',
  createWordCountValidator(500),
  'Maximum 500 words'
));

// Profanity filter
engine.addRule(createCustomRule(
  'profanity',
  createProfanityValidator(['badword1', 'badword2']),
  'Content contains inappropriate language'
));
```

## Utility Functions

```typescript
import {
  countWords,
  countCharacters,
  extractPlainText,
  formatValidationErrors,
} from '@ecodrix/erix-react';

// Count words
const wordCount = countWords(content);

// Count characters (with or without HTML)
const charCount = countCharacters(content, true); // excludes HTML

// Extract plain text from HTML
const plainText = extractPlainText('<p>Hello <strong>World</strong></p>');

// Format errors for display
const errorMessage = formatValidationErrors(result.errors);
```

## Integration with ErixEditor

```typescript
import { ErixEditor, ValidationEngine, createMaxLengthRule } from '@ecodrix/erix-react';

function MyEditor() {
  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine();
    engine.addRule(createMaxLengthRule(5000, 'Content too long', { realTime: true }));
    return engine;
  });

  const handleChange = async (content: string) => {
    const result = await validationEngine.validateRealTime(content);
    if (!result.valid) {
      // Show validation errors
      console.error(result.errors);
    }
  };

  return (
    <ErixEditor
      onChange={handleChange}
      // ... other props
    />
  );
}
```

## Performance Considerations

- **Debouncing**: Real-time validation is debounced to avoid excessive calls
- **Priority Execution**: High-priority rules run first, allowing early exit
- **Stop on First Error**: Configure `stopOnFirstError: true` for faster validation
- **Async Timeout**: Set `asyncTimeout` to prevent slow validators from blocking
- **Execution Time Tracking**: Monitor validation performance with `executionTime` in results

## Best Practices

1. **Use Real-time for UX**: Enable real-time validation for immediate feedback on length limits
2. **Defer Complex Validation**: Run expensive validators (API calls) on blur or submit, not real-time
3. **Set Priorities**: Use priority to ensure critical validations (required, security) run first
4. **Provide Clear Messages**: Write user-friendly error messages with actionable guidance
5. **Handle Async Errors**: Wrap async validators in try-catch to handle network failures gracefully
6. **Clean Up**: Call `engine.dispose()` when unmounting to clean up timers and listeners

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **8.1**: Maximum length validation with real-time prevention
- **8.2**: Required content validation with error state display
- **8.3**: Inline error messages with specific guidance
- **8.6**: Regex pattern validation support
- **8.7**: Programmatic validation API returning all errors

## API Reference

See [types.ts](./types.ts) for complete TypeScript definitions.
