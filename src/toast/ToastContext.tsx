"use client";
// src/toast/ToastContext.tsx
import * as React from "react";
import type { ErixToast, ToastAPI } from "./types";

// Max toasts visible at once
const MAX_TOASTS = 5;

const DEFAULT_DURATIONS: Record<string, number> = {
  success: 3000,
  error:   8000,
  info:    4000,
  warning: 5000,
};

interface ToastContextValue {
  toasts: ErixToast[];
  api:    ToastAPI;
}

const ToastCtx = React.createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useErixToast must be inside ErixProvider");
  return ctx;
}

export function ErixToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ErixToast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: Omit<ErixToast, "id">) => {
      const id = `erix-toast-${Math.random().toString(36).slice(2)}`;
      const duration = toast.duration ?? DEFAULT_DURATIONS[toast.variant] ?? 4000;

      setToasts((prev) => {
        const next = [...prev, { ...toast, id, duration }];
        // Keep max toasts — drop oldest
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const api = React.useMemo<ToastAPI>(
    () => ({
      success: (message, opts) => push({ variant: "success", message, ...opts }),
      error:   (message, opts) => push({ variant: "error",   message, ...opts }),
      info:    (message, opts) => push({ variant: "info",    message, ...opts }),
      warning: (message, opts) => push({ variant: "warning", message, ...opts }),
      dismiss,
      promise: async (p, messages) => {
        const id = push({ variant: "info", message: messages.loading, duration: 0 });
        try {
          const result = await p;
          dismiss(id);
          push({ variant: "success", message: messages.success });
          return result;
        } catch (err) {
          dismiss(id);
          push({ variant: "error", message: messages.error(err as Error) });
          throw err;
        }
      },
    }),
    [push, dismiss],
  );

  return (
    <ToastCtx.Provider value={{ toasts, api }}>
      {children}
    </ToastCtx.Provider>
  );
}
