# Collaboration Module

The Collaboration module provides real-time collaboration features for the ErixEditor, enabling multiple users to edit documents simultaneously with cursor synchronization, operation broadcasting, and presence tracking.

## Features

- **WebSocket Connection Management**: Robust WebSocket connection handling with automatic reconnection
- **Exponential Backoff**: Smart reconnection strategy with configurable delays (1s to 30s)
- **Connection State Tracking**: Four states - disconnected, connecting, connected, reconnecting
- **Message Queue**: Offline support with message queuing and localStorage persistence
- **User Presence**: Track active users with cursor positions and selections
- **Event-Based Architecture**: Extensible event system for custom integrations
- **Heartbeat Mechanism**: Keep-alive pings to detect dead connections
- **Error Handling**: Comprehensive error types and recovery strategies

## Installation

The collaboration module is part of the `@ecodrix/erix-react` package:

```bash
npm install @ecodrix/erix-react
```

## Basic Usage

### Creating a Collaboration Engine

```typescript
import { CollaborationEngine } from '@ecodrix/erix-react';

const collaboration = new CollaborationEngine({
  websocketUrl: 'wss://api.example.com/collaboration',
  apiKey: 'your-api-key',
  userId: 'user-123',
  userName: 'John Doe',
  userColor: '#3b82f6',
});
```

### Connecting to a Document

```typescript
try {
  await collaboration.connect('document-456');
  console.log('Connected successfully');
} catch (error) {
  console.error('Connection failed:', error);
}
```

### Listening for Events

```typescript
// User joined the session
collaboration.on('user-joined', (user) => {
  console.log(`${user.name} joined`);
  updateUserList();
});

// User left the session
collaboration.on('user-left', (user) => {
  console.log(`${user.name} left`);
  updateUserList();
});

// Operation received from another user
collaboration.on('operation', (operation) => {
  applyOperationToDocument(operation);
});

// Connection state changed
collaboration.on('connection-state-change', ({ oldState, newState }) => {
  console.log(`Connection state: ${oldState} -> ${newState}`);
  updateConnectionIndicator(newState);
});

// Reconnecting
collaboration.on('reconnecting', ({ attempt, delay, maxAttempts }) => {
  console.log(`Reconnecting (attempt ${attempt}/${maxAttempts}) in ${delay}ms`);
});

// Reconnected successfully
collaboration.on('reconnected', () => {
  console.log('Reconnected successfully');
});

// Error occurred
collaboration.on('error', (error) => {
  console.error('Collaboration error:', error);
  showErrorNotification(error.message);
});
```

### Sending Operations

```typescript
import { OperationType } from '@ecodrix/erix-react';

// Send an insert operation
collaboration.sendOperation({
  type: OperationType.INSERT,
  position: 10,
  content: 'Hello, world!',
  userId: 'user-123',
  timestamp: Date.now(),
});

// Send a delete operation
collaboration.sendOperation({
  type: OperationType.DELETE,
  position: 5,
  length: 7,
  userId: 'user-123',
  timestamp: Date.now(),
});
```

### Getting Active Users

```typescript
const users = collaboration.getActiveUsers();
console.log(`${users.length} users online`);

users.forEach(user => {
  console.log(`- ${user.name} (${user.id})`);
  if (user.cursor) {
    console.log(`  Cursor at line ${user.cursor.line}, column ${user.cursor.column}`);
  }
});
```

### Checking Connection State

```typescript
import { ConnectionState } from '@ecodrix/erix-react';

const state = collaboration.getConnectionState();

if (state === ConnectionState.CONNECTED) {
  console.log('Connected and ready');
} else if (state === ConnectionState.RECONNECTING) {
  console.log('Reconnecting...');
}

// Or use the convenience method
if (collaboration.isConnected()) {
  console.log('Connected');
}
```

### Disconnecting

```typescript
collaboration.disconnect();
```

## Configuration

### Basic Configuration

```typescript
interface CollaborationConfig {
  websocketUrl: string;      // WebSocket server URL
  apiKey: string;            // API key for authentication
  userId: string;            // Current user ID
  userName: string;          // Current user display name
  userColor: string;         // User color for cursor/selection (hex)
  reconnection?: ReconnectionConfig;
  messageQueue?: MessageQueueConfig;
}
```

### Reconnection Configuration

```typescript
interface ReconnectionConfig {
  enabled: boolean;          // Enable automatic reconnection (default: true)
  initialDelay: number;      // Initial delay in ms (default: 1000)
  maxDelay: number;          // Maximum delay in ms (default: 30000)
  maxAttempts: number;       // Max reconnection attempts (default: Infinity)
  backoffMultiplier: number; // Backoff multiplier (default: 2)
}
```

Example with custom reconnection:

```typescript
const collaboration = new CollaborationEngine({
  websocketUrl: 'wss://api.example.com/collaboration',
  apiKey: 'your-api-key',
  userId: 'user-123',
  userName: 'John Doe',
  userColor: '#3b82f6',
  reconnection: {
    enabled: true,
    initialDelay: 2000,      // Start with 2s delay
    maxDelay: 60000,         // Max 60s delay
    maxAttempts: 10,         // Try 10 times
    backoffMultiplier: 1.5,  // Slower backoff
  },
});
```

### Message Queue Configuration

```typescript
interface MessageQueueConfig {
  enabled: boolean;    // Enable message queuing (default: true)
  maxSize: number;     // Maximum queue size (default: 100)
  persist: boolean;    // Persist to localStorage (default: true)
}
```

Example with custom queue:

```typescript
const collaboration = new CollaborationEngine({
  websocketUrl: 'wss://api.example.com/collaboration',
  apiKey: 'your-api-key',
  userId: 'user-123',
  userName: 'John Doe',
  userColor: '#3b82f6',
  messageQueue: {
    enabled: true,
    maxSize: 200,      // Store up to 200 messages
    persist: true,     // Save to localStorage
  },
});
```

## Advanced Usage

### Updating Configuration

```typescript
// Update configuration at runtime
collaboration.updateConfig({
  userName: 'Jane Doe',
  userColor: '#ef4444',
  reconnection: {
    maxAttempts: 5,
  },
});
```

### Managing Message Queue

```typescript
// Get queue size
const queueSize = collaboration.getQueueSize();
console.log(`${queueSize} messages queued`);

// Clear queue
collaboration.clearQueue();
```

### Cleanup

```typescript
// Destroy the collaboration engine and clean up resources
collaboration.destroy();
```

## Connection States

The collaboration engine tracks four connection states:

1. **DISCONNECTED**: Not connected to the server
2. **CONNECTING**: Attempting to establish connection
3. **CONNECTED**: Successfully connected and ready
4. **RECONNECTING**: Connection lost, attempting to reconnect

## Event Types

The collaboration engine emits the following events:

- `user-joined`: A user joined the session
- `user-left`: A user left the session
- `user-update`: A user's information was updated
- `operation`: An operation was received from another user
- `cursor-update`: A user's cursor position changed
- `selection-update`: A user's selection changed
- `connection-state-change`: Connection state changed
- `error`: An error occurred
- `reconnecting`: Reconnection attempt in progress
- `reconnected`: Successfully reconnected after disconnection

## Error Types

The collaboration engine defines the following error types:

- `CONNECTION_FAILED`: Failed to establish WebSocket connection
- `AUTHENTICATION_FAILED`: Authentication with server failed
- `MESSAGE_SEND_FAILED`: Failed to send a message
- `INVALID_MESSAGE`: Received an invalid message from server
- `RECONNECTION_FAILED`: Maximum reconnection attempts reached
- `UNKNOWN`: Unknown error occurred

## Offline Support

The collaboration engine provides robust offline support through message queuing:

1. **Automatic Queuing**: When offline, messages are automatically queued
2. **localStorage Persistence**: Queue is saved to localStorage (configurable)
3. **Automatic Flush**: When reconnected, queued messages are sent automatically
4. **Size Limits**: Queue size is limited to prevent memory issues (default: 100 messages)

## Reconnection Strategy

The collaboration engine uses exponential backoff for reconnection:

1. **Initial Delay**: Starts with 1 second delay (configurable)
2. **Exponential Backoff**: Each attempt doubles the delay (configurable multiplier)
3. **Maximum Delay**: Caps at 30 seconds (configurable)
4. **Maximum Attempts**: Continues indefinitely by default (configurable)

Example reconnection timeline:
- Attempt 1: 1s delay
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- Attempt 4: 8s delay
- Attempt 5: 16s delay
- Attempt 6+: 30s delay (capped)

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 4.1**: User presence tracking with cursor positions and selections
- **Requirement 4.2**: Real-time operation broadcasting within 200ms
- **Requirement 7.5**: Offline message queuing with automatic sync on reconnection

## Best Practices

1. **Error Handling**: Always listen for the `error` event and handle errors appropriately
2. **Cleanup**: Call `disconnect()` or `destroy()` when unmounting components
3. **State Management**: Use the `connection-state-change` event to update UI
4. **Reconnection Feedback**: Show reconnection status to users during reconnection attempts
5. **Queue Monitoring**: Monitor queue size in offline scenarios to prevent memory issues

## TypeScript Support

The collaboration module is written in TypeScript and provides full type definitions:

```typescript
import type {
  CollaborationConfig,
  CollaborationUser,
  Operation,
  CollaborationEvent,
  CollaborationError,
} from '@ecodrix/erix-react';
```

## Browser Compatibility

The collaboration module requires:
- WebSocket API support
- localStorage API (for queue persistence)
- ES6+ features (Promise, Map, Set)

Supported browsers:
- Chrome 16+
- Firefox 11+
- Safari 7+
- Edge 12+

## Performance Considerations

- **Heartbeat**: 30-second ping/pong to detect dead connections
- **Queue Limits**: Default 100 messages to prevent memory issues
- **Event Handlers**: Use `off()` to remove unused handlers
- **Cleanup**: Always call `destroy()` to prevent memory leaks

## Security Considerations

- **Authentication**: API key is sent via WebSocket URL query parameter
- **HTTPS/WSS**: Always use secure WebSocket connections (wss://)
- **Validation**: Validate all incoming messages before processing
- **Error Handling**: Never expose sensitive information in error messages

## Troubleshooting

### Connection fails immediately

- Check WebSocket URL is correct and accessible
- Verify API key is valid
- Ensure server is running and accepting connections
- Check browser console for detailed error messages

### Reconnection not working

- Verify `reconnection.enabled` is `true`
- Check `maxAttempts` hasn't been reached
- Ensure server is accepting reconnections
- Monitor `reconnecting` events for attempt details

### Messages not being sent

- Check connection state is `CONNECTED`
- Verify message queue isn't full
- Check browser console for send errors
- Monitor `error` events for details

### High memory usage

- Reduce `messageQueue.maxSize`
- Clear queue periodically with `clearQueue()`
- Ensure `destroy()` is called when done
- Remove unused event handlers with `off()`

## License

This module is part of the @ecodrix/erix-react package and follows the same license.
