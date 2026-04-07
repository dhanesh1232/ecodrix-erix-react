"use client";
// src/components/crm/LeadCard.tsx — Compact kanban card
import * as React from "react";
import { Phone, Star, Tag, Calendar, MoreHorizontal } from "lucide-react";
import { ErixBadge } from "@/components/ui/erix-badge";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/platform";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface LeadCardProps {
  lead: Lead;
  onOpen?: (id: string) => void;
  onConvert?: (id: string, outcome: "won" | "lost") => void;
  onArchive?: (id: string) => void;
  isDragging?: boolean;
}

const scoreColor = (score: number) =>
  score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "erix-text-red-400";

export function LeadCard({ lead, onOpen, onConvert, onArchive, isDragging }: LeadCardProps) {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  return (
    <div
      className={cn(
        "erix-group erix-relative erix-rounded-xl erix-border erix-border-border erix-bg-card erix-p-3.5 erix-shadow-sm transition-all",
        "hover:erix-border-primary/30 hover:erix-shadow-md hover:erix-shadow-primary/5 erix-cursor-pointer",
        isDragging && "erix-rotate-2 erix-scale-105 erix-shadow-2xl erix-shadow-black/30 erix-border-primary/50",
      )}
      onClick={() => onOpen?.(lead._id)}
    >
      {/* Tag strip */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="mb-2 erix-flex erix-flex-wrap erix-gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <ErixBadge key={tag} variant="ghost" size="sm">
              <Tag className="erix-size-2.5" />
              {tag}
            </ErixBadge>
          ))}
          {lead.tags.length > 3 && (
            <ErixBadge variant="ghost" size="sm">+{lead.tags.length - 3}</ErixBadge>
          )}
        </div>
      )}

      {/* Name + menu */}
      <div className="erix-flex erix-items-start erix-justify-between erix-gap-2">
        <div className="min-w-0">
          <p className="erix-truncate erix-text-sm font-semibold erix-text-foreground erix-leading-tight">{name}</p>
          <div className="mt-0.5 erix-flex erix-items-center erix-gap-1.5 erix-text-xs erix-text-muted-foreground">
            <Phone className="erix-size-3 erix-shrink-0" />
            <span className="erix-truncate">{lead.phone}</span>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="erix-shrink-0 erix-rounded-md erix-p-1 erix-opacity-0 transition-opacity group-hover:erix-opacity-100 hover:erix-bg-muted"
            >
              <MoreHorizontal className="erix-size-4 erix-text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="erix-z-50 erix-min-w-[140px] erix-overflow-hidden erix-rounded-lg erix-border erix-border-border erix-bg-card erix-shadow-xl erix-p-1"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu.Item
              className="erix-flex erix-cursor-pointer erix-items-center erix-gap-2 erix-rounded-md px-2.5 py-1.5 erix-text-xs erix-text-foreground hover:erix-bg-muted erix-outline-none"
              onSelect={() => onOpen?.(lead._id)}
            >Open</DropdownMenu.Item>
            <DropdownMenu.Item
              className="erix-flex erix-cursor-pointer erix-items-center erix-gap-2 erix-rounded-md px-2.5 py-1.5 erix-text-xs erix-text-emerald-400 hover:erix-bg-emerald-500/10 erix-outline-none"
              onSelect={() => onConvert?.(lead._id, "won")}
            >Mark Won</DropdownMenu.Item>
            <DropdownMenu.Item
              className="erix-flex erix-cursor-pointer erix-items-center erix-gap-2 erix-rounded-md px-2.5 py-1.5 erix-text-xs erix-text-red-400 hover:erix-bg-red-500/10 erix-outline-none"
              onSelect={() => onConvert?.(lead._id, "lost")}
            >Mark Lost</DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 erix-border-t erix-border-border" />
            <DropdownMenu.Item
              className="erix-flex erix-cursor-pointer erix-items-center erix-gap-2 erix-rounded-md px-2.5 py-1.5 erix-text-xs erix-text-muted-foreground hover:erix-bg-muted erix-outline-none"
              onSelect={() => onArchive?.(lead._id)}
            >Archive</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      {/* Footer row */}
      <div className="mt-3 erix-flex erix-items-center erix-justify-between">
        <div className="erix-flex erix-items-center erix-gap-1.5">
          {lead.source && (
            <ErixBadge variant="ghost" size="sm">{lead.source}</ErixBadge>
          )}
        </div>
        <div className="erix-flex erix-items-center erix-gap-2">
          {lead.score !== undefined && (
            <span className={cn("erix-flex erix-items-center erix-gap-0.5 erix-text-xs font-semibold", scoreColor(lead.score))}>
              <Star className="erix-size-3 erix-fill-current" />
              {lead.score}
            </span>
          )}
          {lead.createdAt && (
            <span className="erix-flex erix-items-center erix-gap-0.5 erix-text-xs erix-text-muted-foreground">
              <Calendar className="erix-size-2.5" />
              {new Date(lead.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
