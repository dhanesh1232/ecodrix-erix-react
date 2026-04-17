"use client";
// src/hooks/email/useEmailVariables.ts
// Extracts {{varName}} tokens from template content and lazily loads
// CRM collection fields for the variable mapping palette.

import * as React from "react";
import { unwrap, useEmailTemplateApi } from "@/lib/emailTemplateClient";
import type { CuratedMappingConfig } from "@/types/email";

// ─── Token extraction ─────────────────────────────────────────────────────────

const TOKEN_RE = /\{\{([^}]+)\}\}/g;

/**
 * Extracts unique {{varName}} tokens from combined template content.
 * Returns plain variable names (no braces).
 */
function extractTokens(...chunks: string[]): string[] {
  const joined = chunks.join(" ");
  const hits: string[] = [];
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
  while ((match = TOKEN_RE.exec(joined)) !== null) {
    hits.push(match[1].trim());
  }
  // Reset lastIndex for reuse
  TOKEN_RE.lastIndex = 0;
  return [...new Set(hits)];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseEmailVariablesReturn {
  /** Unique token names found in the template content */
  detectedVars: string[];
  /** List of available CRM collection names */
  collections: Array<{ name: string; label: string }>;
  /** Fields keyed by collection name (loaded lazily) */
  fieldsByCollection: Record<string, Array<{ name: string; label: string }>>;
  /** True while collection list or any fields are loading */
  loading: boolean;
  /** Manually trigger loading fields for a specific collection */
  loadFields: (collectionName: string) => Promise<void>;
  /** Curated suggestions from the backend (collection → fields metadata) */
  mappingConfig: CuratedMappingConfig | null;
}

/**
 * Reactive hook that keeps `detectedVars` in sync with template content changes
 * and exposes CRM field introspection for the variable palette.
 */
export function useEmailVariables(
  htmlBody: string,
  subject: string,
  preheader: string,
): UseEmailVariablesReturn {
  const { base, headers } = useEmailTemplateApi();

  const [collections, setCollections] = React.useState<
    Array<{ name: string; label: string }>
  >([]);
  const [fieldsByCollection, setFieldsByCollection] = React.useState<
    Record<string, Array<{ name: string; label: string }>>
  >({});
  const [mappingConfig, setMappingConfig] =
    React.useState<CuratedMappingConfig | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Derive detected vars from content — no async work, pure computation
  const detectedVars = React.useMemo(
    () => extractTokens(htmlBody, subject, preheader),
    [htmlBody, subject, preheader],
  );

  // ─── Load collections list + curated config once on mount ─────────────────

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`${base}/collections`, { headers }).then((r) =>
        unwrap<Array<{ name: string; label: string }>>(r),
      ),
      fetch(`${base}/mapping/config`, { headers }).then((r) =>
        unwrap<CuratedMappingConfig>(r),
      ),
    ])
      .then(([cols, config]) => {
        if (cancelled) return;
        setCollections(cols);
        setMappingConfig(config);
      })
      .catch(() => {
        // Non-fatal — palette still works with manual field entry
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  // ─── Lazy field loader ─────────────────────────────────────────────────────

  const loadFields = React.useCallback(
    async (collectionName: string): Promise<void> => {
      // Skip if already loaded
      if (fieldsByCollection[collectionName]) return;

      try {
        const res = await fetch(
          `${base}/collections/${encodeURIComponent(collectionName)}/fields`,
          { headers },
        );
        const fields = await unwrap<Array<{ name: string; label: string }>>(res);
        setFieldsByCollection((prev) => ({
          ...prev,
          [collectionName]: fields,
        }));
      } catch {
        // Set empty array so the UI can show a "no fields" message
        setFieldsByCollection((prev) => ({
          ...prev,
          [collectionName]: [],
        }));
      }
    },
    [base, headers, fieldsByCollection],
  );

  return {
    detectedVars,
    collections,
    fieldsByCollection,
    loading,
    loadFields,
    mappingConfig,
  };
}
