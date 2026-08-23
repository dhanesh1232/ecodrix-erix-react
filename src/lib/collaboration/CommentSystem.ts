/**
 * CommentSystem
 * 
 * Manages threaded comments on content with range tracking, replies,
 * and resolve/unresolve functionality. Integrates with CollaborationEngine
 * for real-time comment synchronization and mention notifications.
 * 
 * Features:
 * - Comment thread creation and management
 * - Range-based comment attachment to content
 * - Threaded replies
 * - Resolve/unresolve functionality
 * - Mention detection and notification (@username)
 * - Real-time synchronization via CollaborationEngine
 * - Comment filtering by range
 * 
 * Requirements: 4.4, 4.6
 */

import type { CollaborationEngine } from './CollaborationEngine';
import { MessageType } from './types';

/**
 * Comment range in the document
 */
export interface CommentRange {
  /** Start position in document */
  start: number;
  /** End position in document */
  end: number;
}

/**
 * Individual comment in a thread
 */
export interface Comment {
  /** Unique comment ID */
  id: string;
  /** User ID who created the comment */
  userId: string;
  /** User display name */
  userName: string;
  /** Comment content (supports markdown) */
  content: string;
  /** Content range this comment is attached to */
  range: CommentRange;
  /** Creation timestamp */
  timestamp: number;
  /** Reply comments */
  replies: Comment[];
  /** Whether the comment thread is resolved */
  resolved: boolean;
  /** Parent comment ID (null for root comments) */
  parentId: string | null;
  /** Mentioned user IDs */
  mentions: string[];
  /** Last edited timestamp (null if never edited) */
  editedAt: number | null;
}

/**
 * Comment creation input (omits auto-generated fields)
 */
export type CommentInput = Omit<Comment, 'id' | 'timestamp' | 'replies' | 'parentId' | 'mentions' | 'editedAt'>;

/**
 * Reply creation input
 */
export interface ReplyInput {
  /** User ID creating the reply */
  userId: string;
  /** User display name */
  userName: string;
  /** Reply content */
  content: string;
}

/**
 * Comment system configuration
 */
export interface CommentSystemConfig {
  /** Enable mention detection (default: true) */
  enableMentions?: boolean;
  /** Enable real-time synchronization (default: true) */
  enableSync?: boolean;
  /** Mention pattern regex (default: /@(\w+)/g) */
  mentionPattern?: RegExp;
  /** Maximum comment depth for replies (default: 5) */
  maxReplyDepth?: number;
}

/**
 * Comment event types
 */
export type CommentEvent =
  | 'comment-added'
  | 'comment-updated'
  | 'comment-deleted'
  | 'comment-resolved'
  | 'comment-unresolved'
  | 'reply-added'
  | 'mention-detected';

/**
 * Comment event handler
 */
export type CommentEventHandler = (data: any) => void;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<CommentSystemConfig> = {
  enableMentions: true,
  enableSync: true,
  mentionPattern: /@(\w+)/g,
  maxReplyDepth: 5,
};

/**
 * CommentSystem class
 * 
 * Manages comment threads with range tracking and real-time synchronization
 */
export class CommentSystem {
  private config: Required<CommentSystemConfig>;
  private collaborationEngine: CollaborationEngine | null = null;

  // Comment storage (keyed by comment ID)
  private comments: Map<string, Comment> = new Map();

  // Event handlers
  private eventHandlers: Map<CommentEvent, Set<CommentEventHandler>> = new Map();

  // User registry for mention validation
  private availableUsers: Map<string, { id: string; name: string }> = new Map();

  constructor(config: CommentSystemConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the collaboration engine for real-time synchronization
   * Requirements: 4.4, 4.6
   * 
   * @param engine - CollaborationEngine instance
   */
  setCollaborationEngine(engine: CollaborationEngine): void {
    this.collaborationEngine = engine;

    if (this.config.enableSync) {
      // Listen for comment events from other users
      engine.on('comment-added', (data: Comment) => {
        this.handleRemoteCommentAdded(data);
      });

      engine.on('comment-updated', (data: { commentId: string; updates: Partial<Comment> }) => {
        this.handleRemoteCommentUpdated(data);
      });

      engine.on('comment-deleted', (data: { commentId: string }) => {
        this.handleRemoteCommentDeleted(data);
      });

      engine.on('reply-added', (data: { parentId: string; reply: Comment }) => {
        this.handleRemoteReplyAdded(data);
      });

      // Update available users for mentions
      engine.on('user-joined', (user: { id: string; name: string }) => {
        this.availableUsers.set(user.id, { id: user.id, name: user.name });
      });

      engine.on('user-left', (user: { id: string }) => {
        this.availableUsers.delete(user.id);
      });

      // Initialize available users
      const activeUsers = engine.getActiveUsers();
      activeUsers.forEach(user => {
        this.availableUsers.set(user.id, { id: user.id, name: user.name });
      });
    }
  }

  /**
   * Add a new comment
   * Requirements: 4.4, 4.6
   * 
   * @param comment - Comment input data
   * @returns Created comment
   */
  addComment(comment: CommentInput): Comment {
    // Generate unique ID
    const id = this.generateCommentId();

    // Detect mentions in content
    const mentions = this.config.enableMentions
      ? this.detectMentions(comment.content)
      : [];

    // Create full comment object
    const fullComment: Comment = {
      ...comment,
      id,
      timestamp: Date.now(),
      replies: [],
      parentId: null,
      mentions,
      editedAt: null,
    };

    // Store comment
    this.comments.set(id, fullComment);

    // Emit event
    this.emit('comment-added', fullComment);

    // Broadcast to other users if sync is enabled
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastCommentAdded(fullComment);
    }

    // Send mention notifications
    if (mentions.length > 0) {
      this.sendMentionNotifications(fullComment, mentions);
    }

    return fullComment;
  }

  /**
   * Reply to a comment
   * Requirements: 4.4, 4.6
   * 
   * @param commentId - Parent comment ID
   * @param reply - Reply input data
   * @returns Created reply comment
   */
  replyToComment(commentId: string, reply: ReplyInput): Comment {
    const parentComment = this.comments.get(commentId);
    if (!parentComment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Check reply depth
    const depth = this.getCommentDepth(parentComment);
    if (depth >= this.config.maxReplyDepth) {
      throw new Error(`Maximum reply depth (${this.config.maxReplyDepth}) exceeded`);
    }

    // Generate unique ID
    const id = this.generateCommentId();

    // Detect mentions
    const mentions = this.config.enableMentions
      ? this.detectMentions(reply.content)
      : [];

    // Create reply comment
    const replyComment: Comment = {
      id,
      userId: reply.userId,
      userName: reply.userName,
      content: reply.content,
      range: parentComment.range, // Inherit range from parent
      timestamp: Date.now(),
      replies: [],
      resolved: false,
      parentId: commentId,
      mentions,
      editedAt: null,
    };

    // Add reply to parent
    parentComment.replies.push(replyComment);

    // Store reply in main map for easy lookup
    this.comments.set(id, replyComment);

    // Emit event
    this.emit('reply-added', { parentId: commentId, reply: replyComment });

    // Broadcast to other users
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastReplyAdded(commentId, replyComment);
    }

    // Send mention notifications
    if (mentions.length > 0) {
      this.sendMentionNotifications(replyComment, mentions);
    }

    return replyComment;
  }

  /**
   * Resolve a comment thread
   * Requirements: 4.4
   * 
   * @param commentId - Comment ID to resolve
   */
  resolveComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Only resolve root comments
    if (comment.parentId !== null) {
      throw new Error('Can only resolve root comments');
    }

    comment.resolved = true;

    // Emit event
    this.emit('comment-resolved', { commentId, comment });

    // Broadcast to other users
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastCommentUpdated(commentId, { resolved: true });
    }
  }

  /**
   * Unresolve a comment thread
   * Requirements: 4.4
   * 
   * @param commentId - Comment ID to unresolve
   */
  unresolveComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Only unresolve root comments
    if (comment.parentId !== null) {
      throw new Error('Can only unresolve root comments');
    }

    comment.resolved = false;

    // Emit event
    this.emit('comment-unresolved', { commentId, comment });

    // Broadcast to other users
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastCommentUpdated(commentId, { resolved: false });
    }
  }

  /**
   * Get comments in a specific range
   * Requirements: 4.4
   * 
   * @param start - Range start position
   * @param end - Range end position
   * @returns Array of comments overlapping the range
   */
  getCommentsInRange(start: number, end: number): Comment[] {
    const result: Comment[] = [];

    for (const comment of this.comments.values()) {
      // Only include root comments (not replies)
      if (comment.parentId !== null) {
        continue;
      }

      // Check if comment range overlaps with query range
      if (this.rangesOverlap(comment.range, { start, end })) {
        result.push(comment);
      }
    }

    // Sort by position
    return result.sort((a, b) => a.range.start - b.range.start);
  }

  /**
   * Get a specific comment by ID
   * 
   * @param commentId - Comment ID
   * @returns Comment or null if not found
   */
  getComment(commentId: string): Comment | null {
    return this.comments.get(commentId) || null;
  }

  /**
   * Get all root comments (not replies)
   * 
   * @returns Array of root comments
   */
  getAllComments(): Comment[] {
    return Array.from(this.comments.values())
      .filter(comment => comment.parentId === null)
      .sort((a, b) => a.range.start - b.range.start);
  }

  /**
   * Get all resolved comments
   * 
   * @returns Array of resolved comments
   */
  getResolvedComments(): Comment[] {
    return this.getAllComments().filter(comment => comment.resolved);
  }

  /**
   * Get all unresolved comments
   * 
   * @returns Array of unresolved comments
   */
  getUnresolvedComments(): Comment[] {
    return this.getAllComments().filter(comment => !comment.resolved);
  }

  /**
   * Update a comment's content
   * 
   * @param commentId - Comment ID
   * @param content - New content
   */
  updateComment(commentId: string, content: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Update content
    comment.content = content;
    comment.editedAt = Date.now();

    // Re-detect mentions
    if (this.config.enableMentions) {
      const newMentions = this.detectMentions(content);
      const addedMentions = newMentions.filter(m => !comment.mentions.includes(m));
      comment.mentions = newMentions;

      // Send notifications for new mentions
      if (addedMentions.length > 0) {
        this.sendMentionNotifications(comment, addedMentions);
      }
    }

    // Emit event
    this.emit('comment-updated', { commentId, comment });

    // Broadcast to other users
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastCommentUpdated(commentId, { content, editedAt: comment.editedAt, mentions: comment.mentions });
    }
  }

  /**
   * Delete a comment
   * 
   * @param commentId - Comment ID to delete
   */
  deleteComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // If it's a root comment, delete all replies
    if (comment.parentId === null) {
      this.deleteCommentAndReplies(comment);
    } else {
      // If it's a reply, remove from parent's replies array
      const parent = this.comments.get(comment.parentId);
      if (parent) {
        parent.replies = parent.replies.filter(r => r.id !== commentId);
      }
      this.comments.delete(commentId);
    }

    // Emit event
    this.emit('comment-deleted', { commentId });

    // Broadcast to other users
    if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
      this.broadcastCommentDeleted(commentId);
    }
  }

  /**
   * Register an event handler
   * 
   * @param event - Event type
   * @param handler - Handler function
   */
  on(event: CommentEvent, handler: CommentEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   * 
   * @param event - Event type
   * @param handler - Handler function
   */
  off(event: CommentEvent, handler: CommentEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Get available users for mentions
   * 
   * @returns Array of available users
   */
  getAvailableUsers(): Array<{ id: string; name: string }> {
    return Array.from(this.availableUsers.values());
  }

  /**
   * Add a user to the available users list
   * 
   * @param user - User to add
   */
  addAvailableUser(user: { id: string; name: string }): void {
    this.availableUsers.set(user.id, user);
  }

  /**
   * Remove a user from the available users list
   * 
   * @param userId - User ID to remove
   */
  removeAvailableUser(userId: string): void {
    this.availableUsers.delete(userId);
  }

  /**
   * Clear all comments
   */
  clear(): void {
    this.comments.clear();
  }

  /**
   * Get comment count
   * 
   * @returns Total number of comments (including replies)
   */
  getCommentCount(): number {
    return this.comments.size;
  }

  /**
   * Get root comment count
   * 
   * @returns Number of root comments
   */
  getRootCommentCount(): number {
    return Array.from(this.comments.values()).filter(c => c.parentId === null).length;
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration
   */
  updateConfig(config: Partial<CommentSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): Required<CommentSystemConfig> {
    return { ...this.config };
  }

  // Private helper methods

  /**
   * Generate unique comment ID
   */
  private generateCommentId(): string {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect mentions in content
   * Requirements: 4.6
   * 
   * @param content - Comment content
   * @returns Array of mentioned user IDs
   */
  private detectMentions(content: string): string[] {
    const mentions: string[] = [];
    const pattern = new RegExp(this.config.mentionPattern);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const username = match[1];
      // Find user by name
      const user = Array.from(this.availableUsers.values()).find(
        u => u.name.toLowerCase() === username.toLowerCase()
      );
      if (user && !mentions.includes(user.id)) {
        mentions.push(user.id);
      }
    }

    return mentions;
  }

  /**
   * Send mention notifications
   * Requirements: 4.6
   * 
   * @param comment - Comment containing mentions
   * @param mentionedUserIds - Array of mentioned user IDs
   */
  private sendMentionNotifications(comment: Comment, mentionedUserIds: string[]): void {
    mentionedUserIds.forEach(userId => {
      // Emit local event
      this.emit('mention-detected', {
        commentId: comment.id,
        mentionedUserId: userId,
        comment,
      });

      // Broadcast notification if sync is enabled
      if (this.config.enableSync && this.collaborationEngine?.isConnected()) {
        const message = {
          type: 'mention-notification' as any,
          payload: {
            commentId: comment.id,
            mentionedUserId: userId,
            fromUserId: comment.userId,
            fromUserName: comment.userName,
            content: comment.content,
            range: comment.range,
          },
          timestamp: Date.now(),
        };

        (this.collaborationEngine as any).sendMessage?.(message);
      }
    });
  }

  /**
   * Check if two ranges overlap
   * 
   * @param range1 - First range
   * @param range2 - Second range
   * @returns True if ranges overlap
   */
  private rangesOverlap(range1: CommentRange, range2: CommentRange): boolean {
    return range1.start <= range2.end && range2.start <= range1.end;
  }

  /**
   * Get comment depth (nesting level)
   * 
   * @param comment - Comment to check
   * @returns Depth level (0 for root comments)
   */
  private getCommentDepth(comment: Comment): number {
    let depth = 0;
    let current = comment;

    while (current.parentId !== null) {
      depth++;
      const parent = this.comments.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    return depth;
  }

  /**
   * Delete comment and all its replies recursively
   * 
   * @param comment - Comment to delete
   */
  private deleteCommentAndReplies(comment: Comment): void {
    // Delete all replies first
    comment.replies.forEach(reply => {
      this.deleteCommentAndReplies(reply);
    });

    // Delete the comment itself
    this.comments.delete(comment.id);
  }

  /**
   * Emit an event to all registered handlers
   * 
   * @param event - Event type
   * @param data - Event data
   */
  private emit(event: CommentEvent, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in comment event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Broadcast comment added to other users
   * 
   * @param comment - Added comment
   */
  private broadcastCommentAdded(comment: Comment): void {
    const message = {
      type: 'comment-added' as any,
      payload: comment,
      timestamp: Date.now(),
    };

    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Broadcast comment updated to other users
   * 
   * @param commentId - Comment ID
   * @param updates - Updated fields
   */
  private broadcastCommentUpdated(commentId: string, updates: Partial<Comment>): void {
    const message = {
      type: 'comment-updated' as any,
      payload: { commentId, updates },
      timestamp: Date.now(),
    };

    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Broadcast comment deleted to other users
   * 
   * @param commentId - Deleted comment ID
   */
  private broadcastCommentDeleted(commentId: string): void {
    const message = {
      type: 'comment-deleted' as any,
      payload: { commentId },
      timestamp: Date.now(),
    };

    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Broadcast reply added to other users
   * 
   * @param parentId - Parent comment ID
   * @param reply - Reply comment
   */
  private broadcastReplyAdded(parentId: string, reply: Comment): void {
    const message = {
      type: 'reply-added' as any,
      payload: { parentId, reply },
      timestamp: Date.now(),
    };

    (this.collaborationEngine as any).sendMessage?.(message);
  }

  /**
   * Handle remote comment added event
   * 
   * @param comment - Remote comment
   */
  private handleRemoteCommentAdded(comment: Comment): void {
    // Store comment
    this.comments.set(comment.id, comment);

    // Emit local event
    this.emit('comment-added', comment);
  }

  /**
   * Handle remote comment updated event
   * 
   * @param data - Update data
   */
  private handleRemoteCommentUpdated(data: { commentId: string; updates: Partial<Comment> }): void {
    const comment = this.comments.get(data.commentId);
    if (comment) {
      Object.assign(comment, data.updates);
      this.emit('comment-updated', { commentId: data.commentId, comment });
    }
  }

  /**
   * Handle remote comment deleted event
   * 
   * @param data - Delete data
   */
  private handleRemoteCommentDeleted(data: { commentId: string }): void {
    const comment = this.comments.get(data.commentId);
    if (comment) {
      if (comment.parentId === null) {
        this.deleteCommentAndReplies(comment);
      } else {
        const parent = this.comments.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies.filter(r => r.id !== data.commentId);
        }
        this.comments.delete(data.commentId);
      }
      this.emit('comment-deleted', data);
    }
  }

  /**
   * Handle remote reply added event
   * 
   * @param data - Reply data
   */
  private handleRemoteReplyAdded(data: { parentId: string; reply: Comment }): void {
    const parent = this.comments.get(data.parentId);
    if (parent) {
      parent.replies.push(data.reply);
      this.comments.set(data.reply.id, data.reply);
      this.emit('reply-added', data);
    }
  }

  /**
   * Destroy the comment system and clean up resources
   */
  destroy(): void {
    this.comments.clear();
    this.eventHandlers.clear();
    this.availableUsers.clear();
    this.collaborationEngine = null;
  }
}
