"use client";
// src/components/email/builder/useCanvasState.ts
// Complete editor state management with undo/redo, block CRUD, and drag tracking.
//
// History is stored in a ref (not state) to avoid nested setState calls
// that cause "Maximum update depth exceeded" errors. History changes
// always coincide with editorState changes, so reactivity is preserved.

import * as React from "react";
import type {
  BlockType,
  EditorState,
  EmailBlock,
  EmailDocument,
} from "./types";
import { DEFAULT_DOCUMENT, uid } from "./types";
import { createBlock } from "./blockDefs";

// ─── History helpers ──────────────────────────────────────────────────────────

const MAX_HISTORY = 60;

interface History {
  stack: EmailDocument[];
  index: number;
}

function pushHistory(history: History, doc: EmailDocument): History {
  const trimmed = history.stack.slice(0, history.index + 1);
  const next = [...trimmed, doc].slice(-MAX_HISTORY);
  return { stack: next, index: next.length - 1 };
}

// ─── Block tree helpers ───────────────────────────────────────────────────────

function cloneBlock(block: EmailBlock): EmailBlock {
  return JSON.parse(JSON.stringify(block));
}

/** Insert a block at a specific index (0 = prepend, length = append) */
function insertAtIndex(
  blocks: EmailBlock[],
  newBlock: EmailBlock,
  index: number,
): EmailBlock[] {
  const next = [...blocks];
  next.splice(Math.min(Math.max(0, index), next.length), 0, newBlock);
  return next;
}

/** Insert a block after a given sibling id (null = append) */
function insertAfter(
  blocks: EmailBlock[],
  newBlock: EmailBlock,
  afterId: string | null,
): EmailBlock[] {
  if (afterId === null) return [...blocks, newBlock];
  const idx = blocks.findIndex((b) => b.id === afterId);
  if (idx === -1) return [...blocks, newBlock];
  const next = [...blocks];
  next.splice(idx + 1, 0, newBlock);
  return next;
}

/** Remove block by id (searches nested children too) */
function removeById(blocks: EmailBlock[], id: string): EmailBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) =>
      b.children ? { ...b, children: removeById(b.children, id) } : b,
    );
}

/** Update block by id (searches nested children too) */
function updateById(
  blocks: EmailBlock[],
  id: string,
  updater: (b: EmailBlock) => EmailBlock,
): EmailBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    if (b.children) {
      return { ...b, children: updateById(b.children, id, updater) };
    }
    return b;
  });
}

/** Move block to a specific index (adjusts for removal) */
function moveToIndex(
  blocks: EmailBlock[],
  movingId: string,
  toIndex: number,
): EmailBlock[] {
  const fromIndex = blocks.findIndex((b) => b.id === movingId);
  if (fromIndex === -1) return blocks;
  const arr = [...blocks];
  const [removed] = arr.splice(fromIndex, 1);
  // Adjust target index for removal
  const adjusted = fromIndex < toIndex ? toIndex - 1 : toIndex;
  arr.splice(Math.min(Math.max(0, adjusted), arr.length), 0, removed);
  return arr;
}

/** Swap two adjacent blocks */
function swapBlocks(
  blocks: EmailBlock[],
  id: string,
  direction: "up" | "down",
): EmailBlock[] {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1) return blocks;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return blocks;
  const arr = [...blocks];
  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
  return arr;
}

// ─── Hook interface ───────────────────────────────────────────────────────────

export interface UseCanvasStateReturn {
  editorState: EditorState;

  // Document
  setDocument: (doc: EmailDocument) => void;
  updateDocumentStyle: (
    patch: Partial<
      Pick<EmailDocument, "backgroundColor" | "contentWidth" | "fontFamily">
    >,
  ) => void;

  // Block CRUD
  insertBlock: (type: BlockType, afterId: string | null) => void;
  insertBlockAt: (type: BlockType, index: number, parentId?: string | null) => void;
  insertBlockAfterSelected: (type: BlockType) => void;
  insertRawBlock: (block: EmailBlock, afterId: string | null) => void;
  updateBlock: (id: string, patch: Partial<EmailBlock>) => void;
  updateBlockStyle: (id: string, style: Partial<EmailBlock["style"]>) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;

  // Movement
  moveBlockTo: (movingId: string, toIndex: number, parentId?: string | null) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;

  // Selection
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;

  // Drag tracking
  setDraggingBlockId: (id: string | null) => void;
  setDraggingNewType: (type: BlockType | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Derived
  selectedBlock: EmailBlock | undefined;
  selectedIndex: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCanvasState(
  initialDoc?: Partial<EmailDocument>,
): UseCanvasStateReturn {
  const startDoc: EmailDocument = {
    ...DEFAULT_DOCUMENT,
    ...initialDoc,
  };

  const [editorState, setEditorState] = React.useState<EditorState>({
    document: startDoc,
    selectedId: null,
    hoveredId: null,
    draggingBlockId: null,
    draggingNewType: null,
  });

  // History lives in a ref — avoids nested setState (which causes
  // "Maximum update depth exceeded" when the color picker fires rapidly).
  // Every history mutation is paired with a setEditorState call, so the
  // component always re-renders and the derived canUndo/canRedo stay fresh.
  const historyRef = React.useRef<History>({
    stack: [startDoc],
    index: 0,
  });

  // ── Sync incoming doc (e.g. when loaded from backend) ──────────────────
  React.useEffect(() => {
    if (initialDoc?.blocks !== undefined) {
      const fullDoc = { ...DEFAULT_DOCUMENT, ...initialDoc };
      setEditorState((s) => ({ ...s, document: fullDoc }));
      historyRef.current = { stack: [fullDoc], index: 0 };
    }
    // Only re-run when the blocks array identity changes from backend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialDoc?.blocks)]);

  // ── Document level ──────────────────────────────────────────────────────

  const setDocument = React.useCallback((doc: EmailDocument) => {
    historyRef.current = pushHistory(historyRef.current, doc);
    setEditorState((s) => ({ ...s, document: doc }));
  }, []);

  const updateDocumentStyle = React.useCallback(
    (
      patch: Partial<
        Pick<EmailDocument, "backgroundColor" | "contentWidth" | "fontFamily">
      >,
    ) => {
      setEditorState((s) => {
        const next = { ...s.document, ...patch };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next };
      });
    },
    [],
  );

  // ── Block actions ────────────────────────────────────────────────────────

  /** Insert after a given block id (null = append) */
  const insertBlock = React.useCallback(
    (type: BlockType, afterId: string | null) => {
      const block = createBlock(type);
      setEditorState((s) => {
        const blocks = insertAfter(s.document.blocks, block, afterId);
        const next = { ...s.document, blocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next, selectedId: block.id };
      });
    },
    [],
  );

  /** Insert at a specific index (most reliable for drag-drop) */
  const insertBlockAt = React.useCallback(
    (type: BlockType, index: number, parentId: string | null = null) => {
      const block = createBlock(type);
      setEditorState((s) => {
        let blocks: EmailBlock[];
        if (parentId) {
          blocks = updateById(s.document.blocks, parentId, (p) => ({
            ...p,
            children: insertAtIndex(p.children ?? [], block, index),
          }));
        } else {
          blocks = insertAtIndex(s.document.blocks, block, index);
        }
        const next = { ...s.document, blocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next, selectedId: block.id };
      });
    },
    [],
  );

  /** Insert after currently selected block, or append if nothing selected */
  const insertBlockAfterSelected = React.useCallback((type: BlockType) => {
    const block = createBlock(type);
    setEditorState((s) => {
      // For simplicity, we currently only support insert-after at the root level
      // or within the SAME parent if the selection is nested.
      // To keep it clean, we'll find if the selected block exists anywhere.
      const findParent = (
        arr: EmailBlock[],
      ): { parent: EmailBlock | null; index: number } | null => {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].id === s.selectedId) return { parent: null, index: i };
          if (arr[i].children) {
            const inner = findParent(arr[i].children!);
            if (inner) {
              if (inner.parent === null)
                return { parent: arr[i], index: inner.index };
              return inner;
            }
          }
        }
        return null;
      };

      const loc = s.selectedId ? findParent(s.document.blocks) : null;

      let blocks: EmailBlock[];
      if (loc) {
        if (loc.parent === null) {
          blocks = insertAtIndex(s.document.blocks, block, loc.index + 1);
        } else {
          blocks = updateById(s.document.blocks, loc.parent.id, (p) => ({
            ...p,
            children: insertAtIndex(p.children!, block, loc.index + 1),
          }));
        }
      } else {
        // Fallback to append at root
        blocks = [...s.document.blocks, block];
      }

      const next = { ...s.document, blocks };
      historyRef.current = pushHistory(historyRef.current, next);
      return { ...s, document: next, selectedId: block.id };
    });
  }, []);

  const insertRawBlock = React.useCallback(
    (block: EmailBlock, afterId: string | null) => {
      setEditorState((s) => {
        const blocks = insertAfter(s.document.blocks, block, afterId);
        const next = { ...s.document, blocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next, selectedId: block.id };
      });
    },
    [],
  );

  const updateBlock = React.useCallback(
    (id: string, patch: Partial<EmailBlock>) => {
      setEditorState((s) => {
        const blocks = updateById(s.document.blocks, id, (b) => ({
          ...b,
          ...patch,
        }));
        const next = { ...s.document, blocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next };
      });
    },
    [],
  );

  const updateBlockStyle = React.useCallback(
    (id: string, style: Partial<EmailBlock["style"]>) => {
      setEditorState((s) => {
        const blocks = updateById(s.document.blocks, id, (b) => ({
          ...b,
          style: { ...b.style, ...style },
        }));
        const next = { ...s.document, blocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next };
      });
    },
    [],
  );

  const removeBlock = React.useCallback((id: string) => {
    setEditorState((s) => {
      const blocks = removeById(s.document.blocks, id);
      const next = { ...s.document, blocks };
      historyRef.current = pushHistory(historyRef.current, next);
      return {
        ...s,
        document: next,
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    });
  }, []);

  const duplicateBlock = React.useCallback((id: string) => {
    setEditorState((s) => {
      // Find block anyway in tree
      const find = (arr: EmailBlock[]): EmailBlock | undefined => {
        for (const b of arr) {
          if (b.id === id) return b;
          if (b.children) {
            const res = find(b.children);
            if (res) return res;
          }
        }
        return undefined;
      };

      const orig = find(s.document.blocks);
      if (!orig) return s;

      const copy = { ...cloneBlock(orig), id: uid() };

      // We need to insert it AFTER orig in the SAME parent array
      const insertRecursive = (arr: EmailBlock[]): EmailBlock[] => {
        const idx = arr.findIndex((b) => b.id === id);
        if (idx !== -1) {
          const next = [...arr];
          next.splice(idx + 1, 0, copy);
          return next;
        }
        return arr.map((b) =>
          b.children ? { ...b, children: insertRecursive(b.children) } : b,
        );
      };

      const blocks = insertRecursive(s.document.blocks);
      const next = { ...s.document, blocks };
      historyRef.current = pushHistory(historyRef.current, next);
      return { ...s, document: next, selectedId: copy.id };
    });
  }, []);

  /** Move block; toIndex is the final position in the re-ordered array */
  const moveBlockTo = React.useCallback(
    (movingId: string, toIndex: number, parentId: string | null = null) => {
      setEditorState((s) => {
        // 1. Find the block being moved
        const find = (arr: EmailBlock[]): EmailBlock | undefined => {
          for (const b of arr) {
            if (b.id === movingId) return b;
            if (b.children) {
              const res = find(b.children);
              if (res) return res;
            }
          }
          return undefined;
        };
        const movingBlock = find(s.document.blocks);
        if (!movingBlock) return s;

        // 2. Remove it from current position
        const docWithoutBlock = removeById(s.document.blocks, movingId);

        // 3. Insert it into new position
        let finalBlocks: EmailBlock[];
        if (parentId) {
          finalBlocks = updateById(docWithoutBlock, parentId, (p) => ({
            ...p,
            children: insertAtIndex(p.children ?? [], movingBlock, toIndex),
          }));
        } else {
          finalBlocks = insertAtIndex(docWithoutBlock, movingBlock, toIndex);
        }

        const next = { ...s.document, blocks: finalBlocks };
        historyRef.current = pushHistory(historyRef.current, next);
        return { ...s, document: next };
      });
    },
    [],
  );

  const moveBlockUp = React.useCallback((id: string) => {
    setEditorState((s) => {
      const moveRec = (arr: EmailBlock[]): EmailBlock[] => {
        const idx = arr.findIndex((b) => b.id === id);
        if (idx !== -1) return swapBlocks(arr, id, "up");
        return arr.map((b) =>
          b.children ? { ...b, children: moveRec(b.children) } : b,
        );
      };
      const blocks = moveRec(s.document.blocks);
      const next = { ...s.document, blocks };
      historyRef.current = pushHistory(historyRef.current, next);
      return { ...s, document: next };
    });
  }, []);

  const moveBlockDown = React.useCallback((id: string) => {
    setEditorState((s) => {
      const moveRec = (arr: EmailBlock[]): EmailBlock[] => {
        const idx = arr.findIndex((b) => b.id === id);
        if (idx !== -1) return swapBlocks(arr, id, "down");
        return arr.map((b) =>
          b.children ? { ...b, children: moveRec(b.children) } : b,
        );
      };
      const blocks = moveRec(s.document.blocks);
      const next = { ...s.document, blocks };
      historyRef.current = pushHistory(historyRef.current, next);
      return { ...s, document: next };
    });
  }, []);

  // ── Selection ────────────────────────────────────────────────────────────

  const selectBlock = React.useCallback((id: string | null) => {
    setEditorState((s) => ({ ...s, selectedId: id }));
  }, []);

  const hoverBlock = React.useCallback((id: string | null) => {
    setEditorState((s) => (s.hoveredId === id ? s : { ...s, hoveredId: id }));
  }, []);

  // ── Drag tracking ─────────────────────────────────────────────────────────

  const setDraggingBlockId = React.useCallback((id: string | null) => {
    setEditorState((s) => ({ ...s, draggingBlockId: id }));
  }, []);

  const setDraggingNewType = React.useCallback((type: BlockType | null) => {
    setEditorState((s) => ({ ...s, draggingNewType: type }));
  }, []);

  // ── History ────────────────────────────────────────────────────────────

  const undo = React.useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    historyRef.current = { ...h, index: h.index - 1 };
    const doc = historyRef.current.stack[historyRef.current.index];
    setEditorState((s) => ({ ...s, document: doc }));
  }, []);

  const redo = React.useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    historyRef.current = { ...h, index: h.index + 1 };
    const doc = historyRef.current.stack[historyRef.current.index];
    setEditorState((s) => ({ ...s, document: doc }));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedBlock = React.useMemo(() => {
    if (!editorState.selectedId) return undefined;
    const find = (blocks: EmailBlock[]): EmailBlock | undefined => {
      for (const b of blocks) {
        if (b.id === editorState.selectedId) return b;
        if (b.children) {
          const found = find(b.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return find(editorState.document.blocks);
  }, [editorState.selectedId, editorState.document.blocks]);

  const selectedIndex = React.useMemo(
    () =>
      editorState.selectedId
        ? editorState.document.blocks.findIndex(
            (b) => b.id === editorState.selectedId,
          )
        : -1,
    [editorState.selectedId, editorState.document.blocks],
  );

  // canUndo/canRedo are computed from the ref at render time.
  // Since every history change is paired with a setEditorState call,
  // the component re-renders and these values stay fresh.
  const canUndo = historyRef.current.index > 0;
  const canRedo =
    historyRef.current.index < historyRef.current.stack.length - 1;

  return {
    editorState,
    setDocument,
    updateDocumentStyle,
    insertBlock,
    insertBlockAt,
    insertBlockAfterSelected,
    insertRawBlock,
    updateBlock,
    updateBlockStyle,
    removeBlock,
    duplicateBlock,
    moveBlockTo,
    moveBlockUp,
    moveBlockDown,
    selectBlock,
    hoverBlock,
    setDraggingBlockId,
    setDraggingNewType,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedBlock,
    selectedIndex,
  };
}
