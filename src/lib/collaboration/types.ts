/**
 * Type definitions for the Collaboration system
 * 
 * Defines interfaces and types for real-time collaboration features including
 * WebSocket communication, user presence, and operations.
 */

/**
 * Configuration for the CollaborationEngine
 */
export interface CollaborationConfig {
  /** WebSocket server URL */
  websocketUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Current user ID */
  userId: string;
  /** Current user display name */
  userName: string;
  /** Current user color for cursor/selection display */
  userColor: string;
  /** Reconnection configuration */
  reconnection?: ReconnectionConfig;
  /** Message queue configuration */
  messageQueue?: MessageQueueConfig;
}

/**
 * Reconnection configuration
 */
export interface ReconnectionConfig {
  /** Enable automatic reconnection (default: true) */
  enabled: boolean;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay: number;
  /** Maximum number of reconnection attempts (default: Infinity) */
  maxAttempts: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
}

/**
 * Message queue configuration
 */
export interface MessageQueueConfig {
  /** Enable message queuing when offline (default: true) */
  enabled: boolean;
  /** Maximum queue size (default: 100) */
  maxSize: number;
  /** Persist queue to localStorage (default: true) */
  persist: boolean;
}

/**
 * Default reconnection configuration
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  enabled: true,
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: Infinity,
  backoffMultiplier: 2,
};

/**
 * Default message queue configuration
 */
export const DEFAULT_MESSAGE_QUEUE_CONFIG: MessageQueueConfig = {
  enabled: true,
  maxSize: 100,
  persist: true,
};

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

/**
 * Collaboration user information
 */
export interface CollaborationUser {
  /** User ID */
  id: string;
  /** User display name */
  name: string;
  /** User color for cursor/selection */
  color: string;
  /** Current cursor position (null if not in document) */
  cursor: { line: number; column: number } | null;
  /** Current selection range (null if no selection) */
  selection: { start: number; end: number } | null;
  /** Last activity timestamp */
  lastActivity: number;
}

/**
 * Operation types for document changes
 */
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  RETAIN = 'retain',
}

/**
 * Document operation
 */
export interface Operation {
  /** Operation type */
  type: OperationType;
  /** Position in document */
  position: number;
  /** Content for insert operations */
  content?: string;
  /** Length for delete/retain operations */
  length?: number;
  /** User who performed the operation */
  userId: string;
  /** Operation timestamp */
  timestamp: number;
  /** Optional operation metadata */
  metadata?: Record<string, any>;
}

/**
 * WebSocket message types
 */
export enum MessageType {
  // Connection messages
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  
  // User presence messages
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  USER_UPDATE = 'user-update',
  
  // Operation messages
  OPERATION = 'operation',
  OPERATION_ACK = 'operation-ack',
  
  // Cursor/selection messages
  CURSOR_UPDATE = 'cursor-update',
  SELECTION_UPDATE = 'selection-update',
  
  // Error messages
  ERROR = 'error',
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  /** Message type */
  type: MessageType;
  /** Message payload */
  payload: any;
  /** Message ID for tracking */
  messageId?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Event types emitted by CollaborationEngine
 */
export type CollaborationEvent = 
  | 'user-joined'
  | 'user-left'
  | 'user-update'
  | 'operation'
  | 'cursor-update'
  | 'selection-update'
  | 'connection-state-change'
  | 'error'
  | 'reconnecting'
  | 'reconnected';

/**
 * Event handler function type
 */
export type EventHandler = (...args: any[]) => void;

/**
 * Collaboration error types
 */
export enum CollaborationErrorType {
  CONNECTION_FAILED = 'connection-failed',
  AUTHENTICATION_FAILED = 'authentication-failed',
  MESSAGE_SEND_FAILED = 'message-send-failed',
  INVALID_MESSAGE = 'invalid-message',
  RECONNECTION_FAILED = 'reconnection-failed',
  UNKNOWN = 'unknown',
}

/**
 * Collaboration error
 */
export interface CollaborationError {
  type: CollaborationErrorType;
  message: string;
  originalError?: Error;
  timestamp: number;
}
