import type {
  ErixError,
  ErrorDisplayConfig,
  ErrorLoggingConfig,
  RecoveryConfig,
  RecoveryResult,
} from './types';
import {
  ErrorType,
  ErrorSeverity,
  ErrorDisplayMode,
  RecoveryStrategy,
} from './types';
import { ErrorLogger } from './ErrorLogger';
import { ErrorDisplay } from './ErrorDisplay';
import { RecoveryManager } from './RecoveryManager';

/**
 * Configuration for the ErrorHandler
 */
export interface ErrorHandlerConfig {
  display?: Partial<ErrorDisplayConfig>;
  logging?: Partial<ErrorLoggingConfig>;
  recovery?: Partial<RecoveryConfig>;
}

/**
 * ErrorHandler is the main class for managing errors in the ErixEditor
 * Coordinates error logging, display, and recovery
 */
export class ErrorHandler {
  private logger: ErrorLogger;
  private display: ErrorDisplay;
  private recovery: RecoveryManager;

  constructor(config: ErrorHandlerConfig = {}) {
    this.logger = new ErrorLogger(config.logging);
    this.display = new ErrorDisplay(config.display);
    this.recovery = new RecoveryManager(config.recovery);
  }

  /**
   * Handle an error with logging, display, and optional recovery
   */
  async handleError(
    error: ErixError,
    operation?: () => Promise<any>
  ): Promise<RecoveryResult | null> {
    // Log the error
    this.logger.log(error);

    // Display the error to the user
    this.display.display(error);

    // Attempt recovery if error is recoverable and operation is provided
    if (error.recoverable && operation) {
      const result = await this.recovery.recover(error, operation);
      return result;
    }

    return null;
  }

  /**
   * Create an error from an exception
   */
  createError(
    type: ErrorType,
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      recoverable?: boolean;
      severity?: ErrorSeverity;
      displayMode?: ErrorDisplayMode;
      recoveryStrategy?: RecoveryStrategy;
      originalError?: Error;
    } = {}
  ): ErixError {
    return {
      type,
      message,
      code: options.code,
      details: options.details,
      recoverable: options.recoverable ?? false,
      severity: options.severity ?? ErrorSeverity.ERROR,
      displayMode: options.displayMode ?? ErrorDisplayMode.TOAST,
      recoveryStrategy: options.recoveryStrategy ?? RecoveryStrategy.USER_ACTION_REQUIRED,
      originalError: options.originalError,
      timestamp: Date.now(),
      stack: options.originalError?.stack || new Error().stack,
    };
  }

  /**
   * Create and handle an error in one call
   */
  async error(
    type: ErrorType,
    message: string,
    options: Parameters<typeof this.createError>[2] = {},
    operation?: () => Promise<any>
  ): Promise<RecoveryResult | null> {
    const error = this.createError(type, message, options);
    return this.handleError(error, operation);
  }

  /**
   * Handle a network error with automatic retry
   */
  async handleNetworkError(
    message: string,
    operation?: () => Promise<any>,
    options: Partial<ErixError> = {}
  ): Promise<RecoveryResult | null> {
    const error = this.createError(ErrorType.NETWORK_ERROR, message, {
      recoverable: true,
      severity: ErrorSeverity.WARNING,
      displayMode: ErrorDisplayMode.TOAST,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
      ...options,
    });

    return this.handleError(error, operation);
  }

  /**
   * Handle an API error
   */
  async handleAPIError(
    message: string,
    statusCode?: number,
    options: Partial<ErixError> = {}
  ): Promise<RecoveryResult | null> {
    const error = this.createError(ErrorType.API_ERROR, message, {
      code: statusCode ? `HTTP_${statusCode}` : undefined,
      details: statusCode ? { statusCode } : undefined,
      recoverable: statusCode ? statusCode >= 500 : false,
      severity: ErrorSeverity.ERROR,
      displayMode: ErrorDisplayMode.TOAST,
      recoveryStrategy:
        statusCode && statusCode >= 500
          ? RecoveryStrategy.RETRY_WITH_BACKOFF
          : RecoveryStrategy.USER_ACTION_REQUIRED,
      ...options,
    });

    return this.handleError(error);
  }

  /**
   * Handle a validation error
   */
  handleValidationError(
    message: string,
    field?: string,
    options: Partial<ErixError> = {}
  ): void {
    const error = this.createError(ErrorType.VALIDATION_ERROR, message, {
      details: field ? { field } : undefined,
      recoverable: false,
      severity: ErrorSeverity.WARNING,
      displayMode: ErrorDisplayMode.INLINE,
      recoveryStrategy: RecoveryStrategy.USER_ACTION_REQUIRED,
      ...options,
    });

    this.handleError(error);
  }

  /**
   * Handle a content error
   */
  handleContentError(
    message: string,
    options: Partial<ErixError> = {}
  ): void {
    const error = this.createError(ErrorType.CONTENT_ERROR, message, {
      recoverable: false,
      severity: ErrorSeverity.ERROR,
      displayMode: ErrorDisplayMode.TOAST,
      recoveryStrategy: RecoveryStrategy.USER_ACTION_REQUIRED,
      ...options,
    });

    this.handleError(error);
  }

  /**
   * Handle a plugin error
   */
  handlePluginError(
    pluginName: string,
    message: string,
    options: Partial<ErixError> = {}
  ): void {
    const error = this.createError(ErrorType.PLUGIN_ERROR, message, {
      details: { pluginName },
      recoverable: false,
      severity: ErrorSeverity.ERROR,
      displayMode: ErrorDisplayMode.TOAST,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      ...options,
    });

    this.handleError(error);
  }

  /**
   * Handle a permission error
   */
  handlePermissionError(
    message: string,
    requiredPermission?: string,
    options: Partial<ErixError> = {}
  ): void {
    const error = this.createError(ErrorType.PERMISSION_ERROR, message, {
      details: requiredPermission ? { requiredPermission } : undefined,
      recoverable: false,
      severity: ErrorSeverity.ERROR,
      displayMode: ErrorDisplayMode.MODAL,
      recoveryStrategy: RecoveryStrategy.USER_ACTION_REQUIRED,
      ...options,
    });

    this.handleError(error);
  }

  /**
   * Handle an unknown error
   */
  handleUnknownError(
    originalError: Error,
    options: Partial<ErixError> = {}
  ): void {
    const error = this.createError(
      ErrorType.UNKNOWN_ERROR,
      originalError.message || 'An unexpected error occurred',
      {
        originalError,
        recoverable: false,
        severity: ErrorSeverity.ERROR,
        displayMode: ErrorDisplayMode.TOAST,
        recoveryStrategy: RecoveryStrategy.USER_ACTION_REQUIRED,
        ...options,
      }
    );

    this.handleError(error);
  }

  /**
   * Get error history from logger
   */
  getErrorHistory(): ErixError[] {
    return this.logger.getHistory();
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.logger.clearHistory();
  }

  /**
   * Clear all displayed errors
   */
  clearDisplayedErrors(): void {
    this.display.clearAll();
  }

  /**
   * Reset retry attempts for recovery
   */
  resetRetries(error: ErixError): void {
    this.recovery.resetRetries(error);
  }

  /**
   * Reset all retry attempts
   */
  resetAllRetries(): void {
    this.recovery.resetAllRetries();
  }

  /**
   * Update configuration
   */
  updateConfig(config: ErrorHandlerConfig): void {
    if (config.display) {
      this.display.updateConfig(config.display);
    }
    if (config.logging) {
      this.logger.updateConfig(config.logging);
    }
    if (config.recovery) {
      this.recovery.updateConfig(config.recovery);
    }
  }

  /**
   * Register custom recovery handler
   */
  registerRecoveryHandler(
    errorType: string,
    handler: (error: ErixError) => Promise<boolean>
  ): void {
    this.recovery.registerRecoveryHandler(errorType, handler);
  }

  /**
   * Get the logger instance
   */
  getLogger(): ErrorLogger {
    return this.logger;
  }

  /**
   * Get the display instance
   */
  getDisplay(): ErrorDisplay {
    return this.display;
  }

  /**
   * Get the recovery manager instance
   */
  getRecoveryManager(): RecoveryManager {
    return this.recovery;
  }
}

// Export singleton instance for convenience
let defaultErrorHandler: ErrorHandler | null = null;

/**
 * Get or create the default error handler instance
 */
export function getDefaultErrorHandler(config?: ErrorHandlerConfig): ErrorHandler {
  if (!defaultErrorHandler) {
    defaultErrorHandler = new ErrorHandler(config);
  }
  return defaultErrorHandler;
}

/**
 * Reset the default error handler instance
 */
export function resetDefaultErrorHandler(): void {
  defaultErrorHandler = null;
}
