# ContentSanitizer

The `ContentSanitizer` class provides comprehensive HTML content sanitization and XSS protection for the ErixEditor.

## Features

- **HTML Tag Whitelisting**: Only allows safe HTML tags
- **Attribute Sanitization**: Removes dangerous attributes like `onclick`, `onerror`
- **URL Protocol Validation**: Only allows safe protocols (http, https, mailto, data)
- **XSS Prevention**: Removes script tags, event handlers, and other attack vectors
- **Configurable Whitelist**: Customize allowed tags, attributes, and protocols

## Basic Usage

```typescript
import { ContentSanitizer } from '@ecodrix/erix-react/lib/security';

// Create a sanitizer with default configuration
const sanitizer = new ContentSanitizer();

// Sanitize HTML content
const malicious = '<p>Hello</p><script>alert("XSS")</script>';
const safe = sanitizer.sanitize(malicious);
// Result: '<p>Hello</p>'

// Validate URLs
const isValid = sanitizer.validateURL('https://example.com'); // true
const isDangerous = sanitizer.validateURL('javascript:alert(1)'); // false

// Escape HTML entities
const escaped = sanitizer.escapeHTML('<script>alert(1)</script>');
// Result: '&lt;script&gt;alert(1)&lt;/script&gt;'
```

## Custom Configuration

```typescript
import { ContentSanitizer } from '@ecodrix/erix-react/lib/security';

// Create a sanitizer with custom configuration
const sanitizer = new ContentSanitizer({
  allowedTags: ['p', 'strong', 'em', 'a'],
  allowedAttributes: {
    a: ['href', 'title'],
  },
  allowedProtocols: ['https:'],
  stripScripts: true,
  stripStyles: true,
});

const html = '<p>Safe <strong>content</strong> with <a href="https://example.com">link</a></p>';
const sanitized = sanitizer.sanitize(html);
```

## Factory Methods

### Strict Mode

For maximum security with minimal allowed tags:

```typescript
const strict = ContentSanitizer.createStrict();
// Only allows: p, br, strong, em, u
// Only allows HTTPS protocol
// Strips all styles
```

### Permissive Mode

For rich content editing with more allowed tags:

```typescript
const permissive = ContentSanitizer.createPermissive();
// Allows additional semantic HTML5 tags
// Allows more attributes
// Preserves inline styles
```

## Runtime Configuration Updates

```typescript
const sanitizer = new ContentSanitizer();

// Update configuration at runtime
sanitizer.updateConfig({
  allowedTags: ['p', 'div', 'span'],
  stripStyles: false,
});

// Get current configuration
const config = sanitizer.getConfig();
console.log(config.allowedTags);
```

## Integration with PasteHandler

The `ContentSanitizer` is automatically used by the `PasteHandler` to sanitize pasted content:

```typescript
import { PasteHandler } from '@ecodrix/erix-react/lib/content';

const pasteHandler = new PasteHandler({
  sanitize: true, // Enables ContentSanitizer
  preserveFormatting: true,
});

// The PasteHandler will automatically sanitize pasted content
```

## Security Features

### Script Tag Removal

```typescript
const malicious = '<p>Hello</p><script>alert("XSS")</script>';
const safe = sanitizer.sanitize(malicious);
// Result: '<p>Hello</p>'
```

### Event Handler Removal

```typescript
const malicious = '<p onclick="alert(\'XSS\')">Click me</p>';
const safe = sanitizer.sanitize(malicious);
// Result: '<p>Click me</p>'
```

### Dangerous Element Removal

```typescript
const malicious = '<p>Safe</p><iframe src="evil.com"></iframe>';
const safe = sanitizer.sanitize(malicious);
// Result: '<p>Safe</p>'
```

### URL Protocol Validation

```typescript
const malicious = '<a href="javascript:alert(1)">Click</a>';
const safe = sanitizer.sanitize(malicious);
// Result: '<a>Click</a>' (href removed)
```

### Style Attribute Sanitization

```typescript
const malicious = '<span style="width: expression(alert(1));">Text</span>';
const safe = sanitizer.sanitize(malicious);
// Result: '<span>Text</span>' (dangerous style removed)
```

## Default Configuration

The default configuration provides a secure baseline:

```typescript
{
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'a', 'span', 'div',
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
}
```

## Requirements Satisfied

- **19.1**: Remove all script tags and event handlers
- **19.2**: Whitelist only safe HTML tags and attributes
- **19.4**: Validate URL protocol and warn about potentially unsafe links
- **19.5**: Escape all user-generated content before rendering to prevent XSS
- **19.7**: Provide configurable whitelist of allowed HTML tags and attributes

## API Reference

### Constructor

```typescript
constructor(config?: Partial<SanitizationConfig>)
```

### Methods

- `sanitize(html: string): string` - Sanitize HTML content
- `validateURL(url: string): boolean` - Validate URL protocol
- `escapeHTML(text: string): string` - Escape HTML entities
- `updateConfig(config: Partial<SanitizationConfig>): void` - Update configuration
- `getConfig(): SanitizationConfig` - Get current configuration

### Static Methods

- `ContentSanitizer.createStrict(): ContentSanitizer` - Create strict sanitizer
- `ContentSanitizer.createPermissive(): ContentSanitizer` - Create permissive sanitizer

## TypeScript Types

```typescript
interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  allowedProtocols: string[];
  stripScripts: boolean;
  stripStyles: boolean;
}
```
