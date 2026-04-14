"use client";

import * as React from "react";
import type { ResourceManifest } from "@ecodrix/erix-api";
import { cn } from "@/lib/utils";
import { ErixBadge } from "@/components/ui/erix-badge";

/**
 * Props for the ResourceTable component.
 */
export interface ResourceTableProps {
  /** The manifest defining how the resource should be displayed. */
  manifest: ResourceManifest;
  /** The actual data rows to render. */
  data: Array<Record<string, any>>;
  /** Loading state for the table body. */
  loading?: boolean;
  /** Callback when a row is clicked. */
  onRowClick?: (row: Record<string, any>) => void;
  /** CSS class for the container. */
  className?: string;
}

/**
 * A "Smart Component" that automatically renders a data table
 * using configuration from an SDK ResourceManifest.
 */
export function ResourceTable({
  manifest,
  data,
  loading = false,
  onRowClick,
  className,
}: ResourceTableProps) {
  // Determine which fields to show based on summaryFields hint, falling back to all fields
  const visibleFields = manifest.uiHints?.summaryFields
    ? manifest.fields.filter((f) =>
        manifest.uiHints!.summaryFields!.includes(f.key),
      )
    : manifest.fields.slice(0, 5);

  const renderCellValue = (
    row: Record<string, any>,
    fieldKey: string,
    type: string,
  ) => {
    const value = row[fieldKey];
    if (value === undefined || value === null) return "-";

    switch (type) {
      case "select":
        return <ErixBadge variant="default">{String(value)}</ErixBadge>;
      case "date":
      case "datetime":
        return new Date(value).toLocaleDateString();
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value as number);
      default:
        return String(value);
    }
  };

  return (
    <div
      className={cn(
        "erix-relative erix-w-full erix-overflow-auto erix-rounded-xl erix-border erix-border-border erix-bg-background",
        className,
      )}
    >
      <table className="erix-w-full erix-caption-bottom erix-text-sm">
        <thead className="erix-bg-muted/50">
          <tr className="erix-border-b erix-transition-colors">
            {visibleFields.map((field) => (
              <th
                key={field.key}
                className="erix-h-12 erix-px-4 erix-text-left erix-align-middle erix-font-semibold erix-text-muted-foreground"
              >
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="erix-divide-y erix-divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="erix-animate-pulse">
                {visibleFields.map((f) => (
                  <td key={f.key} className="erix-p-4">
                    <div className="erix-h-4 erix-w-full erix-rounded erix-bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={visibleFields.length}
                className="erix-h-32 erix-text-center erix-text-muted-foreground"
              >
                No data available for {manifest.name}.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row._id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "erix-transition-colors hover:erix-bg-muted/30",
                  onRowClick && "erix-cursor-pointer",
                )}
              >
                {visibleFields.map((field) => (
                  <td
                    key={field.key}
                    className="erix-p-4 erix-align-middle erix-text-foreground"
                  >
                    {renderCellValue(row, field.key, field.type)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
