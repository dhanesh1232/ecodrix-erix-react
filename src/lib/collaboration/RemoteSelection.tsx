/**
 * RemoteSelection Component
 * 
 * Renders a remote user's selection range with color-coded highlighting.
 * 
 * Features:
 * - Color-coded selection highlighting
 * - Semi-transparent overlay
 * - Smooth transitions
 * - User identification
 * 
 * Requirements: 4.1
 */

import React, { useEffect, useState } from 'react';
import type { RemoteSelection as RemoteSelectionType } from './SelectionManager';

/**
 * Props for RemoteSelection component
 */
export interface RemoteSelectionProps {
  /** Remote selection data */
  selection: RemoteSelectionType;
  /** Container element for positioning */
  containerRef: React.RefObject<HTMLElement>;
  /** Opacity for selection highlight (default: 0.2) */
  opacity?: number;
  /** Animation duration in milliseconds (default: 150) */
  animationDuration?: number;
}

/**
 * Selection rectangle for rendering
 */
interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * RemoteSelection component
 * 
 * Renders a remote user's selection range
 */
export const RemoteSelection: React.FC<RemoteSelectionProps> = ({
  selection,
  containerRef,
  opacity = 0.2,
  animationDuration = 150,
}) => {
  const [rects, setRects] = useState<SelectionRect[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate selection rectangles
    // This is a simplified implementation - in a real editor, you'd need to
    // convert character offsets to pixel coordinates and handle multi-line selections
    const calculateRects = (): SelectionRect[] => {
      const container = containerRef.current;
      if (!container) return [];

      // For demonstration, we'll create a simple rectangle
      // In a real implementation, you'd query the editor's DOM to get exact positions
      // and handle multi-line selections by creating multiple rectangles
      
      const lineHeight = 20; // pixels per line
      const charWidth = 8; // pixels per character
      
      // Simple single-line selection for demonstration
      const startLine = Math.floor(selection.range.start / 80); // Assume 80 chars per line
      const startCol = selection.range.start % 80;
      const endLine = Math.floor(selection.range.end / 80);
      const endCol = selection.range.end % 80;
      
      const rectangles: SelectionRect[] = [];
      
      if (startLine === endLine) {
        // Single line selection
        rectangles.push({
          x: startCol * charWidth,
          y: startLine * lineHeight,
          width: (endCol - startCol) * charWidth,
          height: lineHeight,
        });
      } else {
        // Multi-line selection
        // First line
        rectangles.push({
          x: startCol * charWidth,
          y: startLine * lineHeight,
          width: (80 - startCol) * charWidth,
          height: lineHeight,
        });
        
        // Middle lines
        for (let line = startLine + 1; line < endLine; line++) {
          rectangles.push({
            x: 0,
            y: line * lineHeight,
            width: 80 * charWidth,
            height: lineHeight,
          });
        }
        
        // Last line
        rectangles.push({
          x: 0,
          y: endLine * lineHeight,
          width: endCol * charWidth,
          height: lineHeight,
        });
      }
      
      return rectangles;
    };

    const newRects = calculateRects();
    if (newRects.length > 0) {
      setRects(newRects);
      setIsVisible(true);
    }
  }, [selection.range, containerRef]);

  // Fade out after inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      const timeSinceUpdate = Date.now() - selection.lastUpdate;
      if (timeSinceUpdate > 5000) {
        setIsVisible(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [selection.lastUpdate]);

  if (rects.length === 0 || !isVisible) {
    return null;
  }

  return (
    <>
      {rects.map((rect, index) => (
        <div
          key={`${selection.userId}-${index}`}
          className="erix-remote-selection"
          style={{
            position: 'absolute',
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: selection.userColor,
            opacity: isVisible ? opacity : 0,
            pointerEvents: 'none',
            zIndex: 999,
            transition: `all ${animationDuration}ms ease-out`,
            borderRadius: '2px',
          }}
          title={`${selection.userName}'s selection`}
        />
      ))}
    </>
  );
};

/**
 * Default export
 */
export default RemoteSelection;
