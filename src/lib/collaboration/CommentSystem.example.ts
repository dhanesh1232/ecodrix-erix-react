/**
 * CommentSystem Usage Examples
 * 
 * This file demonstrates how to use the CommentSystem for managing
 * threaded comments with range tracking, mentions, and real-time sync.
 */

import { CommentSystem } from './CommentSystem';
import { CollaborationEngine } from './CollaborationEngine';

/**
 * Example 1: Basic Comment Creation
 * 
 * Create a simple comment attached to a content range
 */
export function example1_BasicComment() {
  const commentSystem = new CommentSystem();

  // Add a comment
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'This section needs clarification.',
    range: { start: 100, end: 150 },
    resolved: false,
  });

  console.log('Created comment:', comment);
  // Output: { id: 'comment-...', userId: 'user-123', content: '...', ... }
}

/**
 * Example 2: Threaded Replies
 * 
 * Add replies to create a threaded discussion
 */
export function example2_ThreadedReplies() {
  const commentSystem = new CommentSystem();

  // Create root comment
  const rootComment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'What does this mean?',
    range: { start: 200, end: 250 },
    resolved: false,
  });

  // Add a reply
  const reply1 = commentSystem.replyToComment(rootComment.id, {
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Let me explain...',
  });

  // Add another reply
  const reply2 = commentSystem.replyToComment(rootComment.id, {
    userId: 'user-789',
    userName: 'Bob Johnson',
    content: 'I agree with Jane.',
  });

  console.log('Root comment with replies:', rootComment);
  console.log('Number of replies:', rootComment.replies.length);
}

/**
 * Example 3: Resolve/Unresolve Comments
 * 
 * Mark comment threads as resolved or unresolved
 */
export function example3_ResolveComments() {
  const commentSystem = new CommentSystem();

  // Create comment
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Please fix this typo.',
    range: { start: 300, end: 310 },
    resolved: false,
  });

  console.log('Initial resolved state:', comment.resolved); // false

  // Resolve the comment
  commentSystem.resolveComment(comment.id);
  console.log('After resolving:', comment.resolved); // true

  // Unresolve if needed
  commentSystem.unresolveComment(comment.id);
  console.log('After unresolving:', comment.resolved); // false
}

/**
 * Example 4: Range-Based Comment Queries
 * 
 * Find comments in a specific content range
 */
export function example4_RangeQueries() {
  const commentSystem = new CommentSystem();

  // Add multiple comments at different positions
  commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Comment 1',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  commentSystem.addComment({
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Comment 2',
    range: { start: 100, end: 150 },
    resolved: false,
  });

  commentSystem.addComment({
    userId: 'user-789',
    userName: 'Bob Johnson',
    content: 'Comment 3',
    range: { start: 200, end: 250 },
    resolved: false,
  });

  // Get comments in a specific range
  const commentsInRange = commentSystem.getCommentsInRange(80, 180);
  console.log('Comments in range [80, 180]:', commentsInRange);
  // Output: [Comment 2] (only comment 2 overlaps with this range)
}

/**
 * Example 5: Mention Detection
 * 
 * Automatically detect and notify mentioned users
 */
export function example5_Mentions() {
  const commentSystem = new CommentSystem({
    enableMentions: true,
  });

  // Add available users
  commentSystem.addAvailableUser({ id: 'user-456', name: 'Jane' });
  commentSystem.addAvailableUser({ id: 'user-789', name: 'Bob' });

  // Listen for mention events
  commentSystem.on('mention-detected', (data) => {
    console.log('User mentioned:', data.mentionedUserId);
    console.log('In comment:', data.commentId);
    // Send notification to mentioned user
  });

  // Create comment with mentions
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Hey @Jane and @Bob, please review this section.',
    range: { start: 400, end: 450 },
    resolved: false,
  });

  console.log('Detected mentions:', comment.mentions);
  // Output: ['user-456', 'user-789']
}

/**
 * Example 6: Real-Time Synchronization
 * 
 * Integrate with CollaborationEngine for real-time comment sync
 */
export async function example6_RealtimeSync() {
  // Create collaboration engine
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-123',
    userName: 'John Doe',
    userColor: '#3b82f6',
  });

  // Create comment system
  const commentSystem = new CommentSystem({
    enableSync: true,
  });

  // Connect collaboration engine
  await collaboration.connect('document-456');

  // Link comment system to collaboration engine
  commentSystem.setCollaborationEngine(collaboration);

  // Listen for remote comments
  commentSystem.on('comment-added', (comment) => {
    console.log('Remote comment added:', comment);
    // Update UI to show new comment
  });

  commentSystem.on('reply-added', (data) => {
    console.log('Remote reply added:', data.reply);
    // Update UI to show new reply
  });

  // Add a comment (will be broadcast to other users)
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'This is a collaborative comment!',
    range: { start: 500, end: 550 },
    resolved: false,
  });

  console.log('Comment broadcast to other users:', comment.id);
}

/**
 * Example 7: Event Handling
 * 
 * Listen to various comment events
 */
export function example7_EventHandling() {
  const commentSystem = new CommentSystem();

  // Listen for comment added
  commentSystem.on('comment-added', (comment) => {
    console.log('New comment:', comment.content);
  });

  // Listen for comment resolved
  commentSystem.on('comment-resolved', (data) => {
    console.log('Comment resolved:', data.commentId);
  });

  // Listen for comment updated
  commentSystem.on('comment-updated', (data) => {
    console.log('Comment updated:', data.commentId);
  });

  // Listen for comment deleted
  commentSystem.on('comment-deleted', (data) => {
    console.log('Comment deleted:', data.commentId);
  });

  // Create and manipulate comments
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Test comment',
    range: { start: 0, end: 10 },
    resolved: false,
  });

  commentSystem.resolveComment(comment.id);
  commentSystem.updateComment(comment.id, 'Updated content');
  commentSystem.deleteComment(comment.id);
}

/**
 * Example 8: Filtering Comments
 * 
 * Get resolved and unresolved comments
 */
export function example8_FilteringComments() {
  const commentSystem = new CommentSystem();

  // Add multiple comments
  const comment1 = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Resolved comment',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  const comment2 = commentSystem.addComment({
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Unresolved comment',
    range: { start: 100, end: 150 },
    resolved: false,
  });

  // Resolve first comment
  commentSystem.resolveComment(comment1.id);

  // Get resolved comments
  const resolved = commentSystem.getResolvedComments();
  console.log('Resolved comments:', resolved.length); // 1

  // Get unresolved comments
  const unresolved = commentSystem.getUnresolvedComments();
  console.log('Unresolved comments:', unresolved.length); // 1

  // Get all comments
  const all = commentSystem.getAllComments();
  console.log('All comments:', all.length); // 2
}

/**
 * Example 9: Comment Updates
 * 
 * Update comment content and track edits
 */
export function example9_CommentUpdates() {
  const commentSystem = new CommentSystem();

  // Create comment
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Original content',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  console.log('Original content:', comment.content);
  console.log('Edited at:', comment.editedAt); // null

  // Update comment
  commentSystem.updateComment(comment.id, 'Updated content');

  console.log('Updated content:', comment.content);
  console.log('Edited at:', comment.editedAt); // timestamp
}

/**
 * Example 10: Complex Comment Thread
 * 
 * Create a complex discussion with multiple levels
 */
export function example10_ComplexThread() {
  const commentSystem = new CommentSystem({
    maxReplyDepth: 5,
  });

  // Create root comment
  const root = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'What do you think about this approach?',
    range: { start: 600, end: 700 },
    resolved: false,
  });

  // First level reply
  const reply1 = commentSystem.replyToComment(root.id, {
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'I think it looks good, but...',
  });

  // Second level reply (reply to reply)
  const reply2 = commentSystem.replyToComment(reply1.id, {
    userId: 'user-789',
    userName: 'Bob Johnson',
    content: 'I agree with Jane.',
  });

  // Another first level reply
  const reply3 = commentSystem.replyToComment(root.id, {
    userId: 'user-101',
    userName: 'Alice Brown',
    content: 'Have you considered alternative X?',
  });

  console.log('Root comment:', root.content);
  console.log('Direct replies:', root.replies.length); // 2
  console.log('First reply has replies:', reply1.replies.length); // 1

  // Get the full thread
  const fullComment = commentSystem.getComment(root.id);
  console.log('Full thread structure:', JSON.stringify(fullComment, null, 2));
}

/**
 * Example 11: Comment Statistics
 * 
 * Get statistics about comments
 */
export function example11_Statistics() {
  const commentSystem = new CommentSystem();

  // Add various comments
  const root1 = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Comment 1',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  commentSystem.replyToComment(root1.id, {
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Reply 1',
  });

  commentSystem.replyToComment(root1.id, {
    userId: 'user-789',
    userName: 'Bob Johnson',
    content: 'Reply 2',
  });

  const root2 = commentSystem.addComment({
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Comment 2',
    range: { start: 100, end: 150 },
    resolved: false,
  });

  // Get statistics
  console.log('Total comments (including replies):', commentSystem.getCommentCount()); // 4
  console.log('Root comments:', commentSystem.getRootCommentCount()); // 2
  console.log('Resolved comments:', commentSystem.getResolvedComments().length); // 0
  console.log('Unresolved comments:', commentSystem.getUnresolvedComments().length); // 2
}

/**
 * Example 12: Custom Mention Pattern
 * 
 * Use a custom regex pattern for mention detection
 */
export function example12_CustomMentionPattern() {
  // Use custom pattern that matches @[username]
  const commentSystem = new CommentSystem({
    enableMentions: true,
    mentionPattern: /@\[(\w+)\]/g,
  });

  // Add available users
  commentSystem.addAvailableUser({ id: 'user-456', name: 'Jane' });

  // Create comment with custom mention format
  const comment = commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Hey @[Jane], please check this out.',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  console.log('Detected mentions:', comment.mentions);
  // Output: ['user-456']
}

/**
 * Example 13: Error Handling
 * 
 * Handle common error scenarios
 */
export function example13_ErrorHandling() {
  const commentSystem = new CommentSystem();

  try {
    // Try to reply to non-existent comment
    commentSystem.replyToComment('invalid-id', {
      userId: 'user-123',
      userName: 'John Doe',
      content: 'This will fail',
    });
  } catch (error) {
    console.error('Error:', (error as Error).message);
    // Output: "Comment not found: invalid-id"
  }

  try {
    // Try to resolve non-existent comment
    commentSystem.resolveComment('invalid-id');
  } catch (error) {
    console.error('Error:', (error as Error).message);
    // Output: "Comment not found: invalid-id"
  }

  // Create a deep thread
  const commentSystem2 = new CommentSystem({
    maxReplyDepth: 2,
  });

  const root = commentSystem2.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Root',
    range: { start: 0, end: 10 },
    resolved: false,
  });

  const reply1 = commentSystem2.replyToComment(root.id, {
    userId: 'user-456',
    userName: 'Jane Smith',
    content: 'Reply 1',
  });

  const reply2 = commentSystem2.replyToComment(reply1.id, {
    userId: 'user-789',
    userName: 'Bob Johnson',
    content: 'Reply 2',
  });

  try {
    // Try to exceed max depth
    commentSystem2.replyToComment(reply2.id, {
      userId: 'user-101',
      userName: 'Alice Brown',
      content: 'This will fail',
    });
  } catch (error) {
    console.error('Error:', (error as Error).message);
    // Output: "Maximum reply depth (2) exceeded"
  }
}

/**
 * Example 14: Cleanup and Destruction
 * 
 * Properly clean up resources
 */
export function example14_Cleanup() {
  const commentSystem = new CommentSystem();

  // Add some comments
  commentSystem.addComment({
    userId: 'user-123',
    userName: 'John Doe',
    content: 'Comment 1',
    range: { start: 0, end: 50 },
    resolved: false,
  });

  console.log('Comments before clear:', commentSystem.getCommentCount()); // 1

  // Clear all comments
  commentSystem.clear();
  console.log('Comments after clear:', commentSystem.getCommentCount()); // 0

  // Destroy the comment system
  commentSystem.destroy();
  console.log('Comment system destroyed');
}
