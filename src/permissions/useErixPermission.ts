"use client";
// src/permissions/useErixPermission.ts
import { usePermissions } from "./PermissionsContext";
import type { ErixPermission } from "./types";

/**
 * Imperative RBAC hook — check permissions in conditions or effects.
 *
 * @example
 * ```tsx
 * const { can, role } = useErixPermission();
 *
 * if (can("crm.leads.delete")) {
 *   // show delete controls
 * }
 * ```
 */
export function useErixPermission() {
  return usePermissions();
}
