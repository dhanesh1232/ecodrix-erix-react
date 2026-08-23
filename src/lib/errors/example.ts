/**
 * Example usage of the Error Handling Framework
 * This file demonstrates how to use the error handling system
 */

import {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  ErrorDisplayMode,
  RecoveryStrategy,
} from './index';

// Example 1: Basic error handler setup
export function setupErrorHandler() {
  const errorHandler = new ErrorHandler({
    display: {
      toastDuration: 5000,
      showTechnicalDetails: false,
    },
    logging: {
      logToConsole: true,
      minSeverity: ErrorSeverity.WARNING,
      includeStackTrace: true,
    },
    recovery: {
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
    },
  });

  return errorHandler;
}

// Example 2: Handle network error with retry
export async function saveDocumentWithRetry(
  errorHandler: ErrorHandler,
  document: any
) {
  const result = await errorHandler.handleNetworkError(
    'Failed to save document',
    async () => {
      // Simulated API call
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(document),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    }
  );

  return result;
}

// Example 3: Handle validation errors
export function validateForm(errorHandler: ErrorHandler, formData: any) {
  const errors: string[] = [];

  if (!formData.title) {
    errorHandler.handleValidationError('Title is required', 'title');
    errors.push('title');
  }

  if (!formData.content) {
    errorHandler.handleValidationError('Content is required', 'content');
    errors.push('content');
  }

  if (formData.title && formData.title.length > 100) {
    errorHandler.handleValidationError(
      'Title must be less than 100 characters',
      'title'
    );
    errors.push('title');
  }

  return errors.length === 0;
}

// Example 4: Handle API errors
export async function fetchData(errorHandler: ErrorHandler, endpoint: string) {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      await errorHandler.handleAPIError(
        'Failed to fetch data from server',
        response.status,
        {
          details: { endpoint, statusText: response.statusText },
        }
      );
      return null;
    }

    return response.json();
  } catch (err) {
    errorHandler.handleUnknownError(err as Error);
    return null;
  }
}

// Example 5: Handle plugin errors with fallback
export function loadPlugin(errorHandler: ErrorHandler, pluginName: string) {
  try {
    // Simulated plugin loading
    const plugin = (window as any).plugins?.[pluginName];

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    plugin.init();
    return plugin;
  } catch (err) {
    errorHandler.handlePluginError(
      pluginName,
      `Failed to load plugin: ${(err as Error).message}`,
      {
        originalError: err as Error,
        recoveryStrategy: RecoveryStrategy.FALLBACK,
      }
    );
    return null;
  }
}

// Example 6: Custom recovery handler
export function setupCustomRecovery(errorHandler: ErrorHandler) {
  errorHandler.registerRecoveryHandler(
    ErrorType.NETWORK_ERROR,
    async (error) => {
      console.log('Attempting custom recovery for network error:', error);

      // Try alternative endpoint
      try {
        const response = await fetch('/api/backup/endpoint');
        return response.ok;
      } catch (err) {
        return false;
      }
    }
  );
}

// Example 7: Error history and analytics
export function trackErrors(errorHandler: ErrorHandler) {
  const history = errorHandler.getErrorHistory();

  // Group errors by type
  const errorsByType = history.reduce(
    (acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Error statistics:', errorsByType);

  // Get critical errors
  const criticalErrors = errorHandler
    .getLogger()
    .getErrorsBySeverity(ErrorSeverity.CRITICAL);

  if (criticalErrors.length > 0) {
    console.warn('Critical errors detected:', criticalErrors);
  }

  return { errorsByType, criticalErrors };
}

// Example 8: Complete workflow
export async function completeWorkflow() {
  // Setup error handler
  const errorHandler = setupErrorHandler();

  // Setup custom recovery
  setupCustomRecovery(errorHandler);

  // Validate form
  const formData = {
    title: 'My Document',
    content: 'Document content',
  };

  const isValid = validateForm(errorHandler, formData);

  if (!isValid) {
    console.log('Form validation failed');
    return;
  }

  // Save document with retry
  const result = await saveDocumentWithRetry(errorHandler, formData);

  if (result?.success) {
    console.log('Document saved successfully');
  } else {
    console.log('Failed to save document after retries');
  }

  // Track errors
  const stats = trackErrors(errorHandler);
  console.log('Error tracking:', stats);
}

// Example 9: React component integration
export function useErrorHandler() {
  // This would be a React hook in a real implementation
  const errorHandler = setupErrorHandler();

  return {
    errorHandler,
    handleError: (error: Error) => errorHandler.handleUnknownError(error),
    handleNetworkError: (message: string, operation: () => Promise<any>) =>
      errorHandler.handleNetworkError(message, operation),
    handleValidationError: (message: string, field: string) =>
      errorHandler.handleValidationError(message, field),
  };
}

// Example 10: Error display customization
export function setupCustomErrorDisplay() {
  const errorHandler = new ErrorHandler({
    display: {
      toastDuration: 3000,
      showTechnicalDetails: true,
      customMessages: {
        INVALID_API_KEY: 'Please check your API key in the settings',
        NETWORK_TIMEOUT: 'The request took too long. Please try again.',
      },
      onDisplayError: (error) => {
        // Send to analytics
        console.log('Error displayed:', error.type, error.message);

        // Custom tracking
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('Error Displayed', {
            type: error.type,
            message: error.message,
            severity: error.severity,
          });
        }
      },
    },
  });

  return errorHandler;
}
