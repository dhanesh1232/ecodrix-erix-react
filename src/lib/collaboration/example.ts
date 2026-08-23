/**
 * Example usage of the CollaborationEngine
 * 
 * This file demonstrates how to use the CollaborationEngine for real-time
 * collaboration features in the ErixEditor.
 */

import {
  CollaborationEngine,
  ConnectionState,
  OperationType,
  type CollaborationUser,
  type Operation,
} from './index';

/**
 * Example: Basic collaboration setup
 */
export function basicCollaborationExample() {
  // Create a collaboration engine instance
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-123',
    userName: 'John Doe',
    userColor: '#3b82f6',
  });

  // Connect to a document
  collaboration.connect('document-456')
    .then(() => {
      console.log('Connected successfully');
    })
    .catch((error) => {
      console.error('Connection failed:', error);
    });

  // Listen for user events
  collaboration.on('user-joined', (user: CollaborationUser) => {
    console.log(`${user.name} joined the session`);
  });

  collaboration.on('user-left', (user: CollaborationUser) => {
    console.log(`${user.name} left the session`);
  });

  // Listen for operations
  collaboration.on('operation', (operation: Operation) => {
    console.log('Received operation:', operation);
    // Apply operation to your document here
  });

  // Send an operation
  const operation: Operation = {
    type: OperationType.INSERT,
    position: 10,
    content: 'Hello, world!',
    userId: 'user-123',
    timestamp: Date.now(),
  };
  collaboration.sendOperation(operation);

  // Get active users
  const users = collaboration.getActiveUsers();
  console.log(`${users.length} users online`);

  // Disconnect when done
  // collaboration.disconnect();
}

/**
 * Example: Advanced configuration with custom reconnection
 */
export function advancedCollaborationExample() {
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-456',
    userName: 'Jane Smith',
    userColor: '#ef4444',
    reconnection: {
      enabled: true,
      initialDelay: 2000,      // Start with 2s delay
      maxDelay: 60000,         // Max 60s delay
      maxAttempts: 10,         // Try 10 times
      backoffMultiplier: 1.5,  // Slower backoff
    },
    messageQueue: {
      enabled: true,
      maxSize: 200,            // Store up to 200 messages
      persist: true,           // Save to localStorage
    },
  });

  // Monitor connection state
  collaboration.on('connection-state-change', ({ oldState, newState }) => {
    console.log(`Connection state: ${oldState} -> ${newState}`);
    
    if (newState === ConnectionState.CONNECTED) {
      console.log('✓ Connected and ready');
    } else if (newState === ConnectionState.RECONNECTING) {
      console.log('⟳ Reconnecting...');
    } else if (newState === ConnectionState.DISCONNECTED) {
      console.log('✗ Disconnected');
    }
  });

  // Monitor reconnection attempts
  collaboration.on('reconnecting', ({ attempt, delay, maxAttempts }) => {
    console.log(`Reconnecting (attempt ${attempt}/${maxAttempts}) in ${delay}ms`);
  });

  // Handle successful reconnection
  collaboration.on('reconnected', () => {
    console.log('Successfully reconnected!');
  });

  // Handle errors
  collaboration.on('error', (error) => {
    console.error('Collaboration error:', error);
  });

  return collaboration;
}

/**
 * Example: React hook for collaboration
 */
export function useCollaboration(documentId: string) {
  // This would be implemented as a React hook in a real application
  const collaboration = new CollaborationEngine({
    websocketUrl: process.env.REACT_APP_WS_URL || 'wss://api.example.com/collaboration',
    apiKey: process.env.REACT_APP_API_KEY || '',
    userId: 'current-user-id',
    userName: 'Current User',
    userColor: '#3b82f6',
  });

  // Connect on mount
  collaboration.connect(documentId);

  // Setup event listeners
  collaboration.on('user-joined', (user) => {
    console.log('User joined:', user);
  });

  collaboration.on('operation', (operation) => {
    console.log('Operation received:', operation);
  });

  // Cleanup on unmount
  const cleanup = () => {
    collaboration.disconnect();
  };

  return {
    collaboration,
    cleanup,
    isConnected: collaboration.isConnected(),
    activeUsers: collaboration.getActiveUsers(),
    sendOperation: (op: Operation) => collaboration.sendOperation(op),
  };
}

/**
 * Example: Handling offline scenarios
 */
export function offlineCollaborationExample() {
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-789',
    userName: 'Bob Johnson',
    userColor: '#10b981',
    messageQueue: {
      enabled: true,
      maxSize: 100,
      persist: true,
    },
  });

  // Monitor queue size
  setInterval(() => {
    const queueSize = collaboration.getQueueSize();
    if (queueSize > 0) {
      console.log(`${queueSize} messages queued (offline)`);
    }
  }, 5000);

  // Send operations even when offline
  const sendEdit = (content: string, position: number) => {
    const operation: Operation = {
      type: OperationType.INSERT,
      position,
      content,
      userId: 'user-789',
      timestamp: Date.now(),
    };
    
    // This will queue the operation if offline
    collaboration.sendOperation(operation);
  };

  // When reconnected, queued messages are sent automatically
  collaboration.on('reconnected', () => {
    console.log('Reconnected! Sending queued messages...');
  });

  return { collaboration, sendEdit };
}

/**
 * Example: Cursor and selection tracking
 */
export function cursorTrackingExample() {
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-101',
    userName: 'Alice Cooper',
    userColor: '#8b5cf6',
  });

  // Track cursor updates
  collaboration.on('cursor-update', ({ userId, cursor }) => {
    console.log(`User ${userId} cursor at:`, cursor);
    // Update cursor overlay in your editor
  });

  // Track selection updates
  collaboration.on('selection-update', ({ userId, selection }) => {
    console.log(`User ${userId} selection:`, selection);
    // Update selection overlay in your editor
  });

  // Get all active users with their cursor positions
  const users = collaboration.getActiveUsers();
  users.forEach(user => {
    if (user.cursor) {
      console.log(`${user.name} cursor: line ${user.cursor.line}, col ${user.cursor.column}`);
    }
    if (user.selection) {
      console.log(`${user.name} selection: ${user.selection.start}-${user.selection.end}`);
    }
  });

  return collaboration;
}

/**
 * Example: Error handling and recovery
 */
export function errorHandlingExample() {
  const collaboration = new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-202',
    userName: 'Charlie Brown',
    userColor: '#f59e0b',
  });

  // Handle different error types
  collaboration.on('error', (error) => {
    switch (error.type) {
      case 'connection-failed':
        console.error('Failed to connect:', error.message);
        // Show connection error to user
        break;
      
      case 'authentication-failed':
        console.error('Authentication failed:', error.message);
        // Redirect to login or refresh token
        break;
      
      case 'message-send-failed':
        console.error('Failed to send message:', error.message);
        // Message will be queued automatically
        break;
      
      case 'reconnection-failed':
        console.error('Reconnection failed:', error.message);
        // Show offline mode indicator
        break;
      
      default:
        console.error('Unknown error:', error);
    }
  });

  return collaboration;
}
