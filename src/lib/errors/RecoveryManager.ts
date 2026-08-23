import type { ErixError, RecoveryConfig, RecoveryResult } from './types';
import { RecoveryStrategy } from './types';

/**
 * RecoveryManager handles error recovery strategies
 * Implements retry with backoff, fallback, and custom recovery handlers
 */
export class RecoveryManager {
  private config: RecoveryConfig;
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
      ...config,
    };
  }

  /**
   * Attempt to recover from an error
   */
  async recover(error: ErixError, operation?: () => Promise<any>): Promise<RecoveryResult> {
    if (!error.recoverable) {
      return {
        success: false,
        message: 'Error is not recoverable',
      };
    }

    // Check for custom recovery handler
    if (this.config.customRecoveryHandlers?.[error.type]) {
      try {
        const success = await this.config.customRecoveryHandlers[error.type](error);
        return {
          success,
          message: success ? 'Custom recovery successful' : 'Custom recovery failed',
        };
      } catch (err) {
        console.error('Custom recovery handler failed:', err);
        return {
          success: false,
          message: 'Custom recovery handler threw an error',
        };
      }
    }

    // Apply recovery strategy
    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return this.retryOperation(error, operation);

      case RecoveryStrategy.RETRY_WITH_BACKOFF:
        return this.retryWithBackoff(error, operation);

      case RecoveryStrategy.FALLBACK:
        return this.applyFallback(error);

      case RecoveryStrategy.USER_ACTION_REQUIRED:
        return {
          success: false,
          message: 'User action required to resolve this error',
        };

      case RecoveryStrategy.IGNORE:
        return {
          success: true,
          message: 'Error ignored as per recovery strategy',
        };

      default:
        return {
          success: false,
          message: 'No recovery strategy available',
        };
    }
  }

  /**
   * Retry operation immediately
   */
  private async retryOperation(
    error: ErixError,
    operation?: () => Promise<any>
  ): Promise<RecoveryResult> {
    if (!operation) {
      return {
        success: false,
        message: 'No operation provided to retry',
      };
    }

    const errorKey = this.getErrorKey(error);
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.config.maxRetries) {
      this.retryAttempts.delete(errorKey);
      return {
        success: false,
        message: `Maximum retry attempts (${this.config.maxRetries}) reached`,
        attempts,
      };
    }

    try {
      this.retryAttempts.set(errorKey, attempts + 1);
      await operation();
      this.retryAttempts.delete(errorKey);
      return {
        success: true,
        message: 'Retry successful',
        attempts: attempts + 1,
      };
    } catch (err) {
      return {
        success: false,
        message: 'Retry failed',
        attempts: attempts + 1,
        shouldRetry: attempts + 1 < this.config.maxRetries,
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff(
    error: ErixError,
    operation?: () => Promise<any>
  ): Promise<RecoveryResult> {
    if (!operation) {
      return {
        success: false,
        message: 'No operation provided to retry',
      };
    }

    const errorKey = this.getErrorKey(error);
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.config.maxRetries) {
      this.retryAttempts.delete(errorKey);
      return {
        success: false,
        message: `Maximum retry attempts (${this.config.maxRetries}) reached`,
        attempts,
      };
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.backoffMultiplier, attempts),
      this.config.maxRetryDelay
    );

    // Wait before retrying
    await this.sleep(delay);

    try {
      this.retryAttempts.set(errorKey, attempts + 1);
      await operation();
      this.retryAttempts.delete(errorKey);
      return {
        success: true,
        message: `Retry successful after ${delay}ms delay`,
        attempts: attempts + 1,
      };
    } catch (err) {
      return {
        success: false,
        message: `Retry failed after ${delay}ms delay`,
        attempts: attempts + 1,
        shouldRetry: attempts + 1 < this.config.maxRetries,
      };
    }
  }

  /**
   * Apply fallback strategy
   */
  private async applyFallback(error: ErixError): Promise<RecoveryResult> {
    // Fallback logic depends on error type
    // This is a placeholder that can be extended
    return {
      success: true,
      message: 'Fallback strategy applied',
    };
  }

  /**
   * Generate unique key for error tracking
   */
  private getErrorKey(error: ErixError): string {
    return `${error.type}-${error.code || 'unknown'}`;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset retry attempts for an error
   */
  resetRetries(error: ErixError): void {
    const errorKey = this.getErrorKey(error);
    this.retryAttempts.delete(errorKey);
  }

  /**
   * Reset all retry attempts
   */
  resetAllRetries(): void {
    this.retryAttempts.clear();
  }

  /**
   * Get current retry attempt count for an error
   */
  getRetryAttempts(error: ErixError): number {
    const errorKey = this.getErrorKey(error);
    return this.retryAttempts.get(errorKey) || 0;
  }

  /**
   * Update recovery configuration
   */
  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register custom recovery handler
   */
  registerRecoveryHandler(
    errorType: string,
    handler: (error: ErixError) => Promise<boolean>
  ): void {
    if (!this.config.customRecoveryHandlers) {
      this.config.customRecoveryHandlers = {};
    }
    this.config.customRecoveryHandlers[errorType] = handler;
  }

  /**
   * Unregister custom recovery handler
   */
  unregisterRecoveryHandler(errorType: string): void {
    if (this.config.customRecoveryHandlers) {
      delete this.config.customRecoveryHandlers[errorType];
    }
  }
}
