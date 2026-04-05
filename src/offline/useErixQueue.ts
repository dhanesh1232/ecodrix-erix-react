"use client";
// src/offline/useErixQueue.ts
// IndexedDB-backed offline mutation queue with automatic retry on reconnect.
import * as React from "react";
import { useErixRealtime } from "@/realtime/useErixRealtime";

export interface QueuedOp {
  id:        string;
  type:      string;       // e.g. "wa.send", "crm.lead.update"
  payload:   unknown;
  createdAt: number;
  retries:   number;
}

const DB_NAME    = "erix-offline-queue";
const STORE_NAME = "ops";
const DB_VERSION = 1;

// ── IndexedDB helpers ──────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbGetAll(): Promise<QueuedOp[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as QueuedOp[]);
    req.onerror   = () => reject(req.error);
  });
}

async function dbPut(op: QueuedOp): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(op);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export interface UseErixQueueReturn {
  /** All pending operations currently queued. */
  queue:     QueuedOp[];
  /** Number of pending operations. */
  count:     number;
  /** Add an operation to the queue. */
  enqueue:   (type: string, payload: unknown) => Promise<string>;
  /** Remove an operation (after successful mutation). */
  dequeue:   (id: string) => Promise<void>;
  /** Manually trigger a flush attempt. */
  flush:     (executor: (op: QueuedOp) => Promise<void>) => Promise<void>;
}

/**
 * IndexedDB-backed offline mutation queue.
 * Automatically flushes pending operations when the socket reconnects.
 *
 * @example
 * ```tsx
 * const { enqueue, count } = useErixQueue();
 *
 * const send = async (text: string) => {
 *   if (!isConnected) {
 *     await enqueue("wa.send", { conversationId, text });
 *     return; // will retry when back online
 *   }
 *   await sdk.whatsapp.messages.send({ ... });
 * };
 *
 * // Offline badge
 * {count > 0 && <span>{count} pending</span>}
 * ```
 */
export function useErixQueue(): UseErixQueueReturn {
  const [queue, setQueue] = React.useState<QueuedOp[]>([]);
  const { isConnected }   = useErixRealtime();

  // Load queue from IndexedDB on mount
  React.useEffect(() => {
    if (typeof indexedDB === "undefined") return;
    dbGetAll().then(setQueue).catch(console.error);
  }, []);

  const enqueue = React.useCallback(async (type: string, payload: unknown): Promise<string> => {
    const op: QueuedOp = {
      id:        `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      createdAt: Date.now(),
      retries:   0,
    };
    await dbPut(op);
    setQueue((prev) => [...prev, op]);
    return op.id;
  }, []);

  const dequeue = React.useCallback(async (id: string) => {
    await dbDelete(id);
    setQueue((prev) => prev.filter((op) => op.id !== id));
  }, []);

  const flush = React.useCallback(
    async (executor: (op: QueuedOp) => Promise<void>) => {
      const ops = await dbGetAll();
      for (const op of ops) {
        try {
          await executor(op);
          await dbDelete(op.id);
          setQueue((prev) => prev.filter((p) => p.id !== op.id));
        } catch {
          // Increment retry counter
          const updated = { ...op, retries: op.retries + 1 };
          await dbPut(updated);
          setQueue((prev) => prev.map((p) => (p.id === op.id ? updated : p)));
        }
      }
    },
    [],
  );

  return { queue, count: queue.length, enqueue, dequeue, flush };
}
