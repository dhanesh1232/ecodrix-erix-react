"use client";
// src/realtime/useErixRealtime.ts
import { useRealtimeContext } from "./RealtimeContext";

/**
 * Access the real-time connection status.
 *
 * @example
 * ```tsx
 * const { isConnected, status } = useErixRealtime();
 *
 * return (
 *   <div className="connection-badge">
 *     {isConnected ? "● Live" : `○ ${status}`}
 *   </div>
 * );
 * ```
 */
export function useErixRealtime() {
  return useRealtimeContext();
}
