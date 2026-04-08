"use client";
/**
 * routing/RouterContext.tsx
 *
 * RouterContext — the heart of Erix module routing.
 *
 * Design principles:
 *  1. No dependency on any third-party router.
 *  2. Uses window.history.pushState / replaceState for navigation.
 *  3. Dispatches a synthetic "popstate" event after pushState so React
 *     state updates happen in the same flush.
 *  4. SSR-safe: guards all window access with typeof checks.
 */

import * as React from "react";
import { buildModulePath, resolveRoute } from "./match";
import type { ErixModuleName, ErixRouteConfig, ResolvedRoute } from "./types";

// ─── Context shape ─────────────────────────────────────────────────────────

interface RouterContextValue {
  /** Current window.location.pathname */
  pathname: string;

  /**
   * Navigate to an absolute path.
   * Uses pushState (or replaceState when replace=true).
   * Works exactly like useNavigate from react-router.
   */
  navigate: (path: string, replace?: boolean) => void;

  /**
   * Navigate to a sub-path within a specific module.
   * Builds the full path from the module prefix automatically.
   *
   * @example
   * navigateTo("crm", "pipeline")  →  history.pushState("/admin/leads/pipeline")
   * navigateTo("crm", "")          →  history.pushState("/admin/leads")
   */
  navigateTo: (module: ErixModuleName, subPath?: string) => void;

  /** Go back one entry in history */
  back: () => void;

  /** The consumer-supplied route config */
  routes: ErixRouteConfig;

  /** Resolved route for the current pathname */
  resolved: ResolvedRoute;
}

const RouterContext = React.createContext<RouterContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export interface ErixRouterProviderProps {
  /** Route config: module name → URL prefix in the consumer's app */
  routes: ErixRouteConfig;
  /** Optional initial pathname (useful for SSR/Next.js hydration) */
  initialPathname?: string;
  children: React.ReactNode;
}

export const ErixRouterProvider: React.FC<ErixRouterProviderProps> = ({
  routes,
  initialPathname,
  children,
}) => {
  const getPathname = () => {
    if (initialPathname) return initialPathname;
    return typeof window !== "undefined" ? window.location.pathname : "/";
  };

  const [pathname, setPathname] = React.useState<string>(getPathname);

  // Sync internal state with prop changes (crucial for Next.js navigation)
  React.useEffect(() => {
    if (initialPathname) {
      setPathname(initialPathname);
    }
  }, [initialPathname]);

  // ── Listen to all navigation events ────────────────────────────────────
  React.useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handler);
    // Some SPAs fire custom events
    window.addEventListener("locationchange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("locationchange", handler);
    };
  }, []);

  // ── Navigation helpers ──────────────────────────────────────────────────
  const navigate = React.useCallback((path: string, replace = false) => {
    if (typeof window === "undefined") return;
    if (replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    // pushState does NOT fire popstate — dispatch it ourselves
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }, []);

  const navigateTo = React.useCallback(
    (module: ErixModuleName, subPath = "") => {
      const prefix = routes[module];
      if (!prefix) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ErixRouter] navigateTo("${module}") called but module is not configured in routes.`,
          );
        }
        return;
      }
      navigate(buildModulePath(prefix, subPath));
    },
    [navigate, routes],
  );

  const back = React.useCallback(() => {
    if (typeof window !== "undefined") window.history.back();
  }, []);

  // ── Resolve current route ───────────────────────────────────────────────
  const resolved = React.useMemo(
    () => resolveRoute(pathname, routes),
    [pathname, routes],
  );

  const value = React.useMemo<RouterContextValue>(
    () => ({ pathname, navigate, navigateTo, back, routes, resolved }),
    [pathname, navigate, navigateTo, back, routes, resolved],
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

function useErixRouter(): RouterContextValue {
  const ctx = React.useContext(RouterContext);
  if (!ctx) {
    throw new Error(
      "[ErixRouter] useErixRouter must be called inside <ErixRouterProvider> or <ErixModuleRouter>.",
    );
  }
  return ctx;
}

/**
 * Navigate to any URL path.
 *
 * @example
 * const navigate = useErixNavigate();
 * navigate("/admin/leads/pipeline");
 * navigate("/admin/leads", true);  // replace current history entry
 */
export function useErixNavigate(): RouterContextValue["navigate"] {
  return useErixRouter().navigate;
}

/**
 * Navigate to a sub-path within a named module.
 * Automatically resolves the correct full URL from the route config.
 *
 * @example
 * const go = useModuleNavigate();
 * go("crm", "pipeline");  // → "/admin/leads/pipeline"
 * go("crm");              // → "/admin/leads"
 */
export function useModuleNavigate(): RouterContextValue["navigateTo"] {
  return useErixRouter().navigateTo;
}

/**
 * Returns the currently resolved route: which module is active,
 * the sub-path within that module, and any extracted params.
 *
 * @example
 * const { module, subPath, params } = useErixRoute();
 * // module === "crm", subPath === "abc123", params === { id: "abc123" }
 */
export function useErixRoute(): ResolvedRoute & { pathname: string } {
  const { resolved, pathname } = useErixRouter();
  return React.useMemo(() => ({ ...resolved, pathname }), [resolved, pathname]);
}

/**
 * Back navigation.
 */
export function useErixBack(): () => void {
  return useErixRouter().back;
}

/**
 * Returns true when the given absolute path (or prefix) is "active".
 * Useful for styling sidebar links.
 *
 * @example
 * const isActive = useIsActive("/admin/leads");  // true for /admin/leads AND /admin/leads/pipeline
 * const isExact  = useIsActive("/admin/leads", true);  // true only for /admin/leads
 */
export function useIsActive(path: string, exact = false): boolean {
  const { pathname } = useErixRouter();
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

/**
 * Internal hook — allows sub-routers to access the router.
 * Not exported in the public API.
 */
export { useErixRouter };
