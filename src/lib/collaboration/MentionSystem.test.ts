import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MentionSystem } from './MentionSystem';
import type { CollaborationUser } from './types';

describe('MentionSystem', () => {
  let mentionSystem: MentionSystem;
  let mockUser1: CollaborationUser;
  let mockUser2: CollaborationUser;

  beforeEach(() => {
    mentionSystem = new MentionSystem();
    mockUser1 = { id: 'u1', name: 'Alice', color: '#ff0000', cursor: null, selection: null, lastActivity: Date.now() };
    mockUser2 = { id: 'u2', name: 'Bob', color: '#00ff00', cursor: null, selection: null, lastActivity: Date.now() };
    mentionSystem.addAvailableUser(mockUser1);
    mentionSystem.addAvailableUser(mockUser2);
  });

  it('should detect mentions in text', () => {
    const text = 'Hello @Alice and @Bob';
    const mentions = mentionSystem.detectMentions(text);

    expect(mentions.length).toBe(2);
    expect(mentions[0].userId).toBe('u1');
    expect(mentions[1].userId).toBe('u2');
  });

  it('should handle case-insensitive detection by default', () => {
    const text = 'Hi @alice';
    const mentions = mentionSystem.detectMentions(text);
    expect(mentions.length).toBe(1);
    expect(mentions[0].userId).toBe('u1');
  });

  it('should not detect non-existent users', () => {
    const text = 'Hi @Charlie';
    const mentions = mentionSystem.detectMentions(text);
    expect(mentions.length).toBe(0);
  });

  it('should search users for autocomplete', () => {
    const results = mentionSystem.searchUsers('Al');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('u1');
  });

  it('should emit mention event on notify', () => {
    const handler = vi.fn();
    mentionSystem.on('mention', handler);

    const notification = {
      sourceId: 'src-1',
      fromUserId: 'u2',
      mentionedUserId: 'u1',
      content: 'Hey @Alice',
      context: 'test',
      timestamp: Date.now()
    };

    mentionSystem.notify(notification);
    expect(handler).toHaveBeenCalledWith(notification);
  });
});
