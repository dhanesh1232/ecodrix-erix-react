/**
 * routing/match.ts
 * Pure URL-matching utilities — no React, no side-effects.
 */

import type { ErixModuleName, ErixRouteConfig, ResolvedRoute } from "./types";

/** Strip trailing slash, keep root "/" intact. */
export function normalizePrefix(prefix: any): string {
  if (typeof prefix !== "string") return "/";
  return prefix.replace(/\/+$/, "") || "/";
}

/**
 * Test whether `pathname` starts with `prefix`.
 * Returns the remaining sub-path (without leading slash) on match.
 */
export function matchPrefix(
  pathname: string,
  prefix: string,
): { matched: boolean; subPath: string } {
  const norm = normalizePrefix(prefix);

  if (norm === "/") {
    // Root prefix matches everything
    return { matched: true, subPath: pathname.replace(/^\//, "") };
  }

  if (pathname === norm) {
    return { matched: true, subPath: "" };
  }

  if (pathname.startsWith(norm + "/")) {
    return { matched: true, subPath: pathname.slice(norm.length + 1) };
  }

  return { matched: false, subPath: "" };
}

/**
 * Match a sub-path against a simple pattern, extracting named params.
 *
 * Pattern syntax:
 *   "pipeline"     → literal match
 *   ":id"          → named param
 *   ":id/edit"     → named param + literal segment
 *
 * Returns null if the pattern does not match.
 */
export function matchSubPath(
  subPath: string,
  pattern: string,
): Record<string, string> | null {
  const subParts = subPath.split("/").filter(Boolean);
  const patParts = pattern.split("/").filter(Boolean);

  if (subParts.length !== patParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    const pat = patParts[i];
    const seg = subParts[i];
    if (pat.startsWith(":")) {
      params[pat.slice(1)] = decodeURIComponent(seg);
    } else if (pat !== seg) {
      return null;
    }
  }
  return params;
}

/**
 * Walk the route config in insertion order and return the first match.
 * Returns `module: null` when no prefix matches the current pathname.
 */
export function resolveRoute(
  pathname: string,
  routes: ErixRouteConfig,
): ResolvedRoute {
  const entries = Object.entries(routes) as [
    ErixModuleName,
    string | undefined,
  ][];

  for (const [moduleName, prefix] of entries) {
    if (!prefix || typeof prefix !== "string") continue;
    const { matched, subPath } = matchPrefix(pathname, prefix);
    if (matched) {
      return {
        module: moduleName,
        prefix: normalizePrefix(prefix),
        subPath,
        params: {},
      };
    }
  }

  return { module: null, prefix: "", subPath: "", params: {} };
}

/**
 * Build a full URL for a sub-path within a module prefix.
 * e.g. buildModulePath("/admin/leads", "pipeline") → "/admin/leads/pipeline"
 * e.g. buildModulePath("/admin/leads", "") → "/admin/leads"
 */
export function buildModulePath(prefix: string, subPath: string): string {
  const norm = normalizePrefix(prefix);
  if (!subPath) return norm;
  if (subPath.startsWith("?") || subPath.startsWith("#")) {
    return `${norm}${subPath}`;
  }
  return `${norm}/${subPath}`;
}
