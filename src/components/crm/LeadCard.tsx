"use client";
// src/components/crm/LeadCard.tsx — Compact kanban card
import * as React from "react";
import { Phone, Star, Tag, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/platform";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface LeadCardProps {
  lead: Lead;
  visibleFields?: Set<string>;
  onOpen?: (id: string) => void;
  onConvert?: (id: string, outcome: "won" | "lost") => void;
  onArchive?: (id: string) => void;
  isDragging?: boolean;
}

export function LeadCard({
  lead,
  visibleFields,
  onOpen,
  onConvert,
  onArchive,
  isDragging,
}: LeadCardProps) {
  const name = React.useMemo(
    () =>
      [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown",
    [lead.firstName, lead.lastName],
  );

  const numericScore = React.useMemo(() => {
    if (typeof lead.score === "object" && lead.score !== null) {
      return (lead.score as any).total ?? 0;
    }
    return typeof lead.score === "number" ? lead.score : 0;
  }, [lead.score]);

  const fieldsToRender = React.useMemo(() => {
    const fields: { label: string; value: string; isClass?: string }[] = [];
    if (!visibleFields || visibleFields.has("value")) {
      fields.push({
        label: "Deal Value",
        value: `$${(lead.value || 0).toLocaleString()}`,
      });
    }
    if (!visibleFields || visibleFields.has("source")) {
      fields.push({
        label: "Source",
        value: lead.source || "Organic",
        isClass: "erix-capitalize",
      });
    }

    if (visibleFields && lead.metadata?.extra) {
      Object.entries(lead.metadata.extra).forEach(([k, v]) => {
        if (visibleFields.has(`custom_${k}`)) {
          fields.push({
            label: k.replace(/_/g, " "),
            value: String(v),
          });
        }
      });
    }

    return fields;
  }, [lead, visibleFields]);

  const showTags =
    (visibleFields?.has("tags") ?? false) &&
    Array.isArray(lead.tags) &&
    lead.tags.length > 0;

  return (
    <div
      onClick={() => onOpen?.(lead._id)}
      className={cn(
        "erix-group erix-relative erix-flex erix-flex-col erix-gap-4 erix-rounded-[24px] erix-p-5 erix-transition-all erix-duration-500",
        "erix-bg-card erix-border erix-border-border/50 erix-shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
        "hover:erix-shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:erix-border-primary/40 hover:-erix-translate-y-1.5 erix-cursor-pointer",
        isDragging &&
          "erix-rotate-2 erix-scale-105 erix-shadow-2xl erix-border-primary/60 erix-opacity-95 erix-z-[100]",
      )}
    >
      {/* Dynamic Background Gradient */}
      <div className="erix-absolute erix-inset-0 erix-rounded-[24px] erix-bg-gradient-to-br erix-from-primary/[0.04] erix-via-transparent erix-to-transparent erix-opacity-0 group-hover:erix-opacity-100 transition-opacity duration-500" />

      {/* Top Section: Name & Actions */}
      <div className="erix-flex erix-items-start erix-justify-between erix-gap-3 erix-relative erix-z-10">
        <div className="erix-flex erix-flex-col erix-gap-1 erix-min-w-0">
          <h4 className="erix-text-base erix-font-black erix-tracking-tight erix-text-foreground/90 group-hover:erix-text-primary transition-colors erix-truncate">
            {name}
          </h4>
          <div className="erix-flex erix-items-center erix-gap-2 erix-text-[11px] erix-font-bold erix-text-muted-foreground/60 erix-truncate">
            <div className="erix-flex erix-size-5 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-lg erix-bg-primary/5">
              <Phone className="erix-size-2.5 erix-text-primary/70" />
            </div>
            <span className="erix-truncate">{lead.phone}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => e.stopPropagation()}
              className="erix-flex erix-shrink-0 erix-size-8 erix-items-center erix-justify-center erix-rounded-xl erix-bg-muted/30 erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground erix-transition-all"
            >
              <MoreHorizontal className="erix-size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="erix-w-56 erix-rounded-2xl erix-p-2 erix-shadow-xl"
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs"
              onSelect={() => onOpen?.(lead._id)}
            >
              View Full Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
            <DropdownMenuItem
              className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-emerald-600 focus:erix-text-emerald-600 focus:erix-bg-emerald-50"
              onSelect={() => onConvert?.(lead._id, "won")}
            >
              Convert to Won
            </DropdownMenuItem>
            <DropdownMenuItem
              className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-red-500 focus:erix-text-red-500 focus:erix-bg-red-50"
              onSelect={() => onConvert?.(lead._id, "lost")}
            >
              Mark as Lost
            </DropdownMenuItem>
            <DropdownMenuSeparator className="erix-my-1 erix-opacity-50" />
            <DropdownMenuItem
              className="erix-cursor-pointer erix-rounded-xl erix-py-2.5 erix-px-3 erix-font-bold erix-text-xs erix-text-muted-foreground"
              onSelect={() => onArchive?.(lead._id)}
            >
              Archive Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dynamic Metrics Grid */}
      {fieldsToRender.length > 0 && (
        <div className="erix-grid erix-grid-cols-2 erix-gap-3 erix-relative erix-z-10">
          {fieldsToRender.map((field) => (
            <div
              key={field.label}
              className="erix-flex erix-flex-col erix-gap-1 erix-p-3 erix-rounded-2xl erix-bg-muted/20 erix-border erix-border-border/30 erix-min-w-0"
            >
              <span className="erix-text-[9px] erix-font-black erix-uppercase erix-tracking-[0.15em] erix-text-muted-foreground/50 erix-truncate">
                {field.label}
              </span>
              <span
                className={cn(
                  "erix-text-sm erix-font-black erix-text-foreground/90 erix-truncate",
                  field.isClass,
                )}
                title={field.value}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tags row — only shown when "Tags" field is toggled on */}
      {showTags && (
        <div className="erix-flex erix-flex-wrap erix-gap-1.5 erix-relative erix-z-10">
          {lead.tags!.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="erix-inline-flex erix-items-center erix-gap-1 erix-px-2 erix-py-0.5 erix-rounded-full erix-bg-primary/8 erix-border erix-border-primary/15 erix-text-[9px] erix-font-black erix-text-primary/70 erix-uppercase erix-tracking-wide"
            >
              <Tag className="erix-size-2.5" />
              {tag}
            </span>
          ))}
          {lead.tags!.length > 4 && (
            <span className="erix-inline-flex erix-items-center erix-px-2 erix-py-0.5 erix-rounded-full erix-bg-muted/30 erix-text-[9px] erix-font-black erix-text-muted-foreground/60">
              +{lead.tags!.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bottom Row: Date & Score */}
      <div className="erix-flex erix-items-center erix-justify-between erix-pt-1 erix-relative erix-z-10">
        <div className="erix-flex erix-items-center erix-gap-2">
          <div className="erix-flex erix-size-6 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-lg erix-bg-muted/40">
            <Calendar className="erix-size-3 erix-text-muted-foreground/60" />
          </div>
          <span className="erix-text-[11px] erix-font-black erix-text-muted-foreground/60 erix-truncate">
            {lead.createdAt
              ? new Date(lead.createdAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })
              : "Active"}
          </span>
        </div>

        {/* Score — hidden when 0 (unscored) */}
        {numericScore > 0 && (
          <div
            className={cn(
              "erix-flex erix-shrink-0 erix-items-center erix-gap-1.5 erix-px-3 erix-py-1 erix-rounded-xl erix-text-[11px] erix-font-black erix-border shadow-sm transition-colors",
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
        )}
      </div>
    </div>
  );
}
