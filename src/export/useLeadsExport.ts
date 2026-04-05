"use client";
// src/export/useLeadsExport.ts — CSV export hook for CRM leads
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import { useErixToast } from "@/toast/useErixToast";
import type { LeadListFilters } from "@/types/platform";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const header = headers.map(escapeCsv).join(",");
  const body   = rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(","));
  return [header, ...body].join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const LEAD_CSV_HEADERS = [
  "_id", "firstName", "lastName", "phone", "email",
  "status", "source", "score", "pipelineId", "stageId",
  "assignedTo", "createdAt",
];

export interface UseLeadsExportReturn {
  exporting:  boolean;
  exportCSV:  (filters?: LeadListFilters) => Promise<void>;
  exportJSON: (filters?: LeadListFilters) => Promise<void>;
}

/**
 * Export CRM leads to CSV or JSON.
 * Auto-pages through all results using the SDK's listAutoPaging iterator.
 *
 * @example
 * ```tsx
 * const { exportCSV, exporting } = useLeadsExport();
 *
 * <button onClick={() => exportCSV({ pipelineId: "abc" })} disabled={exporting}>
 *   {exporting ? "Exporting…" : "Export CSV"}
 * </button>
 * ```
 */
export function useLeadsExport(): UseLeadsExportReturn {
  const sdk   = useErixClient();
  const toast = useErixToast();
  const [exporting, setExporting] = React.useState(false);

  const collect = React.useCallback(async (filters?: LeadListFilters): Promise<any[]> => {
    const all: any[] = [];
    for await (const lead of sdk.crm.leads.listAutoPaging(filters as any)) {
      all.push(lead);
    }
    return all;
  }, [sdk]);

  const exportCSV = React.useCallback(async (filters?: LeadListFilters) => {
    setExporting(true);
    try {
      await toast.promise(
        (async () => {
          const leads = await collect(filters);
          const csv   = toCSV(leads, LEAD_CSV_HEADERS);
          downloadFile(csv, `erix-leads-${Date.now()}.csv`, "text/csv");
        })(),
        { loading: "Exporting leads…", success: "Leads exported!", error: (e) => e.message },
      );
    } finally { setExporting(false); }
  }, [collect, toast]);

  const exportJSON = React.useCallback(async (filters?: LeadListFilters) => {
    setExporting(true);
    try {
      await toast.promise(
        (async () => {
          const leads = await collect(filters);
          downloadFile(JSON.stringify(leads, null, 2), `erix-leads-${Date.now()}.json`, "application/json");
        })(),
        { loading: "Exporting leads…", success: "Leads exported!", error: (e) => e.message },
      );
    } finally { setExporting(false); }
  }, [collect, toast]);

  return { exporting, exportCSV, exportJSON };
}
