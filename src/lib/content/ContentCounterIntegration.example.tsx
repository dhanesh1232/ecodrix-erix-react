/**
 * Integration examples for ContentCounter with ValidationEngine
 *
 * This file demonstrates how to integrate character/word counting
 * with the ValidationEngine for enforcing content limits.
 */

import React, { useState, useEffect } from "react";
import {
  ValidationEngine,
  ValidationRuleType,
} from "../validation/ValidationEngine";
import { useContentCounter } from "../../hooks/useContentCounter";
import {
  ContentCountDisplay,
  ContentCountProgress,
} from "../../components/richtext/ui/ContentCountDisplay";
import { countWords } from "./ContentCounter";

/**
 * Example 1: Basic character limit with validation
 */
export function BasicCharacterLimitExample() {
  const [content, setContent] = useState("");
  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine();

    // Add character limit validation rule
    engine.addRule({
      id: "max-chars",
      type: ValidationRuleType.MAX_LENGTH,
      value: 1000,
      message: "Content must not exceed 1000 characters",
      realTime: true,
    });

    return engine;
  });

  const counter = useContentCounter({
    content,
    maxCharacters: 1000,
  });

  // Validate on content change
  useEffect(() => {
    validationEngine.validateRealTime(content);
  }, [content, validationEngine]);

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type your content..."
      />

      <ContentCountDisplay
        content={content}
        maxCharacters={1000}
        showCharacters
        showWords
        showReadingTime
      />

      {counter.isAtCharacterLimit && (
        <div className="text-red-600 text-sm">Character limit reached!</div>
      )}
    </div>
  );
}

/**
 * Example 2: Word limit with validation
 */
export function WordLimitExample() {
  const [content, setContent] = useState("");
  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine();

    // Add custom word limit validation rule
    engine.addRule({
      id: "max-words",
      type: ValidationRuleType.CUSTOM,
      message: "Content must not exceed 500 words",
      realTime: true,
      validator: (text) => {
        // Use imported countWords for accurate word counting
        return countWords(text) <= 500;
      },
    });

    return engine;
  });

  const counter = useContentCounter({
    content,
    maxWords: 500,
  });

  useEffect(() => {
    validationEngine.validateRealTime(content);
  }, [content, validationEngine]);

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type your content..."
      />

      <ContentCountDisplay
        content={content}
        maxWords={500}
        showWords
        showRemaining
      />
    </div>
  );
}

/**
 * Example 3: Combined character and word limits with progress bar
 */
export function CombinedLimitsExample() {
  const [content, setContent] = useState("");
  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine();

    // Character limit
    engine.addRule({
      id: "max-chars",
      type: ValidationRuleType.MAX_LENGTH,
      value: 2000,
      message: "Content must not exceed 2000 characters",
      realTime: true,
      priority: 1,
    });

    // Word limit
    engine.addRule({
      id: "max-words",
      type: ValidationRuleType.CUSTOM,
      message: "Content must not exceed 300 words",
      realTime: true,
      priority: 2,
      validator: (text) => {
        const { countWords } = require("./ContentCounter");
        return countWords(text) <= 300;
      },
    });

    return engine;
  });

  const counter = useContentCounter({
    content,
    maxCharacters: 2000,
    maxWords: 300,
  });

  useEffect(() => {
    validationEngine.validateRealTime(content);
  }, [content, validationEngine]);

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type your content..."
        disabled={counter.isAtLimit}
      />

      <ContentCountProgress
        content={content}
        maxCharacters={2000}
        maxWords={300}
        showCharacters
        showWords
        showReadingTime
        showProgressBar
      />

      {counter.isAtLimit && (
        <div className="text-red-600 text-sm font-medium">
          {counter.isAtCharacterLimit && "Character limit reached! "}
          {counter.isAtWordLimit && "Word limit reached!"}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Focus mode footer with minimal stats
 */
export function FocusModeFooterExample() {
  const [content, setContent] = useState("");

  const counter = useContentCounter({
    content,
    debounceMs: 500, // Slower debounce for focus mode
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor area */}
      <div className="flex-1 p-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 border-none outline-none resize-none"
          placeholder="Start writing..."
        />
      </div>

      {/* Minimal footer (Requirement 12.8) */}
      <footer className="border-t p-4 text-center">
        <div className="text-sm text-muted-foreground">
          {counter.words.toLocaleString()} words ·{" "}
          {counter.readingTimeFormatted}
        </div>
      </footer>
    </div>
  );
}

/**
 * Example 5: Real-time validation with error display
 */
export function ValidationWithErrorsExample() {
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const [validationEngine] = useState(() => {
    const engine = new ValidationEngine({
      enableRealTime: true,
      realTimeDebounce: 300,
    });

    // Minimum character requirement
    engine.addRule({
      id: "min-chars",
      type: ValidationRuleType.MIN_LENGTH,
      value: 50,
      message: "Content must be at least 50 characters",
      realTime: true,
    });

    // Maximum character limit
    engine.addRule({
      id: "max-chars",
      type: ValidationRuleType.MAX_LENGTH,
      value: 500,
      message: "Content must not exceed 500 characters",
      realTime: true,
    });

    return engine;
  });

  const counter = useContentCounter({
    content,
    maxCharacters: 500,
  });

  useEffect(() => {
    validationEngine.validateRealTime(content).then((result) => {
      setErrors(result.errors.map((e) => e.message));
    });
  }, [content, validationEngine]);

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type at least 50 characters..."
      />

      <ContentCountDisplay
        content={content}
        maxCharacters={500}
        showCharacters
        showWords
      />

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Custom rendering with icons
 */
export function CustomRenderingExample() {
  const [content, setContent] = useState("");

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type your content..."
      />

      <ContentCountDisplay
        content={content}
        maxCharacters={1000}
        renderCharacters={(count, remaining, max) => (
          <span className="flex items-center gap-1">
            <span>📝</span>
            <span>
              {count} / {max}
            </span>
          </span>
        )}
        renderWords={(count) => (
          <span className="flex items-center gap-1">
            <span>💬</span>
            <span>{count} words</span>
          </span>
        )}
        renderReadingTime={(formatted) => (
          <span className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{formatted}</span>
          </span>
        )}
        showReadingTime
      />
    </div>
  );
}

/**
 * Example 7: Preventing input when limit reached
 */
export function PreventInputExample() {
  const [content, setContent] = useState("");

  const counter = useContentCounter({
    content,
    maxCharacters: 280, // Twitter-style limit
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    // Only update if under limit
    if (newContent.length <= 280) {
      setContent(newContent);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={handleChange}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type up to 280 characters..."
      />

      <ContentCountDisplay
        content={content}
        maxCharacters={280}
        showCharacters
        showRemaining
      />
    </div>
  );
}
