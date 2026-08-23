/**
 * Error Handling Framework for ErixEditor
 * 
 * Provides comprehensive error handling with:
 * - Error type classification (network, validation, API, etc.)
 * - User-friendly error display (toast, inline, modal)
 * - Error logging with severity levels
 * - Recovery strategies (retry, fallback, etc.)
 * 
 * @example
 * ```typescript
 * import { ErrorHandler, ErrorType } from '@ecodrix/erix-react/errors';
 * 
 * const errorHandler = new ErrorHandler({
 *   logging: { logToConsole: true },
 *   display: { toastDuration: 5000 },
 *   recovery: { maxRetries: 3 }
 * });
 * 
 * // Handle a network error with automatic retry
 * await errorHandler.handleNetworkError(
 *   'Failed to save document',
 *   async () => await saveDocument()
 * );
 * 
 * // Handle a validation error
 * errorHandler.handleValidationError(
 *   'Title is required',
 *   'title'
 * );
 * ```
 */

// Export types
export type {
  ErixError,
  ErrorDisplayConfig,
  ErrorLoggingConfig,
  RecoveryConfig,
  RecoveryResult,
} from './types';

export {
  ErrorType,
  ErrorSeverity,
  ErrorDisplayMode,
  RecoveryStrategy,
} from './types';

// Export classes
export { ErrorLogger } from './ErrorLogger';
export { ErrorDisplay } from './ErrorDisplay';
export { RecoveryManager } from './RecoveryManager';
export {
  ErrorHandler,
  getDefaultErrorHandler,
  resetDefaultErrorHandler,
} from './ErrorHandler';
export type { ErrorHandlerConfig } from './ErrorHandler';
