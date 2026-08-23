/**
 * Content processing utilities
 * 
 * This module provides utilities for processing and transforming content
 * from various sources including Microsoft Word, Google Docs, code snippets,
 * and URLs with link previews. Also includes Unicode-aware content counting
 * utilities for character count, word count, and reading time estimation.
 */

export { PasteHandler } from './PasteHandler';
export type {
  PasteHandlerConfig,
  LinkPreview,
  CodeBlock,
  ParsedContent,
} from './PasteHandler';

export { 
  ContentCounter,
  defaultCounter,
  countCharacters,
  countWords,
  estimateReadingTime,
  formatReadingTime,
  count,
} from './ContentCounter';
export type {
  ContentCounterConfig,
  ContentCountResult,
} from './ContentCounter';
