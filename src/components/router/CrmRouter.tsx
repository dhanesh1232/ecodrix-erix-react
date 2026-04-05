"use client";
/**
 * components/router/CrmRouter.tsx
 *
 * Sub-router for the CRM module.
 *
 * Sub-path mapping:
 *   ""           → LeadList    (searchable, filterable leads table)
 *   "pipeline"   → PipelineView (kanban board — loads first pipeline)
 *   ":id"        → LeadDetail  (single lead — any other non-empty segment)
 */

import * as React from "react";
import { matchSubPath } from "@/routing/match";
import { useErixRoute } from "@/routing/RouterContext";
import { usePipelines } from "@/hooks/crm/usePipeline";
import { KanbanBoard } from "../crm/KanbanBoard";

// ── Leaf views ───────────────────────────────────────────────────────────────
const LeadList: React.FC = () => (
  <div className="erix-p-6">
    <h2 className="erix-text-xl erix-font-bold erix-mb-4">Leads</h2>
    <p className="erix-text-muted-foreground erix-text-sm">
      Lead list view — coming soon
    </p>
  </div>
);

const LeadDetail: React.FC<{ id: string }> = ({ id }) => (
  <div className="erix-p-6">
    <h2 className="erix-text-xl erix-font-bold erix-mb-2">Lead #{id}</h2>
    <p className="erix-text-muted-foreground erix-text-sm">
      Lead detail view — coming soon
    </p>
  </div>
);

/** Pipeline view — loads available pipelines and shows the first one. */
const PipelineView: React.FC = () => {
  const { pipelines, loading } = usePipelines();
  const firstId = pipelines?.[0]?._id;

  if (loading) {
    return (
      <div className="erix-flex erix-items-center erix-justify-center erix-h-64 erix-text-muted-foreground erix-text-sm">
        Loading pipeline…
      </div>
    );
  }

  if (!firstId) {
    return (
      <div className="erix-flex erix-items-center erix-justify-center erix-h-64 erix-text-muted-foreground erix-text-sm">
        No pipelines configured.
      </div>
    );
  }

  return <KanbanBoard pipelineId={firstId} />;
};

const CRM_ROUTES: Array<{
  pattern: string;
  Component: React.FC;
}> = [
  { pattern: "",         Component: LeadList },
  { pattern: "pipeline", Component: PipelineView },
];

export const CrmRouter: React.FC = () => {
  const { subPath } = useErixRoute();

  // Try static routes first (exact match)
  for (const route of CRM_ROUTES) {
    if (subPath === route.pattern) {
      return <route.Component />;
    }
  }

  // Try param route — any single segment is a lead ID
  const params = matchSubPath(subPath, ":id");
  if (params) {
    return <LeadDetail id={params.id} />;
  }

  // Default fallback
  return <LeadList />;
};
