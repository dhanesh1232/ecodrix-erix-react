"use client";
// src/ai/LeadScoreBadge.tsx
import * as React from "react";
import { useLeadScore } from "./useErixAi";

const SCORE_COLOR = (s: number) =>
  s >= 80 ? "#22c55e" : s >= 50 ? "#eab308" : s >= 25 ? "#f97316" : "#ef4444";

export interface LeadScoreBadgeProps {
  leadId: string;
  className?: string;
  /** Show recalculate button */
  interactive?: boolean;
}

/**
 * Displays the AI-calculated lead score as a colored badge.
 *
 * @example
 * ```tsx
 * <LeadScoreBadge leadId={lead._id} interactive />
 * ```
 */
export function LeadScoreBadge({
  leadId,
  className,
  interactive,
}: LeadScoreBadgeProps) {
  const { score, loading, recalculate } = useLeadScore(leadId);

  if (loading) {
    return (
      <span
        className={className}
        style={{
          display: "erix-inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "#94a3b8",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1e293b",
            animation: "pulse 1.5s infinite",
          }}
        />
        Scoring…
      </span>
    );
  }

  if (score === null) return null;

  return (
    <span
      className={className}
      style={{
        display: "erix-inline-flex",
        alignItems: "center",
        gap: 4,
        background: `${SCORE_COLOR(score)}20`,
        color: SCORE_COLOR(score),
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${SCORE_COLOR(score)}40`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: SCORE_COLOR(score),
        }}
      />
      {score}/100
      {interactive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void recalculate();
          }}
          title="Recalculate score"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: 10,
            color: "inherit",
            marginLeft: 2,
            opacity: 0.7,
          }}
        >
          ↻
        </button>
      )}
    </span>
  );
}
