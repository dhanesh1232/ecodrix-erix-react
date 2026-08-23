/**
 * CollaborationOverlay Component
 * 
 * Main overlay component that renders all remote cursors and selections.
 * Integrates with CursorManager and SelectionManager to display real-time
 * collaboration indicators.
 * 
 * Features:
 * - Renders all remote cursors
 * - Renders all remote selections
 * - Automatic updates on cursor/selection changes
 * - Configurable appearance
 * - Performance optimized with React.memo
 * 
 * Requirements: 4.1, 4.2
 */

import React, { useEffect, useState, useRef } from 'react';
import { RemoteCursor } from './RemoteCursor';
import { RemoteSelection } from './RemoteSelection';
import type { CursorManager, RemoteCursor as RemoteCursorType } from './CursorManager';
import type { SelectionManager, RemoteSelection as RemoteSelectionType } from './SelectionManager';

/**
 * Props for CollaborationOverlay component
 */
export interface CollaborationOverlayProps {
  /** CursorManager instance */
  cursorManager: CursorManager;
  /** SelectionManager instance */
  selectionManager: SelectionManager;
  /** Container element for positioning */
  containerRef: React.RefObject<HTMLElement>;
  /** Show user name labels on cursors (default: true) */
  showCursorLabels?: boolean;
  /** Selection highlight opacity (default: 0.2) */
  selectionOpacity?: number;
  /** Cursor animation duration in ms (default: 150) */
  cursorAnimationDuration?: number;
  /** Selection animation duration in ms (default: 150) */
  selectionAnimationDuration?: number;
  /** Enable cursor rendering (default: true) */
  showCursors?: boolean;
  /** Enable selection rendering (default: true) */
  showSelections?: boolean;
}

/**
 * CollaborationOverlay component
 * 
 * Renders remote cursors and selections for real-time collaboration
 */
export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = React.memo(({
  cursorManager,
  selectionManager,
  containerRef,
  showCursorLabels = true,
  selectionOpacity = 0.2,
  cursorAnimationDuration = 150,
  selectionAnimationDuration = 150,
  showCursors = true,
  showSelections = true,
}) => {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursorType[]>([]);
  const [remoteSelections, setRemoteSelections] = useState<RemoteSelectionType[]>([]);

  // Subscribe to cursor updates
  useEffect(() => {
    const handleCursorUpdate = (cursors: RemoteCursorType[]) => {
      setRemoteCursors(cursors);
    };

    cursorManager.onCursorUpdate(handleCursorUpdate);

    // Initial load
    setRemoteCursors(cursorManager.getRemoteCursors());

    return () => {
      cursorManager.offCursorUpdate(handleCursorUpdate);
    };
  }, [cursorManager]);

  // Subscribe to selection updates
  useEffect(() => {
    const handleSelectionUpdate = (selections: RemoteSelectionType[]) => {
      setRemoteSelections(selections);
    };

    selectionManager.onSelectionUpdate(handleSelectionUpdate);

    // Initial load
    setRemoteSelections(selectionManager.getRemoteSelections());

    return () => {
      selectionManager.offSelectionUpdate(handleSelectionUpdate);
    };
  }, [selectionManager]);

  return (
    <div
      className="erix-collaboration-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 998,
      }}
    >
      {/* Render remote selections */}
      {showSelections && remoteSelections.map((selection) => (
        <RemoteSelection
          key={selection.userId}
          selection={selection}
          containerRef={containerRef}
          opacity={selectionOpacity}
          animationDuration={selectionAnimationDuration}
        />
      ))}

      {/* Render remote cursors */}
      {showCursors && remoteCursors.map((cursor) => (
        <RemoteCursor
          key={cursor.userId}
          cursor={cursor}
          containerRef={containerRef}
          showLabel={showCursorLabels}
          animationDuration={cursorAnimationDuration}
        />
      ))}
    </div>
  );
});

CollaborationOverlay.displayName = 'CollaborationOverlay';

/**
 * Default export
 */
export default CollaborationOverlay;
