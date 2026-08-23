/**
 * Collaboration Module
 * 
 * Provides real-time collaboration features for the ErixEditor including:
 * - WebSocket connection management with automatic reconnection
 * - User presence tracking and cursor synchronization
 * - Operation broadcasting for real-time document updates
 * - Offline message queuing with localStorage persistence
 * - Exponential backoff reconnection strategy
 * 
 * @example
 * ```typescript
 * import { CollaborationEngine } from '@ecodrix/erix-react';
 * 
 * const collaboration = new CollaborationEngine({
 *   websocketUrl: 'wss://api.example.com/collaboration',
 *   apiKey: 'your-api-key',
 *   userId: 'user-123',
 *   userName: 'John Doe',
 *   userColor: '#3b82f6',
 * });
 * 
 * // Connect to a document
 * await collaboration.connect('document-456');
 * 
 * // Listen for events
 * collaboration.on('user-joined', (user) => {
 *   console.log('User joined:', user.name);
 * });
 * 
 * collaboration.on('operation', (operation) => {
 *   // Apply operation to document
 *   applyOperation(operation);
 * });
 * 
 * // Send an operation
 * collaboration.sendOperation({
 *   type: OperationType.INSERT,
 *   position: 10,
 *   content: 'Hello',
 *   userId: 'user-123',
 *   timestamp: Date.now(),
 * });
 * 
 * // Get active users
 * const users = collaboration.getActiveUsers();
 * 
 * // Disconnect when done
 * collaboration.disconnect();
 * ```
 * 
 * @module collaboration
 */

export { CollaborationEngine } from './CollaborationEngine';
export { OperationalTransform, OperationError } from './OperationalTransform';
export type {
  CollaborationConfig,
  CollaborationUser,
  Operation,
  WebSocketMessage,
  CollaborationEvent,
  EventHandler,
  CollaborationError,
  ReconnectionConfig,
  MessageQueueConfig,
} from './types';
export {
  ConnectionState,
  MessageType,
  OperationType,
  CollaborationErrorType,
  DEFAULT_RECONNECTION_CONFIG,
  DEFAULT_MESSAGE_QUEUE_CONFIG,
} from './types';

// Cursor and Selection Management
export { CursorManager } from './CursorManager';
export type {
  CursorPosition,
  RemoteCursor as RemoteCursorData,
  CursorManagerConfig,
} from './CursorManager';

export { SelectionManager } from './SelectionManager';
export type {
  SelectionRange,
  RemoteSelection as RemoteSelectionData,
  SelectionManagerConfig,
} from './SelectionManager';

export { UserColorManager } from './UserColorManager';
export type { UserColorAssignment } from './UserColorManager';

// React Components
export { RemoteCursor } from './RemoteCursor';
export type { RemoteCursorProps } from './RemoteCursor';

export { RemoteSelection } from './RemoteSelection';
export type { RemoteSelectionProps } from './RemoteSelection';

export { CollaborationOverlay } from './CollaborationOverlay';
export type { CollaborationOverlayProps } from './CollaborationOverlay';

// Comment System
export { CommentSystem } from './CommentSystem';
export type {
  Comment,
  CommentInput,
  ReplyInput,
  CommentRange,
  CommentSystemConfig,
  CommentEvent,
  CommentEventHandler,
} from './CommentSystem';
