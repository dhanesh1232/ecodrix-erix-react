/**
 * Example usage of ValidationEngine
 * Demonstrates common validation scenarios
 */

import { ValidationEngine } from './ValidationEngine';
import {
  createMaxLengthRule,
  createMinLengthRule,
  createRequiredRule,
  createPatternRule,
  createCustomRule,
  emailValidator,
  createWordCountValidator,
} from './validators';
import { ValidationEventType } from './types';

/**
 * Example 1: Basic content validation with length limits
 */
export function basicValidationExample() {
  const engine = new ValidationEngine({
    enableRealTime: true,
    realTimeDebounce: 300,
  });

  // Add validation rules
  engine.addRule(createRequiredRule('Content is required'));
  engine.addRule(createMaxLengthRule(1000, 'Content must not exceed 1000 characters', {
    realTime: true,
    priority: 10,
  }));
  engine.addRule(createMinLengthRule(10, 'Content must be at least 10 characters', {
    priority: 5,
  }));

  return engine;
}

/**
 * Example 2: Email validation
 */
export function emailValidationExample() {
  const engine = new ValidationEngine();

  engine.addRule(createRequiredRule('Email is required'));
  engine.addRule(createCustomRule(
    'email-format',
    emailValidator,
    'Please enter a valid email address'
  ));

  return engine;
}

/**
 * Example 3: Blog post validation with word count
 */
export function blogPostValidationExample() {
  const engine = new ValidationEngine({
    enableRealTime: true,
    realTimeDebounce: 500,
  });

  // Title validation
  engine.addRule(createRequiredRule('Title is required', {
    id: 'title-required',
    field: 'title',
    priority: 100,
  }));

  engine.addRule(createMaxLengthRule(100, 'Title must not exceed 100 characters', {
    id: 'title-max-length',
    field: 'title',
    realTime: true,
  }));

  // Content validation
  engine.addRule(createRequiredRule('Content is required', {
    id: 'content-required',
    field: 'content',
    priority: 100,
  }));

  engine.addRule(createCustomRule(
    'content-word-count',
    createWordCountValidator(5000),
    'Content must not exceed 5000 words',
    { field: 'content', realTime: true }
  ));

  return engine;
}

/**
 * Example 4: Form validation with pattern matching
 */
export function formValidationExample() {
  const engine = new ValidationEngine();

  // Username validation
  engine.addRule(createPatternRule(
    /^[a-zA-Z0-9_]{3,20}$/,
    'Username must be 3-20 characters and contain only letters, numbers, and underscores',
    { id: 'username-pattern', field: 'username' }
  ));

  // Phone number validation
  engine.addRule(createPatternRule(
    /^\+?[1-9]\d{1,14}$/,
    'Please enter a valid phone number',
    { id: 'phone-pattern', field: 'phone' }
  ));

  return engine;
}

/**
 * Example 5: Async validation (checking uniqueness)
 */
export function asyncValidationExample() {
  const engine = new ValidationEngine({
    asyncTimeout: 5000,
  });

  // Simulate API call to check username uniqueness
  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    // In real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return username !== 'admin'; // 'admin' is taken
  };

  engine.addRule(createCustomRule(
    'username-unique',
    async (content) => await checkUsernameUnique(content),
    'This username is already taken',
    { field: 'username' }
  ));

  return engine;
}

/**
 * Example 6: Real-time validation with event listeners
 */
export function realTimeValidationExample() {
  const engine = new ValidationEngine({
    enableRealTime: true,
    realTimeDebounce: 300,
  });

  // Add rules
  engine.addRule(createMaxLengthRule(500, 'Maximum 500 characters', {
    realTime: true,
  }));

  // Listen to validation events
  engine.on((event) => {
    switch (event.type) {
      case ValidationEventType.VALIDATION_COMPLETE:
        if (event.result?.valid) {
          console.log('✓ Validation passed');
        } else {
          console.log('✗ Validation failed:', event.result?.errors);
        }
        break;
      case ValidationEventType.VALIDATION_ERROR:
        console.error('Validation error:', event.result?.errors);
        break;
    }
  });

  return engine;
}

/**
 * Example 7: Custom error formatting
 */
export function customErrorFormattingExample() {
  const engine = new ValidationEngine({
    errorFormatter: (error) => {
      // Custom error format with emoji
      const emoji = error.ruleType === 'MAX_LENGTH' ? '📏' : '❌';
      return `${emoji} ${error.message}`;
    },
  });

  engine.addRule(createMaxLengthRule(100, 'Too long'));
  engine.addRule(createRequiredRule('Required'));

  return engine;
}

/**
 * Example 8: Priority-based validation
 */
export function priorityValidationExample() {
  const engine = new ValidationEngine({
    stopOnFirstError: true, // Stop on first error for faster validation
  });

  // High priority: Security checks
  engine.addRule(createPatternRule(
    /^[^<>]*$/, // No HTML tags
    'Content contains invalid characters',
    { priority: 100 }
  ));

  // Medium priority: Required fields
  engine.addRule(createRequiredRule('Content is required', {
    priority: 50,
  }));

  // Low priority: Length checks
  engine.addRule(createMaxLengthRule(1000, 'Too long', {
    priority: 10,
  }));

  return engine;
}

/**
 * Example 9: Complete validation workflow
 */
export async function completeValidationWorkflow() {
  const engine = basicValidationExample();

  // Test content
  const testCases = [
    { content: '', expected: false, reason: 'Empty content' },
    { content: 'Short', expected: false, reason: 'Too short' },
    { content: 'This is valid content with enough characters', expected: true, reason: 'Valid' },
    { content: 'x'.repeat(1001), expected: false, reason: 'Too long' },
  ];

  console.log('Running validation tests...\n');

  for (const testCase of testCases) {
    const result = await engine.validate(testCase.content);
    const status = result.valid === testCase.expected ? '✓' : '✗';
    
    console.log(`${status} ${testCase.reason}`);
    console.log(`  Content length: ${testCase.content.length}`);
    console.log(`  Valid: ${result.valid}`);
    
    if (!result.valid) {
      console.log(`  Errors:`, result.errors.map(e => e.message));
    }
    
    console.log('');
  }

  // Clean up
  engine.dispose();
}

/**
 * Example 10: React integration pattern
 */
export function reactIntegrationPattern() {
  // This would be used in a React component like:
  /*
  import { useState, useEffect } from 'react';
  import { ValidationEngine, createMaxLengthRule } from '@ecodrix/erix-react';

  function MyEditor() {
    const [content, setContent] = useState('');
    const [errors, setErrors] = useState([]);
    const [engine] = useState(() => {
      const engine = new ValidationEngine({
        enableRealTime: true,
        realTimeDebounce: 300,
      });
      
      engine.addRule(createMaxLengthRule(1000, 'Content too long', {
        realTime: true,
      }));
      
      return engine;
    });

    useEffect(() => {
      return () => engine.dispose();
    }, [engine]);

    const handleChange = async (newContent: string) => {
      setContent(newContent);
      
      const result = await engine.validateRealTime(newContent);
      setErrors(result.errors);
    };

    return (
      <div>
        <textarea value={content} onChange={(e) => handleChange(e.target.value)} />
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((error, i) => (
              <div key={i} className="error">{error.message}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
  */
}
