"use client";
/**
 * components/email/MarketingTemplatesPage.tsx
 * Standard lander for the Email Templates section of the Marketing module.
 *
 * This component encapsulates the logic previously held by the host app,
 * providing a standardized view for listing and managing templates.
 */

import * as React from "react";
import { useModuleNavigate } from "@/routing/RouterContext";
import { useEmailTemplates } from "@/hooks/email/useEmailTemplates";
import type { EmailTemplateFilters, IEmailTemplate } from "@/types/email";
import { TemplateList } from "./TemplateList";
import { useErixToast } from "@/toast/useErixToast";

export function MarketingTemplatesPage() {
  const navigateTo = useModuleNavigate();
  const toast = useErixToast();
  const [filters, setFilters] = React.useState<EmailTemplateFilters>({});

  const { templates, loading, error, remove } = useEmailTemplates(filters);

  const handleSelect = (template: IEmailTemplate) => {
    navigateTo("marketing", `templates/${template._id}`);
  };

  const handleNew = () => {
    navigateTo("marketing", "templates/new");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      await remove(id);
      toast.success("Template deleted successfully");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message ?? "Unknown error"}`);
    }
  };

  const handlePreview = (template: IEmailTemplate) => {
    // Open builder in preview mode (logic for preview flag can be handled in builder or via query param)
    navigateTo("marketing", `templates/${template._id}?preview=true`);
  };

  return (
    <div className="erix-flex erix-flex-col erix-h-full erix-p-6 erix-gap-6">
      {/* Page header */}
      <div>
        <h1 className="erix-text-2xl erix-font-bold erix-text-foreground">Email Templates</h1>
        <p className="erix-text-sm erix-text-muted-foreground erix-mt-1">
          Build and manage reusable email templates with dynamic variable mapping.
        </p>
      </div>

      {/* Template list */}
      <TemplateList
        templates={templates}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onPreview={handlePreview}
        className="erix-flex-1"
      />
    </div>
  );
}
