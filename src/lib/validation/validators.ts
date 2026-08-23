/**
 * Common validation utility functions and pre-built validators
 * Provides reusable validation logic for common scenarios
 */

import { ValidationRule, ValidationRuleType, ValidationContext } from './types';

/**
 * Create a max length validation rule
 * @param maxLength - Maximum allowed length
 * @param message - Optional custom error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createMaxLengthRule(
  maxLength: number,
  message?: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id: options.id || `max-length-${maxLength}`,
    type: ValidationRuleType.MAX_LENGTH,
    value: maxLength,
    message: message || `Content must not exceed ${maxLength} characters`,
    realTime: options.realTime ?? true,
    priority: options.priority ?? 10,
    ...options,
  };
}

/**
 * Create a min length validation rule
 * @param minLength - Minimum required length
 * @param message - Optional custom error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createMinLengthRule(
  minLength: number,
  message?: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id: options.id || `min-length-${minLength}`,
    type: ValidationRuleType.MIN_LENGTH,
    value: minLength,
    message: message || `Content must be at least ${minLength} characters`,
    realTime: options.realTime ?? false,
    priority: options.priority ?? 10,
    ...options,
  };
}

/**
 * Create a required field validation rule
 * @param message - Optional custom error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createRequiredRule(
  message?: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id: options.id || 'required',
    type: ValidationRuleType.REQUIRED,
    value: true,
    message: message || 'This field is required',
    realTime: options.realTime ?? false,
    priority: options.priority ?? 100, // High priority
    ...options,
  };
}

/**
 * Create a pattern validation rule
 * @param pattern - Regular expression pattern
 * @param message - Error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createPatternRule(
  pattern: RegExp | string,
  message: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id: options.id || 'pattern',
    type: ValidationRuleType.PATTERN,
    value: pattern,
    message,
    realTime: options.realTime ?? false,
    priority: options.priority ?? 5,
    ...options,
  };
}

/**
 * Create an allowed formats validation rule
 * @param allowedTags - Array of allowed HTML tag names
 * @param message - Optional custom error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createAllowedFormatsRule(
  allowedTags: string[],
  message?: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id: options.id || 'allowed-formats',
    type: ValidationRuleType.ALLOWED_FORMATS,
    value: allowedTags,
    message: message || `Content contains disallowed formatting. Allowed tags: ${allowedTags.join(', ')}`,
    realTime: options.realTime ?? false,
    priority: options.priority ?? 5,
    ...options,
  };
}

/**
 * Create a custom validation rule
 * @param id - Unique rule identifier
 * @param validator - Custom validation function
 * @param message - Error message
 * @param options - Additional rule options
 * @returns Validation rule
 */
export function createCustomRule(
  id: string,
  validator: (content: string, context?: ValidationContext) => boolean | Promise<boolean>,
  message: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id,
    type: ValidationRuleType.CUSTOM,
    value: null,
    message,
    validator,
    realTime: options.realTime ?? false,
    priority: options.priority ?? 0,
    ...options,
  };
}

/**
 * Pre-built validator: Email format
 */
export const emailValidator = (content: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(content.trim());
};

/**
 * Pre-built validator: URL format
 */
export const urlValidator = (content: string): boolean => {
  try {
    new URL(content.trim());
    return true;
  } catch {
    return false;
  }
};

/**
 * Pre-built validator: No HTML tags
 */
export const noHtmlValidator = (content: string): boolean => {
  const htmlRegex = /<[^>]*>/g;
  return !htmlRegex.test(content);
};

/**
 * Pre-built validator: Word count limit
 * @param maxWords - Maximum number of words allowed
 */
export const createWordCountValidator = (maxWords: number) => {
  return (content: string): boolean => {
    const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
    return words.length <= maxWords;
  };
};

/**
 * Pre-built validator: No profanity (basic implementation)
 * @param profanityList - Array of words to block
 */
export const createProfanityValidator = (profanityList: string[]) => {
  return (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return !profanityList.some((word) => lowerContent.includes(word.toLowerCase()));
  };
};

/**
 * Pre-built validator: Unique value (async)
 * @param checkUnique - Async function to check uniqueness
 */
export const createUniqueValidator = (
  checkUnique: (value: string) => Promise<boolean>
) => {
  return async (content: string): Promise<boolean> => {
    return await checkUnique(content);
  };
};

/**
 * Utility: Count words in content
 * @param content - Content to count words in
 * @returns Number of words
 */
export function countWords(content: string): number {
  return content.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Utility: Count characters in content (excluding HTML tags)
 * @param content - Content to count characters in
 * @param excludeHtml - Whether to exclude HTML tags from count
 * @returns Number of characters
 */
export function countCharacters(content: string, excludeHtml = false): number {
  if (excludeHtml) {
    // Strip HTML tags and count
    const stripped = content.replace(/<[^>]*>/g, '');
    return stripped.length;
  }
  return content.length;
}

/**
 * Utility: Extract plain text from HTML content
 * @param html - HTML content
 * @returns Plain text
 */
export function extractPlainText(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.trim();
}

/**
 * Utility: Format validation result for display
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Array<{ message: string; field?: string }>): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map((error, index) => {
    const prefix = error.field ? `${error.field}: ` : `${index + 1}. `;
    return prefix + error.message;
  }).join('\n');
}
