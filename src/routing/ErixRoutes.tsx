"use client";
import * as React from "react";
import { useErixRouter } from "./RouterContext";
import { resolveRoute } from "./match";

export interface ErixRoutesProps {
  children: React.ReactNode;
}

/**
 * The Erix version of <Routes> or <Switch>.
 * It matches the current physical pathname against either its ErixRoute children
 * OR the manifest configured in the ErixProvider.
 */
export const ErixRoutes: React.FC<ErixRoutesProps> = ({ children }) => {
  const { pathname, routes } = useErixRouter();

  // 1. First, check the centralized manifest
  const resolved = resolveRoute(pathname, routes);
  if (resolved.module) {
    // This is handled by ErixModuleView usually, but we could render here too
    // For now, ErixRoutes is a shell to support declarative sub-routing if needed.
  }

  // 2. Then check children for declarative <ErixRoute>
  let match: React.ReactElement | null = null;

  React.Children.forEach(children, (child) => {
    if (match || !React.isValidElement(child)) return;

    const element = child as React.ReactElement<{ path?: string; element: React.ReactNode }>;
    const { path } = element.props;
    
    if (path && pathname.startsWith(path)) {
      match = element;
    }
  });

  return match ? (match as React.ReactElement<any>).props.element : null;
};
