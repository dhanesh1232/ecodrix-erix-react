/**
 * Validation types and interfaces for content validation
 * Supports various validation rules and real-time validation
 */

/**
 * Types of validation rules supported by the engine
 */
export enum ValidationRuleType {
  /** Maximum character/word length */
  MAX_LENGTH = 'MAX_LENGTH',
  /** Minimum character/word length */
  MIN_LENGTH = 'MIN_LENGTH',
  /** Required field validation */
  REQUIRED = 'REQUIRED',
  /** Regular expression pattern matching */
  PATTERN = 'PATTERN',
  /** Allowed formatting constraints */
  ALLOWED_FORMATS = 'ALLOWED_FORMATS',
  /** Custom validation function */
  CUSTOM = 'CUSTOM',
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Unique identifier for the rule */
  id: string;
  /** Type of validation to perform */
  type: ValidationRuleType;
  /** Value/constraint for the rule (e.g., max length number, regex pattern) */
  value?: any;
  /** User-friendly error message to display when validation fails */
  message: string;
  /** Optional field name this rule applies to */
  field?: string;
  /** Whether this rule should run in real-time (as user types) */
  realTime?: boolean;
  /** Priority for rule execution (higher runs first) */
  priority?: number;
  /** Custom validation function for CUSTOM type */
  validator?: (content: string, context?: ValidationContext) => boolean | Promise<boolean>;
}

/**
 * Context provided to validation functions
 */
export interface ValidationContext {
  /** Current editor content */
  content: string;
  /** Field being validated (if applicable) */
  field?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Rule ID that failed */
  ruleId: string;
  /** Rule type that failed */
  ruleType: ValidationRuleType;
  /** Error message */
  message: string;
  /** Field that failed validation (if applicable) */
  field?: string;
  /** Location in content where error occurred (character position) */
  position?: number;
  /** Suggested fix (if available) */
  suggestion?: string;
}

/**
 * Result of validation execution
 */
export interface ValidationResult {
  /** Whether all validations passed */
  valid: boolean;
  /** Array of validation errors (empty if valid) */
  errors: ValidationError[];
  /** Warnings that don't prevent submission */
  warnings?: ValidationError[];
  /** Timestamp of validation */
  timestamp: number;
  /** Validation execution time in ms */
  executionTime?: number;
}

/**
 * Configuration for the validation engine
 */
export interface ValidationEngineConfig {
  /** Whether to enable real-time validation */
  enableRealTime: boolean;
  /** Debounce delay for real-time validation (ms) */
  realTimeDebounce: number;
  /** Whether to validate on blur */
  validateOnBlur: boolean;
  /** Whether to validate on submit */
  validateOnSubmit: boolean;
  /** Maximum execution time for async validators (ms) */
  asyncTimeout: number;
  /** Whether to stop on first error or collect all errors */
  stopOnFirstError: boolean;
  /** Custom error formatter */
  errorFormatter?: (error: ValidationError) => string;
}

/**
 * Validation event types
 */
export enum ValidationEventType {
  /** Validation started */
  VALIDATION_START = 'VALIDATION_START',
  /** Validation completed */
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  /** Validation error occurred */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Rule added */
  RULE_ADDED = 'RULE_ADDED',
  /** Rule removed */
  RULE_REMOVED = 'RULE_REMOVED',
  /** Rule updated */
  RULE_UPDATED = 'RULE_UPDATED',
}

/**
 * Validation event payload
 */
export interface ValidationEvent {
  /** Event type */
  type: ValidationEventType;
  /** Validation result (if applicable) */
  result?: ValidationResult;
  /** Rule involved (if applicable) */
  rule?: ValidationRule;
  /** Timestamp */
  timestamp: number;
}

/**
 * Validation listener callback
 */
export type ValidationListener = (event: ValidationEvent) => void;
