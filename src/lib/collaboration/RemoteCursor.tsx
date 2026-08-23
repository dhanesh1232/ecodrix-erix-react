/**
 * RemoteCursor Component
 * 
 * Renders a remote user's cursor with smooth animations and user label.
 * 
 * Features:
 * - Smooth cursor position transitions
 * - User name label display
 * - Color-coded for user identification
 * - Fade-in/fade-out animations
 * 
 * Requirements: 4.1
 */

import React, { useEffect, useState } from 'react';
import type { RemoteCursor as RemoteCursorType } from './CursorManager';

/**
 * Props for RemoteCursor component
 */
export interface RemoteCursorProps {
  /** Remote cursor data */
  cursor: RemoteCursorType;
  /** Container element for positioning */
  containerRef: React.RefObject<HTMLElement>;
  /** Show user name label (default: true) */
  showLabel?: boolean;
  /** Animation duration in milliseconds (default: 150) */
  animationDuration?: number;
}

/**
 * RemoteCursor component
 * 
 * Renders a remote user's cursor with smooth animations
 */
export const RemoteCursor: React.FC<RemoteCursorProps> = ({
  cursor,
  containerRef,
  showLabel = true,
  animationDuration = 150,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate cursor position in pixels
    // This is a simplified implementation - in a real editor, you'd need to
    // convert line/column to pixel coordinates based on the editor's layout
    const calculatePosition = () => {
      const container = containerRef.current;
      if (!container) return null;

      // For demonstration, we'll use a simple calculation
      // In a real implementation, you'd query the editor's DOM to get exact positions
      const lineHeight = 20; // pixels per line
      const charWidth = 8; // pixels per character
      
      const x = cursor.position.column * charWidth;
      const y = cursor.position.line * lineHeight;

      return { x, y };
    };

    const newPosition = calculatePosition();
    if (newPosition) {
      setPosition(newPosition);
      setIsVisible(true);
    }
  }, [cursor.position, containerRef]);

  // Fade out after inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      const timeSinceUpdate = Date.now() - cursor.lastUpdate;
      if (timeSinceUpdate > 5000) {
        setIsVisible(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [cursor.lastUpdate]);

  if (!position || !isVisible) {
    return null;
  }

  return (
    <div
      className="erix-remote-cursor"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: `all ${animationDuration}ms ease-out`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Cursor line */}
      <div
        className="erix-remote-cursor-line"
        style={{
          width: '2px',
          height: '20px',
          backgroundColor: cursor.userColor,
          position: 'relative',
        }}
      >
        {/* Cursor flag/label */}
        {showLabel && (
          <div
            className="erix-remote-cursor-label"
            style={{
              position: 'absolute',
              top: '-24px',
              left: '2px',
              backgroundColor: cursor.userColor,
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
          >
            {cursor.userName}
          </div>
        )}
      </div>

      {/* Cursor blink animation */}
      <style>{`
        @keyframes erix-cursor-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        .erix-remote-cursor-line {
          animation: erix-cursor-blink 1s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Default export
 */
export default RemoteCursor;
