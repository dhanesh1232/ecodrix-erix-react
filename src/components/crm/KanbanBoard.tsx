"use client";
// src/components/crm/KanbanBoard.tsx
import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  LayoutGrid,
  Settings2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { LeadCard } from "./LeadCard";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { usePipelineBoard } from "@/hooks/crm/usePipeline";
import { useLeads } from "@/hooks/crm/useLeads";
import type { Lead, PipelineStage } from "@/types/platform";
import { cn } from "@/lib/utils";

// ── Helper ────────────────────────────────────────────────────────────────────
function formatValue(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toLocaleString()}`;
}

// ─── Sortable Lead Card ───────────────────────────────────────────────────────
function SortableLeadCard({
  lead,
  visibleFields,
  onOpen,
  onConvert,
  onArchive,
}: {
  lead: Lead;
  visibleFields: Set<string>;
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

  // Suppress click-after-drag: pointer events fire a synthetic click on release
  const didDragRef = React.useRef(false);
  React.useEffect(() => {
    if (isDragging) didDragRef.current = true;
  }, [isDragging]);

  const handleOpen = React.useCallback(
    (id: string) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      onOpen(id);
    },
    [onOpen],
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={() => {
        didDragRef.current = false;
      }}
    >
      <LeadCard
        lead={lead}
        visibleFields={visibleFields}
        onOpen={handleOpen}
        onConvert={onConvert}
        onArchive={onArchive}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function KanbanColumn({
  stage,
  leads,
  total,
  visibleFields,
  onOpen,
  onConvert,
  onArchive,
  onAddLead,
}: {
  stage: PipelineStage;
  leads: Lead[];
  total: number;
  visibleFields: Set<string>;
  onOpen: (id: string) => void;
  onConvert: (id: string, outcome: "won" | "lost") => void;
  onArchive: (id: string) => void;
  onAddLead?: (stageId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage._id });

  const columnValue = React.useMemo(
    () => leads.reduce((acc, l) => acc + (l.value || 0), 0),
    [leads],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "erix-group/column erix-flex erix-w-[300px] erix-shrink-0 erix-flex-col erix-gap-4 erix-min-h-0",
        isOver && "erix-bg-primary/5 erix-rounded-[24px]",
      )}
    >
      {/* Column Header */}
      <div className="erix-flex erix-flex-col erix-gap-3.5 erix-px-2 erix-shrink-0">
        <div className="erix-flex erix-items-center erix-justify-between">
          <div className="erix-flex erix-items-center erix-gap-3">
            <div
              className="erix-flex erix-size-8 erix-items-center erix-justify-center erix-rounded-xl erix-shadow-sm transition-transform group-hover/column:erix-scale-110"
              style={{
                backgroundColor: `${stage.color || "#94a3b8"}15`,
                border: `1px solid ${stage.color || "#94a3b8"}30`,
              }}
            >
              <div
                className="erix-size-2 erix-rounded-full"
                style={{
                  backgroundColor: stage.color || "#94a3b8",
                  boxShadow: stage.color
                    ? `0 0 10px ${stage.color}`
                    : undefined,
                }}
              />
            </div>
            <div className="erix-flex erix-flex-col">
              <h3 className="erix-text-sm erix-font-black erix-tracking-tight erix-text-foreground/90">
                {stage.name}
              </h3>
              <span className="erix-text-[10px] erix-font-black erix-text-muted-foreground/60 erix-uppercase erix-tracking-widest">
                {total} {total === 1 ? "Lead" : "Leads"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onAddLead?.(stage._id)}
            className="erix-size-8 erix-rounded-lg erix-text-muted-foreground hover:erix-bg-primary/10 hover:erix-text-primary erix-transition-all"
          >
            <Plus className="erix-size-4 erix-stroke-[3]" />
          </Button>
        </div>

        {/* Meta Strip */}
        <div className="erix-flex erix-flex-1 erix-items-center erix-justify-between erix-px-3 erix-py-1.5 erix-rounded-xl erix-bg-muted/30 erix-border erix-border-border/40">
          <div className="erix-flex erix-items-center erix-gap-1.5">
            <span className="erix-text-[9px] erix-font-black erix-uppercase erix-tracking-widest erix-text-muted-foreground/40">
              Value
            </span>
            <span className="erix-text-[10px] erix-font-black erix-text-foreground/80">
              {formatValue(columnValue)}
            </span>
          </div>
          {stage.probability != null && (
            <div className="erix-flex erix-items-center erix-gap-1.5">
              <span className="erix-text-[10px] erix-font-black erix-text-primary/70">
                {stage.probability}%
              </span>
              <span className="erix-text-[9px] erix-font-black erix-uppercase erix-tracking-widest erix-text-muted-foreground/40">
                Prob.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Column Body / Drop Zone */}
      <div
        className={cn(
          "erix-flex erix-flex-1 erix-flex-col erix-gap-3 erix-rounded-2xl erix-p-2 erix-overflow-y-auto erix-scrollbar-none erix-min-h-0 erix-transition-colors erix-duration-300",
          "erix-bg-muted/5 erix-border erix-border-border/40",
          "group-hover/column:erix-bg-muted/10 group-hover/column:erix-border-border/60",
          isOver && "erix-bg-primary/5 erix-border-primary/20",
        )}
      >
        <SortableContext
          items={leads.map((l) => l._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="erix-flex erix-flex-col erix-gap-4">
            {leads.map((lead) => (
              <SortableLeadCard
                key={lead._id}
                lead={lead}
                visibleFields={visibleFields}
                onOpen={onOpen}
                onConvert={onConvert}
                onArchive={onArchive}
              />
            ))}
            {leads.length === 0 && (
              <div className="erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-py-20 erix-text-center erix-opacity-30 group-hover/column:erix-opacity-50 transition-opacity">
                <div className="erix-flex erix-size-16 erix-items-center erix-justify-center erix-rounded-2xl erix-bg-muted/50 erix-mb-5 erix-border erix-border-border shadow-inner group-hover/column:erix-scale-110 transition-transform">
                  <Plus className="erix-size-7 erix-text-muted-foreground/40" />
                </div>
                <p className="erix-text-[11px] erix-font-black erix-uppercase erix-tracking-[0.25em] erix-mb-2">
                  No Leads
                </p>
                <button
                  onClick={() => onAddLead?.(stage._id)}
                  className="erix-text-[10px] erix-font-bold erix-text-primary hover:erix-opacity-80 transition-all"
                >
                  Click to add
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  pipelineId: string;
  onLeadOpen?: (leadId: string) => void;
  onAddLead?: (stageId: string) => void;
  /** Called when user clicks "Add Stage" or "Configure Pipeline Stages" */
  onConfigureStages?: () => void;
}

export function KanbanBoard({
  pipelineId,
  onLeadOpen,
  onAddLead,
  onConfigureStages,
}: KanbanBoardProps) {
  const { board, stageManifest, loading, error, moveLead, refetch } =
    usePipelineBoard(pipelineId);
  const { convert, archive } = useLeads({ pipelineId });
  const [draggingLead, setDraggingLead] = React.useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [visibleFields, setVisibleFields] = React.useState<Set<string>>(
    new Set(["value", "source"]),
  );

  const toggleField = (col: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const customFields = React.useMemo(() => {
    if (!board) return [];
    const fields = new Set<string>();
    board.columns.forEach((c) => {
      c.leads.forEach((l) => {
        if (l.metadata?.extra) {
          Object.keys(l.metadata.extra).forEach((k) => fields.add(k));
        }
      });
    });
    return Array.from(fields);
  }, [board]);

  // Memoized — was being re-created on every drag frame
  const enhancedColumns = React.useMemo(() => {
    if (!board) return [];
    return board.columns.map((column) => {
      const manifestField: any = stageManifest?.fields?.find(
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
  }, [board, stageManifest]);

  // Board-level stats strip
  const boardStats = React.useMemo(() => {
    if (!enhancedColumns.length) return null;
    const totalLeads = enhancedColumns.reduce((a, c) => a + c.total, 0);
    const totalValue = enhancedColumns.reduce(
      (a, c) => a + c.leads.reduce((s, l) => s + (l.value || 0), 0),
      0,
    );
    return { totalLeads, totalValue };
  }, [enhancedColumns]);

  // Board-aware archive: optimistic via useLeads then reconcile board
  const handleArchive = React.useCallback(
    async (leadId: string) => {
      try {
        await archive(leadId);
        void refetch();
      } catch (e) {
        console.error("Archive failed:", e);
      }
    },
    [archive, refetch],
  );

  // Board-aware convert
  const handleConvert = React.useCallback(
    async (leadId: string, outcome: "won" | "lost") => {
      try {
        await convert(leadId, outcome);
        void refetch();
      } catch (e) {
        console.error("Convert failed:", e);
      }
    },
    [convert, refetch],
  );

  const onDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const lead = (board?.columns || [])
        .flatMap((c) => c.leads)
        .find((l) => l._id === event.active.id);
      if (lead) setDraggingLead(lead);
    },
    [board],
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggingLead(null);
      if (!over) return;

      const leadId = String(active.id);
      const overId = String(over.id);

      const column = enhancedColumns.find(
        (c) => c.stage._id === overId || c.leads.some((l) => l._id === overId),
      );

      if (column && column.stage._id !== draggingLead?.stageId) {
        moveLead(leadId, column.stage._id);
      }
    },
    [enhancedColumns, draggingLead, moveLead],
  );

  // ── Loading ──
  if (loading && !board) {
    return (
      <div className="erix-flex erix-h-64 erix-items-center erix-justify-center">
        <ErixSpinner size="lg" />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-h-64 erix-gap-4 erix-text-center">
        <div className="erix-flex erix-size-16 erix-items-center erix-justify-center erix-rounded-2xl erix-bg-red-500/10 erix-border erix-border-red-500/20">
          <AlertCircle className="erix-size-7 erix-text-red-500" />
        </div>
        <p className="erix-text-sm erix-font-bold erix-text-muted-foreground">
          Failed to load board
        </p>
        <p className="erix-text-xs erix-text-muted-foreground/60">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="erix-gap-2"
        >
          <RefreshCw className="erix-size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="erix-flex erix-flex-col erix-flex-1 erix-min-h-0 erix-min-w-0">
      {/* Board Toolbar */}
      <div className="erix-flex erix-items-center erix-justify-between erix-mb-3 erix-px-2">
        {/* Stats */}
        {boardStats && (
          <div className="erix-flex erix-items-center erix-gap-5">
            <span className="erix-text-[11px] erix-font-black erix-text-muted-foreground/50 erix-uppercase erix-tracking-widest">
              {boardStats.totalLeads} leads
            </span>
            <span className="erix-text-[11px] erix-font-black erix-text-muted-foreground/50 erix-uppercase erix-tracking-widest">
              {formatValue(boardStats.totalValue)} pipeline
            </span>
          </div>
        )}

        <div className="erix-flex erix-items-center erix-gap-2">
          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
            className="erix-h-8 erix-w-8 erix-p-0 erix-rounded-lg hover:erix-bg-muted/50"
            title="Refresh board"
          >
            <RefreshCw
              className={cn("erix-size-3.5", loading && "erix-animate-spin")}
            />
          </Button>

          {/* Card Fields */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="erix-h-8 erix-gap-2 erix-rounded-lg erix-text-xs erix-font-bold erix-border-border/60 hover:erix-bg-muted/50"
              >
                <Settings2 className="erix-size-3.5" />
                Card Fields
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="erix-w-56 erix-rounded-xl erix-p-2"
            >
              <DropdownMenuLabel className="erix-text-xs erix-text-muted-foreground erix-px-2">
                Standard Fields
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
              <DropdownMenuCheckboxItem
                checked={visibleFields.has("value")}
                onCheckedChange={() => toggleField("value")}
                className="erix-text-xs erix-font-bold erix-rounded-lg"
              >
                Deal Value
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleFields.has("source")}
                onCheckedChange={() => toggleField("source")}
                className="erix-text-xs erix-font-bold erix-rounded-lg"
              >
                Source
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleFields.has("tags")}
                onCheckedChange={() => toggleField("tags")}
                className="erix-text-xs erix-font-bold erix-rounded-lg"
              >
                Tags
              </DropdownMenuCheckboxItem>
              {customFields.length > 0 && (
                <>
                  <DropdownMenuSeparator className="erix-my-2 erix-opacity-50" />
                  <DropdownMenuLabel className="erix-text-xs erix-text-muted-foreground erix-px-2">
                    Custom Fields
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
                  {customFields.map((field) => (
                    <DropdownMenuCheckboxItem
                      key={field}
                      checked={visibleFields.has(`custom_${field}`)}
                      onCheckedChange={() => toggleField(`custom_${field}`)}
                      className="erix-text-xs erix-font-bold erix-rounded-lg erix-capitalize"
                    >
                      {field.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {enhancedColumns.length > 0 ? (
          <div
            className="erix-flex erix-flex-1 erix-min-h-0 erix-gap-5 erix-overflow-x-auto erix-pb-4"
            style={{ scrollbarWidth: "thin" }}
          >
            {enhancedColumns.map((col) => (
              <KanbanColumn
                key={col.stage._id}
                stage={col.stage}
                leads={col.leads}
                total={col.total}
                visibleFields={visibleFields}
                onOpen={onLeadOpen || (() => {})}
                onConvert={handleConvert}
                onArchive={handleArchive}
                onAddLead={onAddLead}
              />
            ))}
            {/* Add Stage — wired */}
            <div
              onClick={onConfigureStages}
              className="erix-flex erix-w-[200px] erix-shrink-0 erix-flex-col erix-items-center erix-justify-center erix-rounded-2xl erix-border-2 erix-border-dashed erix-border-border/25 erix-bg-muted/5 hover:erix-bg-muted/10 erix-transition-colors erix-cursor-pointer erix-group"
            >
              <div className="erix-flex erix-size-10 erix-items-center erix-justify-center erix-rounded-xl erix-bg-muted/50 erix-mb-2 group-hover:erix-scale-110 erix-transition-transform erix-border erix-border-border">
                <Plus className="erix-size-5 erix-text-muted-foreground/50" />
              </div>
              <p className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground/50">
                Add Stage
              </p>
            </div>
          </div>
        ) : (
          <div className="erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-text-center erix-py-32">
            <div className="erix-flex erix-size-24 erix-items-center erix-justify-center erix-rounded-[2.5rem] erix-bg-muted erix-mb-8 erix-border erix-border-border shadow-inner">
              <LayoutGrid className="erix-size-12 erix-text-muted-foreground/30" />
            </div>
            <h3 className="erix-text-2xl erix-font-black erix-tracking-tight erix-mb-3">
              Pipeline not configured
            </h3>
            <p className="erix-text-sm erix-text-muted-foreground erix-max-w-md erix-mb-10 erix-leading-relaxed">
              This pipeline doesn&apos;t have any stages yet. Stages allow you
              to track leads through your sales process with precision.
            </p>
            <Button
              size="lg"
              onClick={onConfigureStages}
              className="erix-px-8 erix-h-12 erix-rounded-2xl erix-text-sm erix-font-black erix-tracking-wide shadow-lg shadow-primary/20 active:erix-scale-95"
            >
              Configure Pipeline Stages
            </Button>
          </div>
        )}

        <DragOverlay>
          {draggingLead ? (
            <div className="erix-w-[340px] erix-rotate-2 erix-scale-105 erix-cursor-grabbing erix-z-[100]">
              <LeadCard
                lead={draggingLead}
                visibleFields={visibleFields}
                onOpen={() => {}}
                onConvert={() => {}}
                onArchive={() => {}}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
