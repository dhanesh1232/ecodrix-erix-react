"use client";
// src/permissions/ErixGuard.tsx
import * as React from "react";
import { ShieldOff } from "lucide-react";
import { usePermissions } from "./PermissionsContext";
import type { ErixPermission } from "./types";

export interface ErixGuardProps {
  /** Render children only when this permission is granted. */
  require?:       ErixPermission;
  /** Render children only when ALL of these permissions are granted. */
  requireAll?:    ErixPermission[];
  /** Render children when ANY of these permissions is granted. */
  requireAny?:    ErixPermission[];
  /** Shown in place of children when permission is denied. Default: nothing. */
  fallback?:      React.ReactNode;
  children:       React.ReactNode;
}

/**
 * Declarative RBAC guard. Conditionally renders children based on the current
 * user's permissions. Renders nothing (or a fallback) when access is denied.
 *
 * @example
 * ```tsx
 * <ErixGuard require="crm.leads.create" fallback={<p>No access</p>}>
 *   <CreateLeadButton />
 * </ErixGuard>
 *
 * <ErixGuard requireAny={["crm.leads.edit", "crm.leads.create"]}>
 *   <LeadForm />
 * </ErixGuard>
 * ```
 */
export function ErixGuard({
  require,
  requireAll,
  requireAny,
  fallback = null,
  children,
}: ErixGuardProps) {
  const { can, canAll, canAny } = usePermissions();

  const allowed = React.useMemo(() => {
    if (require    && !can(require))       return false;
    if (requireAll && !canAll(requireAll)) return false;
    if (requireAny && !canAny(requireAny)) return false;
    return true;
  }, [require, requireAll, requireAny, can, canAll, canAny]);

  return <>{allowed ? children : fallback}</>;
}

/**
 * Default "access denied" placeholder — useful as the ErixGuard fallback
 * when you want to surface a visible block rather than silent removal.
 */
export function ErixAccessDenied({ action = "access this feature" }: { action?: string }) {
  return (
    <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-py-12 erix-text-muted-foreground">
      <ShieldOff size={28} />
      <p className="erix-text-sm">You don&apos;t have permission to {action}.</p>
    </div>
  );
}
