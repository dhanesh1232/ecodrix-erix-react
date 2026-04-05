// src/routing/adapters/types.ts
// RouterAdapter interface — lets consumers plug in any navigation system.

export interface RouterAdapter {
  /**
   * Push a new URL (adds to history stack).
   * @param url — Absolute URL string.
   */
  push:    (url: string) => void;
  /**
   * Replace the current URL (no new history entry).
   * @param url — Absolute URL string.
   */
  replace: (url: string) => void;
  /** Navigate back one step in history. */
  back:    () => void;
  /** Get the current pathname. */
  pathname: () => string;
  /**
   * Subscribe to pathname changes.
   * @returns A cleanup function.
   */
  listen:  (callback: (pathname: string) => void) => () => void;
}
