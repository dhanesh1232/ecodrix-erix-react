/**
 * Error types for the ErixEditor
 * Categorizes errors for appropriate handling and display
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  CONTENT_ERROR = 'CONTENT_ERROR',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Severity levels for error logging
 */
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Display modes for error messages
 */
export enum ErrorDisplayMode {
  TOAST = 'TOAST',
  INLINE = 'INLINE',
  MODAL = 'MODAL',
  SILENT = 'SILENT',
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  RETRY_WITH_BACKOFF = 'RETRY_WITH_BACKOFF',
  FALLBACK = 'FALLBACK',
  USER_ACTION_REQUIRED = 'USER_ACTION_REQUIRED',
  IGNORE = 'IGNORE',
}

/**
 * Core error interface with context and metadata
 */
export interface ErixError {
  /** Error type for categorization */
  type: ErrorType;
  /** User-friendly error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
  /** Additional error details and context */
  details?: Record<string, any>;
  /** Whether the error can be recovered from */
  recoverable: boolean;
  /** Severity level for logging */
  severity: ErrorSeverity;
  /** Preferred display mode */
  displayMode: ErrorDisplayMode;
  /** Recovery strategy to apply */
  recoveryStrategy: RecoveryStrategy;
  /** Original error object if available */
  originalError?: Error;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Stack trace for debugging */
  stack?: string;
}

/**
 * Configuration for error display
 */
export interface ErrorDisplayConfig {
  /** Duration to show toast messages (ms) */
  toastDuration: number;
  /** Whether to show technical details in production */
  showTechnicalDetails: boolean;
  /** Custom error message overrides */
  customMessages?: Record<string, string>;
  /** Callback for custom error display */
  onDisplayError?: (error: ErixError) => void;
}

/**
 * Configuration for error logging
 */
export interface ErrorLoggingConfig {
  /** Whether to log to console */
  logToConsole: boolean;
  /** Minimum severity level to log */
  minSeverity: ErrorSeverity;
  /** Custom logging callback */
  onLogError?: (error: ErixError) => void;
  /** Whether to include stack traces */
  includeStackTrace: boolean;
}

/**
 * Configuration for recovery strategies
 */
export interface RecoveryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Initial retry delay (ms) */
  initialRetryDelay: number;
  /** Maximum retry delay (ms) */
  maxRetryDelay: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Custom recovery handlers */
  customRecoveryHandlers?: Record<string, (error: ErixError) => Promise<boolean>>;
}

/**
 * Result of an error recovery attempt
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Message describing the recovery outcome */
  message?: string;
  /** Number of retry attempts made */
  attempts?: number;
  /** Whether to retry the operation */
  shouldRetry?: boolean;
}
