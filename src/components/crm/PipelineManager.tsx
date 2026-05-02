"use client";

import * as React from "react";
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Settings2,
  Trash2,
  LayoutGrid,
  Save,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ChevronRight,
  Sparkles,
  Search,
  Archive,
  History,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipelines, usePipelineMutations } from "@/hooks/crm/usePipeline";
import { useModuleNavigate } from "@/routing/RouterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PipelineEditDialog } from "./PipelineEditDialog";
import type { Pipeline } from "@/types/platform";

const PIPELINE_TEMPLATES = [
  {
    id: "sales_b2b",
    name: "B2B Sales",
    description:
      "Standard high-touch sales process with qualification and negotiation.",
    stages: [
      { name: "Prospecting", color: "#6366f1" },
      { name: "Qualification", color: "#8b5cf6" },
      { name: "Proposal", color: "#d946ef" },
      { name: "Negotiation", color: "#f43f5e" },
      { name: "Closed Won", color: "#10b981", isWon: true },
      { name: "Closed Lost", color: "#ef4444", isLost: true },
    ],
  },
  {
    id: "real_estate",
    name: "Real Estate",
    description: "Property inquiry to closing workflow.",
    stages: [
      { name: "New Inquiry", color: "#6366f1" },
      { name: "Viewing", color: "#0ea5e9" },
      { name: "Offer Made", color: "#f59e0b" },
      { name: "Legal/Contract", color: "#8b5cf6" },
      { name: "Sold", color: "#10b981", isWon: true },
      { name: "Withdrawn", color: "#ef4444", isLost: true },
    ],
  },
  {
    id: "hiring",
    name: "Recruitment",
    description: "Track candidates from application to onboarding.",
    stages: [
      { name: "Applied", color: "#94a3b8" },
      { name: "Screening", color: "#38bdf8" },
      { name: "Interview", color: "#818cf8" },
      { name: "Offer", color: "#f472b6" },
      { name: "Hired", color: "#10b981", isWon: true },
      { name: "Rejected", color: "#ef4444", isLost: true },
    ],
  },
];

export function PipelineManager() {
  const navigateTo = useModuleNavigate();
  const { pipelines, loading: fetching, refetch } = usePipelines();
  const {
    createPipeline,
    updatePipeline,
    archivePipeline,
    deletePipeline,
    setDefaultPipeline,
    checkPipelineInUse,
    loading: mutating,
  } = usePipelineMutations();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedPipeline, setSelectedPipeline] =
    React.useState<Pipeline | null>(null);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"active" | "archived">(
    "active",
  );

  const [newPipelineMode, setNewPipelineMode] = React.useState<
    "template" | "custom"
  >("template");
  const [selectedTemplateId, setSelectedTemplateId] =
    React.useState<string>("sales_b2b");
  const [customData, setCustomData] = React.useState({
    name: "",
    description: "",
  });

  const filteredPipelines = pipelines.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      viewMode === "active" ? p.isActive !== false : p.isActive === false;
    return matchesSearch && matchesStatus;
  });

  const handleCreateFromTemplate = async () => {
    const template = PIPELINE_TEMPLATES.find(
      (t) => t.id === selectedTemplateId,
    );
    if (!template) return;

    try {
      await createPipeline({
        name: template.name,
        description: template.description,
        stages: template.stages.map((s, index) => ({
          ...s,
          order: index,
        })) as any,
      });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustom = async () => {
    if (!customData.name.trim()) return;
    try {
      await createPipeline({
        name: customData.name,
        description: customData.description,
        stages: [
          { name: "New", order: 0, color: "#6366f1" },
          { name: "Closed Won", order: 1, color: "#10b981", isWon: true },
          { name: "Closed Lost", order: 2, color: "#ef4444", isLost: true },
        ] as any,
      });
      setCreateDialogOpen(false);
      setCustomData({ name: "", description: "" });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPipeline(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePipeline(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const inUse = await checkPipelineInUse(id);
    if (inUse) {
      alert(
        "Cannot delete pipeline that has leads associated with it. Move or delete the leads first.",
      );
      return;
    }

    if (confirm("Are you sure you want to permanently delete this pipeline?")) {
      try {
        await deletePipeline(id);
        refetch();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="erix-flex erix-flex-col erix-w-full erix-h-full erix-bg-background erix-overflow-hidden">
      {/* Header */}
      <header className="erix-flex-none erix-border-b erix-border-border erix-bg-background/80 erix-backdrop-blur-md erix-z-10">
        <div className="erix-flex erix-items-center erix-justify-between erix-px-8 erix-py-6">
          <div className="erix-flex erix-items-center erix-gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo("crm")}
              className="erix-size-10 erix-rounded-2xl erix-bg-muted/30 hover:erix-bg-muted erix-transition-all"
            >
              <ArrowLeft className="erix-size-5" />
            </Button>
            <div>
              <div className="erix-flex erix-items-center erix-gap-3">
                <h1 className="erix-text-2xl erix-font-black erix-tracking-tight erix-text-foreground">
                  Pipeline Management
                </h1>
                <Badge
                  variant="outline"
                  className="erix-rounded-full erix-bg-primary/5 erix-text-primary erix-border-primary/20"
                >
                  {pipelines.length} Total
                </Badge>
              </div>
              <p className="erix-text-sm erix-text-muted-foreground/60 erix-mt-0.5">
                Design and optimize your business workflows.
              </p>
            </div>
          </div>

          <div className="erix-flex erix-items-center erix-gap-3">
            <div className="erix-relative erix-hidden lg:erix-block">
              <Search className="erix-absolute erix-left-3 erix-top-1/2 -erix-translate-y-1/2 erix-size-4 erix-text-muted-foreground/40" />
              <Input
                placeholder="Search pipelines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="erix-w-64 erix-h-10 erix-pl-10 erix-rounded-xl erix-bg-muted/30 erix-border-none focus-visible:erix-ring-1"
              />
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="erix-h-10 erix-px-6 erix-gap-2.5 erix-rounded-2xl erix-font-black erix-text-sm erix-shadow-xl erix-shadow-primary/20 erix-bg-primary hover:erix-bg-primary/90"
            >
              <Plus className="erix-size-4 erix-stroke-[3]" />
              New Pipeline
            </Button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="erix-flex erix-items-center erix-px-8 erix-gap-1 erix-pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("active")}
            className={cn(
              "erix-h-9 erix-px-4 erix-rounded-xl erix-text-xs erix-font-black erix-gap-2",
              viewMode === "active"
                ? "erix-bg-primary/10 erix-text-primary"
                : "erix-text-muted-foreground",
            )}
          >
            <ShieldCheck className="erix-size-3.5" />
            Active
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("archived")}
            className={cn(
              "erix-h-9 erix-px-4 erix-rounded-xl erix-text-xs erix-font-black erix-gap-2",
              viewMode === "archived"
                ? "erix-bg-orange-500/10 erix-text-orange-600"
                : "erix-text-muted-foreground",
            )}
          >
            <Archive className="erix-size-3.5" />
            Archived
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="erix-flex-1 erix-overflow-y-auto erix-p-4">
        {fetching && pipelines.length === 0 ? (
          <div className="erix-flex erix-h-96 erix-items-center erix-justify-center">
            <ErixSpinner size="lg" className="erix-text-primary/20" />
          </div>
        ) : filteredPipelines.length === 0 ? (
          <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-h-96 erix-text-center">
            <div className="erix-size-20 erix-rounded-3xl erix-bg-muted/30 erix-flex erix-items-center erix-justify-center erix-mb-6">
              <LayoutGrid className="erix-size-10 erix-text-muted-foreground/20" />
            </div>
            <h3 className="erix-text-xl erix-font-black erix-text-foreground/80">
              No pipelines found
            </h3>
            <p className="erix-text-sm erix-text-muted-foreground/60 erix-mt-2 erix-max-w-xs">
              {searchQuery
                ? "Try adjusting your search query."
                : "Start by creating your first business pipeline."}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                className="erix-mt-6 erix-rounded-xl erix-font-bold"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Pipeline
              </Button>
            )}
          </div>
        ) : (
          <div className="erix-grid erix-grid-cols-1 md:erix-grid-cols-2 xl:erix-grid-cols-3 erix-gap-4 erix-max-w-full erix-mx-auto">
            {filteredPipelines.map((p) => (
              <div
                key={p._id}
                className={cn(
                  "erix-group erix-relative erix-flex erix-flex-col erix-p-6 erix-rounded-xl erix-bg-card erix-border erix-border-border/50 erix-shadow-sm hover:erix-shadow-lg erix-transition-all erix-duration-500",
                  p.isDefault &&
                    "erix-ring-2 erix-ring-primary/20 erix-bg-gradient-to-br erix-from-card erix-to-primary/[0.02]",
                )}
              >
                <div className="erix-flex erix-items-start erix-justify-between erix-mb-6">
                  <div className="erix-flex erix-size-14 erix-items-center erix-justify-center erix-rounded-3xl erix-bg-muted/50 erix-border erix-border-border group-hover:erix-bg-primary group-hover:erix-border-primary erix-transition-all erix-duration-500">
                    <LayoutGrid className="erix-size-7 erix-text-muted-foreground group-hover:erix-text-white erix-transition-colors" />
                  </div>
                  <div className="erix-flex erix-items-center erix-gap-2">
                    {p.isDefault && (
                      <Badge className="erix-rounded-full erix-bg-primary erix-text-white erix-border-none erix-text-[10px] erix-font-black erix-px-3 erix-py-1">
                        DEFAULT
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="erix-size-10 erix-rounded-2xl hover:erix-bg-muted"
                        >
                          <MoreVertical className="erix-size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="erix-w-56 erix-rounded-2xl erix-p-2 erix-shadow-2xl"
                      >
                        <DropdownMenuItem
                          className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-cursor-pointer"
                          onClick={() => {
                            setSelectedPipeline(p);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Settings2 className="erix-size-4 erix-mr-3 erix-text-primary" />
                          Configure Stages
                        </DropdownMenuItem>
                        {p.isDefault ? (
                          <DropdownMenuItem
                            className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-cursor-pointer"
                            onClick={() =>
                              updatePipeline(p._id, {
                                isDefault: false,
                              } as any).then(() => refetch())
                            }
                          >
                            <Star className="erix-size-4 erix-mr-3 erix-text-amber-500 erix-fill-amber-500" />
                            Remove Default
                          </DropdownMenuItem>
                        ) : (
                          p.isActive !== false && (
                            <DropdownMenuItem
                              className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-cursor-pointer"
                              onClick={() => handleSetDefault(p._id)}
                            >
                              <Star className="erix-size-4 erix-mr-3 erix-text-amber-500" />
                              Set as Default
                            </DropdownMenuItem>
                          )
                        )}
                        <DropdownMenuSeparator className="erix-my-2" />
                        {p.isActive !== false ? (
                          <DropdownMenuItem
                            className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-cursor-pointer"
                            onClick={() => handleArchive(p._id)}
                          >
                            <Archive className="erix-size-4 erix-mr-3 erix-text-orange-500" />
                            Archive Pipeline
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-cursor-pointer"
                            onClick={() =>
                              updatePipeline(p._id, {
                                isActive: true,
                              } as any).then(() => refetch())
                            }
                          >
                            <History className="erix-size-4 erix-mr-3 erix-text-green-500" />
                            Restore Pipeline
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="erix-rounded-xl erix-py-3 erix-text-sm erix-font-bold erix-text-red-500 focus:erix-bg-red-50 focus:erix-text-red-600 erix-cursor-pointer"
                          onClick={() => handleDelete(p._id)}
                        >
                          <Trash2 className="erix-size-4 erix-mr-3" />
                          Permanently Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="erix-space-y-2">
                  <h3 className="erix-text-xl erix-font-black erix-tracking-tight erix-text-foreground/90">
                    {p.name}
                  </h3>
                  <p className="erix-text-sm erix-text-muted-foreground/70 erix-line-clamp-2 erix-leading-relaxed">
                    {p.description || "No description provided."}
                  </p>
                </div>

                <div className="erix-mt-8 erix-pt-6 erix-border-t erix-border-border/50 erix-flex erix-items-center erix-justify-between">
                  <div className="erix-flex erix-items-center erix-gap-4">
                    <div className="erix-flex erix-flex-col">
                      <span className="erix-text-[10px] erix-font-black erix-text-muted-foreground/40 erix-uppercase erix-tracking-widest">
                        Stages
                      </span>
                      <span className="erix-text-sm erix-font-bold erix-text-foreground/80">
                        {p.stages?.length || 0}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="erix-h-10 erix-px-5 erix-rounded-xl erix-text-xs erix-font-black erix-gap-2 hover:erix-bg-primary/10 hover:erix-text-primary erix-transition-all"
                    onClick={() => {
                      setSelectedPipeline(p);
                      setEditDialogOpen(true);
                    }}
                  >
                    Manage
                    <ChevronRight className="erix-size-3.5" />
                  </Button>
                </div>

                {/* Visual indicator of stages */}
                <div className="erix-flex erix-h-1.5 erix-w-full erix-mt-4 erix-rounded-full erix-overflow-hidden erix-bg-muted/30">
                  {(p.stages || []).map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className="erix-h-full"
                      style={{
                        width: `${100 / (p.stages?.length || 1)}%`,
                        backgroundColor: s.color || "#6366f1",
                        opacity: 0.6 + idx * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Pipeline Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="erix-sm:erix-max-w-[700px] erix-p-0 erix-overflow-hidden erix-rounded-[2.5rem] erix-border-none erix-shadow-2xl">
          <div className="erix-grid erix-grid-cols-1 md:erix-grid-cols-5 erix-h-[500px]">
            {/* Sidebar with categories */}
            <div className="erix-col-span-2 erix-bg-muted/30 erix-p-8 erix-border-r erix-border-border/50">
              <DialogTitle className="erix-text-2xl erix-font-black erix-tracking-tight erix-mb-8">
                New Pipeline
              </DialogTitle>
              <DialogDescription className="erix-sr-only">
                Create a new pipeline from a template or start from scratch.
              </DialogDescription>

              <div className="erix-space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setNewPipelineMode("template")}
                  className={cn(
                    "erix-w-full erix-justify-start erix-h-12 erix-px-4 erix-rounded-2xl erix-gap-3 erix-font-bold erix-text-sm",
                    newPipelineMode === "template"
                      ? "erix-bg-white erix-shadow-sm erix-text-primary"
                      : "erix-text-muted-foreground",
                  )}
                >
                  <Sparkles className="erix-size-4" />
                  Use Template
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setNewPipelineMode("custom")}
                  className={cn(
                    "erix-w-full erix-justify-start erix-h-12 erix-px-4 erix-rounded-2xl erix-gap-3 erix-font-bold erix-text-sm",
                    newPipelineMode === "custom"
                      ? "erix-bg-white erix-shadow-sm erix-text-primary"
                      : "erix-text-muted-foreground",
                  )}
                >
                  <Edit3 className="erix-size-4" />
                  Start from Scratch
                </Button>
              </div>

              <div className="erix-mt-auto erix-pt-24">
                <p className="erix-text-xs erix-text-muted-foreground/60 erix-leading-relaxed">
                  Pipelines help you track progress through various stages of
                  your business process.
                </p>
              </div>
            </div>

            {/* Main selection area */}
            <div className="erix-col-span-3 erix-p-8 erix-overflow-y-auto">
              {newPipelineMode === "template" ? (
                <div className="erix-space-y-4">
                  <p className="erix-text-xs erix-font-black erix-text-muted-foreground/40 erix-uppercase erix-tracking-widest">
                    Available Templates
                  </p>
                  <div className="erix-space-y-3">
                    {PIPELINE_TEMPLATES.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={cn(
                          "erix-group erix-p-4 erix-rounded-2xl erix-border erix-cursor-pointer erix-transition-all",
                          selectedTemplateId === t.id
                            ? "erix-border-primary erix-bg-primary/5 erix-ring-1 erix-ring-primary"
                            : "erix-border-border/50 hover:erix-border-primary/50 hover:erix-bg-muted/50",
                        )}
                      >
                        <div className="erix-flex erix-items-center erix-justify-between">
                          <h4 className="erix-font-black erix-text-sm">
                            {t.name}
                          </h4>
                          <ChevronRight
                            className={cn(
                              "erix-size-4 erix-transition-all",
                              selectedTemplateId === t.id
                                ? "erix-text-primary erix-translate-x-1"
                                : "erix-text-muted-foreground/20",
                            )}
                          />
                        </div>
                        <p className="erix-text-xs erix-text-muted-foreground erix-mt-1">
                          {t.description}
                        </p>
                        <div className="erix-flex erix-gap-1 erix-mt-3">
                          {t.stages.slice(0, 4).map((s, i) => (
                            <div
                              key={i}
                              className="erix-h-1 erix-flex-1 erix-rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                          ))}
                          {t.stages.length > 4 && (
                            <div className="erix-text-[8px] erix-font-bold erix-text-muted-foreground">
                              +{t.stages.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="erix-space-y-6">
                  <p className="erix-text-xs erix-font-black erix-text-muted-foreground/40 erix-uppercase erix-tracking-widest">
                    Custom Pipeline Details
                  </p>
                  <div className="erix-space-y-4">
                    <div className="erix-space-y-2">
                      <Label className="erix-text-xs erix-font-bold">
                        Pipeline Name
                      </Label>
                      <Input
                        placeholder="e.g. Project Delivery"
                        value={customData.name}
                        onChange={(e) =>
                          setCustomData({ ...customData, name: e.target.value })
                        }
                        className="erix-h-11 erix-rounded-xl erix-bg-muted/30 erix-border-none"
                      />
                    </div>
                    <div className="erix-space-y-2">
                      <Label className="erix-text-xs erix-font-bold">
                        Description (Optional)
                      </Label>
                      <Input
                        placeholder="What is this pipeline for?"
                        value={customData.description}
                        onChange={(e) =>
                          setCustomData({
                            ...customData,
                            description: e.target.value,
                          })
                        }
                        className="erix-h-11 erix-rounded-xl erix-bg-muted/30 erix-border-none"
                      />
                    </div>
                    <div className="erix-p-4 erix-rounded-2xl erix-bg-primary/5 erix-border erix-border-primary/20">
                      <p className="erix-text-[10px] erix-text-primary erix-font-bold erix-leading-relaxed">
                        Custom pipelines start with three basic stages:{" "}
                        <span className="erix-underline">New</span>,{" "}
                        <span className="erix-underline">Won</span>, and{" "}
                        <span className="erix-underline">Lost</span>. You can
                        fully customize them after creation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="erix-mt-10 erix-pt-6 erix-border-t erix-border-border/50 erix-flex erix-justify-end">
                <Button
                  onClick={
                    newPipelineMode === "template"
                      ? handleCreateFromTemplate
                      : handleCreateCustom
                  }
                  disabled={
                    mutating ||
                    (newPipelineMode === "custom" && !customData.name)
                  }
                  className="erix-h-12 erix-px-8 erix-rounded-2xl erix-font-black erix-gap-2 erix-shadow-xl erix-shadow-primary/20"
                >
                  {mutating ? (
                    <ErixSpinner size="sm" />
                  ) : (
                    <CheckCircle2 className="erix-size-4" />
                  )}
                  Create Pipeline
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stage Editor Dialog */}
      <PipelineEditDialog
        pipeline={selectedPipeline}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          refetch();
          setSelectedPipeline(null);
        }}
      />
    </div>
  );
}
