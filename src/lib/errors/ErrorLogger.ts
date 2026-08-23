import type { ErixError, ErrorLoggingConfig, ErrorSeverity } from './types';
import { ErrorSeverity as Severity } from './types';

/**
 * ErrorLogger handles logging of errors with severity levels
 * Provides console logging and custom logging callbacks
 */
export class ErrorLogger {
  private config: ErrorLoggingConfig;
  private errorHistory: ErixError[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  constructor(config: Partial<ErrorLoggingConfig> = {}) {
    this.config = {
      logToConsole: true,
      minSeverity: Severity.WARNING,
      includeStackTrace: true,
      ...config,
    };
  }

  /**
   * Log an error with appropriate severity level
   */
  log(error: ErixError): void {
    // Check if error meets minimum severity threshold
    if (!this.shouldLog(error.severity)) {
      return;
    }

    // Add to history
    this.addToHistory(error);

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(error);
    }

    // Call custom logging callback if provided
    if (this.config.onLogError) {
      try {
        this.config.onLogError(error);
      } catch (err) {
        console.error('Error in custom logging callback:', err);
      }
    }
  }

  /**
   * Check if error should be logged based on severity
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityLevels = {
      [Severity.INFO]: 0,
      [Severity.WARNING]: 1,
      [Severity.ERROR]: 2,
      [Severity.CRITICAL]: 3,
    };

    return severityLevels[severity] >= severityLevels[this.config.minSeverity];
  }

  /**
   * Log error to console with appropriate method
   */
  private logToConsole(error: ErixError): void {
    const prefix = `[ErixEditor ${error.severity}]`;
    const message = `${prefix} ${error.type}: ${error.message}`;

    // Choose console method based on severity
    const consoleMethod = this.getConsoleMethod(error.severity);

    // Log main message
    consoleMethod(message);

    // Log details if available
    if (error.details && Object.keys(error.details).length > 0) {
      console.group('Error Details:');
      console.table(error.details);
      console.groupEnd();
    }

    // Log stack trace if enabled and available
    if (this.config.includeStackTrace && error.stack) {
      console.group('Stack Trace:');
      console.log(error.stack);
      console.groupEnd();
    }

    // Log original error if available
    if (error.originalError) {
      console.group('Original Error:');
      console.error(error.originalError);
      console.groupEnd();
    }
  }

  /**
   * Get appropriate console method for severity level
   */
  private getConsoleMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case Severity.INFO:
        return console.info;
      case Severity.WARNING:
        return console.warn;
      case Severity.ERROR:
      case Severity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Add error to history with size limit
   */
  private addToHistory(error: ErixError): void {
    this.errorHistory.push(error);

    // Maintain maximum history size
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error history
   */
  getHistory(): ErixError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: string): ErixError[] {
    return this.errorHistory.filter((error) => error.type === type);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErixError[] {
    return this.errorHistory.filter((error) => error.severity === severity);
  }

  /**
   * Update logging configuration
   */
  updateConfig(config: Partial<ErrorLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
