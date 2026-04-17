"use client";
// src/components/email/TemplateList.tsx
// Searchable, filterable grid of email templates with status/category badges.

import * as React from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Layout,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type {
  EmailTemplateCategory,
  EmailTemplateFilters,
  EmailTemplateStatus,
  EmailTemplateType,
  IEmailTemplate,
} from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  EmailTemplateStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: "Draft",
    icon: Clock,
    className: "erix-text-amber-600 erix-bg-amber-500/10",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    className: "erix-text-emerald-600 erix-bg-emerald-500/10",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "erix-text-muted-foreground erix-bg-muted/50",
  },
};

const CATEGORY_META: Record<EmailTemplateCategory, { label: string }> = {
  marketing: { label: "Marketing" },
  transactional: { label: "Transactional" },
  sequence: { label: "Sequence" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TemplateListProps {
  templates: IEmailTemplate[];
  loading?: boolean;
  error?: string | null;
  filters?: EmailTemplateFilters;
  onFiltersChange?: (filters: EmailTemplateFilters) => void;
  onSelect?: (template: IEmailTemplate) => void;
  onNew?: () => void;
  onDelete?: (id: string) => void;
  onPreview?: (template: IEmailTemplate) => void;
  className?: string;
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onSelect,
  onDelete,
  onPreview,
}: {
  template: IEmailTemplate;
  onSelect?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
}) {
  const status = STATUS_META[template.status];
  const StatusIcon = status.icon;
  const categoryLabel =
    CATEGORY_META[template.category]?.label ?? template.category;

  return (
    <Card
      className="erix-group erix-relative erix-flex erix-flex-col erix-overflow-hidden erix-transition-all erix-duration-200 hover:erix-border-primary/40 hover:erix-shadow-md focus-within:erix-ring-2 focus-within:erix-ring-primary/30"
      aria-label={`Email template: ${template.name}`}
    >
      <div className="erix-flex erix-h-32 erix-items-center erix-justify-center erix-bg-muted/30 erix-overflow-hidden">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={`${template.name} thumbnail`}
            className="erix-h-full erix-w-full erix-object-cover"
          />
        ) : (
          <Mail
            className="erix-h-10 erix-w-10 erix-text-muted-foreground/30"
            aria-hidden="true"
          />
        )}
      </div>

      <CardContent className="erix-flex-1 erix-p-4 erix-pb-3">
        <h3 className="erix-truncate erix-text-sm erix-font-semibold erix-text-foreground erix-leading-tight">
          {template.name}
        </h3>
        {template.description && (
          <p className="erix-mt-1 erix-truncate erix-text-xs erix-text-muted-foreground">
            {template.description}
          </p>
        )}

        <div className="erix-flex erix-flex-wrap erix-gap-1.5 erix-pt-3">
          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn("erix-font-medium", status.className)}
          >
            <StatusIcon
              className="erix-mr-1 erix-h-3 erix-w-3"
              aria-hidden="true"
            />
            {status.label}
          </Badge>

          {/* Category badge */}
          <Badge
            variant="secondary"
            className="erix-bg-primary/10 erix-text-primary hover:erix-bg-primary/10"
          >
            {categoryLabel}
          </Badge>

          {/* Layout badge */}
          {template.type === "layout" && (
            <Badge className="erix-bg-violet-500/10 erix-text-violet-600 hover:erix-bg-violet-500/10 erix-border-none">
              <Layout
                className="erix-mr-1 erix-h-3 erix-w-3"
                aria-hidden="true"
              />
              Layout
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="erix-flex erix-items-center erix-justify-between erix-border-t erix-border-border/50 erix-p-4 erix-py-3 erix-text-xs erix-text-muted-foreground">
        <span>v{template.version}</span>
        <span>
          {new Date(template.updatedAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </span>
      </CardFooter>

      <div className="erix-absolute erix-right-2 erix-top-2 erix-z-[10]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon-xs"
              className="erix-h-7 erix-w-7 erix-bg-background/80 erix-backdrop-blur-sm shadow-sm hover:erix-bg-background"
              aria-label="Template actions"
            >
              <MoreVertical className="erix-h-3.5 erix-w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="erix-w-40">
            {onSelect && (
              <DropdownMenuItem onClick={onSelect}>
                <FileEdit className="erix-mr-2 erix-h-3.5 erix-w-3.5" />
                Edit Template
              </DropdownMenuItem>
            )}
            {onPreview && (
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="erix-mr-2 erix-h-3.5 erix-w-3.5" />
                Preview
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="erix-text-destructive focus:erix-bg-destructive focus:erix-text-destructive-foreground"
                >
                  <Trash2 className="erix-mr-2 erix-h-3.5 erix-w-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Full-card click target */}
      {onSelect && (
        <button
          type="button"
          className="erix-absolute erix-inset-0 erix-z-[1] erix-rounded-xl focus:erix-outline-none"
          onClick={onSelect}
          aria-label={`Open ${template.name}`}
        />
      )}
    </Card>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T | undefined;
  options: Array<{ value: T; label: string }>;
  onChange: (val: T | undefined) => void;
}) {
  return (
    <Select
      value={value ?? "__all__"}
      onValueChange={(v) => onChange(v === "__all__" ? undefined : (v as T))}
    >
      <SelectTrigger
        id={id}
        className="erix-h-9 erix-w-[150px] sm:erix-w-auto erix-max-w-[240px] erix-bg-background"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TemplateList({
  templates,
  loading = false,
  error = null,
  filters = {},
  onFiltersChange,
  onSelect,
  onNew,
  onDelete,
  onPreview,
  className = "",
}: TemplateListProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q),
    );
  }, [templates, search]);

  return (
    <section
      className={[
        "erix-flex erix-flex-col erix-h-full erix-gap-4",
        className,
      ].join(" ")}
      aria-label="Email templates"
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="erix-flex erix-flex-col sm:erix-flex-row erix-items-stretch sm:erix-items-center erix-gap-3">
        {/* Search */}
        <div className="erix-relative erix-flex-1 erix-min-w-48 sm:erix-max-w-xs">
          <Search
            className="erix-pointer-events-none erix-absolute erix-left-3 erix-top-1/2 erix-h-4 erix-w-4 -erix-translate-y-1/2 erix-text-muted-foreground erix-z-10"
            aria-hidden="true"
          />
          <Input
            id="email-template-search"
            type="search"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="erix-h-9 erix-pl-9"
            aria-label="Search email templates"
          />
        </div>

        {/* Status filter */}
        <FilterSelect<EmailTemplateStatus>
          id="email-template-status-filter"
          label="All Statuses"
          value={filters.status}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
          onChange={(v) => onFiltersChange?.({ ...filters, status: v })}
        />

        {/* Category filter */}
        <FilterSelect<EmailTemplateCategory>
          id="email-template-category-filter"
          label="All Categories"
          value={filters.category}
          options={[
            { value: "marketing", label: "Marketing" },
            { value: "transactional", label: "Transactional" },
            { value: "sequence", label: "Sequence" },
          ]}
          onChange={(v) => onFiltersChange?.({ ...filters, category: v })}
        />

        {/* Type filter */}
        <FilterSelect<EmailTemplateType>
          id="email-template-type-filter"
          label="All Types"
          value={filters.type}
          options={[
            { value: "standard", label: "Standard" },
            { value: "layout", label: "Layout" },
          ]}
          onChange={(v) => onFiltersChange?.({ ...filters, type: v })}
        />

        {/* New button */}
        {onNew && (
          <Button
            id="email-template-new-btn"
            onClick={onNew}
            className="erix-w-full sm:erix-w-auto sm:erix-ml-auto erix-shadow-sm"
            size="sm"
          >
            <Plus className="erix-h-4 erix-w-4" aria-hidden="true" />
            New Template
          </Button>
        )}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {error && (
        <p
          role="alert"
          className="erix-rounded-lg erix-bg-destructive/10 erix-p-4 erix-text-sm erix-text-destructive"
        >
          {error}
        </p>
      )}

      {loading && !templates.length ? (
        /* Skeleton grid */
        <div
          className="erix-grid erix-grid-cols-1 erix-gap-4 sm:erix-grid-cols-2 lg:erix-grid-cols-3 xl:erix-grid-cols-4"
          aria-busy="true"
          aria-label="Loading templates"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton only
            <Skeleton key={i} className="erix-h-64 erix-rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-py-20 erix-text-muted-foreground">
          <FileEdit
            className="erix-h-10 erix-w-10 erix-opacity-30"
            aria-hidden="true"
          />
          <p className="erix-text-sm">
            {search ? "No templates match your search." : "No templates yet."}
          </p>
          {!search && onNew && (
            <Button
              variant="link"
              onClick={onNew}
              className="erix-text-primary"
            >
              Create your first template
            </Button>
          )}
        </div>
      ) : (
        <div className="erix-grid erix-grid-cols-1 erix-gap-4 sm:erix-grid-cols-2 lg:erix-grid-cols-3 xl:erix-grid-cols-4 erix-overflow-y-auto">
          {filtered.map((t) => (
            <TemplateCard
              key={t._id}
              template={t}
              onSelect={onSelect ? () => onSelect(t) : undefined}
              onDelete={onDelete ? () => onDelete(t._id) : undefined}
              onPreview={onPreview ? () => onPreview(t) : undefined}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p
          className="erix-text-xs erix-text-muted-foreground"
          aria-live="polite"
        >
          {filtered.length} of {templates.length} template
          {templates.length !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}
