/**
 * CursorManager
 * 
 * Manages cursor position tracking and broadcasting for real-time collaboration.
 * Implements throttling to avoid excessive network traffic while maintaining
 * smooth cursor updates.
 * 
 * Features:
 * - Real-time cursor position tracking
 * - Throttled broadcasting (configurable interval)
 * - Local and remote cursor state management
 * - Integration with CollaborationEngine
 * 
 * Requirements: 4.1, 4.2
 */

import type { CollaborationEngine } from './CollaborationEngine';
import { MessageType } from './types';

/**
 * Cursor position in the document
 */
export interface CursorPosition {
  line: number;
  column: number;
}

/**
 * Remote cursor information
 */
export interface RemoteCursor {
  userId: string;
  userName: string;
  userColor: string;
  position: CursorPosition;
  lastUpdate: number;
}

/**
 * Cursor manager configuration
 */
export interface CursorManagerConfig {
  /** Throttle interval for cursor updates in milliseconds (default: 100ms) */
  throttleInterval?: number;
  /** Enable cursor broadcasting (default: true) */
  enabled?: boolean;
  /** Timeout for stale cursors in milliseconds (default: 30000ms) */
  staleTimeout?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<CursorManagerConfig> = {
  throttleInterval: 100,
  enabled: true,
  staleTimeout: 30000,
};

/**
 * CursorManager class
 * 
 * Manages cursor position tracking and synchronization
 */
export class CursorManager {
  private config: Required<CursorManagerConfig>;
  private collaborationEngine: CollaborationEngine | null = null;
  
  // Local cursor state
  private localCursor: CursorPosition | null = null;
  
  // Remote cursors
  private remoteCursors: Map<string, RemoteCursor> = new Map();
  
  // Throttling state
  private lastBroadcastTime = 0;
  private pendingBroadcast: CursorPosition | null = null;
  private broadcastTimeoutId: number | null = null;
  
  // Stale cursor cleanup
  private cleanupIntervalId: number | null = null;
  
  // Event handlers
  private cursorUpdateHandlers: Set<(cursors: RemoteCursor[]) => void> = new Set();

  constructor(config: CursorManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start stale cursor cleanup
    this.startCleanup();
  }

  /**
   * Set the collaboration engine
   * Requirements: 4.1, 4.2
   * 
   * @param engine - CollaborationEngine instance
   */
  setCollaborationEngine(engine: CollaborationEngine): void {
    this.collaborationEngine = engine;
    
    // Listen for cursor updates from other users
    engine.on('cursor-update', (payload: { userId: string; cursor: CursorPosition | null }) => {
      this.handleRemoteCursorUpdate(payload);
    });
    
    // Clean up when users leave
    engine.on('user-left', (user: { id: string }) => {
      this.removeRemoteCursor(user.id);
    });
  }

  /**
   * Update local cursor position
   * Requirements: 4.1, 4.2
   * 
   * @param position - New cursor position
   */
  updateCursor(position: CursorPosition): void {
    if (!this.config.enabled) return;
    
    this.localCursor = position;
    
    // Broadcast with throttling
    this.broadcastCursorThrottled(position);
  }

  /**
   * Get local cursor position
   * 
   * @returns Current local cursor position or null
   */
  getLocalCursor(): CursorPosition | null {
    return this.localCursor;
  }

  /**
   * Get all remote cursors
   * Requirements: 4.1
   * 
   * @returns Array of remote cursors
   */
  getRemoteCursors(): RemoteCursor[] {
    return Array.from(this.remoteCursors.values());
  }

  /**
   * Get remote cursor for a specific user
   * 
   * @param userId - User ID
   * @returns Remote cursor or null
   */
  getRemoteCursor(userId: string): RemoteCursor | null {
    return this.remoteCursors.get(userId) || null;
  }

  /**
   * Register a cursor update handler
   * 
   * @param handler - Handler function
   */
  onCursorUpdate(handler: (cursors: RemoteCursor[]) => void): void {
    this.cursorUpdateHandlers.add(handler);
  }

  /**
   * Unregister a cursor update handler
   * 
   * @param handler - Handler function
   */
  offCursorUpdate(handler: (cursors: RemoteCursor[]) => void): void {
    this.cursorUpdateHandlers.delete(handler);
  }

  /**
   * Broadcast cursor position with throttling
   * Requirements: 4.2
   * 
   * @param position - Cursor position to broadcast
   */
  private broadcastCursorThrottled(position: CursorPosition): void {
    const now = Date.now();
    const timeSinceLastBroadcast = now - this.lastBroadcastTime;
    
    if (timeSinceLastBroadcast >= this.config.throttleInterval) {
      // Enough time has passed, broadcast immediately
      this.broadcastCursor(position);
      this.lastBroadcastTime = now;
      this.pendingBroadcast = null;
      
      // Clear any pending timeout
      if (this.broadcastTimeoutId !== null) {
        clearTimeout(this.broadcastTimeoutId);
        this.broadcastTimeoutId = null;
      }
    } else {
      // Store pending broadcast
      this.pendingBroadcast = position;
      
      // Schedule broadcast if not already scheduled
      if (this.broadcastTimeoutId === null) {
        const delay = this.config.throttleInterval - timeSinceLastBroadcast;
        this.broadcastTimeoutId = window.setTimeout(() => {
          if (this.pendingBroadcast) {
            this.broadcastCursor(this.pendingBroadcast);
            this.lastBroadcastTime = Date.now();
            this.pendingBroadcast = null;
          }
          this.broadcastTimeoutId = null;
        }, delay);
      }
    }
  }

  /**
   * Broadcast cursor position immediately
   * Requirements: 4.2
   * 
   * @param position - Cursor position to broadcast
   */
  private broadcastCursor(position: CursorPosition): void {
    if (!this.collaborationEngine || !this.collaborationEngine.isConnected()) {
      return;
    }
    
    // Send cursor update through collaboration engine
    // The engine will wrap this in a WebSocket message
    const message = {
      type: MessageType.CURSOR_UPDATE,
      payload: {
        cursor: position,
      },
      timestamp: Date.now(),
    };
    
    // Use internal sendMessage if available, otherwise queue
    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Handle remote cursor update
   * Requirements: 4.1
   * 
   * @param payload - Cursor update payload
   */
  private handleRemoteCursorUpdate(payload: { userId: string; cursor: CursorPosition | null }): void {
    if (payload.cursor === null) {
      // User cleared their cursor
      this.removeRemoteCursor(payload.userId);
      return;
    }
    
    // Get user info from collaboration engine
    const users = this.collaborationEngine?.getActiveUsers() || [];
    const user = users.find(u => u.id === payload.userId);
    
    if (!user) {
      return;
    }
    
    // Update or create remote cursor
    const remoteCursor: RemoteCursor = {
      userId: payload.userId,
      userName: user.name,
      userColor: user.color,
      position: payload.cursor,
      lastUpdate: Date.now(),
    };
    
    this.remoteCursors.set(payload.userId, remoteCursor);
    
    // Notify handlers
    this.notifyCursorUpdate();
  }

  /**
   * Remove a remote cursor
   * 
   * @param userId - User ID
   */
  private removeRemoteCursor(userId: string): void {
    if (this.remoteCursors.delete(userId)) {
      this.notifyCursorUpdate();
    }
  }

  /**
   * Notify cursor update handlers
   */
  private notifyCursorUpdate(): void {
    const cursors = this.getRemoteCursors();
    this.cursorUpdateHandlers.forEach(handler => {
      try {
        handler(cursors);
      } catch (error) {
        console.error('Error in cursor update handler:', error);
      }
    });
  }

  /**
   * Start stale cursor cleanup
   */
  private startCleanup(): void {
    this.stopCleanup();
    
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupStaleCursors();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop stale cursor cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Clean up stale cursors
   */
  private cleanupStaleCursors(): void {
    const now = Date.now();
    let removed = false;
    
    for (const [userId, cursor] of this.remoteCursors.entries()) {
      if (now - cursor.lastUpdate > this.config.staleTimeout) {
        this.remoteCursors.delete(userId);
        removed = true;
      }
    }
    
    if (removed) {
      this.notifyCursorUpdate();
    }
  }

  /**
   * Clear local cursor
   */
  clearLocalCursor(): void {
    this.localCursor = null;
    
    // Broadcast null cursor
    if (this.collaborationEngine && this.collaborationEngine.isConnected()) {
      const message = {
        type: MessageType.CURSOR_UPDATE,
        payload: {
          cursor: null,
        },
        timestamp: Date.now(),
      };
      
      (this.collaborationEngine as any).sendMessage?.(message);
    }
  }

  /**
   * Clear all remote cursors
   */
  clearRemoteCursors(): void {
    this.remoteCursors.clear();
    this.notifyCursorUpdate();
  }

  /**
   * Enable or disable cursor broadcasting
   * 
   * @param enabled - Enable flag
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.clearLocalCursor();
    }
  }

  /**
   * Check if cursor broadcasting is enabled
   * 
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration
   */
  updateConfig(config: Partial<CursorManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): Required<CursorManagerConfig> {
    return { ...this.config };
  }

  /**
   * Destroy the cursor manager and clean up resources
   */
  destroy(): void {
    // Clear timeouts
    if (this.broadcastTimeoutId !== null) {
      clearTimeout(this.broadcastTimeoutId);
      this.broadcastTimeoutId = null;
    }
    
    this.stopCleanup();
    
    // Clear state
    this.localCursor = null;
    this.remoteCursors.clear();
    this.cursorUpdateHandlers.clear();
    this.pendingBroadcast = null;
  }
}
