# Content Processing Module

This module provides utilities for processing and transforming content from various sources including Microsoft Word, Google Docs, code snippets, and URLs with link previews.

## PasteHandler

The `PasteHandler` class is an enhanced paste handler that intelligently processes rich content from multiple sources.

### Features

- **Microsoft Word Support**: Preserves formatting including headings, lists, and tables (Requirement 5.1)
- **Google Docs Support**: Converts Google Docs styles to editor-compatible formatting (Requirement 5.2)
- **Code Block Detection**: Automatically detects programming language and creates syntax-highlighted code blocks (Requirement 5.7)
- **Link Preview Fetching**: Fetches and displays link previews with title, description, and thumbnail (Requirement 5.6)
- **Async Processing**: Handles large paste operations asynchronously to avoid blocking UI (Requirement 3.4)
- **Content Sanitization**: Removes malicious content and enforces security policies

### Installation

The PasteHandler is exported from the main package:

```typescript
import { PasteHandler } from '@ecodrix/erix-react';
```

### Basic Usage

```typescript
import { PasteHandler } from '@ecodrix/erix-react';

// Create a paste handler instance
const pasteHandler = new PasteHandler({
  preserveFormatting: true,
  sanitize: true,
  maxSize: 1024 * 1024, // 1MB
  linkPreviewApiUrl: 'https://api.example.com/link-preview',
  apiKey: 'your-api-key',
});

// Handle paste event
document.addEventListener('paste', async (event) => {
  event.preventDefault();
  
  try {
    const result = await pasteHandler.handlePaste(event);
    console.log('Parsed content:', result);
    
    // Insert the parsed HTML into your editor
    insertHTML(result.html);
    
    // Access metadata if available
    if (result.metadata?.codeBlock) {
      console.log('Code language:', result.metadata.codeBlock.language);
    }
    if (result.metadata?.linkPreview) {
      console.log('Link preview:', result.metadata.linkPreview);
    }
  } catch (error) {
    console.error('Paste error:', error);
  }
});
```

### Configuration Options

```typescript
interface PasteHandlerConfig {
  /** Whether to preserve formatting from source (default: true) */
  preserveFormatting: boolean;
  
  /** Whether to sanitize pasted content (default: true) */
  sanitize: boolean;
  
  /** Maximum paste size in bytes before async processing (default: 1MB) */
  maxSize: number;
  
  /** API endpoint for link preview fetching (optional) */
  linkPreviewApiUrl?: string;
  
  /** API key for link preview service (optional) */
  apiKey?: string;
}
```

### Content Types

The handler automatically detects and processes different content types:

#### 1. Microsoft Word Content

```typescript
// Automatically detected when pasting from Word
// Preserves:
// - Headings (h1-h6)
// - Lists (ordered and unordered)
// - Tables
// - Basic formatting (bold, italic, underline)
```

#### 2. Google Docs Content

```typescript
// Automatically detected when pasting from Google Docs
// Converts:
// - Bold text to <strong>
// - Italic text to <em>
// - Underline to <u>
// - Strikethrough to <s>
```

#### 3. Code Blocks

```typescript
// Detects code in multiple formats:

// 1. Fenced code blocks
```javascript
const hello = 'world';
```

// 2. Indented code blocks (4 spaces or tab)
    function example() {
      return true;
    }

// 3. Code patterns (automatic language detection)
// Supports 20+ languages including:
// - JavaScript/TypeScript
// - Python
// - Java
// - C/C++
// - HTML/CSS
// - SQL
// - Ruby, PHP, Go, Rust, Bash, and more
```

#### 4. URLs with Link Previews

```typescript
// When pasting a URL, fetches metadata:
// - Title
// - Description
// - Thumbnail image
// - Site name
// - Favicon

// Example result:
{
  type: 'link',
  html: '<div class="link-preview">...</div>',
  metadata: {
    linkPreview: {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'An example website',
      thumbnail: 'https://example.com/image.jpg',
      siteName: 'Example',
      favicon: 'https://example.com/favicon.ico'
    }
  }
}
```

### Advanced Usage

#### Custom Link Preview API

```typescript
// Set up your own link preview service
const pasteHandler = new PasteHandler({
  linkPreviewApiUrl: 'https://your-api.com/preview',
  apiKey: 'your-secret-key',
});

// Your API should accept POST requests with:
// { url: string }
// And return:
// {
//   title: string,
//   description: string,
//   thumbnail?: string,
//   siteName?: string,
//   favicon?: string
// }
```

#### Processing Large Pastes

```typescript
// Large pastes (>1MB by default) are processed asynchronously
const pasteHandler = new PasteHandler({
  maxSize: 500 * 1024, // 500KB threshold
});

// Show loading indicator for large pastes
document.addEventListener('paste', async (event) => {
  event.preventDefault();
  
  const size = (event.clipboardData?.getData('text/html')?.length || 0) +
               (event.clipboardData?.getData('text/plain')?.length || 0);
  
  if (size > pasteHandler.config.maxSize) {
    showLoadingIndicator();
  }
  
  const result = await pasteHandler.handlePaste(event);
  hideLoadingIndicator();
  insertHTML(result.html);
});
```

#### Manual Content Processing

```typescript
// Process content without clipboard event
const pasteHandler = new PasteHandler();

// Parse Word content
const wordHTML = '<html xmlns:w="urn:schemas-microsoft-com:office:word">...</html>';
const parsed = pasteHandler.parseWordContent(wordHTML);

// Parse Google Docs content
const docsHTML = '<b id="docs-internal-guid-...">...</b>';
const converted = pasteHandler.parseGoogleDocsContent(docsHTML);

// Detect code blocks
const codeText = '```javascript\nconst x = 1;\n```';
const codeBlock = pasteHandler.detectCodeBlock(codeText);
if (codeBlock) {
  console.log('Language:', codeBlock.language);
  console.log('Code:', codeBlock.code);
}

// Fetch link preview
const preview = await pasteHandler.fetchLinkPreview('https://example.com');
```

### Integration with ErixEditor

```typescript
import { ErixEditor, PasteHandler } from '@ecodrix/erix-react';

function MyEditor() {
  const pasteHandler = new PasteHandler({
    preserveFormatting: true,
    sanitize: true,
    linkPreviewApiUrl: process.env.LINK_PREVIEW_API,
    apiKey: process.env.API_KEY,
  });

  const handleEditorPaste = async (event: ClipboardEvent) => {
    event.preventDefault();
    
    try {
      const result = await pasteHandler.handlePaste(event);
      
      // Insert into ErixEditor
      editorInstance.insertHTML(result.html);
      
      // Handle special cases
      if (result.type === 'code' && result.metadata?.codeBlock) {
        // Apply syntax highlighting
        applySyntaxHighlighting(result.metadata.codeBlock.language);
      }
      
      if (result.type === 'link' && result.metadata?.linkPreview) {
        // Track link preview insertion
        analytics.track('link_preview_inserted', {
          url: result.metadata.linkPreview.url,
        });
      }
    } catch (error) {
      console.error('Paste failed:', error);
      showErrorToast('Failed to paste content');
    }
  };

  return (
    <ErixEditor
      onPaste={handleEditorPaste}
      // ... other props
    />
  );
}
```

### Security Considerations

The PasteHandler includes built-in security features:

1. **HTML Sanitization**: Removes dangerous elements (script, iframe, object, embed)
2. **Attribute Whitelisting**: Only allows safe attributes
3. **URL Validation**: Validates href and src attributes
4. **Protocol Checking**: Only allows http, https, mailto, and data protocols

```typescript
// Sanitization is enabled by default
const pasteHandler = new PasteHandler({
  sanitize: true, // Recommended for production
});

// Disable only if you trust the content source
const unsafePasteHandler = new PasteHandler({
  sanitize: false, // Use with caution!
});
```

### Performance Optimization

The PasteHandler is optimized for performance:

1. **Async Processing**: Large pastes don't block the UI
2. **Lazy Loading**: Link previews are fetched asynchronously
3. **Efficient Parsing**: Uses native DOM APIs for HTML processing
4. **Memory Management**: Cleans up temporary DOM elements

```typescript
// Monitor performance
const pasteHandler = new PasteHandler();

document.addEventListener('paste', async (event) => {
  const startTime = performance.now();
  
  const result = await pasteHandler.handlePaste(event);
  
  const duration = performance.now() - startTime;
  console.log(`Paste processed in ${duration}ms`);
  
  if (duration > 100) {
    console.warn('Slow paste operation detected');
  }
});
```

### Error Handling

```typescript
const pasteHandler = new PasteHandler();

document.addEventListener('paste', async (event) => {
  event.preventDefault();
  
  try {
    const result = await pasteHandler.handlePaste(event);
    insertHTML(result.html);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No clipboard data available') {
        console.warn('Empty clipboard');
      } else {
        console.error('Paste error:', error.message);
        showErrorNotification('Failed to paste content');
      }
    }
  }
});
```

### Testing

```typescript
import { PasteHandler } from '@ecodrix/erix-react';

describe('PasteHandler', () => {
  it('should detect Word content', () => {
    const handler = new PasteHandler();
    const wordHTML = '<html xmlns:w="urn:schemas-microsoft-com:office:word"><p>Test</p></html>';
    const result = handler.parseWordContent(wordHTML);
    expect(result).toContain('<p>Test</p>');
  });

  it('should detect code blocks', () => {
    const handler = new PasteHandler();
    const code = '```javascript\nconst x = 1;\n```';
    const result = handler.detectCodeBlock(code);
    expect(result).toEqual({
      language: 'javascript',
      code: 'const x = 1;',
    });
  });

  it('should sanitize malicious content', async () => {
    const handler = new PasteHandler({ sanitize: true });
    const malicious = '<p>Hello<script>alert("XSS")</script></p>';
    // Create mock clipboard event
    const event = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    });
    event.clipboardData?.setData('text/html', malicious);
    
    const result = await handler.handlePaste(event);
    expect(result.html).not.toContain('<script>');
  });
});
```

## API Reference

### PasteHandler Class

#### Constructor

```typescript
constructor(config?: Partial<PasteHandlerConfig>)
```

#### Methods

##### handlePaste

```typescript
async handlePaste(event: ClipboardEvent): Promise<ParsedContent>
```

Main paste handler that processes clipboard events.

##### parseWordContent

```typescript
parseWordContent(html: string): string
```

Parses Microsoft Word HTML content and preserves formatting.

##### parseGoogleDocsContent

```typescript
parseGoogleDocsContent(html: string): string
```

Parses Google Docs HTML content and converts styles.

##### detectCodeBlock

```typescript
detectCodeBlock(text: string): CodeBlock | null
```

Detects code blocks in pasted text and identifies the programming language.

##### fetchLinkPreview

```typescript
async fetchLinkPreview(url: string): Promise<LinkPreview | undefined>
```

Fetches link preview metadata for a URL.

### Types

#### ParsedContent

```typescript
interface ParsedContent {
  html: string;
  type: 'word' | 'google-docs' | 'code' | 'link' | 'text' | 'html';
  metadata?: {
    codeBlock?: CodeBlock;
    linkPreview?: LinkPreview;
  };
}
```

#### CodeBlock

```typescript
interface CodeBlock {
  language: string;
  code: string;
}
```

#### LinkPreview

```typescript
interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  siteName?: string;
  favicon?: string;
}
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **5.1**: Preserve formatting from Microsoft Word (headings, lists, tables)
- **5.2**: Convert Google Docs styles to editor-compatible formatting
- **5.6**: Fetch and display link previews with title, description, thumbnail
- **5.7**: Detect programming language and create code blocks with syntax highlighting
- **3.4**: Process large content asynchronously without blocking UI

## Browser Compatibility

The PasteHandler uses standard Web APIs and is compatible with:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT
