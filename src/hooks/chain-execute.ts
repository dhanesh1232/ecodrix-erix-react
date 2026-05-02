// src/hooks/chain-execute.ts
// Convenience hook: access the ErixChain directly from any component
// inside an <ErixEditorProvider> tree.
"use client";
import * as React from "react";
import { useErixEditor } from "@/context/editor";
import { ErixChain } from "@/core/chain";

/**
 * Returns a stable `ErixChain` instance tied to the current editor engine,
 * plus an `execute(action, ...args)` helper for calling chain methods by name.
 *
 * @example
 * const { execute } = useEditorChain();
 * execute("bold");
 * execute("heading", 2);
 */
export function useEditorChain() {
  const { engine } = useErixEditor();

  // Re-create chain whenever the engine reference changes
  const chain = React.useMemo(
    () => (engine ? new ErixChain(engine) : null),
    [engine],
  );

  const execute = React.useCallback(
    (action: string, ...args: unknown[]) => {
      if (!chain) return;
      const cta = chain as unknown as Record<string, unknown>;
      const fn = cta[action];
      if (typeof fn === "function") {
        const result = (fn as (...a: unknown[]) => unknown).apply(chain, args);
        // If method returns a chain (fluent), auto-run it
        if (
          result &&
          typeof (result as { run?: () => void }).run === "function"
        ) {
          (result as { run: () => void }).run();
        }
      } else {
        console.warn(`[ErixChain] No method found for action: "${action}"`);
      }
    },
    [chain],
  );

  return { chain, execute };
}
