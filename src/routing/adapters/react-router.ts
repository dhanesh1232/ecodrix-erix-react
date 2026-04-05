// src/routing/adapters/react-router.ts
// React Router v6+ adapter for @ecodrix/erix-react.
//
// Usage:
//   import { makeReactRouterAdapter } from "@ecodrix/erix-react/adapters/react-router";
//   <ErixModuleRouter adapter={makeReactRouterAdapter(navigate, location)} routes={...} />

import type { RouterAdapter } from "./types";

/**
 * Creates a React Router v6 adapter.
 * Call inside a component that has access to useNavigate + useLocation.
 *
 * @example
 * ```tsx
 * import { useNavigate, useLocation } from "react-router-dom";
 * import { makeReactRouterAdapter } from "@ecodrix/erix-react/adapters/react-router";
 *
 * export function ErixShell() {
 *   const navigate = useNavigate();
 *   const location = useLocation();
 *   const adapter  = makeReactRouterAdapter(navigate, location);
 *
 *   return <ErixModuleRouter adapter={adapter} routes={...} />;
 * }
 * ```
 */
export function makeReactRouterAdapter(
  navigate: (to: string, opts?: { replace?: boolean }) => void,
  location: { pathname: string },
): RouterAdapter {
  return {
    push:     (url) => navigate(url),
    replace:  (url) => navigate(url, { replace: true }),
    back:     ()    => navigate(-1 as any),
    pathname: ()    => location.pathname,
    listen:   (cb) => {
      // React Router handles re-renders on navigation via its own context.
      // This adapter relies on prop changes from the parent component.
      void cb;
      return () => {};
    },
  };
}
