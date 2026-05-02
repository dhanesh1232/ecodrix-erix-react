"use client";
// src/toast/ErixToaster.tsx — Animated toast portal
import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastContext } from "./ToastContext";
import type { ErixToast, ToastVariant } from "./types";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle     size={16} />,
  info:    <Info         size={16} />,
  warning: <AlertTriangle size={16} />,
};

const COLOR_MAP: Record<ToastVariant, string> = {
  success: "erix-toast--success",
  error:   "erix-toast--error",
  info:    "erix-toast--info",
  warning: "erix-toast--warning",
};

// ── Single toast item ──────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: ErixToast; onDismiss: () => void }) {
  const [exiting, setExiting] = React.useState(false);

  const dismiss = React.useCallback(() => {
    setExiting(true);
    setTimeout(onDismiss, 220); // allow CSS exit animation
  }, [onDismiss]);

  return (
    <div
      data-exiting={exiting}
      className={`erix-toast ${COLOR_MAP[toast.variant]}`}
      role="status"
      aria-live="polite"
    >
      <span className="erix-toast__icon">{ICONS[toast.variant]}</span>
      <span className="erix-toast__message">{toast.message}</span>

      {toast.action && (
        <button
          type="button"
          className="erix-toast__action"
          onClick={() => {
            toast.action!.onClick();
            dismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        aria-label="Dismiss"
        className="erix-toast__close"
        onClick={dismiss}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Portal ────────────────────────────────────────────────────────────────────
export function ErixToaster() {
  const { toasts, api } = useToastContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="erix-toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => api.dismiss(t.id)} />
      ))}
    </div>,
    document.body,
  );
}
