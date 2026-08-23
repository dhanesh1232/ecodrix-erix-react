# CommentSystem

A comprehensive comment management system for collaborative document editing with support for threaded discussions, range-based attachment, mention notifications, and real-time synchronization.

## Features

- **Range-Based Comments**: Attach comments to specific content ranges in the document
- **Threaded Replies**: Support for nested reply threads with configurable depth
- **Resolve/Unresolve**: Mark comment threads as resolved or unresolved
- **Mention Detection**: Automatically detect @mentions and send notifications
- **Real-Time Sync**: Integrate with CollaborationEngine for multi-user collaboration
- **Event System**: Subscribe to comment events for UI updates
- **Filtering**: Query comments by range, resolution status, or other criteria

## Requirements

This implementation satisfies the following requirements:

- **Requirement 4.4**: When a user creates a Comment_Thread, THE ErixEditor SHALL attach the comment to the specific content range
- **Requirement 4.6**: When a user is mentioned in a Comment_Thread, THE ErixEditor SHALL send a notification to that user

## Installation

The CommentSystem is part of the `@ecodrix/erix-react` package:

```typescript
import { CommentSystem } from '@ecodrix/erix-react';
```

## Basic Usage

### Creating a Comment System

```typescript
import { CommentSystem } from '@ecodrix/erix-react';

const commentSystem = new CommentSystem({
  enableMentions: true,
  enableSync: true,
  maxReplyDepth: 5,
});
```

### Adding Comments

```typescript
const comment = commentSystem.addComment({
  userId: 'user-123',
  userName: 'John Doe',
  content: 'This section needs clarification.',
  range: { start: 100, end: 150 }, // Character positions in document
  resolved: false,
});

console.log('Created comment:', comment.id);
```

### Adding Replies

```typescript
const reply = commentSystem.replyToComment(comment.id, {
  userId: 'user-456',
  userName: 'Jane Smith',
  content: 'Let me explain...',
});

console.log('Added reply:', reply.id);
console.log('Parent has replies:', comment.replies.length);
```

### Resolving Comments

```typescript
// Mark as resolved
commentSystem.resolveComment(comment.id);

// Mark as unresolved
commentSystem.unresolveComment(comment.id);
```

### Querying Comments

```typescript
// Get comments in a specific range
const commentsInRange = commentSystem.getCommentsInRange(100, 200);

// Get all comments
const allComments = commentSystem.getAllComments();

// Get resolved comments
const resolved = commentSystem.getResolvedComments();

// Get unresolved comments
const unresolved = commentSystem.getUnresolvedComments();

// Get specific comment
const comment = commentSystem.getComment('comment-id');
```

## Advanced Features

### Mention Detection

The CommentSystem automatically detects @mentions in comment content:

```typescript
// Add available users for mention detection
commentSystem.addAvailableUser({ id: 'user-456', name: 'Jane' });
commentSystem.addAvailableUser({ id: 'user-789', name: 'Bob' });

// Listen for mention events
commentSystem.on('mention-detected', (data) => {
  console.log('User mentioned:', data.mentionedUserId);
  // Send notification to mentioned user
  sendNotification(data.mentionedUserId, {
    type: 'mention',
    commentId: data.commentId,
    from: data.comment.userName,
  });
});

// Create comment with mentions
const comment = commentSystem.addComment({
  userId: 'user-123',
  userName: 'John Doe',
  content: 'Hey @Jane and @Bob, please review this.',
  range: { start: 400, end: 450 },
  resolved: false,
});

console.log('Detected mentions:', comment.mentions);
// Output: ['user-456', 'user-789']
```

### Real-Time Synchronization

Integrate with CollaborationEngine for real-time comment sync across users:

```typescript
import { CollaborationEngine, CommentSystem } from '@ecodrix/erix-react';

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

// Connect to document
await collaboration.connect('document-456');

// Link comment system to collaboration engine
commentSystem.setCollaborationEngine(collaboration);

// Listen for remote comments
commentSystem.on('comment-added', (comment) => {
  console.log('Remote comment added:', comment);
  updateUI(comment);
});

commentSystem.on('reply-added', (data) => {
  console.log('Remote reply added:', data.reply);
  updateUI(data.reply);
});

// Add a comment (will be broadcast to other users)
const comment = commentSystem.addComment({
  userId: 'user-123',
  userName: 'John Doe',
  content: 'This is a collaborative comment!',
  range: { start: 500, end: 550 },
  resolved: false,
});
```

### Event Handling

Subscribe to various comment events:

```typescript
// Comment added
commentSystem.on('comment-added', (comment) => {
  console.log('New comment:', comment);
});

// Comment updated
commentSystem.on('comment-updated', (data) => {
  console.log('Comment updated:', data.commentId);
});

// Comment deleted
commentSystem.on('comment-deleted', (data) => {
  console.log('Comment deleted:', data.commentId);
});

// Comment resolved
commentSystem.on('comment-resolved', (data) => {
  console.log('Comment resolved:', data.commentId);
});

// Comment unresolved
commentSystem.on('comment-unresolved', (data) => {
  console.log('Comment unresolved:', data.commentId);
});

// Reply added
commentSystem.on('reply-added', (data) => {
  console.log('Reply added to:', data.parentId);
});

// Mention detected
commentSystem.on('mention-detected', (data) => {
  console.log('User mentioned:', data.mentionedUserId);
});
```

### Updating Comments

```typescript
// Update comment content
commentSystem.updateComment(comment.id, 'Updated content');

// Check if edited
console.log('Edited at:', comment.editedAt); // timestamp or null
```

### Deleting Comments

```typescript
// Delete a comment (and all its replies if it's a root comment)
commentSystem.deleteComment(comment.id);
```

## Configuration

### CommentSystemConfig

```typescript
interface CommentSystemConfig {
  /** Enable mention detection (default: true) */
  enableMentions?: boolean;
  
  /** Enable real-time synchronization (default: true) */
  enableSync?: boolean;
  
  /** Mention pattern regex (default: /@(\w+)/g) */
  mentionPattern?: RegExp;
  
  /** Maximum comment depth for replies (default: 5) */
  maxReplyDepth?: number;
}
```

### Custom Mention Pattern

```typescript
// Use custom pattern that matches @[username]
const commentSystem = new CommentSystem({
  enableMentions: true,
  mentionPattern: /@\[(\w+)\]/g,
});

const comment = commentSystem.addComment({
  userId: 'user-123',
  userName: 'John Doe',
  content: 'Hey @[Jane], please check this.',
  range: { start: 0, end: 50 },
  resolved: false,
});
```

## Data Structures

### Comment

```typescript
interface Comment {
  id: string;                    // Unique comment ID
  userId: string;                // User who created the comment
  userName: string;              // User display name
  content: string;               // Comment content (supports markdown)
  range: CommentRange;           // Content range
  timestamp: number;             // Creation timestamp
  replies: Comment[];            // Reply comments
  resolved: boolean;             // Resolution status
  parentId: string | null;       // Parent comment ID (null for root)
  mentions: string[];            // Mentioned user IDs
  editedAt: number | null;       // Last edit timestamp
}
```

### CommentRange

```typescript
interface CommentRange {
  start: number;  // Start position in document
  end: number;    // End position in document
}
```

## API Reference

### Constructor

```typescript
constructor(config?: CommentSystemConfig)
```

### Methods

#### addComment(comment: CommentInput): Comment
Add a new root comment.

#### replyToComment(commentId: string, reply: ReplyInput): Comment
Add a reply to an existing comment.

#### resolveComment(commentId: string): void
Mark a comment thread as resolved.

#### unresolveComment(commentId: string): void
Mark a comment thread as unresolved.

#### getCommentsInRange(start: number, end: number): Comment[]
Get comments overlapping a specific range.

#### getComment(commentId: string): Comment | null
Get a specific comment by ID.

#### getAllComments(): Comment[]
Get all root comments.

#### getResolvedComments(): Comment[]
Get all resolved comments.

#### getUnresolvedComments(): Comment[]
Get all unresolved comments.

#### updateComment(commentId: string, content: string): void
Update a comment's content.

#### deleteComment(commentId: string): void
Delete a comment and all its replies.

#### on(event: CommentEvent, handler: CommentEventHandler): void
Register an event handler.

#### off(event: CommentEvent, handler: CommentEventHandler): void
Unregister an event handler.

#### getAvailableUsers(): Array<{ id: string; name: string }>
Get available users for mentions.

#### addAvailableUser(user: { id: string; name: string }): void
Add a user to the available users list.

#### removeAvailableUser(userId: string): void
Remove a user from the available users list.

#### clear(): void
Clear all comments.

#### getCommentCount(): number
Get total comment count (including replies).

#### getRootCommentCount(): number
Get root comment count.

#### destroy(): void
Clean up resources.

## Error Handling

The CommentSystem throws errors for invalid operations:

```typescript
try {
  // Try to reply to non-existent comment
  commentSystem.replyToComment('invalid-id', {
    userId: 'user-123',
    userName: 'John Doe',
    content: 'This will fail',
  });
} catch (error) {
  console.error('Error:', error.message);
  // Output: "Comment not found: invalid-id"
}

try {
  // Try to exceed max depth
  commentSystem.replyToComment(deeplyNestedCommentId, {
    userId: 'user-123',
    userName: 'John Doe',
    content: 'This will fail',
  });
} catch (error) {
  console.error('Error:', error.message);
  // Output: "Maximum reply depth (5) exceeded"
}
```

## Best Practices

### 1. Initialize Early

Create the CommentSystem early in your application lifecycle:

```typescript
const commentSystem = useMemo(() => new CommentSystem({
  enableMentions: true,
  enableSync: true,
}), []);
```

### 2. Clean Up on Unmount

Always clean up resources when the component unmounts:

```typescript
useEffect(() => {
  return () => {
    commentSystem.destroy();
  };
}, [commentSystem]);
```

### 3. Handle Events Properly

Use event handlers to update your UI reactively:

```typescript
useEffect(() => {
  const handleCommentAdded = (comment: Comment) => {
    setComments(prev => [...prev, comment]);
  };

  commentSystem.on('comment-added', handleCommentAdded);

  return () => {
    commentSystem.off('comment-added', handleCommentAdded);
  };
}, [commentSystem]);
```

### 4. Validate User Input

Always validate user input before creating comments:

```typescript
function addComment(content: string, range: CommentRange) {
  if (!content.trim()) {
    showError('Comment content cannot be empty');
    return;
  }

  if (range.start >= range.end) {
    showError('Invalid range');
    return;
  }

  commentSystem.addComment({
    userId: currentUser.id,
    userName: currentUser.name,
    content: content.trim(),
    range,
    resolved: false,
  });
}
```

### 5. Optimize Range Queries

Cache range queries when possible:

```typescript
const commentsInViewport = useMemo(() => {
  return commentSystem.getCommentsInRange(viewportStart, viewportEnd);
}, [viewportStart, viewportEnd, commentSystem]);
```

## Integration with UI

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { CommentSystem, Comment } from '@ecodrix/erix-react';

function CommentThread({ commentSystem, commentId }: Props) {
  const [comment, setComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const c = commentSystem.getComment(commentId);
    setComment(c);

    const handleUpdate = () => {
      setComment(commentSystem.getComment(commentId));
    };

    commentSystem.on('comment-updated', handleUpdate);
    commentSystem.on('reply-added', handleUpdate);

    return () => {
      commentSystem.off('comment-updated', handleUpdate);
      commentSystem.off('reply-added', handleUpdate);
    };
  }, [commentSystem, commentId]);

  const handleReply = () => {
    if (replyText.trim()) {
      commentSystem.replyToComment(commentId, {
        userId: currentUser.id,
        userName: currentUser.name,
        content: replyText,
      });
      setReplyText('');
    }
  };

  const handleResolve = () => {
    if (comment?.resolved) {
      commentSystem.unresolveComment(commentId);
    } else {
      commentSystem.resolveComment(commentId);
    }
  };

  if (!comment) return null;

  return (
    <div className="comment-thread">
      <div className="comment">
        <strong>{comment.userName}</strong>
        <p>{comment.content}</p>
        <button onClick={handleResolve}>
          {comment.resolved ? 'Unresolve' : 'Resolve'}
        </button>
      </div>

      {comment.replies.map(reply => (
        <div key={reply.id} className="reply">
          <strong>{reply.userName}</strong>
          <p>{reply.content}</p>
        </div>
      ))}

      <div className="reply-input">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply..."
        />
        <button onClick={handleReply}>Reply</button>
      </div>
    </div>
  );
}
```

## Performance Considerations

### 1. Range Query Optimization

The `getCommentsInRange` method uses efficient overlap detection:

```typescript
// O(n) where n is total number of comments
const comments = commentSystem.getCommentsInRange(start, end);
```

For large documents with many comments, consider:
- Caching range queries
- Using spatial indexing for very large comment sets
- Limiting the query range to the visible viewport

### 2. Event Handler Optimization

Avoid creating new handler functions on every render:

```typescript
// Bad: Creates new function on every render
commentSystem.on('comment-added', (comment) => {
  setComments([...comments, comment]);
});

// Good: Use useCallback
const handleCommentAdded = useCallback((comment: Comment) => {
  setComments(prev => [...prev, comment]);
}, []);

useEffect(() => {
  commentSystem.on('comment-added', handleCommentAdded);
  return () => commentSystem.off('comment-added', handleCommentAdded);
}, [commentSystem, handleCommentAdded]);
```

### 3. Memory Management

Clean up resources when no longer needed:

```typescript
// Clear comments when switching documents
commentSystem.clear();

// Destroy when component unmounts
commentSystem.destroy();
```

## Testing

See `CommentSystem.example.ts` for comprehensive usage examples and test scenarios.

## License

Part of the @ecodrix/erix-react package. See package LICENSE for details.
