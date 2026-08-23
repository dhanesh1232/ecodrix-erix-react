# Error Handling Framework

Comprehensive error handling system for the ErixEditor with error classification, user-friendly display, logging, and recovery strategies.

## Features

- **Error Type Classification**: Network, validation, API, permission, content, plugin, and unknown errors
- **User-Friendly Display**: Toast notifications, inline errors, and modal dialogs
- **Error Logging**: Console logging with severity levels and error history
- **Recovery Strategies**: Retry, retry with exponential backoff, fallback, and custom handlers
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Mobile Responsive**: Optimized layouts for mobile devices
- **Dark Mode**: Automatic dark mode support
- **Customizable**: Extensive configuration options

## Quick Start

```typescript
import { ErrorHandler } from '@ecodrix/erix-react/errors';

// Create error handler with default configuration
const errorHandler = new ErrorHandler();

// Handle a network error with automatic retry
await errorHandler.handleNetworkError(
  'Failed to save document',
  async () => await saveDocument()
);

// Handle a validation error
errorHandler.handleValidationError('Title is required', 'title');

// Handle an API error
await errorHandler.handleAPIError('Failed to fetch data', 404);
```

## Configuration

```typescript
const errorHandler = new ErrorHandler({
  // Display configuration
  display: {
    toastDuration: 5000, // Toast duration in ms
    showTechnicalDetails: false, // Show error codes and details
    customMessages: {
      'API_001': 'Custom error message for API_001',
    },
    onDisplayError: (error) => {
      // Custom display callback
      console.log('Displaying error:', error);
    },
  },

  // Logging configuration
  logging: {
    logToConsole: true, // Log to browser console
    minSeverity: 'WARNING', // Minimum severity to log
    includeStackTrace: true, // Include stack traces
    onLogError: (error) => {
      // Custom logging callback (e.g., send to analytics)
      analytics.trackError(error);
    },
  },

  // Recovery configuration
  recovery: {
    maxRetries: 3, // Maximum retry attempts
    initialRetryDelay: 1000, // Initial delay in ms
    maxRetryDelay: 30000, // Maximum delay in ms
    backoffMultiplier: 2, // Exponential backoff multiplier
    customRecoveryHandlers: {
      NETWORK_ERROR: async (error) => {
        // Custom recovery logic
        return true; // Return true if recovery successful
      },
    },
  },
});
```

## Error Types

### Network Error
```typescript
await errorHandler.handleNetworkError(
  'Failed to connect to server',
  async () => await fetchData()
);
```

### API Error
```typescript
await errorHandler.handleAPIError(
  'Invalid API key',
  401,
  {
    code: 'INVALID_API_KEY',
    details: { endpoint: '/api/editor' },
  }
);
```

### Validation Error
```typescript
errorHandler.handleValidationError(
  'Email address is invalid',
  'email',
  {
    displayMode: ErrorDisplayMode.INLINE,
  }
);
```

### Content Error
```typescript
errorHandler.handleContentError(
  'Content contains invalid HTML',
  {
    details: { invalidTags: ['script', 'iframe'] },
  }
);
```

### Plugin Error
```typescript
errorHandler.handlePluginError(
  'spell-checker',
  'Failed to initialize spell checker',
  {
    recoveryStrategy: RecoveryStrategy.FALLBACK,
  }
);
```

### Permission Error
```typescript
errorHandler.handlePermissionError(
  'You do not have permission to edit this document',
  'document.edit',
  {
    displayMode: ErrorDisplayMode.MODAL,
  }
);
```

### Unknown Error
```typescript
try {
  // Some operation
} catch (err) {
  errorHandler.handleUnknownError(err as Error);
}
```

## Display Modes

### Toast Notification
```typescript
const error = errorHandler.createError(
  ErrorType.NETWORK_ERROR,
  'Connection lost',
  {
    displayMode: ErrorDisplayMode.TOAST,
    severity: ErrorSeverity.WARNING,
  }
);
await errorHandler.handleError(error);
```

### Inline Error
```typescript
const error = errorHandler.createError(
  ErrorType.VALIDATION_ERROR,
  'Field is required',
  {
    displayMode: ErrorDisplayMode.INLINE,
    details: { field: 'username' },
  }
);
await errorHandler.handleError(error);
```

### Modal Dialog
```typescript
const error = errorHandler.createError(
  ErrorType.PERMISSION_ERROR,
  'Access denied',
  {
    displayMode: ErrorDisplayMode.MODAL,
    severity: ErrorSeverity.ERROR,
  }
);
await errorHandler.handleError(error);
```

### Silent (Log Only)
```typescript
const error = errorHandler.createError(
  ErrorType.UNKNOWN_ERROR,
  'Background task failed',
  {
    displayMode: ErrorDisplayMode.SILENT,
    severity: ErrorSeverity.INFO,
  }
);
await errorHandler.handleError(error);
```

## Recovery Strategies

### Retry
```typescript
const error = errorHandler.createError(
  ErrorType.NETWORK_ERROR,
  'Request failed',
  {
    recoverable: true,
    recoveryStrategy: RecoveryStrategy.RETRY,
  }
);

await errorHandler.handleError(error, async () => {
  await fetchData();
});
```

### Retry with Exponential Backoff
```typescript
const error = errorHandler.createError(
  ErrorType.API_ERROR,
  'Server error',
  {
    recoverable: true,
    recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
  }
);

await errorHandler.handleError(error, async () => {
  await saveDocument();
});
```

### Fallback
```typescript
const error = errorHandler.createError(
  ErrorType.PLUGIN_ERROR,
  'Plugin failed to load',
  {
    recoverable: true,
    recoveryStrategy: RecoveryStrategy.FALLBACK,
  }
);

await errorHandler.handleError(error);
```

### Custom Recovery Handler
```typescript
errorHandler.registerRecoveryHandler(
  ErrorType.NETWORK_ERROR,
  async (error) => {
    // Custom recovery logic
    console.log('Attempting custom recovery for:', error);
    
    // Try alternative endpoint
    try {
      await fetchFromBackupServer();
      return true; // Recovery successful
    } catch (err) {
      return false; // Recovery failed
    }
  }
);
```

## Error History

```typescript
// Get all errors
const history = errorHandler.getErrorHistory();

// Get errors by type
const networkErrors = errorHandler
  .getLogger()
  .getErrorsByType(ErrorType.NETWORK_ERROR);

// Get errors by severity
const criticalErrors = errorHandler
  .getLogger()
  .getErrorsBySeverity(ErrorSeverity.CRITICAL);

// Clear history
errorHandler.clearErrorHistory();
```

## Styling

Import the CSS file to apply default styles:

```typescript
import '@ecodrix/erix-react/errors/styles.css';
```

Or customize the styles by overriding CSS variables:

```css
:root {
  --erix-error-toast-bg: #ffffff;
  --erix-error-toast-border: #ef4444;
  --erix-error-modal-bg: #ffffff;
  --erix-error-modal-overlay: rgba(0, 0, 0, 0.5);
}
```

## Accessibility

The error handling framework follows WCAG 2.1 Level AA guidelines:

- **ARIA Labels**: All interactive elements have appropriate ARIA labels
- **Keyboard Navigation**: Full keyboard support for dismissing errors
- **Screen Reader Support**: Errors are announced to screen readers
- **Focus Management**: Focus is trapped in modal dialogs
- **High Contrast Mode**: Supports high contrast mode
- **Reduced Motion**: Respects prefers-reduced-motion setting

## Best Practices

1. **Use Appropriate Error Types**: Choose the correct error type for better categorization
2. **Provide User-Friendly Messages**: Write clear, actionable error messages
3. **Include Context**: Add relevant details to help with debugging
4. **Set Correct Severity**: Use appropriate severity levels for logging
5. **Choose Right Display Mode**: Use inline for validation, toast for notifications, modal for critical errors
6. **Enable Recovery**: Mark errors as recoverable when possible
7. **Log Errors**: Always log errors for debugging and monitoring
8. **Test Error Scenarios**: Test error handling in development

## Examples

### Form Validation
```typescript
function validateForm(data: FormData): void {
  if (!data.email) {
    errorHandler.handleValidationError(
      'Email address is required',
      'email'
    );
  }

  if (!data.email.includes('@')) {
    errorHandler.handleValidationError(
      'Please enter a valid email address',
      'email'
    );
  }
}
```

### API Request with Retry
```typescript
async function saveDocument(doc: Document): Promise<void> {
  try {
    await api.save(doc);
  } catch (err) {
    const result = await errorHandler.handleNetworkError(
      'Failed to save document. Retrying...',
      async () => await api.save(doc)
    );

    if (!result?.success) {
      errorHandler.handleAPIError(
        'Unable to save document after multiple attempts',
        500
      );
    }
  }
}
```

### Plugin Error Handling
```typescript
function loadPlugin(pluginName: string): void {
  try {
    const plugin = require(`./plugins/${pluginName}`);
    plugin.init();
  } catch (err) {
    errorHandler.handlePluginError(
      pluginName,
      `Failed to load plugin: ${err.message}`,
      {
        originalError: err as Error,
        recoveryStrategy: RecoveryStrategy.FALLBACK,
      }
    );
  }
}
```

## API Reference

See the TypeScript definitions for complete API documentation:

- `ErrorHandler` - Main error handling class
- `ErrorLogger` - Error logging with severity levels
- `ErrorDisplay` - User-facing error display
- `RecoveryManager` - Error recovery strategies
- `ErrorType` - Error type enumeration
- `ErrorSeverity` - Severity level enumeration
- `ErrorDisplayMode` - Display mode enumeration
- `RecoveryStrategy` - Recovery strategy enumeration

## Requirements Satisfied

This implementation satisfies the following requirements:

- **10.1**: Invalid API key displays specific error message with instructions
- **10.2**: Network request failures display HTTP status code and error message
- **10.3**: Unexpected errors log detailed information to console
- **10.8**: Editor validates configuration props and displays warnings

Additional features beyond requirements:

- Error history tracking
- Custom recovery handlers
- Multiple display modes
- Accessibility support
- Mobile responsive design
- Dark mode support
