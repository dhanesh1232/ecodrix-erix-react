"use client";

import * as React from "react";
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Wand2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { toast } from "sonner";
import { usePipelineMutations } from "@/hooks/crm/usePipeline";
import type { Pipeline, PipelineStage } from "@/types/platform";

interface PipelineEditDialogProps {
  pipeline: Pipeline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PipelineEditDialog({
  pipeline,
  open,
  onOpenChange,
  onSuccess,
}: PipelineEditDialogProps) {
  const { reorderStages, addStage, updateStage, deleteStage, loading } =
    usePipelineMutations();

  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize stages when pipeline changes
  React.useEffect(() => {
    if (pipeline) {
      setStages([...(pipeline.stages || [])].sort((a, b) => a.order - b.order));
    } else {
      setStages([]);
    }
  }, [pipeline, open]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddStage = () => {
    const newId = `temp-${Date.now()}`;
    const newStage: PipelineStage = {
      _id: newId,
      name: "New Stage",
      order: stages.length,
      color: "#6366f1",
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id: string) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((s) => s._id !== id));
  };

  const handleUpdateStageName = (id: string, name: string) => {
    setStages(stages.map((s) => (s._id === id ? { ...s, name } : s)));
  };

  const handleToggleWonLost = (id: string, type: "isWon" | "isLost") => {
    setStages(
      stages.map((s) => {
        if (s._id === id) {
          return {
            ...s,
            isWon: type === "isWon" ? !s.isWon : false,
            isLost: type === "isLost" ? !s.isLost : false,
          };
        }
        // If setting won/lost on one, clear it on others if needed (though multiple lost stages are fine)
        if (type === "isWon" && !s.isWon && s._id !== id) {
          return { ...s, isWon: false };
        }
        return s;
      }),
    );
  };

  const handleSave = async () => {
    if (!pipeline) return;
    setIsSaving(true);
    try {
      // 1. Process stages: Add new ones, update existing ones
      const currentStageIds: string[] = [];

      // We process sequentially to avoid potential race conditions on the backend
      // when creating new stages (though the backend handles it, frontend ordering is safer)
      for (const s of stages) {
        const payload = {
          name: s.name,
          color: s.color,
          probability: s.probability,
          isWon: s.isWon,
          isLost: s.isLost,
        };

        if (s._id.startsWith("temp-")) {
          const created = await addStage(pipeline._id, payload);
          currentStageIds.push(created._id);
        } else {
          await updateStage(s._id, payload);
          currentStageIds.push(s._id);
        }
      }

      // 3. Delete stages that were removed
      const removedStageIds = (pipeline.stages || [])
        .filter((ps) => !stages.find((s) => s._id === ps._id))
        .map((ps) => ps._id);

      for (const id of removedStageIds) {
        await deleteStage(id);
      }

      // 4. Synchronize Final Order
      // This is the most critical step for drag-and-drop persistence.
      // We pass the full array of current IDs in the desired order.
      await reorderStages(pipeline._id, currentStageIds);

      toast.success("Pipeline updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save pipeline stages:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="erix-sm:erix-max-w-[500px] erix-p-0 erix-overflow-hidden erix-rounded-3xl erix-border-none erix-shadow-2xl">
        <DialogHeader className="erix-p-6 erix-pb-0">
          <DialogTitle className="erix-text-2xl erix-font-black erix-tracking-tight erix-flex erix-items-center erix-gap-2">
            <Wand2 className="erix-size-6 erix-text-primary" />
            Configure Stages
          </DialogTitle>
          <DialogDescription className="erix-text-sm erix-text-muted-foreground/70 erix-mt-1">
            Customize the stages for{" "}
            <span className="erix-font-bold erix-text-foreground">
              {pipeline?.name}
            </span>
            . Drag to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="erix-p-6 erix-max-h-[60vh] erix-overflow-y-auto erix-space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="erix-space-y-2">
                {stages.map((stage) => (
                  <SortableItem
                    key={stage._id}
                    stage={stage}
                    onRemove={handleRemoveStage}
                    onUpdateName={handleUpdateStageName}
                    onToggleWonLost={handleToggleWonLost}
                    isOnlyStage={stages.length <= 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            className="erix-w-full erix-h-12 erix-border-dashed erix-rounded-2xl erix-gap-2 erix-text-sm erix-font-bold hover:erix-bg-primary/5 hover:erix-border-primary/50 erix-transition-all"
            onClick={handleAddStage}
          >
            <Plus className="erix-size-4" />
            Add New Stage
          </Button>
        </div>

        <DialogFooter className="erix-p-6 erix-bg-muted/30 erix-border-t erix-border-border/50 erix-flex erix-items-center erix-justify-between erix-gap-4">
          <div className="erix-flex erix-items-center erix-gap-4">
            <div className="erix-flex erix-items-center erix-gap-1.5 erix-text-[10px] erix-font-black erix-text-muted-foreground/60 erix-uppercase erix-tracking-wider">
              <CheckCircle2 className="erix-size-3 erix-text-green-500" />
              Won Marker
            </div>
            <div className="erix-flex erix-items-center erix-gap-1.5 erix-text-[10px] erix-font-black erix-text-muted-foreground/60 erix-uppercase erix-tracking-wider">
              <AlertCircle className="erix-size-3 erix-text-red-500" />
              Lost Marker
            </div>
          </div>
          <div className="erix-flex erix-gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="erix-h-10 erix-px-4 erix-rounded-xl erix-font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || stages.length === 0}
              className="erix-h-10 erix-px-6 erix-rounded-xl erix-font-black erix-gap-2 erix-shadow-lg erix-shadow-primary/20"
            >
              {isSaving ? (
                <ErixSpinner size="sm" />
              ) : (
                <Save className="erix-size-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableItemProps {
  stage: PipelineStage;
  onRemove: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onToggleWonLost: (id: string, type: "isWon" | "isLost") => void;
  isOnlyStage: boolean;
}

function SortableItem({
  stage,
  onRemove,
  onUpdateName,
  onToggleWonLost,
  isOnlyStage,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "erix-group erix-flex erix-items-center erix-gap-3 erix-p-3 erix-rounded-2xl erix-bg-background erix-border erix-border-border/50 erix-transition-all",
        isDragging &&
          "erix-shadow-xl erix-border-primary/50 erix-opacity-80 erix-scale-[1.02] erix-bg-muted/50",
        stage.isWon && "erix-border-green-500/30 erix-bg-green-500/[0.02]",
        stage.isLost && "erix-border-red-500/30 erix-bg-red-500/[0.02]",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="erix-cursor-grab active:erix-cursor-grabbing erix-p-1 erix-rounded-lg erix-text-muted-foreground/40 hover:erix-bg-muted hover:erix-text-muted-foreground erix-transition-colors"
      >
        <GripVertical className="erix-size-4" />
      </div>

      <div className="erix-flex-1">
        <Input
          value={stage.name}
          onChange={(e) => onUpdateName(stage._id, e.target.value)}
          placeholder="Stage Name"
          className="erix-h-9 erix-bg-transparent erix-border-none focus-visible:erix-ring-1 erix-font-bold erix-text-sm erix-px-2"
        />
      </div>

      <div className="erix-flex erix-items-center erix-gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "erix-size-8 erix-rounded-lg erix-transition-all",
            stage.isWon
              ? "erix-bg-green-500/20 erix-text-green-600 hover:erix-bg-green-500/30"
              : "erix-text-muted-foreground/40 hover:erix-bg-muted hover:erix-text-muted-foreground",
          )}
          onClick={() => onToggleWonLost(stage._id, "isWon")}
          title="Mark as 'Won' stage"
        >
          <CheckCircle2 className="erix-size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "erix-size-8 erix-rounded-lg erix-transition-all",
            stage.isLost
              ? "erix-bg-red-500/20 erix-text-red-600 hover:erix-bg-red-500/30"
              : "erix-text-muted-foreground/40 hover:erix-bg-muted hover:erix-text-muted-foreground",
          )}
          onClick={() => onToggleWonLost(stage._id, "isLost")}
          title="Mark as 'Lost' stage"
        >
          <AlertCircle className="erix-size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={isOnlyStage}
          className="erix-size-8 erix-rounded-lg erix-text-muted-foreground/40 hover:erix-bg-red-50 hover:erix-text-red-500 erix-transition-all"
          onClick={() => onRemove(stage._id)}
        >
          <Trash2 className="erix-size-4" />
        </Button>
      </div>
    </div>
  );
}
