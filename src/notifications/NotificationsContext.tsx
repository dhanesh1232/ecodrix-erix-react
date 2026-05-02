"use client";
// src/notifications/NotificationsContext.tsx
// Aligned with backend: /api/crm/notifications (notification.routes.ts)
// Socket events: "notification:new" | "notification:dismissed" | "notification:resolved"
import * as React from "react";
import { useErixClient } from "../context/ErixProvider";
import type { ErixNotification } from "./types";

// ─── Public interface ─────────────────────────────────────────────────────────
export interface NotificationsContextValue {
  notifications: ErixNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  /** Mark single notification dismissed (backend: PATCH /api/crm/notifications/:id/dismiss) */
  dismiss: (id: string) => Promise<void>;
  /** Clear all notifications (backend: DELETE /api/crm/notifications/clear-all) */
  dismissAll: () => Promise<void>;
  /** Retry a failed action (backend: POST /api/crm/notifications/:id/retry) */
  retry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsCtx = React.createContext<NotificationsContextValue | null>(
  null,
);

export function useErixNotifications(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsCtx);
  if (!ctx)
    throw new Error("useErixNotifications must be used inside <ErixProvider>");
  return ctx;
}

const POLL_INTERVAL_MS = 60_000;

export function NotificationsProvider({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const sdk = useErixClient();

  const [notifications, setNotifications] = React.useState<ErixNotification[]>(
    [],
  );
  const [loading, setLoading] = React.useState(!disabled);
  const [error, setError] = React.useState<Error | null>(null);

  // ── Fetch from correct endpoint via typed SDK method ─────────────────────
  const fetchNotifications = React.useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      setError(null);
      // Uses ecod.notifications.listAlerts() → GET /api/crm/notifications
      const res = await sdk.notifications.listAlerts<{
        data: ErixNotification[];
      }>();
      // Backend returns { success: true, data: [...] }
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data)) {
        // Normalise _id → id for React key usage
        setNotifications(data.map((n: any) => ({ ...n, id: n._id ?? n.id })));
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      console.error("[ErixNotifications] fetch failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Polling fallback when socket is disconnected
  React.useEffect(() => {
    const id = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // ── Real-time socket listeners ────────────────────────────────────────────
  // Backend emits "notification:new", "notification:dismissed", "notification:resolved"
  React.useEffect(() => {
    if (disabled) return;
    const onNew = (data: unknown) => {
      const notif = data as ErixNotification;
      const normalized = { ...notif, id: (notif as any)._id ?? notif.id };
      setNotifications((prev) => {
        // Deduplicate on reconnect
        if (prev.some((n) => n.id === normalized.id)) return prev;
        return [normalized, ...prev];
      });
    };

    const onDismissed = (data: { id: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.id ? { ...n, status: "dismissed" as const } : n,
        ),
      );
    };

    const onDismissedAll = () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "dismissed" as const })),
      );
    };

    const onResolved = (data: { id: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.id ? { ...n, status: "resolved" as const } : n,
        ),
      );
    };

    sdk.on("notification:new", onNew);
    sdk.on("notification:dismissed", onDismissed);
    sdk.on("notification:dismissed_all", onDismissedAll);
    sdk.on("notification:resolved", onResolved);

    return () => {
      sdk.off?.("notification:new", onNew);
      sdk.off?.("notification:dismissed", onDismissed);
      sdk.off?.("notification:dismissed_all", onDismissedAll);
      sdk.off?.("notification:resolved", onResolved);
    };
  }, [sdk]);

  // ── Mutations — use typed SDK methods ─────────────────────────────────────
  const dismiss = React.useCallback(
    async (id: string) => {
      // Optimistic
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: "dismissed" as const } : n,
        ),
      );
      try {
        // PATCH /api/crm/notifications/:id/dismiss
        await sdk.notifications.dismissAlert(id);
      } catch (err) {
        console.error("[ErixNotifications] dismiss failed:", err);
        void fetchNotifications();
      }
    },
    [sdk, fetchNotifications],
  );

  const dismissAll = React.useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "dismissed" as const })),
    );
    try {
      // DELETE /api/crm/notifications/clear-all
      await sdk.notifications.clearAllAlerts();
    } catch (err) {
      console.error("[ErixNotifications] dismissAll failed:", err);
      void fetchNotifications();
    }
  }, [sdk, fetchNotifications]);

  const retry = React.useCallback(
    async (id: string) => {
      try {
        // POST /api/crm/notifications/:id/retry
        await sdk.notifications.retryAction(id);
        // Status update comes back via socket "notification:resolved"
      } catch (err) {
        console.error("[ErixNotifications] retry failed:", err);
      }
    },
    [sdk],
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const unreadCount = React.useMemo(
    () => notifications.filter((n) => n.status === "unread").length,
    [notifications],
  );

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      dismiss,
      dismissAll,
      retry,
      refresh: fetchNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      dismiss,
      dismissAll,
      retry,
      fetchNotifications,
    ],
  );

  return (
    <NotificationsCtx.Provider value={value}>
      {children}
    </NotificationsCtx.Provider>
  );
}
