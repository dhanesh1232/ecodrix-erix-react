/**
 * routing/types.ts
 * All public types for the Erix module routing system.
 */

/** The built-in module names the package knows how to render. */
export type ErixModuleName =
  | "crm"
  | "analytics"
  | "whatsapp"
  | "meetings"
  | "richtext"
  | "notifications"
  | "marketing";

/**
 * Route configuration supplied by the consumer.
 * Each value is the **URL prefix** in the consumer's app that should
 * activate that module. Trailing slashes are normalised automatically.
 *
 * @example
 * {
 *   crm:       "/admin/leads",      // /admin/leads, /admin/leads/pipeline, /admin/leads/:id
 *   analytics: "/admin/analytics",
 *   whatsapp:  "/admin/chat",
 * }
 */
export interface ErixRouteConfig {
  crm?: string;
  analytics?: string;
  whatsapp?: string;
  meetings?: string;
  richtext?: string;
  notifications?: string;
  marketing?: string;
  [key: string]: string | undefined;
}

/**
 * The result of matching `window.location.pathname` against
 * the consumer's route config.
 */
export interface ResolvedRoute {
  /** Which module matched, or null if nothing matched. */
  module: ErixModuleName | null;
  /** The matched prefix (e.g. "/admin/leads") */
  prefix: string;
  /**
   * Everything after the prefix, without leading slash.
   * e.g. pathname="/admin/leads/pipeline" → subPath="pipeline"
   * e.g. pathname="/admin/leads"          → subPath=""
   */
  subPath: string;
  /**
   * Named params extracted from the subPath by sub-routers.
   * Populated lazily at the module level (e.g. { id: "abc123" }).
   */
  params: Record<string, string>;
}
