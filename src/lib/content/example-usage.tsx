/**
 * Simple usage example for ContentCounter
 * 
 * This file demonstrates basic usage of the character and word counting features.
 * For more comprehensive examples, see ContentCounterIntegration.example.tsx
 */

import React, { useState } from 'react';
import { useContentCounter } from '../../hooks/useContentCounter';
import { ContentCountDisplay } from '../../components/richtext/ui/ContentCountDisplay';

/**
 * Example 1: Basic editor with character count
 */
export function BasicEditorExample() {
  const [content, setContent] = useState('');

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Basic Editor with Character Count</h2>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Start typing..."
      />
      
      <ContentCountDisplay
        content={content}
        maxCharacters={1000}
        showCharacters
        showWords
        showReadingTime
      />
    </div>
  );
}

/**
 * Example 2: Using the hook directly
 */
export function HookExample() {
  const [content, setContent] = useState('');
  
  const {
    characters,
    words,
    readingTimeFormatted,
    remainingCharacters,
    isAtCharacterLimit,
  } = useContentCounter({
    content,
    maxCharacters: 500,
  });

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Using Hook Directly</h2>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Type up to 500 characters..."
        disabled={isAtCharacterLimit}
      />
      
      <div className="text-sm space-y-1">
        <div>Characters: {characters} / 500</div>
        <div>Remaining: {remainingCharacters}</div>
        <div>Words: {words}</div>
        <div>Reading time: {readingTimeFormatted}</div>
        {isAtCharacterLimit && (
          <div className="text-red-600 font-medium">
            Character limit reached!
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 3: Focus mode footer
 */
export function FocusModeExample() {
  const [content, setContent] = useState('');
  
  const { words, readingTimeFormatted } = useContentCounter({
    content,
    debounceMs: 500,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 border-none outline-none resize-none text-lg"
          placeholder="Start writing in focus mode..."
        />
      </div>
      
      {/* Minimal footer - Requirement 12.8 */}
      <footer className="border-t p-4 text-center bg-gray-50">
        <div className="text-sm text-gray-600">
          {words.toLocaleString()} words · {readingTimeFormatted}
        </div>
      </footer>
    </div>
  );
}

/**
 * Example 4: Unicode content demonstration
 */
export function UnicodeExample() {
  const [content, setContent] = useState('Hello 👋 World 你好世界');
  
  const { characters, words } = useContentCounter({ content });

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Unicode-Aware Counting</h2>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Try emojis and different languages..."
      />
      
      <div className="text-sm space-y-2">
        <div>
          <strong>Characters:</strong> {characters}
          <span className="text-gray-500 ml-2">
            (Emojis count as 1 character)
          </span>
        </div>
        <div>
          <strong>Words:</strong> {words}
          <span className="text-gray-500 ml-2">
            (CJK characters count as individual words)
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Examples:
          <ul className="list-disc list-inside mt-1">
            <li>'Hello 👋' = 7 characters, 2 words</li>
            <li>'你好世界' = 4 characters, 4 words</li>
            <li>'café' = 4 characters (combining accent)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Demo component showing all examples
 */
export function ContentCounterDemo() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-center">
        Content Counter Examples
      </h1>
      
      <div className="space-y-8">
        <BasicEditorExample />
        <hr />
        <HookExample />
        <hr />
        <FocusModeExample />
        <hr />
        <UnicodeExample />
      </div>
    </div>
  );
}

export default ContentCounterDemo;
