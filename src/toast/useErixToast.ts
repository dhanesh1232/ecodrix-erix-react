"use client";
// src/toast/useErixToast.ts
import { useToastContext } from "./ToastContext";
import type { ToastAPI } from "./types";

/**
 * Drop-in toast notification hook.
 *
 * @example
 * ```tsx
 * const toast = useErixToast();
 *
 * // Simple variants
 * toast.success("Lead created!");
 * toast.error("Failed to send message", { duration: 10_000 });
 *
 * // Promise shorthand (loading → success/error)
 * await toast.promise(sdk.crm.leads.create(data), {
 *   loading: "Creating lead...",
 *   success: "Lead created!",
 *   error:   (err) => `Failed: ${err.message}`,
 * });
 * ```
 */
export function useErixToast(): ToastAPI {
  return useToastContext().api;
}
