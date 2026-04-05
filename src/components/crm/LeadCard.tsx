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
  score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";

export function LeadCard({ lead, onOpen, onConvert, onArchive, isDragging }: LeadCardProps) {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 cursor-pointer",
        isDragging && "rotate-2 scale-105 shadow-2xl shadow-black/30 border-primary/50",
      )}
      onClick={() => onOpen?.(lead._id)}
    >
      {/* Tag strip */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <ErixBadge key={tag} variant="ghost" size="sm">
              <Tag className="size-2.5" />
              {tag}
            </ErixBadge>
          ))}
          {lead.tags.length > 3 && (
            <ErixBadge variant="ghost" size="sm">+{lead.tags.length - 3}</ErixBadge>
          )}
        </div>
      )}

      {/* Name + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">{name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="size-3 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
            >
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="z-50 min-w-[140px] overflow-hidden rounded-lg border border-border bg-card shadow-xl p-1"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted outline-none"
              onSelect={() => onOpen?.(lead._id)}
            >Open</DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 outline-none"
              onSelect={() => onConvert?.(lead._id, "won")}
            >Mark Won</DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 outline-none"
              onSelect={() => onConvert?.(lead._id, "lost")}
            >Mark Lost</DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 border-t border-border" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted outline-none"
              onSelect={() => onArchive?.(lead._id)}
            >Archive</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {lead.source && (
            <ErixBadge variant="ghost" size="sm">{lead.source}</ErixBadge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lead.score !== undefined && (
            <span className={cn("flex items-center gap-0.5 text-xs font-semibold", scoreColor(lead.score))}>
              <Star className="size-3 fill-current" />
              {lead.score}
            </span>
          )}
          {lead.createdAt && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Calendar className="size-2.5" />
              {new Date(lead.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
