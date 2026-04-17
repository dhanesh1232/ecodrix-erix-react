"use client";
/**
 * components/router/MarketingRouter.tsx
 * Sub-router for the Marketing module.
 *
 * Sub-path mapping:
 *   ""                   → Marketing Dashboard (redirects to templates for now)
 *   "templates"          → MarketingTemplatesPage (list of templates)
 *   "templates/new"      → TemplateBuilder (create mode)
 *   "templates/:id"      → TemplateBuilder (edit mode)
 *   "broadcasts"         → BroadcastsPlaceholder
 */

import * as React from "react";
import { matchSubPath } from "@/routing/match";
import { useErixRoute, useModuleNavigate } from "@/routing/RouterContext";
import { MarketingTemplatesPage } from "../email/MarketingTemplatesPage";
import { TemplateBuilder } from "../email/TemplateBuilder";
import { Button } from "../ui/button";
import { Mail, Megaphone } from "lucide-react";

// ── Placeholder Views ────────────────────────────────────────────────────────

/**
 * Marketing Dashboard
 *
 * @returns {React.FC}
 */
const MarketingDashboard: React.FC = () => {
  const navigateTo = useModuleNavigate();
  return (
    <div className="erix-p-8 erix-max-w-4xl erix-mx-auto">
      <h1 className="erix-text-3xl erix-font-bold erix-mb-2">Marketing Hub</h1>
      <p className="erix-text-muted-foreground erix-mb-8">
        Manage your multi-channel marketing campaigns and communication
        templates.
      </p>

      <div className="erix-grid erix-grid-cols-1 md:erix-grid-cols-2 erix-gap-6">
        <div className="erix-border erix-rounded-xl erix-p-6 erix-bg-card hover:erix-border-primary/50 erix-transition-colors">
          <Mail className="erix-size-10 erix-text-primary erix-mb-4" />
          <h2 className="erix-text-xl erix-font-semibold erix-mb-2">
            Email Templates
          </h2>
          <p className="erix-text-sm erix-text-muted-foreground erix-mb-6">
            Design and version dynamic email templates with live preview and
            variable mapping.
          </p>
          <Button onClick={() => navigateTo("marketing", "templates")}>
            Manage Templates
          </Button>
        </div>

        <div className="erix-border erix-rounded-xl erix-p-6 erix-bg-card erix-opacity-60">
          <Megaphone className="erix-size-10 erix-text-muted-foreground erix-mb-4" />
          <h2 className="erix-text-xl erix-font-semibold erix-mb-2">
            Broadcasts
          </h2>
          <p className="erix-text-sm erix-text-muted-foreground erix-mb-6">
            Launch bulk email campaigns to your contact lists. (System update
            required)
          </p>
          <Button disabled variant="outline">
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Router Component ─────────────────────────────────────────────────────────

export const MarketingRouter: React.FC = () => {
  const { subPath } = useErixRoute();
  const navigateTo = useModuleNavigate();

  // 1. Root dashboard
  if (!subPath || subPath === "") {
    return <MarketingDashboard />;
  }

  // 2. Templates List
  if (subPath === "templates") {
    return <MarketingTemplatesPage />;
  }

  // 3. Template Builder (New)
  if (subPath === "templates/new") {
    return (
      <TemplateBuilder
        templateId={null}
        onBack={() => navigateTo("marketing", "templates")}
        onCreated={(id: string) => navigateTo("marketing", `templates/${id}`)}
      />
    );
  }

  // 4. Template Builder (Edit)
  const templateParams = matchSubPath(subPath, "templates/:id");
  if (templateParams) {
    return (
      <TemplateBuilder
        templateId={templateParams.id}
        onBack={() => navigateTo("marketing", "templates")}
      />
    );
  }

  // Default fallback
  return <MarketingDashboard />;
};
