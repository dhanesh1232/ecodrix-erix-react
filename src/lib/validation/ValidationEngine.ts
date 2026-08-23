/**
 * ValidationEngine - Content validation engine for ErixEditor
 *
 * Provides a flexible rule-based validation system with support for:
 * - Multiple validation rule types (length, pattern, required, custom)
 * - Real-time validation with debouncing
 * - Async validation rules
 * - Field-level and document-level validation
 * - Event-driven architecture for validation lifecycle
 *
 * @example
 * ```typescript
 * const engine = new ValidationEngine({
 *   enableRealTime: true,
 *   realTimeDebounce: 300,
 * });
 *
 * engine.addRule({
 *   id: 'max-length',
 *   type: ValidationRuleType.MAX_LENGTH,
 *   value: 1000,
 *   message: 'Content must not exceed 1000 characters',
 *   realTime: true,
 * });
 *
 * const result = await engine.validate(content);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */

import {
  ValidationRule,
  ValidationRuleType,
  ValidationResult,
  ValidationError,
  ValidationContext,
  ValidationEngineConfig,
  ValidationEvent,
  ValidationEventType,
  ValidationListener,
} from "./types";

/**
 * Default configuration for the validation engine
 */
const DEFAULT_CONFIG: ValidationEngineConfig = {
  enableRealTime: true,
  realTimeDebounce: 300,
  validateOnBlur: true,
  validateOnSubmit: true,
  asyncTimeout: 5000,
  stopOnFirstError: false,
};

export { ValidationRuleType };
/**
 * ValidationEngine class - manages content validation rules and execution
 */
export class ValidationEngine {
  private config: ValidationEngineConfig;
  private rules: Map<string, ValidationRule>;
  private listeners: Set<ValidationListener>;
  private realTimeTimer: NodeJS.Timeout | null;
  private lastValidationResult: ValidationResult | null;

  /**
   * Create a new ValidationEngine instance
   * @param config - Configuration options
   */
  constructor(config: Partial<ValidationEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rules = new Map();
    this.listeners = new Set();
    this.realTimeTimer = null;
    this.lastValidationResult = null;
  }

  /**
   * Add a validation rule to the engine
   * @param rule - Validation rule to add
   */
  addRule(rule: ValidationRule): void {
    // Set default priority if not provided
    const ruleWithDefaults: ValidationRule = {
      ...rule,
      priority: rule.priority ?? 0,
      realTime: rule.realTime ?? false,
    };

    this.rules.set(rule.id, ruleWithDefaults);

    // Emit rule added event
    this.emitEvent({
      type: ValidationEventType.RULE_ADDED,
      rule: ruleWithDefaults,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a validation rule from the engine
   * @param ruleId - ID of the rule to remove
   * @returns true if rule was removed, false if not found
   */
  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    const removed = this.rules.delete(ruleId);

    if (removed && rule) {
      this.emitEvent({
        type: ValidationEventType.RULE_REMOVED,
        rule,
        timestamp: Date.now(),
      });
    }

    return removed;
  }

  /**
   * Update an existing validation rule
   * @param ruleId - ID of the rule to update
   * @param updates - Partial rule updates
   * @returns true if rule was updated, false if not found
   */
  updateRule(ruleId: string, updates: Partial<ValidationRule>): boolean {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      return false;
    }

    const updatedRule = { ...existingRule, ...updates, id: ruleId };
    this.rules.set(ruleId, updatedRule);

    this.emitEvent({
      type: ValidationEventType.RULE_UPDATED,
      rule: updatedRule,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get a validation rule by ID
   * @param ruleId - ID of the rule to retrieve
   * @returns The rule if found, undefined otherwise
   */
  getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all validation rules
   * @returns Array of all rules
   */
  getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Validate content against all registered rules
   * @param content - Content to validate
   * @param context - Optional validation context
   * @returns Validation result
   */
  async validate(
    content: string,
    context?: Partial<ValidationContext>,
  ): Promise<ValidationResult> {
    const startTime = performance.now();

    // Emit validation start event
    this.emitEvent({
      type: ValidationEventType.VALIDATION_START,
      timestamp: Date.now(),
    });

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Get rules sorted by priority (highest first)
    const sortedRules = Array.from(this.rules.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );

    // Build validation context
    const validationContext: ValidationContext = {
      content,
      field: context?.field,
      metadata: context?.metadata,
    };

    // Execute validation rules
    for (const rule of sortedRules) {
      try {
        const error = await this.executeRule(rule, content, validationContext);
        if (error) {
          errors.push(error);

          // Stop on first error if configured
          if (this.config.stopOnFirstError) {
            break;
          }
        }
      } catch (err) {
        // Handle validation execution errors
        errors.push({
          ruleId: rule.id,
          ruleType: rule.type,
          message: `Validation error: ${err instanceof Error ? err.message : "Unknown error"}`,
          field: rule.field,
        });
      }
    }

    const executionTime = performance.now() - startTime;

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      timestamp: Date.now(),
      executionTime,
    };

    this.lastValidationResult = result;

    // Emit validation complete event
    this.emitEvent({
      type: ValidationEventType.VALIDATION_COMPLETE,
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Execute a single validation rule
   * @param rule - Rule to execute
   * @param content - Content to validate
   * @param context - Validation context
   * @returns Validation error if rule fails, null if passes
   */
  private async executeRule(
    rule: ValidationRule,
    content: string,
    context: ValidationContext,
  ): Promise<ValidationError | null> {
    let isValid = false;

    switch (rule.type) {
      case ValidationRuleType.MAX_LENGTH:
        isValid = content.length <= (rule.value ?? Number.MAX_SAFE_INTEGER);
        break;

      case ValidationRuleType.MIN_LENGTH:
        isValid = content.length >= (rule.value ?? 0);
        break;

      case ValidationRuleType.REQUIRED:
        isValid = content.trim().length > 0;
        break;

      case ValidationRuleType.PATTERN:
        if (rule.value === undefined) {
          throw new Error(`Pattern value not provided for rule ${rule.id}`);
        }
        const regex =
          rule.value instanceof RegExp ? rule.value : new RegExp(rule.value);
        isValid = regex.test(content);
        break;

      case ValidationRuleType.ALLOWED_FORMATS:
        // Check if content contains only allowed HTML tags/formats
        if (!Array.isArray(rule.value)) {
          throw new Error(
            `Allowed formats must be an array for rule ${rule.id}`,
          );
        }
        isValid = this.validateAllowedFormats(content, rule.value);
        break;

      case ValidationRuleType.CUSTOM:
        if (rule.validator) {
          const validatorResult = rule.validator(content, context);
          isValid =
            validatorResult instanceof Promise
              ? await validatorResult
              : validatorResult;
        } else {
          throw new Error(
            `Custom validator function not provided for rule ${rule.id}`,
          );
        }
        break;

      default:
        throw new Error(`Unknown validation rule type: ${rule.type}`);
    }

    if (!isValid) {
      const error: ValidationError = {
        ruleId: rule.id,
        ruleType: rule.type,
        message: this.formatErrorMessage(rule, content),
        field: rule.field,
      };

      // Emit validation error event
      this.emitEvent({
        type: ValidationEventType.VALIDATION_ERROR,
        result: {
          valid: false,
          errors: [error],
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      return error;
    }

    return null;
  }

  /**
   * Validate allowed formats (HTML tags/formatting)
   * @param content - Content to validate
   * @param allowedFormats - Array of allowed format tags
   * @returns true if content only contains allowed formats
   */
  private validateAllowedFormats(
    content: string,
    allowedFormats: string[],
  ): boolean {
    // Extract all HTML tags from content
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    const matches = content.matchAll(tagRegex);

    for (const match of matches) {
      const tagName = match[1].toLowerCase();
      if (!allowedFormats.includes(tagName)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Format error message using custom formatter or default
   * @param rule - Validation rule
   * @param content - Content that failed validation
   * @returns Formatted error message
   */
  private formatErrorMessage(rule: ValidationRule, content: string): string {
    if (this.config.errorFormatter) {
      const error: ValidationError = {
        ruleId: rule.id,
        ruleType: rule.type,
        message: rule.message,
        field: rule.field,
      };
      return this.config.errorFormatter(error);
    }

    // Default formatting with context
    let message = rule.message;

    // Add context for length rules
    if (
      rule.type === ValidationRuleType.MAX_LENGTH &&
      rule.value !== undefined
    ) {
      message += ` (current: ${content.length}, max: ${rule.value})`;
    } else if (
      rule.type === ValidationRuleType.MIN_LENGTH &&
      rule.value !== undefined
    ) {
      message += ` (current: ${content.length}, min: ${rule.value})`;
    }

    return message;
  }

  /**
   * Validate content in real-time with debouncing
   * @param content - Content to validate
   * @param context - Optional validation context
   * @returns Promise that resolves when validation completes
   */
  validateRealTime(
    content: string,
    context?: Partial<ValidationContext>,
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      // Clear existing timer
      if (this.realTimeTimer) {
        clearTimeout(this.realTimeTimer);
      }

      // Set new debounced validation
      this.realTimeTimer = setTimeout(async () => {
        // Only validate rules marked for real-time
        const realTimeRules = Array.from(this.rules.values()).filter(
          (rule) => rule.realTime,
        );

        if (realTimeRules.length === 0) {
          resolve({
            valid: true,
            errors: [],
            timestamp: Date.now(),
          });
          return;
        }

        // Temporarily store all rules and set only real-time rules
        const allRules = new Map(this.rules);
        this.rules.clear();
        realTimeRules.forEach((rule) => this.rules.set(rule.id, rule));

        // Validate
        const result = await this.validate(content, context);

        // Restore all rules
        this.rules = allRules;

        resolve(result);
      }, this.config.realTimeDebounce);
    });
  }

  /**
   * Get the last validation result
   * @returns Last validation result or null if no validation has been performed
   */
  getLastResult(): ValidationResult | null {
    return this.lastValidationResult;
  }

  /**
   * Check if content is currently valid based on last validation
   * @returns true if last validation passed, false otherwise
   */
  isValid(): boolean {
    return this.lastValidationResult?.valid ?? true;
  }

  /**
   * Add a validation event listener
   * @param listener - Listener callback function
   */
  on(listener: ValidationListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a validation event listener
   * @param listener - Listener callback function to remove
   */
  off(listener: ValidationListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit a validation event to all listeners
   * @param event - Event to emit
   */
  private emitEvent(event: ValidationEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in validation listener:", err);
      }
    });
  }

  /**
   * Update engine configuration
   * @param config - Partial configuration updates
   */
  updateConfig(config: Partial<ValidationEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current engine configuration
   * @returns Current configuration
   */
  getConfig(): ValidationEngineConfig {
    return { ...this.config };
  }

  /**
   * Dispose of the validation engine and clean up resources
   */
  dispose(): void {
    if (this.realTimeTimer) {
      clearTimeout(this.realTimeTimer);
      this.realTimeTimer = null;
    }
    this.rules.clear();
    this.listeners.clear();
    this.lastValidationResult = null;
  }
}
