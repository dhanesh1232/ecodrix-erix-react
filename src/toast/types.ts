// src/toast/types.ts

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ErixToastAction {
  label:   string;
  onClick: () => void;
}

export interface ErixToast {
  id:        string;
  variant:   ToastVariant;
  message:   string;
  action?:   ErixToastAction;
  duration?: number; // ms — 0 = persistent
}

export interface ToastAPI {
  success: (message: string, opts?: Partial<Pick<ErixToast, "action" | "duration">>) => void;
  error:   (message: string, opts?: Partial<Pick<ErixToast, "action" | "duration">>) => void;
  info:    (message: string, opts?: Partial<Pick<ErixToast, "action" | "duration">>) => void;
  warning: (message: string, opts?: Partial<Pick<ErixToast, "action" | "duration">>) => void;
  promise: <T>(
    p: Promise<T>,
    messages: { loading: string; success: string; error: (err: Error) => string },
  ) => Promise<T>;
  dismiss: (id: string) => void;
}
