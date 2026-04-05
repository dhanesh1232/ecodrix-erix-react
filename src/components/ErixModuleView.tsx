"use client";
/**
 * components/ErixModuleView.tsx
 *
 * Renders the correct module component based on the currently resolved route.
 * Wraps every module in:
 *  - React.Suspense    → lazy-load code split per-module
 *  - ErixErrorBoundary → isolate crashes so one module can't break the whole app
 *
 * Must be inside <ErixRouterProvider> (or <ErixModuleRouter>).
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useErixRoute } from "@/routing/RouterContext";
import { ErixErrorBoundary } from "./ErixErrorBoundary";

// ── Lazy-loaded module routers ────────────────────────────────────────────────
// Each router chunk is only downloaded when the user first visits that module.
const CrmRouter       = React.lazy(() => import("./router/CrmRouter").then((m) => ({ default: m.CrmRouter })));
const AnalyticsRouter = React.lazy(() => import("./router/AnalyticsRouter").then((m) => ({ default: m.AnalyticsRouter })));
const WhatsAppRouter  = React.lazy(() => import("./router/WhatsAppRouter").then((m) => ({ default: m.WhatsAppRouter })));
const MeetingsRouter  = React.lazy(() => import("./router/MeetingsRouter").then((m) => ({ default: m.MeetingsRouter })));

const MODULE_ROUTERS = {
  crm:       CrmRouter,
  analytics: AnalyticsRouter,
  whatsapp:  WhatsAppRouter,
  meetings:  MeetingsRouter,
} as const;

// ── Module skeleton loader ────────────────────────────────────────────────────
function ModuleSkeleton() {
  return (
    <div className="erix-flex erix-items-center erix-justify-center erix-h-full erix-min-h-[240px] erix-gap-2 erix-text-muted-foreground">
      <Loader2 className="erix-animate-spin" size={20} />
      <span className="erix-text-sm">Loading module…</span>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
export interface ErixModuleViewProps {
  /** Rendered when no module prefix matches the current URL. */
  fallback?:         React.ReactNode;
  /** Override the wrapper class. */
  className?:        string;
  /** Custom loading skeleton — replaces the default spinner. */
  loadingFallback?:  React.ReactNode;
  /** Custom error UI factory — replaces the default error card. */
  errorFallback?:    (error: Error, reset: () => void) => React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────────
export const ErixModuleView: React.FC<ErixModuleViewProps> = ({
  fallback         = null,
  className,
  loadingFallback  = <ModuleSkeleton />,
  errorFallback,
}) => {
  const { module: activeModule } = useErixRoute();

  if (!activeModule) return <>{fallback}</>;

  const ModuleRouter = MODULE_ROUTERS[activeModule as keyof typeof MODULE_ROUTERS];
  if (!ModuleRouter) return <>{fallback}</>;

  return (
    <div className={className} data-erix-module={activeModule}>
      <ErixErrorBoundary moduleName={activeModule} fallback={errorFallback}>
        <React.Suspense fallback={loadingFallback}>
          <ModuleRouter />
        </React.Suspense>
      </ErixErrorBoundary>
    </div>
  );
};
