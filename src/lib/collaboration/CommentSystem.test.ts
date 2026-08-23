/**
 * Unit tests for CommentSystem
 * 
 * Tests the CommentSystem implementation including:
 * - Comment thread creation and management
 * - Range-based comment attachment
 * - Threaded replies
 * - Resolve/unresolve functionality
 * - Mention detection and notification
 * - Real-time synchronization
 * 
 * Requirements: 4.4, 4.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommentSystem, type CommentInput, type ReplyInput } from './CommentSystem';
import { CollaborationEngine } from './CollaborationEngine';
import { ConnectionState } from './types';

describe('CommentSystem', () => {
  let commentSystem: CommentSystem;
  let mockCollaborationEngine: any;

  beforeEach(() => {
    commentSystem = new CommentSystem();
    
    // Create a mock CollaborationEngine
    mockCollaborationEngine = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      getActiveUsers: vi.fn().mockReturnValue([
        { id: 'user1', name: 'User One' },
        { id: 'user2', name: 'User Two' }
      ]),
      sendMessage: vi.fn()
    };
  });

  describe('Basics', () => {
    it('should add a new comment', () => {
      const input: CommentInput = {
        userId: 'user1',
        userName: 'User One',
        content: 'Test comment',
        range: { start: 10, end: 20 },
        resolved: false
      };

      const comment = commentSystem.addComment(input);

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.range).toEqual({ start: 10, end: 20 });
      expect(commentSystem.getCommentCount()).toBe(1);
    });

    it('should get comments in range', () => {
      commentSystem.addComment({
        userId: 'user1',
        userName: 'User One',
        content: 'Comment 1',
        range: { start: 10, end: 20 },
        resolved: false
      });

      commentSystem.addComment({
        userId: 'user2',
        userName: 'User Two',
        content: 'Comment 2',
        range: { start: 30, end: 40 },
        resolved: false
      });

      const comments = commentSystem.getCommentsInRange(15, 25);
      expect(comments.length).toBe(1);
      expect(comments[0].content).toBe('Comment 1');
    });

    it('should delete a comment', () => {
      const comment = commentSystem.addComment({
        userId: 'user1',
        userName: 'User One',
        content: 'Test comment',
        range: { start: 10, end: 20 },
        resolved: false
      });

      expect(commentSystem.getCommentCount()).toBe(1);
      commentSystem.deleteComment(comment.id);
      expect(commentSystem.getCommentCount()).toBe(0);
    });
  });

  describe('Replies', () => {
    it('should add a reply to a comment', () => {
      const rootComment = commentSystem.addComment({
        userId: 'user1',
        userName: 'User One',
        content: 'Root comment',
        range: { start: 10, end: 20 },
        resolved: false
      });

      const replyInput: ReplyInput = {
        userId: 'user2',
        userName: 'User Two',
        content: 'Reply comment'
      };

      const reply = commentSystem.replyToComment(rootComment.id, replyInput);

      expect(reply.parentId).toBe(rootComment.id);
      expect(rootComment.replies.length).toBe(1);
      expect(rootComment.replies[0].id).toBe(reply.id);
      expect(commentSystem.getCommentCount()).toBe(2);
    });

    it('should enforce maximum reply depth', () => {
      commentSystem.updateConfig({ maxReplyDepth: 2 });
      
      const c1 = commentSystem.addComment({
        userId: 'u1', userName: 'User 1', content: 'C1', range: { start: 0, end: 5 }, resolved: false
      });
      
      const c2 = commentSystem.replyToComment(c1.id, {
        userId: 'u2', userName: 'User 2', content: 'C2'
      });
      
      const c3 = commentSystem.replyToComment(c2.id, {
        userId: 'u3', userName: 'User 3', content: 'C3'
      });
      
      expect(() => {
        commentSystem.replyToComment(c3.id, {
          userId: 'u4', userName: 'User 4', content: 'C4'
        });
      }).toThrow(/Maximum reply depth/);
    });

    it('should delete replies when root comment is deleted', () => {
      const root = commentSystem.addComment({
        userId: 'u1', userName: 'User 1', content: 'Root', range: { start: 0, end: 5 }, resolved: false
      });
      
      commentSystem.replyToComment(root.id, {
        userId: 'u2', userName: 'User 2', content: 'Reply'
      });
      
      expect(commentSystem.getCommentCount()).toBe(2);
      commentSystem.deleteComment(root.id);
      expect(commentSystem.getCommentCount()).toBe(0);
    });
  });

  describe('Resolution', () => {
    it('should resolve and unresolve a comment thread', () => {
      const comment = commentSystem.addComment({
        userId: 'u1', userName: 'User 1', content: 'C', range: { start: 0, end: 5 }, resolved: false
      });
      
      expect(comment.resolved).toBe(false);
      commentSystem.resolveComment(comment.id);
      expect(comment.resolved).toBe(true);
      commentSystem.unresolveComment(comment.id);
      expect(comment.resolved).toBe(false);
    });

    it('should only resolve root comments', () => {
      const root = commentSystem.addComment({
        userId: 'u1', userName: 'User 1', content: 'Root', range: { start: 0, end: 5 }, resolved: false
      });
      
      const reply = commentSystem.replyToComment(root.id, {
        userId: 'u2', userName: 'User 2', content: 'Reply'
      });
      
      expect(() => commentSystem.resolveComment(reply.id)).toThrow(/Can only resolve root comments/);
    });
  });

  describe('Mentions', () => {
    beforeEach(() => {
      commentSystem.addAvailableUser({ id: 'user-123', name: 'Alice' });
    });

    it('should detect mentions in content', () => {
      const comment = commentSystem.addComment({
        userId: 'u1',
        userName: 'User 1',
        content: 'Hello @Alice, check this out!',
        range: { start: 0, end: 5 },
        resolved: false
      });

      expect(comment.mentions).toContain('user-123');
    });

    it('should emit mention-detected event', () => {
      const handler = vi.fn();
      commentSystem.on('mention-detected', handler);

      commentSystem.addComment({
        userId: 'u1',
        userName: 'User 1',
        content: 'Ping @Alice',
        range: { start: 0, end: 5 },
        resolved: false
      });

      expect(handler).toHaveBeenCalled();
      const callData = handler.mock.calls[0][0];
      expect(callData.mentionedUserId).toBe('user-123');
    });
  });

  describe('Collaboration Sync', () => {
    it('should broadcast comment addition when sync enabled', () => {
      commentSystem.setCollaborationEngine(mockCollaborationEngine as any);
      
      commentSystem.addComment({
        userId: 'u1',
        userName: 'User 1',
        content: 'Sync test',
        range: { start: 0, end: 5 },
        resolved: false
      });

      expect(mockCollaborationEngine.sendMessage).toHaveBeenCalled();
      const message = mockCollaborationEngine.sendMessage.mock.calls[0][0];
      expect(message.type).toBe('comment-added');
      expect(message.payload.content).toBe('Sync test');
    });

    it('should handle remote comment addition', () => {
      commentSystem.setCollaborationEngine(mockCollaborationEngine as any);
      
      // Get the handler registered with the engine
      const onCall = mockCollaborationEngine.on.mock.calls.find((call: any) => call[0] === 'comment-added');
      const handler = onCall[1];

      const remoteComment = {
        id: 'remote-1',
        userId: 'u2',
        userName: 'User 2',
        content: 'Remote comment',
        range: { start: 10, end: 15 },
        timestamp: Date.now(),
        replies: [],
        resolved: false,
        parentId: null,
        mentions: [],
        editedAt: null
      };

      handler(remoteComment);

      expect(commentSystem.getCommentCount()).toBe(1);
      expect(commentSystem.getComment('remote-1')).toEqual(remoteComment);
    });
  });
});
