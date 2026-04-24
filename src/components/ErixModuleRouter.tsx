"use client";
/**
 * components/ErixModuleRouter.tsx
 *
 * The single all-in-one component for consuming the Erix module system.
 *
 * It:
 *   1. Creates the ErixRouterProvider (so consumers don't need to separately)
 *   2. Renders ErixModuleView which outputs the correct module
 *
 * Analogous to <BrowserRouter> + <Routes> + <Route> all in one.
 *
 * @example — Basic usage
 * <ErixProvider config={erixConfig}>
 *   <ErixModuleRouter
 *     routes={{
 *       crm:       "/admin/leads",
 *       analytics: "/admin/analytics",
 *       whatsapp:  "/admin/chat",
 *       meetings:  "/admin/meetings",
 *     }}
 *   />
 * </ErixProvider>
 *
 * @example — With custom fallback
 * <ErixModuleRouter
 *   routes={{ crm: "/admin/leads" }}
 *   fallback={<EmptyState message="Select a module from the sidebar" />}
 * />
 */

import * as React from "react";
import {
  ErixRouterProvider,
  type ErixRouterProviderProps,
} from "@/routing/RouterContext";
import { ErixModuleView, type ErixModuleViewProps } from "./ErixModuleView";

export interface ErixModuleRouterProps
  extends ErixRouterProviderProps, ErixModuleViewProps {}

export const ErixModuleRouter: React.FC<ErixModuleRouterProps> = ({
  routes,
  fallback,
  className,
  children,
  initialPathname,
}) => {
  return (
    <ErixRouterProvider routes={routes} initialPathname={initialPathname}>
      <ErixModuleView fallback={fallback} className={className} />
      {/* Allow arbitrary children (e.g. sidebar, header) inside the same provider */}
      {children}
    </ErixRouterProvider>
  );
};
