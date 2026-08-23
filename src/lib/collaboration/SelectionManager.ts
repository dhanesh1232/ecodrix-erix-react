/**
 * SelectionManager
 * 
 * Manages selection range tracking and broadcasting for real-time collaboration.
 * Implements throttling to avoid excessive network traffic while maintaining
 * smooth selection updates.
 * 
 * Features:
 * - Real-time selection range tracking
 * - Throttled broadcasting (configurable interval)
 * - Local and remote selection state management
 * - Integration with CollaborationEngine
 * 
 * Requirements: 4.1, 4.2
 */

import type { CollaborationEngine } from './CollaborationEngine';
import { MessageType } from './types';

/**
 * Selection range in the document
 */
export interface SelectionRange {
  start: number;
  end: number;
}

/**
 * Remote selection information
 */
export interface RemoteSelection {
  userId: string;
  userName: string;
  userColor: string;
  range: SelectionRange;
  lastUpdate: number;
}

/**
 * Selection manager configuration
 */
export interface SelectionManagerConfig {
  /** Throttle interval for selection updates in milliseconds (default: 150ms) */
  throttleInterval?: number;
  /** Enable selection broadcasting (default: true) */
  enabled?: boolean;
  /** Timeout for stale selections in milliseconds (default: 30000ms) */
  staleTimeout?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SelectionManagerConfig> = {
  throttleInterval: 150,
  enabled: true,
  staleTimeout: 30000,
};

/**
 * SelectionManager class
 * 
 * Manages selection range tracking and synchronization
 */
export class SelectionManager {
  private config: Required<SelectionManagerConfig>;
  private collaborationEngine: CollaborationEngine | null = null;
  
  // Local selection state
  private localSelection: SelectionRange | null = null;
  
  // Remote selections
  private remoteSelections: Map<string, RemoteSelection> = new Map();
  
  // Throttling state
  private lastBroadcastTime = 0;
  private pendingBroadcast: SelectionRange | null = null;
  private broadcastTimeoutId: number | null = null;
  
  // Stale selection cleanup
  private cleanupIntervalId: number | null = null;
  
  // Event handlers
  private selectionUpdateHandlers: Set<(selections: RemoteSelection[]) => void> = new Set();

  constructor(config: SelectionManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start stale selection cleanup
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
    
    // Listen for selection updates from other users
    engine.on('selection-update', (payload: { userId: string; selection: SelectionRange | null }) => {
      this.handleRemoteSelectionUpdate(payload);
    });
    
    // Clean up when users leave
    engine.on('user-left', (user: { id: string }) => {
      this.removeRemoteSelection(user.id);
    });
  }

  /**
   * Update local selection range
   * Requirements: 4.1, 4.2
   * 
   * @param range - New selection range
   */
  updateSelection(range: SelectionRange): void {
    if (!this.config.enabled) return;
    
    // Normalize range (ensure start <= end)
    const normalizedRange: SelectionRange = {
      start: Math.min(range.start, range.end),
      end: Math.max(range.start, range.end),
    };
    
    this.localSelection = normalizedRange;
    
    // Broadcast with throttling
    this.broadcastSelectionThrottled(normalizedRange);
  }

  /**
   * Get local selection range
   * 
   * @returns Current local selection range or null
   */
  getLocalSelection(): SelectionRange | null {
    return this.localSelection;
  }

  /**
   * Get all remote selections
   * Requirements: 4.1
   * 
   * @returns Array of remote selections
   */
  getRemoteSelections(): RemoteSelection[] {
    return Array.from(this.remoteSelections.values());
  }

  /**
   * Get remote selection for a specific user
   * 
   * @param userId - User ID
   * @returns Remote selection or null
   */
  getRemoteSelection(userId: string): RemoteSelection | null {
    return this.remoteSelections.get(userId) || null;
  }

  /**
   * Register a selection update handler
   * 
   * @param handler - Handler function
   */
  onSelectionUpdate(handler: (selections: RemoteSelection[]) => void): void {
    this.selectionUpdateHandlers.add(handler);
  }

  /**
   * Unregister a selection update handler
   * 
   * @param handler - Handler function
   */
  offSelectionUpdate(handler: (selections: RemoteSelection[]) => void): void {
    this.selectionUpdateHandlers.delete(handler);
  }

  /**
   * Broadcast selection range with throttling
   * Requirements: 4.2
   * 
   * @param range - Selection range to broadcast
   */
  private broadcastSelectionThrottled(range: SelectionRange): void {
    const now = Date.now();
    const timeSinceLastBroadcast = now - this.lastBroadcastTime;
    
    if (timeSinceLastBroadcast >= this.config.throttleInterval) {
      // Enough time has passed, broadcast immediately
      this.broadcastSelection(range);
      this.lastBroadcastTime = now;
      this.pendingBroadcast = null;
      
      // Clear any pending timeout
      if (this.broadcastTimeoutId !== null) {
        clearTimeout(this.broadcastTimeoutId);
        this.broadcastTimeoutId = null;
      }
    } else {
      // Store pending broadcast
      this.pendingBroadcast = range;
      
      // Schedule broadcast if not already scheduled
      if (this.broadcastTimeoutId === null) {
        const delay = this.config.throttleInterval - timeSinceLastBroadcast;
        this.broadcastTimeoutId = window.setTimeout(() => {
          if (this.pendingBroadcast) {
            this.broadcastSelection(this.pendingBroadcast);
            this.lastBroadcastTime = Date.now();
            this.pendingBroadcast = null;
          }
          this.broadcastTimeoutId = null;
        }, delay);
      }
    }
  }

  /**
   * Broadcast selection range immediately
   * Requirements: 4.2
   * 
   * @param range - Selection range to broadcast
   */
  private broadcastSelection(range: SelectionRange): void {
    if (!this.collaborationEngine || !this.collaborationEngine.isConnected()) {
      return;
    }
    
    // Send selection update through collaboration engine
    const message = {
      type: MessageType.SELECTION_UPDATE,
      payload: {
        selection: range,
      },
      timestamp: Date.now(),
    };
    
    // Use internal sendMessage if available, otherwise queue
    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Handle remote selection update
   * Requirements: 4.1
   * 
   * @param payload - Selection update payload
   */
  private handleRemoteSelectionUpdate(payload: { userId: string; selection: SelectionRange | null }): void {
    if (payload.selection === null) {
      // User cleared their selection
      this.removeRemoteSelection(payload.userId);
      return;
    }
    
    // Get user info from collaboration engine
    const users = this.collaborationEngine?.getActiveUsers() || [];
    const user = users.find(u => u.id === payload.userId);
    
    if (!user) {
      return;
    }
    
    // Update or create remote selection
    const remoteSelection: RemoteSelection = {
      userId: payload.userId,
      userName: user.name,
      userColor: user.color,
      range: payload.selection,
      lastUpdate: Date.now(),
    };
    
    this.remoteSelections.set(payload.userId, remoteSelection);
    
    // Notify handlers
    this.notifySelectionUpdate();
  }

  /**
   * Remove a remote selection
   * 
   * @param userId - User ID
   */
  private removeRemoteSelection(userId: string): void {
    if (this.remoteSelections.delete(userId)) {
      this.notifySelectionUpdate();
    }
  }

  /**
   * Notify selection update handlers
   */
  private notifySelectionUpdate(): void {
    const selections = this.getRemoteSelections();
    this.selectionUpdateHandlers.forEach(handler => {
      try {
        handler(selections);
      } catch (error) {
        console.error('Error in selection update handler:', error);
      }
    });
  }

  /**
   * Start stale selection cleanup
   */
  private startCleanup(): void {
    this.stopCleanup();
    
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupStaleSelections();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop stale selection cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Clean up stale selections
   */
  private cleanupStaleSelections(): void {
    const now = Date.now();
    let removed = false;
    
    for (const [userId, selection] of this.remoteSelections.entries()) {
      if (now - selection.lastUpdate > this.config.staleTimeout) {
        this.remoteSelections.delete(userId);
        removed = true;
      }
    }
    
    if (removed) {
      this.notifySelectionUpdate();
    }
  }

  /**
   * Clear local selection
   */
  clearLocalSelection(): void {
    this.localSelection = null;
    
    // Broadcast null selection
    if (this.collaborationEngine && this.collaborationEngine.isConnected()) {
      const message = {
        type: MessageType.SELECTION_UPDATE,
        payload: {
          selection: null,
        },
        timestamp: Date.now(),
      };
      
      (this.collaborationEngine as any).sendMessage?.(message);
    }
  }

  /**
   * Clear all remote selections
   */
  clearRemoteSelections(): void {
    this.remoteSelections.clear();
    this.notifySelectionUpdate();
  }

  /**
   * Enable or disable selection broadcasting
   * 
   * @param enabled - Enable flag
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.clearLocalSelection();
    }
  }

  /**
   * Check if selection broadcasting is enabled
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
  updateConfig(config: Partial<SelectionManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): Required<SelectionManagerConfig> {
    return { ...this.config };
  }

  /**
   * Destroy the selection manager and clean up resources
   */
  destroy(): void {
    // Clear timeouts
    if (this.broadcastTimeoutId !== null) {
      clearTimeout(this.broadcastTimeoutId);
      this.broadcastTimeoutId = null;
    }
    
    this.stopCleanup();
    
    // Clear state
    this.localSelection = null;
    this.remoteSelections.clear();
    this.selectionUpdateHandlers.clear();
    this.pendingBroadcast = null;
  }
}
