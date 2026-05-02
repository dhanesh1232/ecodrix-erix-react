"use client";
// packages/erix-react/src/components/crm/CRMViewContainer.tsx
import * as React from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/crm/useLeads";
import { usePipelines, usePipelineForecast } from "@/hooks/crm/usePipeline";
import { useModuleNavigate } from "@/routing/RouterContext";
import { KanbanBoard } from "./KanbanBoard";
import { LeadTable } from "./LeadTable";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateLeadModal } from "./CreateLeadModal";

export function CRMViewContainer() {
  const navigateTo = useModuleNavigate();
  const [view, setView] = React.useState<"table" | "board">("board");
  const [search, setSearch] = React.useState("");
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(
    null,
  );
  const [page, setPage] = React.useState(1);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [defaultStageId, setDefaultStageId] = React.useState<
    string | undefined
  >(undefined);

  const { pipelines, loading: pipelinesLoading } = usePipelines();
  const [activePipelineId, setActivePipelineId] = React.useState<string | null>(
    null,
  );

  const {
    leads,
    total,
    loading: leadsLoading,
    refetch,
    convert,
    archive,
    update,
    move,
  } = useLeads({
    pipelineId: activePipelineId || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const { forecast } = usePipelineForecast(activePipelineId);
  const activePipeline = pipelines.find((p) => p._id === activePipelineId);

  const handleAddLead = (stageId?: string) => {
    setDefaultStageId(stageId);
    setCreateModalOpen(true);
  };

  const stats = [
    {
      icon: Users,
      label: "Total Leads",
      value: String(
        forecast?.rows?.reduce((a: number, s: any) => a + (s.total || 0), 0) ??
          0,
      ),
      color: "erix-text-primary",
      bg: "erix-bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Pipeline Value",
      value: `$${((forecast?.totalPipeline ?? 0) / 1000).toFixed(1)}k`,
      color: "erix-text-emerald-600",
      bg: "erix-bg-emerald-500/10",
    },
    {
      icon: Target,
      label: "Expected Rev.",
      value: `$${((forecast?.grandTotal ?? 0) / 1000).toFixed(1)}k`,
      color: "erix-text-amber-600",
      bg: "erix-bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      label: "Avg. Score",
      value: "78",
      color: "erix-text-indigo-600",
      bg: "erix-bg-indigo-500/10",
    },
  ];

  return (
    <div className="erix-flex erix-flex-col erix-w-full erix-min-w-0 erix-h-full erix-overflow-hidden erix-bg-background">
      {/* Header */}
      <header className="erix-flex-none erix-border-b erix-border-border erix-bg-background">
        {/* Top row */}
        <div className="erix-flex erix-items-center erix-justify-between erix-gap-4 erix-px-6 erix-pt-5 erix-pb-4 erix-flex-wrap">
          <div className="erix-flex erix-items-center erix-gap-4 erix-min-w-0 erix-flex-1">
            <div className="erix-min-w-0">
              <h1 className="erix-text-2xl erix-font-black erix-tracking-tight erix-text-foreground">
                Lead Pipeline
              </h1>
              <p className="erix-text-xs erix-text-muted-foreground/60 erix-mt-0.5">
                Manage and track your sales opportunities
              </p>
            </div>
            {pipelines.length > 0 && (
              <>
                <div className="erix-h-7 erix-w-px erix-bg-border/50 erix-hidden sm:erix-block erix-shrink-0" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="erix-gap-2 erix-rounded-xl erix-bg-muted/40 erix-px-3.5 erix-h-9 erix-font-bold erix-text-sm erix-border erix-border-border/40 erix-shrink-0"
                    >
                      <span className="erix-text-primary/70 erix-text-xs erix-font-black">
                        Pipeline:
                      </span>
                      {activePipeline?.name || "All Pipelines"}
                      <ChevronDown className="erix-size-3.5 erix-text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="erix-w-52 erix-rounded-xl erix-p-1.5"
                    align="start"
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivePipelineId(null);
                        setView("table");
                      }}
                      className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-font-bold erix-text-sm"
                    >
                      All Pipelines
                      {activePipelineId === null && (
                        <div className="erix-ml-auto erix-size-2 erix-rounded-full erix-bg-primary" />
                      )}
                    </DropdownMenuItem>
                    {pipelines.map((p) => (
                      <DropdownMenuItem
                        key={p._id}
                        onSelect={() => setActivePipelineId(p._id)}
                        className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-font-bold erix-text-sm"
                      >
                        {p.name}
                        {p._id === activePipelineId && (
                          <div className="erix-ml-auto erix-size-2 erix-rounded-full erix-bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => navigateTo("crm", "pipelines")}
                      className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-font-bold erix-text-sm erix-text-muted-foreground focus:erix-text-foreground"
                    >
                      <Settings className="erix-mr-2 erix-size-4" />
                      Manage Pipelines
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          <div className="erix-flex erix-items-center erix-gap-2 erix-shrink-0">
            <div className="erix-relative erix-hidden md:erix-block">
              <Search className="erix-absolute erix-left-3 erix-top-1/2 erix-size-3.5 -erix-translate-y-1/2 erix-text-muted-foreground/50" />
              <Input
                placeholder="Search leads, phone, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="erix-h-9 erix-pl-9 erix-w-60 erix-rounded-xl erix-bg-muted/20 erix-border-border/40 erix-text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="erix-size-9 erix-rounded-xl erix-border-border/40"
            >
              <RefreshCw
                className={cn(
                  "erix-size-3.5 erix-text-muted-foreground",
                  leadsLoading && "erix-animate-spin",
                )}
              />
            </Button>
            <Button
              onClick={() => handleAddLead()}
              className="erix-h-9 erix-px-4 erix-gap-2 erix-rounded-xl erix-font-black erix-text-sm erix-shadow-md erix-shadow-primary/20"
            >
              <Plus className="erix-size-3.5 erix-stroke-[3]" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Bottom row: view toggle + status */}
        <div className="erix-flex erix-items-center erix-gap-2 erix-px-6 erix-pb-3">
          <div className="erix-flex erix-bg-muted/30 erix-p-1 erix-rounded-xl erix-border erix-border-border/50">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className={cn(
                "erix-h-8 erix-px-3 erix-rounded-lg erix-gap-2 erix-text-xs erix-font-bold",
                view === "table"
                  ? "erix-bg-background erix-shadow-sm erix-text-foreground"
                  : "erix-text-muted-foreground hover:erix-text-foreground",
              )}
            >
              <List className="erix-size-3.5" />
              Table
            </Button>
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("board")}
              className={cn(
                "erix-h-8 erix-px-3 erix-rounded-lg erix-gap-2 erix-text-xs erix-font-bold",
                view === "board"
                  ? "erix-bg-background erix-shadow-sm erix-text-foreground"
                  : "erix-text-muted-foreground hover:erix-text-foreground",
              )}
            >
              <LayoutGrid className="erix-size-3.5" />
              Board
            </Button>
          </div>
          <div className="erix-flex erix-items-center erix-gap-4 erix-ml-auto">
            <div className="erix-flex erix-items-center erix-gap-1.5 erix-px-2.5 erix-py-1 erix-rounded-full erix-bg-emerald-500/8 erix-border erix-border-emerald-500/15">
              <span className="erix-relative erix-flex erix-size-1.5">
                <span className="erix-animate-ping erix-absolute erix-inline-flex erix-h-full erix-w-full erix-rounded-full erix-bg-emerald-400 erix-opacity-75" />
                <span className="erix-relative erix-inline-flex erix-rounded-full erix-size-1.5 erix-bg-emerald-500" />
              </span>
              <span className="erix-text-[10px] erix-font-black erix-uppercase erix-tracking-widest erix-text-emerald-600/80">
                Syncing
              </span>
            </div>
            <button className="erix-flex erix-items-center erix-gap-1.5 erix-text-xs erix-font-black erix-uppercase erix-tracking-widest erix-text-muted-foreground hover:erix-text-foreground erix-transition-colors">
              <Filter className="erix-size-3 erix-text-primary/60" />
              Filters
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {activePipelineId && (
        <div className="erix-flex-none erix-grid erix-grid-cols-4 erix-border-b erix-border-border erix-bg-muted/5 erix-divide-x erix-divide-border">
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="erix-flex erix-items-center erix-gap-3 erix-px-6 erix-py-4"
            >
              <div
                className={cn(
                  "erix-flex erix-size-10 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-xl",
                  bg,
                  color,
                )}
              >
                <Icon className="erix-size-5" />
              </div>
              <div>
                <p className="erix-text-[10px] erix-font-black erix-uppercase erix-tracking-widest erix-text-muted-foreground/50">
                  {label}
                </p>
                <p className="erix-text-xl erix-font-black erix-tracking-tight">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <main className="erix-flex-1 erix-min-h-0">
        {pipelinesLoading ? (
          <div className="erix-flex erix-h-full erix-items-center erix-justify-center">
            <ErixSpinner size="lg" />
          </div>
        ) : pipelines.length > 0 ? (
          view === "board" ? (
            !activePipelineId ? (
              <div className="erix-flex erix-h-full erix-flex-col erix-items-center erix-justify-center erix-gap-3">
                <LayoutGrid className="erix-size-10 erix-text-muted-foreground/30 erix-mb-2" />
                <p className="erix-text-base erix-font-bold erix-text-foreground">
                  Choose a pipeline to view the board
                </p>
                <p className="erix-text-xs erix-text-muted-foreground erix-max-w-[250px] erix-text-center">
                  The Kanban board requires a specific pipeline to be selected
                  to map stages correctly.
                </p>
              </div>
            ) : (
              <div className="erix-flex erix-h-full erix-flex-col erix-min-h-0 erix-px-6 erix-pt-5 erix-pb-4">
                <KanbanBoard
                  pipelineId={activePipelineId}
                  onLeadOpen={setSelectedLeadId}
                  onAddLead={handleAddLead}
                  onConfigureStages={() => navigateTo("crm", "pipelines")}
                />
              </div>
            )
          ) : (
            <div className="erix-h-full erix-overflow-y-auto erix-px-6 erix-py-5">
              <LeadTable
                leads={leads}
                loading={leadsLoading}
                total={total}
                page={page}
                onPageChange={setPage}
                onOpen={setSelectedLeadId}
                onConvert={convert}
                onArchive={archive}
                onUpdate={update}
                onMove={move}
                pipelines={pipelines}
              />
            </div>
          )
        ) : (
          <div className="erix-flex erix-h-full erix-flex-col erix-items-center erix-justify-center erix-gap-3">
            <p className="erix-text-sm erix-text-muted-foreground">
              No pipelines found.
            </p>
            <button
              onClick={() => navigateTo("crm", "pipelines")}
              className="erix-text-sm erix-text-primary erix-font-semibold hover:erix-underline"
            >
              Create your first pipeline
            </button>
          </div>
        )}
      </main>

      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
      <CreateLeadModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultPipelineId={activePipelineId || undefined}
        defaultStageId={defaultStageId}
      />
    </div>
  );
}
