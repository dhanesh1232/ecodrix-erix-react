// src/lib/optimistic.ts
// Provides a lightweight optimistic update helper that pairs a local state transition
// with an async mutation and rolls back on failure.

/**
 * Wraps a mutation to provide optimistic updates with automatic rollback.
 *
 * @param setState   The React state setter for the collection.
 * @param optimistic A function that returns the optimistically updated state.
 * @param mutate     The async mutation to perform.
 * @param onError    Optional callback for the rolled-back error.
 *
 * @example
 * ```tsx
 * const send = (text: string) => optimistic(
 *   setMessages,
 *   (prev) => [...prev, { _id: "temp", text, status: "sending" }],
 *   () => sdk.whatsapp.messages.send({ to, text }),
 *   (err) => toast.error(`Failed: ${err.message}`),
 * );
 * ```
 */
export async function optimistic<T>(
  setState:   React.Dispatch<React.SetStateAction<T>>,
  applyLocal: (prev: T) => T,
  mutate:     () => Promise<T>,
  onError?:   (error: Error, rollback: T) => void,
): Promise<T | undefined> {
  let previous!: T;

  // Apply optimistic state
  setState((prev) => {
    previous = prev;
    return applyLocal(prev);
  });

  try {
    const result = await mutate();
    return result;
  } catch (err) {
    // Rollback on failure
    setState(previous);
    onError?.(err as Error, previous);
    return undefined;
  }
}

import type React from "react";
