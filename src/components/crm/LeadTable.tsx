"use client";
// packages/erix-react/src/components/crm/LeadTable.tsx
import * as React from "react";
import {
  Phone,
  Mail,
  Star,
  MoreHorizontal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Archive,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import type { Lead, Pipeline } from "@/types/platform";

export interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (leadId: string) => void;
  onConvert: (leadId: string, outcome: "won" | "lost") => void;
  onArchive: (leadId: string) => void;
  onUpdate?: (leadId: string, data: Partial<Lead>) => void;
  onMove?: (leadId: string, stageId: string) => void;
  pipelines?: Pipeline[];
}

const statusColors: Record<string, string> = {
  new: "erix-bg-blue-500/10 erix-text-blue-500 erix-border-blue-500/20",
  contacted:
    "erix-bg-amber-500/10 erix-text-amber-500 erix-border-amber-500/20",
  qualified:
    "erix-bg-purple-500/10 erix-text-purple-500 erix-border-purple-500/20",
  won: "erix-bg-emerald-500/10 erix-text-emerald-500 erix-border-emerald-500/20",
  lost: "erix-bg-red-500/10 erix-text-red-500 erix-border-red-500/20",
};

type ColumnKey =
  | "status"
  | "contact"
  | "source"
  | "score"
  | "pipeline"
  | "stage"
  | "added"
  | string;

export function LeadTable({
  leads,
  loading,
  total,
  page,
  onPageChange,
  onOpen,
  onConvert,
  onArchive,
  onUpdate,
  onMove,
  pipelines = [],
}: LeadTableProps) {
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Extract custom fields from all leads
  const customFields = React.useMemo(() => {
    const fields = new Set<string>();
    leads.forEach((l) => {
      if (l.metadata?.extra) {
        Object.keys(l.metadata.extra).forEach((k) => fields.add(k));
      }
    });
    return Array.from(fields);
  }, [leads]);

  // View state for columns
  const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnKey>>(
    new Set(["status", "contact", "source", "score", "pipeline"]),
  );

  const toggleColumn = (col: ColumnKey) => {
    const next = new Set(visibleColumns);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    setVisibleColumns(next);
  };

  const getPipelineName = (pipelineId?: any) => {
    const id = typeof pipelineId === "object" ? pipelineId?._id : pipelineId;
    if (!id) return "No Pipeline";
    const pipeline = pipelines.find((p) => p._id === id);
    if (!pipeline) return "Pipeline Not Found";
    return pipeline.name;
  };

  const getStageName = (pipelineId?: any, stageId?: any) => {
    const pId = typeof pipelineId === "object" ? pipelineId?._id : pipelineId;
    const sId = typeof stageId === "object" ? stageId?._id : stageId;
    if (!pId || !sId) return "No Stage";
    const pipeline = pipelines.find((p) => p._id === pId);
    if (!pipeline) return "Pipeline Not Found";
    const stage = pipeline.stages?.find((s: any) => s._id === sId);
    if (!stage) return "Stage Not Found";
    return stage.name;
  };

  return (
    <div className="erix-w-full erix-space-y-4">
      {/* Toolbar */}
      <div className="erix-flex erix-items-center erix-justify-end erix-mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="erix-h-8 erix-gap-2 erix-rounded-lg erix-text-xs erix-font-bold erix-border-border/60 hover:erix-bg-muted/50"
            >
              <Settings2 className="erix-size-3.5" />
              Columns
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
              checked={visibleColumns.has("status")}
              onCheckedChange={() => toggleColumn("status")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("pipeline")}
              onCheckedChange={() => toggleColumn("pipeline")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Pipeline
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("stage")}
              onCheckedChange={() => toggleColumn("stage")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Stage
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("contact")}
              onCheckedChange={() => toggleColumn("contact")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Contact (Email/Phone)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("source")}
              onCheckedChange={() => toggleColumn("source")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Source
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("score")}
              onCheckedChange={() => toggleColumn("score")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Score
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.has("added")}
              onCheckedChange={() => toggleColumn("added")}
              className="erix-text-xs erix-font-bold erix-rounded-lg"
            >
              Date Added
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
                    checked={visibleColumns.has(`custom_${field}`)}
                    onCheckedChange={() => toggleColumn(`custom_${field}`)}
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

      <div className="erix-rounded-2xl erix-border erix-bg-card erix-overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:erix-bg-transparent">
              <TableHead className="erix-w-[280px]">Lead</TableHead>
              {visibleColumns.has("status") && <TableHead>Status</TableHead>}
              {visibleColumns.has("pipeline") && (
                <TableHead>Pipeline</TableHead>
              )}
              {visibleColumns.has("stage") && <TableHead>Stage</TableHead>}
              {visibleColumns.has("contact") && <TableHead>Contact</TableHead>}
              {visibleColumns.has("source") && <TableHead>Source</TableHead>}
              {visibleColumns.has("score") && <TableHead>Score</TableHead>}
              {visibleColumns.has("added") && <TableHead>Added On</TableHead>}
              {customFields.map(
                (f) =>
                  visibleColumns.has(`custom_${f}`) && (
                    <TableHead key={f} className="erix-capitalize">
                      {f.replace(/_/g, " ")}
                    </TableHead>
                  ),
              )}
              <TableHead className="erix-text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10} className="erix-h-16">
                    <div className="erix-flex erix-items-center erix-space-x-4 erix-animate-pulse">
                      <div className="erix-size-10 erix-rounded-full erix-bg-muted" />
                      <div className="erix-space-y-2">
                        <div className="erix-h-4 erix-w-[150px] erix-rounded erix-bg-muted" />
                        <div className="erix-h-3 erix-w-[100px] erix-rounded erix-bg-muted" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="erix-h-32 erix-text-center erix-text-muted-foreground"
                >
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const pId =
                  typeof lead.pipelineId === "object"
                    ? (lead.pipelineId as any)?._id
                    : lead.pipelineId;
                const sId =
                  typeof lead.stageId === "object"
                    ? (lead.stageId as any)?._id
                    : lead.stageId;

                const name =
                  [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
                  "Unknown";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const numericScore = (() => {
                  if (typeof lead.score === "object" && lead.score !== null) {
                    return (lead.score as any).total ?? 0;
                  }
                  return typeof lead.score === "number" ? lead.score : 0;
                })();

                return (
                  <TableRow
                    key={lead._id}
                    className="erix-group erix-cursor-pointer erix-border-border/40 hover:erix-bg-muted/30 transition-colors"
                    onClick={() => onOpen(lead._id)}
                  >
                    <TableCell className="erix-py-4 erix-align-top">
                      <div className="erix-flex erix-items-center erix-gap-4">
                        <div className="erix-flex erix-size-10 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-xl erix-bg-primary/5 erix-text-xs erix-font-black erix-text-primary group-hover:erix-scale-110 erix-transition-transform">
                          {initials}
                        </div>
                        <div className="erix-flex erix-flex-col erix-gap-0.5">
                          <span className="erix-font-black erix-text-sm erix-text-foreground group-hover:erix-text-primary transition-colors">
                            {name}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {visibleColumns.has("status") && (
                      <TableCell className="erix-align-top erix-pt-5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "erix-rounded-lg erix-border erix-px-2.5 erix-py-0.5 erix-text-[10px] erix-font-black erix-uppercase erix-tracking-widest erix-shadow-sm",
                            statusColors[lead.status] ||
                              "erix-bg-muted erix-text-muted-foreground",
                          )}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                    )}

                    {visibleColumns.has("pipeline") && (
                      <TableCell
                        className="erix-align-top erix-pt-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger className="erix-flex erix-items-center erix-gap-1 hover:erix-text-primary transition-colors erix-cursor-pointer select-none erix-text-xs erix-font-bold erix-text-foreground/80 erix-outline-none">
                            {getPipelineName(pId)}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="erix-w-48 erix-rounded-xl erix-p-1.5"
                          >
                            <DropdownMenuLabel className="erix-px-2 erix-py-1.5 erix-text-xs erix-text-muted-foreground erix-font-semibold">
                              Change Pipeline
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="erix-my-1" />
                            {pipelines.map((p) => (
                              <DropdownMenuItem
                                key={p._id}
                                onSelect={() => {
                                  if (onUpdate && p._id !== pId) {
                                    onUpdate(lead._id, {
                                      pipelineId: p._id,
                                      stageId: p.stages?.[0]?._id,
                                    });
                                  }
                                }}
                                className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-text-xs erix-font-bold"
                              >
                                {p.name}
                                {p._id === pId && (
                                  <div className="erix-ml-auto erix-size-2 erix-rounded-full erix-bg-primary" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}

                    {visibleColumns.has("stage") && (
                      <TableCell
                        className="erix-align-top erix-pt-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger className="erix-outline-none erix-bg-muted/50 erix-px-2 erix-py-1 erix-rounded-md erix-border erix-border-border/40 erix-text-xs erix-font-bold erix-text-foreground/80 hover:erix-bg-muted erix-transition-colors erix-flex erix-items-center erix-gap-1">
                            {getStageName(pId, sId)}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="erix-w-48 erix-rounded-xl erix-p-1.5"
                          >
                            <DropdownMenuLabel className="erix-px-2 erix-py-1.5 erix-text-xs erix-text-muted-foreground erix-font-semibold">
                              Change Stage
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="erix-my-1" />
                            {pipelines.map((p) => (
                              <DropdownMenuSub key={p._id}>
                                <DropdownMenuSubTrigger className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-text-xs erix-font-bold">
                                  {p.name}
                                  {p._id === pId && (
                                    <div className="erix-ml-auto erix-size-2 erix-rounded-full erix-bg-primary erix-mr-2" />
                                  )}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="erix-w-48 erix-rounded-xl erix-p-1.5 erix-z-50">
                                    {p.stages?.map((stage: any) => (
                                      <DropdownMenuItem
                                        key={stage._id}
                                        onSelect={() => {
                                          if (p._id !== pId) {
                                            if (onUpdate)
                                              onUpdate(lead._id, {
                                                pipelineId: p._id,
                                                stageId: stage._id,
                                              });
                                          } else if (stage._id !== sId) {
                                            if (onMove)
                                              onMove(lead._id, stage._id);
                                          }
                                        }}
                                        className="erix-cursor-pointer erix-rounded-lg erix-py-2 erix-px-3 erix-text-xs erix-font-bold"
                                      >
                                        {stage.name}
                                        {p._id === pId && stage._id === sId && (
                                          <div className="erix-ml-auto erix-size-2 erix-rounded-full erix-bg-primary" />
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}

                    {visibleColumns.has("contact") && (
                      <TableCell className="erix-align-top erix-pt-4">
                        <div className="erix-flex erix-flex-col erix-gap-1.5">
                          <div className="erix-flex erix-items-center erix-gap-2.5 erix-text-xs erix-font-bold erix-text-muted-foreground/80">
                            <div className="erix-flex erix-size-5 erix-items-center erix-justify-center erix-rounded-md erix-bg-muted/50">
                              <Phone className="erix-size-2.5" />
                            </div>
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="erix-flex erix-items-center erix-gap-2.5 erix-text-xs erix-font-bold erix-text-muted-foreground/80">
                              <div className="erix-flex erix-size-5 erix-items-center erix-justify-center erix-rounded-md erix-bg-muted/50">
                                <Mail className="erix-size-2.5" />
                              </div>
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has("source") && (
                      <TableCell className="erix-align-top erix-pt-5">
                        <div className="erix-flex erix-items-center erix-gap-2">
                          <div className="erix-size-1.5 erix-rounded-full erix-bg-primary/30" />
                          <span className="erix-text-xs erix-font-black erix-text-foreground/70 erix-capitalize">
                            {lead.source || "Organic"}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has("score") && (
                      <TableCell className="erix-align-top erix-pt-5">
                        <div className="erix-flex erix-items-center erix-gap-2">
                          <div
                            className={cn(
                              "erix-flex erix-items-center erix-gap-1.5 erix-px-2.5 erix-py-1 erix-rounded-lg erix-text-[11px] erix-font-black erix-border shadow-sm",
                              numericScore >= 70
                                ? "erix-bg-emerald-500/10 erix-text-emerald-600 erix-border-emerald-500/20"
                                : numericScore >= 40
                                  ? "erix-bg-amber-500/10 erix-text-amber-600 erix-border-amber-500/20"
                                  : "erix-bg-slate-500/10 erix-text-slate-600 erix-border-slate-500/20",
                            )}
                          >
                            <Star
                              className={cn(
                                "erix-size-3",
                                numericScore >= 40 && "erix-fill-current",
                              )}
                            />
                            {numericScore}
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has("added") && (
                      <TableCell className="erix-align-top erix-pt-5">
                        <span className="erix-text-xs erix-font-bold erix-text-muted-foreground">
                          {lead.createdAt &&
                            new Date(lead.createdAt).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                        </span>
                      </TableCell>
                    )}

                    {customFields.map(
                      (f) =>
                        visibleColumns.has(`custom_${f}`) && (
                          <TableCell
                            key={f}
                            className="erix-align-top erix-pt-5"
                          >
                            <span className="erix-text-xs erix-font-bold erix-text-foreground/80">
                              {(lead.metadata?.extra?.[f] as string) ?? "-"}
                            </span>
                          </TableCell>
                        ),
                    )}

                    <TableCell className="erix-text-right erix-align-top erix-pt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="erix-size-9 erix-rounded-xl hover:erix-bg-muted/50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="erix-size-4 erix-text-muted-foreground/60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="erix-w-56 erix-rounded-2xl erix-p-2 erix-shadow-xl"
                        >
                          <DropdownMenuItem
                            onSelect={() => onOpen(lead._id)}
                            className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs"
                          >
                            <ExternalLink className="erix-mr-2.5 erix-size-3.5 erix-text-primary/70" />
                            View Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
                          <DropdownMenuItem
                            onSelect={() => onConvert(lead._id, "won")}
                            className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-emerald-600 focus:erix-text-emerald-600 focus:erix-bg-emerald-50"
                          >
                            <CheckCircle2 className="erix-mr-2.5 erix-size-3.5" />
                            Mark as Won
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onConvert(lead._id, "lost")}
                            className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-red-500 focus:erix-text-red-500 focus:erix-bg-red-50"
                          >
                            <XCircle className="erix-mr-2.5 erix-size-3.5" />
                            Mark as Lost
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
                          <DropdownMenuItem
                            onSelect={() => onArchive(lead._id)}
                            className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-muted-foreground"
                          >
                            <Archive className="erix-mr-2.5 erix-size-3.5" />
                            Archive Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="erix-flex erix-items-center erix-justify-between erix-px-2">
          <p className="erix-text-xs erix-text-muted-foreground">
            Showing{" "}
            <span className="erix-font-medium">{(page - 1) * limit + 1}</span>{" "}
            to{" "}
            <span className="erix-font-medium">
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="erix-font-medium">{total}</span> leads
          </p>
          <div className="erix-flex erix-items-center erix-gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="erix-size-4" />
            </Button>
            <span className="erix-text-xs erix-font-bold erix-px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="erix-size-4" />
            </Button>{" "}
          </div>
        </div>
      )}
    </div>
  );
}
