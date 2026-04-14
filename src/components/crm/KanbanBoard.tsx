"use client";
// src/components/crm/KanbanBoard.tsx
import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, ChevronRight } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { ErixBadge } from "@/components/ui/erix-badge";
import { usePipelineBoard } from "@/hooks/crm/usePipeline";
import { useLeads } from "@/hooks/crm/useLeads";
import type { Lead, PipelineStage } from "@/types/platform";
import { cn } from "@/lib/utils";

// ─── Sortable Lead Card ────────────────────────────────────────────────────────
function SortableLeadCard({
  lead,
  onOpen,
  onConvert,
  onArchive,
}: {
  lead: Lead;
  onOpen: (id: string) => void;
  onConvert: (id: string, outcome: "won" | "lost") => void;
  onArchive: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard
        lead={lead}
        onOpen={onOpen}
        onConvert={onConvert}
        onArchive={onArchive}
        isDragging={false}
      />
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({
  stage,
  leads,
  total,
  onOpen,
  onConvert,
  onArchive,
  onAddLead,
}: {
  stage: PipelineStage;
  leads: Lead[];
  total: number;
  onOpen: (id: string) => void;
  onConvert: (id: string, outcome: "won" | "lost") => void;
  onArchive: (id: string) => void;
  onAddLead?: (stageId: string) => void;
}) {
  return (
    <div className="erix-flex erix-w-[280px] erix-shrink-0 erix-flex-col erix-rounded-2xl erix-border erix-border-border erix-bg-muted/30 erix-p-3">
      {/* Column header */}
      <div className="mb-3 erix-flex erix-items-center erix-justify-between">
        <div className="erix-flex erix-items-center erix-gap-2">
          {stage.color && (
            <span
              className="erix-size-3 erix-rounded-full erix-shrink-0"
              style={{ background: stage.color }}
            />
          )}
          <span className="erix-text-sm font-semibold erix-text-foreground">
            {stage.name}
          </span>
        </div>
        <div className="erix-flex erix-items-center erix-gap-1.5">
          <ErixBadge variant="ghost" size="sm">
            {total}
          </ErixBadge>
          {onAddLead && (
            <button
              type="button"
              onClick={() => onAddLead(stage._id)}
              className="erix-rounded-md erix-p-1 erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground transition-colors"
            >
              <Plus className="erix-size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lead cards */}
      <SortableContext
        items={leads.map((l) => l._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="erix-flex erix-flex-col erix-gap-2 erix-overflow-y-auto">
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead._id}
              lead={lead}
              onOpen={onOpen}
              onConvert={onConvert}
              onArchive={onArchive}
            />
          ))}
          {leads.length === 0 && (
            <div className="erix-flex erix-flex-col erix-items-center erix-gap-1 erix-rounded-xl erix-border erix-border-dashed erix-border-border py-8 erix-text-center">
              <p className="erix-text-xs erix-text-muted-foreground">
                No leads
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Board ────────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  pipelineId: string;
  onLeadOpen?: (leadId: string) => void;
  onAddLead?: (stageId: string) => void;
}

export function KanbanBoard({
  pipelineId,
  onLeadOpen,
  onAddLead,
}: KanbanBoardProps) {
  const { board, stageManifest, loading } = usePipelineBoard(pipelineId);
  const { move, convert, archive } = useLeads({ pipelineId });
  const [draggingLead, setDraggingLead] = React.useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (loading && !board) {
    return (
      <div className="erix-flex erix-h-64 erix-items-center erix-justify-center">
        <ErixSpinner size="lg" />
      </div>
    );
  }

  if (!board) return null;

  // Enhance columns with metadata from manifest if applicable
  const enhancedColumns = board.columns.map((column) => {
    const manifestField: any = stageManifest?.fields.find(
      (f: any) => f.key === column.stage._id,
    );
    return {
      ...column,
      stage: {
        ...column.stage,
        name: manifestField?.label || column.stage.name,
        color: manifestField?.uiHints?.color || column.stage.color,
      },
    };
  });

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = board.columns
      .flatMap((c) => c.leads)
      .find((l) => l._id === active.id);
    if (lead) setDraggingLead(lead);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingLead(null);
    if (!over) return;

    const leadId = String(active.id);
    const overId = String(over.id);

    // If dropped over a column (stage ID) or another card (belonging to a stage)
    const column = enhancedColumns.find(
      (c) => c.stage._id === overId || c.leads.some((l) => l._id === overId),
    );

    if (column) {
      void move(leadId, column.stage._id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="erix-flex erix-h-full erix-gap-4 erix-overflow-x-auto erix-pb-4">
        {enhancedColumns.map((col) => (
          <KanbanColumn
            key={col.stage._id}
            stage={col.stage}
            leads={col.leads}
            total={col.total}
            onOpen={onLeadOpen || (() => {})}
            onConvert={convert}
            onArchive={archive}
            onAddLead={onAddLead}
          />
        ))}
      </div>

      <DragOverlay>
        {draggingLead ? (
          <div className="erix-w-[280px] erix-rotate-3 erix-scale-105 erix-cursor-grabbing">
            <LeadCard
              lead={draggingLead}
              onOpen={() => {}}
              onConvert={() => {}}
              onArchive={() => {}}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
