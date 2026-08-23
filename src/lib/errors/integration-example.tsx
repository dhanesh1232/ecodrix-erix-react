/**
 * Integration Example: Using ErrorHandler with ErixEditor
 * This file demonstrates how to integrate the error handling framework
 * with the ErixEditor component
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ErrorHandler, ErrorType, ErrorSeverity } from './index';

// Import styles
import './styles.css';

/**
 * Context for sharing error handler across components
 */
interface ErrorHandlerContextValue {
  errorHandler: ErrorHandler;
}

const ErrorHandlerContext = createContext<ErrorHandlerContextValue | null>(null);

/**
 * Provider component for error handler
 */
export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  const [errorHandler] = useState(() => {
    return new ErrorHandler({
      display: {
        toastDuration: 5000,
        showTechnicalDetails: process.env.NODE_ENV === 'development',
      },
      logging: {
        logToConsole: true,
        minSeverity: ErrorSeverity.WARNING,
        includeStackTrace: process.env.NODE_ENV === 'development',
      },
      recovery: {
        maxRetries: 3,
        initialRetryDelay: 1000,
        maxRetryDelay: 30000,
        backoffMultiplier: 2,
      },
    });
  });

  return (
    <ErrorHandlerContext.Provider value={{ errorHandler }}>
      {children}
    </ErrorHandlerContext.Provider>
  );
}

/**
 * Hook to access error handler
 */
export function useErrorHandler() {
  const context = useContext(ErrorHandlerContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorHandlerProvider');
  }
  return context.errorHandler;
}

/**
 * Example: ErixEditor with error handling
 */
export function ErixEditorWithErrorHandling(props: any) {
  const errorHandler = useErrorHandler();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Handle save with error handling and retry
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await errorHandler.handleNetworkError(
        'Failed to save document',
        async () => {
          const response = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        }
      );

      if (result?.success) {
        console.log('Document saved successfully');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle content validation
  const handleValidation = (newContent: string) => {
    if (newContent.length > 10000) {
      errorHandler.handleValidationError(
        'Content exceeds maximum length of 10,000 characters',
        'content'
      );
      return false;
    }
    return true;
  };

  // Handle content change
  const handleChange = (newContent: string) => {
    if (handleValidation(newContent)) {
      setContent(newContent);
    }
  };

  return (
    <div>
      {/* Your ErixEditor component here */}
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

/**
 * Example: API client with error handling
 */
export class ErixAPIClient {
  constructor(private errorHandler: ErrorHandler) {}

  async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(endpoint, options);

      if (!response.ok) {
        await this.errorHandler.handleAPIError(
          `API request failed: ${endpoint}`,
          response.status,
          {
            details: {
              endpoint,
              method: options?.method || 'GET',
              statusText: response.statusText,
            },
          }
        );
        return null;
      }

      return response.json();
    } catch (err) {
      this.errorHandler.handleUnknownError(err as Error, {
        details: { endpoint, method: options?.method || 'GET' },
      });
      return null;
    }
  }

  async validateAPIKey(apiKey: string): Promise<boolean> {
    const result = await this.request<{ valid: boolean }>('/api/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!result) {
      await this.errorHandler.handleAPIError(
        'Invalid API key. Please check your API key in the settings and ensure it is correct.',
        401,
        {
          code: 'INVALID_API_KEY',
          details: {
            message: 'To obtain a valid API key, visit https://ecodrix.com/settings',
          },
        }
      );
      return false;
    }

    return result.valid;
  }
}

/**
 * Example: Form validation with error handling
 */
export function DocumentForm() {
  const errorHandler = useErrorHandler();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });

  const validateForm = (): boolean => {
    let isValid = true;

    if (!formData.title.trim()) {
      errorHandler.handleValidationError('Title is required', 'title');
      isValid = false;
    }

    if (formData.title.length > 100) {
      errorHandler.handleValidationError(
        'Title must be less than 100 characters',
        'title'
      );
      isValid = false;
    }

    if (!formData.content.trim()) {
      errorHandler.handleValidationError('Content is required', 'content');
      isValid = false;
    }

    if (formData.content.length < 10) {
      errorHandler.handleValidationError(
        'Content must be at least 10 characters',
        'content'
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Submit form with error handling
    await errorHandler.handleNetworkError(
      'Failed to submit form',
      async () => {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Content"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Example: Plugin loader with error handling
 */
export class PluginLoader {
  constructor(private errorHandler: ErrorHandler) {}

  async loadPlugin(pluginName: string): Promise<any | null> {
    try {
      // Simulated plugin loading
      const plugin = await import(`./plugins/${pluginName}`);

      if (!plugin.default) {
        throw new Error('Plugin does not have a default export');
      }

      // Initialize plugin
      await plugin.default.init();

      return plugin.default;
    } catch (err) {
      this.errorHandler.handlePluginError(
        pluginName,
        `Failed to load plugin: ${(err as Error).message}`,
        {
          originalError: err as Error,
          details: { pluginName },
        }
      );
      return null;
    }
  }

  async loadPluginWithFallback(
    pluginName: string,
    fallbackPlugin: string
  ): Promise<any | null> {
    let plugin = await this.loadPlugin(pluginName);

    if (!plugin) {
      console.log(`Falling back to ${fallbackPlugin}`);
      plugin = await this.loadPlugin(fallbackPlugin);
    }

    return plugin;
  }
}

/**
 * Example: Complete application setup
 */
export function App() {
  return (
    <ErrorHandlerProvider>
      <div className="app">
        <h1>ErixEditor with Error Handling</h1>
        <ErixEditorWithErrorHandling />
        <DocumentForm />
      </div>
    </ErrorHandlerProvider>
  );
}

/**
 * Example: Error monitoring and analytics
 */
export function ErrorMonitoring() {
  const errorHandler = useErrorHandler();
  const [errorStats, setErrorStats] = useState<any>(null);

  useEffect(() => {
    // Update error stats every 5 seconds
    const interval = setInterval(() => {
      const history = errorHandler.getErrorHistory();

      const stats = {
        total: history.length,
        byType: history.reduce(
          (acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        bySeverity: history.reduce(
          (acc, error) => {
            acc[error.severity] = (acc[error.severity] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      setErrorStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, [errorHandler]);

  if (!errorStats) {
    return <div>Loading error statistics...</div>;
  }

  return (
    <div className="error-monitoring">
      <h2>Error Statistics</h2>
      <p>Total Errors: {errorStats.total}</p>

      <h3>By Type</h3>
      <ul>
        {Object.entries(errorStats.byType).map(([type, count]) => (
          <li key={type}>
            {type}: {count as number}
          </li>
        ))}
      </ul>

      <h3>By Severity</h3>
      <ul>
        {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
          <li key={severity}>
            {severity}: {count as number}
          </li>
        ))}
      </ul>
    </div>
  );
}
