/**
 * Unit tests for ErrorHandler
 * These tests verify the core functionality of the error handling framework
 * 
 * Test Coverage:
 * - Error type classification (Requirements 10.1, 10.2)
 * - Error display logic (Requirements 10.1, 10.2)
 * - Recovery strategies (Requirements 10.3)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  ErrorDisplayMode,
  RecoveryStrategy,
} from "../index";

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      logging: {
        logToConsole: false, // Disable console logging in tests
      },
    });
  });

  afterEach(() => {
    // Clean up any DOM elements created during tests
    errorHandler.clearDisplayedErrors();
  });

  // ============================================================================
  // Error Type Classification Tests
  // ============================================================================

  describe("Error Type Classification", () => {
    describe("createError", () => {
      it("should create an error with required fields", () => {
        const error = errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          "Test error message",
        );

        expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
        expect(error.message).toBe("Test error message");
        expect(error.timestamp).toBeDefined();
        expect(error.recoverable).toBe(false);
        expect(error.severity).toBe(ErrorSeverity.ERROR);
      });

      it("should create an error with custom options", () => {
        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Network error",
          {
            code: "NET_001",
            details: { endpoint: "/api/test" },
            recoverable: true,
            severity: ErrorSeverity.WARNING,
            displayMode: ErrorDisplayMode.TOAST,
            recoveryStrategy: RecoveryStrategy.RETRY,
          },
        );

        expect(error.code).toBe("NET_001");
        expect(error.details).toEqual({ endpoint: "/api/test" });
        expect(error.recoverable).toBe(true);
        expect(error.severity).toBe(ErrorSeverity.WARNING);
        expect(error.displayMode).toBe(ErrorDisplayMode.TOAST);
        expect(error.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
      });

      it("should include stack trace in error", () => {
        const error = errorHandler.createError(
          ErrorType.CONTENT_ERROR,
          "Content error",
        );

        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe("string");
      });

      it("should preserve original error if provided", () => {
        const originalError = new Error("Original error");
        const error = errorHandler.createError(
          ErrorType.UNKNOWN_ERROR,
          "Wrapped error",
          { originalError },
        );

        expect(error.originalError).toBe(originalError);
        expect(error.stack).toBe(originalError.stack);
      });
    });

    describe("Network Error Classification", () => {
      it("should classify network errors correctly", async () => {
        await errorHandler.handleNetworkError("Connection failed");

        const history = errorHandler.getErrorHistory();
        expect(history).toHaveLength(1);
        expect(history[0].type).toBe(ErrorType.NETWORK_ERROR);
        expect(history[0].recoverable).toBe(true);
        expect(history[0].severity).toBe(ErrorSeverity.WARNING);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.TOAST);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.RETRY_WITH_BACKOFF,
        );
      });

      it("should allow custom network error options", async () => {
        await errorHandler.handleNetworkError("Timeout", undefined, {
          severity: ErrorSeverity.ERROR,
          code: "TIMEOUT",
        });

        const history = errorHandler.getErrorHistory();
        expect(history[0].severity).toBe(ErrorSeverity.ERROR);
        expect(history[0].code).toBe("TIMEOUT");
      });
    });

    describe("API Error Classification", () => {
      it("should classify 4xx errors as client errors", async () => {
        await errorHandler.handleAPIError("Not found", 404);

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.API_ERROR);
        expect(history[0].code).toBe("HTTP_404");
        expect(history[0].details?.statusCode).toBe(404);
        expect(history[0].recoverable).toBe(false);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.USER_ACTION_REQUIRED,
        );
      });

      it("should classify 5xx errors as server errors", async () => {
        await errorHandler.handleAPIError("Server error", 500);

        const history = errorHandler.getErrorHistory();
        expect(history[0].recoverable).toBe(true);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.RETRY_WITH_BACKOFF,
        );
      });

      it("should handle API errors without status code", async () => {
        await errorHandler.handleAPIError("Unknown API error");

        const history = errorHandler.getErrorHistory();
        expect(history[0].code).toBeUndefined();
        expect(history[0].recoverable).toBe(false);
      });

      it("should classify different 4xx status codes correctly", async () => {
        const testCases = [
          { code: 400, name: "Bad Request" },
          { code: 401, name: "Unauthorized" },
          { code: 403, name: "Forbidden" },
          { code: 404, name: "Not Found" },
        ];

        for (const testCase of testCases) {
          errorHandler.clearErrorHistory();
          await errorHandler.handleAPIError(testCase.name, testCase.code);

          const history = errorHandler.getErrorHistory();
          expect(history[0].code).toBe(`HTTP_${testCase.code}`);
          expect(history[0].recoverable).toBe(false);
        }
      });

      it("should classify different 5xx status codes correctly", async () => {
        const testCases = [
          { code: 500, name: "Internal Server Error" },
          { code: 502, name: "Bad Gateway" },
          { code: 503, name: "Service Unavailable" },
          { code: 504, name: "Gateway Timeout" },
        ];

        for (const testCase of testCases) {
          errorHandler.clearErrorHistory();
          await errorHandler.handleAPIError(testCase.name, testCase.code);

          const history = errorHandler.getErrorHistory();
          expect(history[0].code).toBe(`HTTP_${testCase.code}`);
          expect(history[0].recoverable).toBe(true);
        }
      });
    });

    describe("Validation Error Classification", () => {
      it("should classify validation errors correctly", () => {
        errorHandler.handleValidationError("Email is required", "email");

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.VALIDATION_ERROR);
        expect(history[0].details?.field).toBe("email");
        expect(history[0].recoverable).toBe(false);
        expect(history[0].severity).toBe(ErrorSeverity.WARNING);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.INLINE);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.USER_ACTION_REQUIRED,
        );
      });

      it("should handle validation errors without field", () => {
        errorHandler.handleValidationError("Form is invalid");

        const history = errorHandler.getErrorHistory();
        expect(history[0].details).toBeUndefined();
      });
    });

    describe("Content Error Classification", () => {
      it("should classify content errors correctly", () => {
        errorHandler.handleContentError("Invalid content format");

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.CONTENT_ERROR);
        expect(history[0].recoverable).toBe(false);
        expect(history[0].severity).toBe(ErrorSeverity.ERROR);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.TOAST);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.USER_ACTION_REQUIRED,
        );
      });
    });

    describe("Plugin Error Classification", () => {
      it("should classify plugin errors correctly", () => {
        errorHandler.handlePluginError("spell-checker", "Failed to initialize");

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.PLUGIN_ERROR);
        expect(history[0].details?.pluginName).toBe("spell-checker");
        expect(history[0].recoverable).toBe(false);
        expect(history[0].severity).toBe(ErrorSeverity.ERROR);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.TOAST);
        expect(history[0].recoveryStrategy).toBe(RecoveryStrategy.FALLBACK);
      });
    });

    describe("Permission Error Classification", () => {
      it("should classify permission errors correctly", () => {
        errorHandler.handlePermissionError("Access denied", "document.edit");

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.PERMISSION_ERROR);
        expect(history[0].details?.requiredPermission).toBe("document.edit");
        expect(history[0].recoverable).toBe(false);
        expect(history[0].severity).toBe(ErrorSeverity.ERROR);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.MODAL);
        expect(history[0].recoveryStrategy).toBe(
          RecoveryStrategy.USER_ACTION_REQUIRED,
        );
      });

      it("should handle permission errors without required permission", () => {
        errorHandler.handlePermissionError("Access denied");

        const history = errorHandler.getErrorHistory();
        expect(history[0].details).toBeUndefined();
      });
    });

    describe("Unknown Error Classification", () => {
      it("should classify unknown errors correctly", () => {
        const originalError = new Error("Something went wrong");
        errorHandler.handleUnknownError(originalError);

        const history = errorHandler.getErrorHistory();
        expect(history[0].type).toBe(ErrorType.UNKNOWN_ERROR);
        expect(history[0].originalError).toBe(originalError);
        expect(history[0].message).toBe("Something went wrong");
        expect(history[0].recoverable).toBe(false);
        expect(history[0].severity).toBe(ErrorSeverity.ERROR);
        expect(history[0].displayMode).toBe(ErrorDisplayMode.TOAST);
      });

      it("should handle errors without message", () => {
        const originalError = new Error();
        errorHandler.handleUnknownError(originalError);

        const history = errorHandler.getErrorHistory();
        expect(history[0].message).toBe("An unexpected error occurred");
      });
    });
  });

  // ============================================================================
  // Error Display Logic Tests
  // ============================================================================

  describe("Error Display Logic", () => {
    beforeEach(() => {
      // Set up DOM for display tests
      document.body.innerHTML = "";
    });

    describe("Toast Display", () => {
      it("should display toast for network errors", async () => {
        await errorHandler.handleNetworkError("Connection failed");

        // Check that toast container was created
        const container = document.getElementById("erix-error-toast-container");
        expect(container).toBeTruthy();

        // Check that toast was added
        const toasts = container?.querySelectorAll(".erix-error-toast");
        expect(toasts?.length).toBeGreaterThan(0);
      });

      it("should display toast with correct content", async () => {
        await errorHandler.handleAPIError("API request failed", 500);

        const toast = document.querySelector(".erix-error-toast");
        expect(toast?.textContent).toContain("API request failed");
      });

      it("should include error code in toast when showTechnicalDetails is true", async () => {
        errorHandler.updateConfig({
          display: {
            showTechnicalDetails: true,
          },
        });

        await errorHandler.handleAPIError("Server error", 500);

        const toast = document.querySelector(".erix-error-toast");
        expect(toast?.textContent).toContain("HTTP_500");
      });

      it("should not include error code when showTechnicalDetails is false", async () => {
        errorHandler.updateConfig({
          display: {
            showTechnicalDetails: false,
          },
        });

        await errorHandler.handleAPIError("Server error", 500);

        const toast = document.querySelector(".erix-error-toast");
        expect(toast?.textContent).not.toContain("HTTP_500");
      });
    });

    describe("Inline Display", () => {
      it("should emit event for inline errors", () => {
        const eventListener = vi.fn();
        window.addEventListener("erix-inline-error", eventListener);

        errorHandler.handleValidationError("Email is required", "email");

        expect(eventListener).toHaveBeenCalled();
        const event = eventListener.mock.calls[0][0] as CustomEvent;
        expect(event.detail.error.type).toBe(ErrorType.VALIDATION_ERROR);
        expect(event.detail.message).toBe("Email is required");

        window.removeEventListener("erix-inline-error", eventListener);
      });
    });

    describe("Modal Display", () => {
      it("should display modal for permission errors", () => {
        errorHandler.handlePermissionError("Access denied", "document.edit");

        const modal = document.querySelector(".erix-error-modal-overlay");
        expect(modal).toBeTruthy();
      });

      it("should display modal with correct content", () => {
        errorHandler.handlePermissionError("Access denied", "document.edit");

        const modal = document.querySelector(".erix-error-modal");
        expect(modal?.textContent).toContain("Access denied");
      });

      it("should include technical details in modal when enabled", () => {
        errorHandler.updateConfig({
          display: {
            showTechnicalDetails: true,
          },
        });

        errorHandler.handlePermissionError("Access denied", "document.edit");

        const modal = document.querySelector(".erix-error-modal");
        expect(modal?.textContent).toContain("document.edit");
      });
    });

    describe("Custom Display Callback", () => {
      it("should call custom display callback", async () => {
        const customCallback = vi.fn();
        errorHandler.updateConfig({
          display: {
            onDisplayError: customCallback,
          },
        });

        await errorHandler.handleNetworkError("Connection failed");

        expect(customCallback).toHaveBeenCalled();
        expect(customCallback.mock.calls[0][0].type).toBe(
          ErrorType.NETWORK_ERROR,
        );
      });

      it("should handle errors in custom display callback", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const customCallback = vi.fn(() => {
          throw new Error("Callback error");
        });

        errorHandler.updateConfig({
          display: {
            onDisplayError: customCallback,
          },
        });

        await errorHandler.handleNetworkError("Connection failed");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error in custom display callback:",
          expect.any(Error),
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe("Custom Messages", () => {
      it("should use custom message override", async () => {
        errorHandler.updateConfig({
          display: {
            customMessages: {
              HTTP_404: "The resource you're looking for doesn't exist",
            },
          },
        });

        await errorHandler.handleAPIError("Not found", 404);

        const toast = document.querySelector(".erix-error-toast");
        expect(toast?.textContent).toContain(
          "The resource you're looking for doesn't exist",
        );
      });
    });

    describe("Clear Displayed Errors", () => {
      it("should clear all displayed errors", async () => {
        await errorHandler.handleNetworkError("Error 1");
        await errorHandler.handleNetworkError("Error 2");

        let toasts = document.querySelectorAll(".erix-error-toast");
        expect(toasts.length).toBeGreaterThan(0);

        errorHandler.clearDisplayedErrors();

        // Wait for animation
        await new Promise((resolve) => setTimeout(resolve, 400));

        toasts = document.querySelectorAll(".erix-error-toast");
        expect(toasts.length).toBe(0);
      });
    });
  });

  // ============================================================================
  // Recovery Strategy Tests
  // ============================================================================

  describe("Recovery Strategies", () => {
    describe("Retry Strategy", () => {
      it("should retry operation on network error", async () => {
        let attempts = 0;
        const operation = vi.fn(async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Network error");
          }
          return "success";
        });

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Connection failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.RETRY,
          },
        );

        // First attempt - will fail
        let result = await errorHandler.getRecoveryManager().recover(error, operation);
        expect(result?.success).toBe(false);
        expect(attempts).toBe(1);

        // Second attempt - will succeed
        result = await errorHandler.getRecoveryManager().recover(error, operation);
        expect(result?.success).toBe(true);
        expect(attempts).toBe(2);
      });

      it("should stop retrying after max attempts", async () => {
        const operation = vi.fn(async () => {
          throw new Error("Always fails");
        });

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Connection failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.RETRY,
          },
        );

        // Try up to max retries
        for (let i = 0; i < 3; i++) {
          await errorHandler.getRecoveryManager().recover(error, operation);
        }

        expect(operation).toHaveBeenCalledTimes(3);

        // Next attempt should not retry (max reached)
        const result = await errorHandler.getRecoveryManager().recover(error, operation);
        expect(result?.success).toBe(false);
        expect(result?.message).toContain("Maximum retry attempts");
        expect(operation).toHaveBeenCalledTimes(3); // Still 3, no new attempt
      });
    });

    describe("Retry with Backoff Strategy", () => {
      it("should apply exponential backoff between retries", async () => {
        // Use shorter delays for testing
        errorHandler.updateConfig({
          recovery: {
            initialRetryDelay: 100,
            maxRetryDelay: 1000,
          },
        });

        const timestamps: number[] = [];
        const operation = vi.fn(async () => {
          timestamps.push(Date.now());
          throw new Error("Always fails");
        });

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Connection failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
          },
        );

        // Make 3 retry attempts
        for (let i = 0; i < 3; i++) {
          await errorHandler.getRecoveryManager().recover(error, operation);
        }

        // Check that we made multiple attempts
        expect(timestamps.length).toBe(3);
        
        if (timestamps.length >= 3) {
          const delay1 = timestamps[1] - timestamps[0];
          const delay2 = timestamps[2] - timestamps[1];
          // Second delay should be longer than first (exponential backoff)
          expect(delay2).toBeGreaterThan(delay1);
        }
      }, 10000); // 10 second timeout

      it("should respect max retry delay", async () => {
        errorHandler.updateConfig({
          recovery: {
            initialRetryDelay: 100,
            maxRetryDelay: 500,
            backoffMultiplier: 10,
          },
        });

        const timestamps: number[] = [];
        const operation = vi.fn(async () => {
          timestamps.push(Date.now());
          throw new Error("Always fails");
        });

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Connection failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
          },
        );

        // Make 3 retry attempts
        for (let i = 0; i < 3; i++) {
          await errorHandler.getRecoveryManager().recover(error, operation);
        }

        // Check that delay doesn't exceed max
        if (timestamps.length >= 3) {
          const delay = timestamps[2] - timestamps[1];
          expect(delay).toBeLessThanOrEqual(600); // Allow small margin
        }
      }, 10000); // 10 second timeout
    });

    describe("Fallback Strategy", () => {
      it("should apply fallback for plugin errors", async () => {
        const error = errorHandler.createError(
          ErrorType.PLUGIN_ERROR,
          "Plugin failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.FALLBACK,
          },
        );

        // Fallback strategy doesn't require an operation
        const result = await errorHandler.getRecoveryManager().recover(error);

        expect(result?.success).toBe(true);
        expect(result?.message).toContain("Fallback");
      });
    });

    describe("User Action Required Strategy", () => {
      it("should not attempt recovery for user action required", async () => {
        const operation = vi.fn();
        const error = errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          "Invalid input",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.USER_ACTION_REQUIRED,
          },
        );

        const result = await errorHandler.handleError(error, operation);

        expect(result?.success).toBe(false);
        expect(result?.message).toContain("User action required");
        expect(operation).not.toHaveBeenCalled();
      });
    });

    describe("Ignore Strategy", () => {
      it("should ignore errors with ignore strategy", async () => {
        const error = errorHandler.createError(
          ErrorType.CONTENT_ERROR,
          "Minor issue",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.IGNORE,
          },
        );

        // Ignore strategy doesn't require an operation
        const result = await errorHandler.getRecoveryManager().recover(error);

        expect(result?.success).toBe(true);
        expect(result?.message).toContain("ignored");
      });
    });

    describe("Custom Recovery Handler", () => {
      it("should use custom recovery handler when registered", async () => {
        const customHandler = vi.fn(async () => true);

        errorHandler.registerRecoveryHandler(
          ErrorType.NETWORK_ERROR,
          customHandler,
        );

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Test error",
          {
            recoverable: true,
          },
        );

        const result = await errorHandler.handleError(error, async () => {});

        expect(customHandler).toHaveBeenCalledWith(error);
        expect(result?.success).toBe(true);
      });

      it("should handle errors in custom recovery handler", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const customHandler = vi.fn(async () => {
          throw new Error("Handler error");
        });

        errorHandler.registerRecoveryHandler(
          ErrorType.NETWORK_ERROR,
          customHandler,
        );

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Test error",
          {
            recoverable: true,
          },
        );

        const result = await errorHandler.handleError(error, async () => {});

        expect(result?.success).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });

    describe("Reset Retries", () => {
      it("should reset retry attempts for specific error", async () => {
        const operation = vi.fn(async () => {
          throw new Error("Always fails");
        });

        const error = errorHandler.createError(
          ErrorType.NETWORK_ERROR,
          "Connection failed",
          {
            recoverable: true,
            recoveryStrategy: RecoveryStrategy.RETRY,
          },
        );

        // First attempt - try up to max retries
        for (let i = 0; i < 3; i++) {
          await errorHandler.getRecoveryManager().recover(error, operation);
        }
        expect(operation).toHaveBeenCalledTimes(3);

        // Should not retry anymore (max reached)
        operation.mockClear();
        const result = await errorHandler.getRecoveryManager().recover(error, operation);
        expect(result?.message).toContain("Maximum retry attempts");
        expect(operation).not.toHaveBeenCalled();

        // Reset retries
        errorHandler.resetRetries(error);

        // Should be able to retry again
        await errorHandler.getRecoveryManager().recover(error, operation);
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it("should reset all retry attempts", async () => {
        const operation = vi.fn(async () => {
          throw new Error("Always fails");
        });

        // Multiple errors
        await errorHandler.handleNetworkError("Error 1", operation);
        await errorHandler.handleNetworkError("Error 2", operation);

        // Reset all
        errorHandler.resetAllRetries();

        // Should be able to retry again
        operation.mockClear();
        await errorHandler.handleNetworkError("Error 1", operation);
        expect(operation).toHaveBeenCalled();
      });
    });

    describe("Non-recoverable Errors", () => {
      it("should not attempt recovery for non-recoverable errors", async () => {
        const operation = vi.fn();
        const error = errorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          "Invalid input",
          {
            recoverable: false,
          },
        );

        const result = await errorHandler.handleError(error, operation);

        expect(result).toBeNull();
        expect(operation).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Error History Tests
  // ============================================================================

  describe("Error History", () => {
    it("should track error history", () => {
      errorHandler.handleValidationError("Error 1", "field1");
      errorHandler.handleValidationError("Error 2", "field2");
      errorHandler.handleValidationError("Error 3", "field3");

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe("Error 1");
      expect(history[1].message).toBe("Error 2");
      expect(history[2].message).toBe("Error 3");
    });

    it("should clear error history", () => {
      errorHandler.handleValidationError("Error 1", "field1");
      errorHandler.handleValidationError("Error 2", "field2");

      errorHandler.clearErrorHistory();

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(0);
    });

    it("should maintain error history order", () => {
      const errors = ["First", "Second", "Third"];
      for (const msg of errors) {
        errorHandler.handleContentError(msg);
      }

      const history = errorHandler.getErrorHistory();
      expect(history.map((e) => e.message)).toEqual(errors);
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe("Configuration", () => {
    it("should update display configuration", () => {
      errorHandler.updateConfig({
        display: {
          toastDuration: 3000,
          showTechnicalDetails: true,
        },
      });

      expect(errorHandler.getDisplay()).toBeDefined();
    });

    it("should update logging configuration", () => {
      errorHandler.updateConfig({
        logging: {
          logToConsole: true,
          minSeverity: ErrorSeverity.WARNING,
        },
      });

      expect(errorHandler.getLogger()).toBeDefined();
    });

    it("should update recovery configuration", () => {
      errorHandler.updateConfig({
        recovery: {
          maxRetries: 5,
          initialRetryDelay: 2000,
        },
      });

      expect(errorHandler.getRecoveryManager()).toBeDefined();
    });

    it("should allow partial configuration updates", () => {
      errorHandler.updateConfig({
        display: {
          toastDuration: 3000,
        },
      });

      // Should not throw and should update only display config
      expect(errorHandler.getDisplay()).toBeDefined();
      expect(errorHandler.getLogger()).toBeDefined();
      expect(errorHandler.getRecoveryManager()).toBeDefined();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete error lifecycle", async () => {
      const operation = vi.fn(async () => {
        throw new Error("Network error");
      });

      // Handle error with recovery
      const result = await errorHandler.handleNetworkError(
        "Connection failed",
        operation,
      );

      // Check error was logged
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);

      // Check error was displayed
      const toast = document.querySelector(".erix-error-toast");
      expect(toast).toBeTruthy();

      // Check recovery was attempted
      expect(operation).toHaveBeenCalled();
    });

    it("should handle multiple concurrent errors", async () => {
      const promises = [
        errorHandler.handleNetworkError("Error 1"),
        errorHandler.handleAPIError("Error 2", 500),
        errorHandler.handleContentError("Error 3"),
      ];

      await Promise.all(promises);

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(3);

      const toasts = document.querySelectorAll(".erix-error-toast");
      expect(toasts.length).toBeGreaterThan(0);
    });

    it("should handle error method shorthand", async () => {
      const result = await errorHandler.error(
        ErrorType.NETWORK_ERROR,
        "Test error",
        {
          recoverable: true,
          recoveryStrategy: RecoveryStrategy.RETRY,
        },
      );

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe(ErrorType.NETWORK_ERROR);
    });
  });
});
