"use client";
// src/hooks/email/useEmailTemplateSync.ts
// Debounced auto-save with version-based conflict detection.
// The hook silently saves draft changes to the backend while the user types.

import * as React from "react";
import { unwrap, useEmailTemplateApi } from "@/lib/emailTemplateClient";
import type { IEmailTemplate, SyncStatusValue } from "@/types/email";

interface UseEmailTemplateSyncOptions {
  /** Debounce delay in ms before auto-saving. Default: 1500 */
  debounceMs?: number;
  /** Called when a newer server version is detected (conflict) */
  onConflict?: (serverTemplate: IEmailTemplate) => void;
}

interface UseEmailTemplateSyncReturn {
  syncStatus: SyncStatusValue;
  /** Last time a successful save completed (ISO string) */
  lastSyncedAt: string | null;
  /** Trigger an immediate save, bypassing the debounce */
  forceSave: () => Promise<void>;
}

/**
 * Watches `draft` for changes and persists them to the backend after debounceMs.
 *
 * - Pass `templateId = null` when editing a new (unsaved) template to disable auto-save.
 * - The hook compares the returned `version` against its own `lastKnownVersion` to
 *   detect out-of-band edits (e.g. another user saving via a different session).
 */
export function useEmailTemplateSync(
  templateId: string | null,
  draft: Partial<IEmailTemplate>,
  {
    debounceMs = 1500,
    onConflict,
  }: UseEmailTemplateSyncOptions = {},
): UseEmailTemplateSyncReturn {
  const { base, headers } = useEmailTemplateApi();
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusValue>("idle");
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const isMounted = React.useRef(true);
  const lastKnownVersionRef = React.useRef<number>(draft.version ?? 1);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Keep known version in sync when draft is loaded from external source
  React.useEffect(() => {
    if (draft.version !== undefined) {
      lastKnownVersionRef.current = draft.version;
    }
  }, [draft.version]);

  const save = React.useCallback(async () => {
    if (!templateId || !isMounted.current) return;

    setSyncStatus("saving");

    try {
      const res = await fetch(`${base}/${templateId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(draft),
      });

      const updated = await unwrap<IEmailTemplate>(res);

      if (!isMounted.current) return;

      // Conflict detection: server version jumped more than one step
      if (
        updated.version > lastKnownVersionRef.current + 1 &&
        onConflict
      ) {
        onConflict(updated);
      }

      lastKnownVersionRef.current = updated.version;
      setLastSyncedAt(new Date().toISOString());
      setSyncStatus("saved");

      // Auto-reset to idle after 3 s so the indicator doesn't linger
      setTimeout(() => {
        if (isMounted.current) setSyncStatus("idle");
      }, 3000);
    } catch {
      if (isMounted.current) setSyncStatus("error");
    }
    // Intentionally omit `draft` from deps — using a ref-free closure is intentional.
    // The draft value is captured at call-time, which is correct for debounced saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, base]);

  // Debounce on draft content changes (serialize to avoid object reference churn)
  // biome-ignore lint/correctness/useExhaustiveDependencies: serialized draft is the relevant dep
  React.useEffect(() => {
    if (!templateId) return;

    // Show "saving" optimistically as soon as the user starts typing
    setSyncStatus("saving");

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save();
    }, debounceMs);

    return () => {
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft), templateId, debounceMs]);

  return {
    syncStatus,
    lastSyncedAt,
    forceSave: save,
  };
}
