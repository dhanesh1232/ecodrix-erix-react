/**
 * MentionSystem
 * 
 * Manages user mentions (@username) within the editor and comments.
 * Handles mention detection, user search/autocomplete, and notification emission.
 * 
 * Features:
 * - Mention detection in text
 * - User search and filtering for autocomplete
 * - Notification emission for detected mentions
 * - Customizable mention patterns
 * - Collaboration integration
 * 
 * Requirements: 4.5, 4.6
 */

import type { CollaborationEngine } from './CollaborationEngine';
import type { CollaborationUser } from './types';

/**
 * Mention data structure
 */
export interface Mention {
  /** Mentioned user ID */
  userId: string;
  /** Mentioned user name */
  userName: string;
  /** Position in the text (optional) */
  position?: number;
  /** Length of the mention string in text (optional) */
  length?: number;
}

/**
 * Mention notification data
 */
export interface MentionNotification {
  /** ID of the comment or document where the mention occurred */
  sourceId: string;
  /** The user who triggered the mention */
  fromUserId: string;
  /** The user who was mentioned */
  mentionedUserId: string;
  /** The content containing the mention */
  content: string;
  /** Context description (e.g., 'comment', 'editor') */
  context: string;
  /** Timestamp of the mention */
  timestamp: number;
}

/**
 * Mention system configuration
 */
export interface MentionConfig {
  /** Mention trigger character (default: '@') */
  trigger?: string;
  /** Regex pattern for detecting mentions (default: /@(\w+)/g) */
  pattern?: RegExp;
  /** Case sensitivity for user search (default: false) */
  caseSensitive?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MentionConfig> = {
  trigger: '@',
  pattern: /@(\w+)/g,
  caseSensitive: false,
};

/**
 * MentionSystem class
 */
export class MentionSystem {
  private config: Required<MentionConfig>;
  private collaborationEngine: CollaborationEngine | null = null;
  private availableUsers: Map<string, CollaborationUser> = new Map();
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: MentionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set collaboration engine to track active users
   * 
   * @param engine - CollaborationEngine instance
   */
  setCollaborationEngine(engine: CollaborationEngine): void {
    this.collaborationEngine = engine;

    // Sync users
    const users = engine.getActiveUsers();
    users.forEach(user => this.availableUsers.set(user.id, user));

    // Listen for user changes
    engine.on('user-joined', (user: CollaborationUser) => {
      this.availableUsers.set(user.id, user);
    });

    engine.on('user-left', (payload: { userId: string }) => {
      this.availableUsers.delete(payload.userId);
    });

    engine.on('user-update', (user: CollaborationUser) => {
      this.availableUsers.set(user.id, user);
    });
  }

  /**
   * Detect all mentions in a given text
   * 
   * @param text - Text to search for mentions
   * @returns Array of detected mentions
   */
  detectMentions(text: string): Mention[] {
    const mentions: Mention[] = [];
    const pattern = new RegExp(this.config.pattern);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const username = match[1];
      const user = this.findUserByName(username);

      if (user) {
        mentions.push({
          userId: user.id,
          userName: user.name,
          position: match.index,
          length: match[0].length,
        });
      }
    }

    return mentions;
  }

  /**
   * Search for users matching a query (for autocomplete)
   * 
   * @param query - Search query (excluding trigger character)
   * @returns Array of matching users
   */
  searchUsers(query: string): CollaborationUser[] {
    const q = this.config.caseSensitive ? query : query.toLowerCase();
    
    return Array.from(this.availableUsers.values()).filter(user => {
      const name = this.config.caseSensitive ? user.name : user.name.toLowerCase();
      return name.includes(q);
    });
  }

  /**
   * Notify mentioned users
   * 
   * @param notification - Mention notification data
   */
  notify(notification: MentionNotification): void {
    // Emit local event
    this.emit('mention', notification);

    // Broadcast if collaboration is connected
    if (this.collaborationEngine?.isConnected()) {
      (this.collaborationEngine as any).sendMessage?.({
        type: 'mention-notification',
        payload: notification,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Find a user by name in the available users registry
   * 
   * @param name - Username to search for
   */
  private findUserByName(name: string): CollaborationUser | undefined {
    const searchName = this.config.caseSensitive ? name : name.toLowerCase();
    
    return Array.from(this.availableUsers.values()).find(user => {
      const userName = this.config.caseSensitive ? user.name : user.name.toLowerCase();
      return userName === searchName;
    });
  }

  /**
   * Register an event handler
   */
  on(event: 'mention', handler: (data: MentionNotification) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(event: 'mention', handler: (data: MentionNotification) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach(handler => handler(data));
  }

  /**
   * Manually add a user to the available users list (for testing or manual sync)
   */
  addAvailableUser(user: CollaborationUser): void {
    this.availableUsers.set(user.id, user);
  }
}
