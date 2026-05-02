"use client";
// src/permissions/PermissionsContext.tsx
import * as React from "react";
import { type ErixPermission, type ErixRolePreset, ROLE_PERMISSION_MAP } from "./types";

// ── Context ───────────────────────────────────────────────────────────────────
export interface PermissionsContextValue {
  permissions: Set<ErixPermission>;
  role:        ErixRolePreset;
  /** Check a single required permission. */
  can:         (permission: ErixPermission) => boolean;
  /** Check that ALL of the given permissions are granted. */
  canAll:      (permissions: ErixPermission[]) => boolean;
  /** Check that ANY of the given permissions is granted. */
  canAny:      (permissions: ErixPermission[]) => boolean;
}

const PermissionsCtx = React.createContext<PermissionsContextValue | null>(null);

export function usePermissions(): PermissionsContextValue {
  const ctx = React.useContext(PermissionsCtx);
  if (!ctx) throw new Error("useErixPermission must be inside ErixPermissionsProvider");
  return ctx;
}

// ── Provider props ────────────────────────────────────────────────────────────
export interface ErixPermissionsProviderProps {
  /** Role preset — resolves a default permission set. */
  role:         ErixRolePreset;
  /**
   * Additional permissions to grant on top of the role preset.
   * Also used as the entire permission list when role = "custom".
   */
  permissions?: ErixPermission[];
  /** Permissions to explicitly revoke from the role preset. */
  deny?:        ErixPermission[];
  children:     React.ReactNode;
}

export function ErixPermissionsProvider({
  role,
  permissions: extra = [],
  deny = [],
  children,
}: ErixPermissionsProviderProps) {
  const permSet = React.useMemo<Set<ErixPermission>>(() => {
    const base  = new Set<ErixPermission>(ROLE_PERMISSION_MAP[role]);
    for (const p of extra) base.add(p);
    for (const p of deny)  base.delete(p);
    return base;
  }, [role, extra, deny]);

  const can    = React.useCallback((p: ErixPermission) => permSet.has(p),     [permSet]);
  const canAll = React.useCallback((ps: ErixPermission[]) => ps.every(can),   [can]);
  const canAny = React.useCallback((ps: ErixPermission[]) => ps.some(can),    [can]);

  const value = React.useMemo<PermissionsContextValue>(
    () => ({ permissions: permSet, role, can, canAll, canAny }),
    [permSet, role, can, canAll, canAny],
  );

  return <PermissionsCtx.Provider value={value}>{children}</PermissionsCtx.Provider>;
}
