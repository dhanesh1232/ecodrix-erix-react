/**
 * CollaborationEngine
 * 
 * Manages real-time collaboration features including WebSocket connections,
 * user presence, cursor synchronization, and operation broadcasting.
 * 
 * Features:
 * - WebSocket connection management with automatic reconnection
 * - Exponential backoff for reconnection attempts
 * - Connection state tracking (disconnected, connecting, connected, reconnecting)
 * - Message queue for offline support
 * - User presence tracking
 * - Event-based architecture for extensibility
 * 
 * Requirements: 4.1, 4.2, 7.5
 */

import type {
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
import {
  ConnectionState,
  MessageType,
  CollaborationErrorType,
  DEFAULT_RECONNECTION_CONFIG,
  DEFAULT_MESSAGE_QUEUE_CONFIG,
} from './types';

/**
 * CollaborationEngine class
 * 
 * Main class for managing real-time collaboration features.
 * Handles WebSocket connections, reconnection logic, message queuing,
 * and event broadcasting.
 */
export class CollaborationEngine {
  private config: CollaborationConfig;
  private reconnectionConfig: ReconnectionConfig;
  private messageQueueConfig: MessageQueueConfig;
  
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private documentId: string | null = null;
  
  // User tracking
  private activeUsers: Map<string, CollaborationUser> = new Map();
  
  // Event handling
  private eventHandlers: Map<CollaborationEvent, Set<EventHandler>> = new Map();
  
  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectTimeoutId: any = null;
  private currentReconnectDelay = 0;
  
  // Message queue for offline support
  private messageQueue: WebSocketMessage[] = [];
  private queueStorageKey = 'erix-collaboration-queue';
  
  // Heartbeat
  private heartbeatIntervalId: any = null;
  private heartbeatInterval = 30000; // 30 seconds
  private lastPongTime = 0;
  
  constructor(config: CollaborationConfig) {
    this.config = config;
    this.reconnectionConfig = {
      ...DEFAULT_RECONNECTION_CONFIG,
      ...config.reconnection,
    };
    this.messageQueueConfig = {
      ...DEFAULT_MESSAGE_QUEUE_CONFIG,
      ...config.messageQueue,
    };
    
    // Load persisted queue if enabled
    if (this.messageQueueConfig.persist) {
      this.loadQueueFromStorage();
    }
  }

  /**
   * Connect to a collaboration session for a document
   * Requirements: 4.1, 4.2
   * 
   * @param documentId - The document ID to collaborate on
   * @returns Promise that resolves when connected
   */
  async connect(documentId: string): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED && this.documentId === documentId) {
      // Already connected to this document
      return;
    }

    // Disconnect from previous session if any without resetting reconnection state
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.documentId = documentId;
    this.setConnectionState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        // Construct WebSocket URL with authentication and document ID
        const url = new URL(this.config.websocketUrl);
        url.searchParams.set('documentId', documentId);
        url.searchParams.set('userId', this.config.userId);
        url.searchParams.set('apiKey', this.config.apiKey);

        this.ws = new WebSocket(url.toString());

        // Connection opened
        this.ws.onopen = () => {
          this.handleConnectionOpen();
          resolve();
        };

        // Connection error
        this.ws.onerror = (event) => {
          const error: CollaborationError = {
            type: CollaborationErrorType.CONNECTION_FAILED,
            message: 'WebSocket connection failed',
            timestamp: Date.now(),
          };
          this.handleError(error);
          reject(error);
        };

        // Message received
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        // Connection closed
        this.ws.onclose = (event) => {
          this.handleConnectionClose(event);
        };

      } catch (error) {
        const collaborationError: CollaborationError = {
          type: CollaborationErrorType.CONNECTION_FAILED,
          message: error instanceof Error ? error.message : 'Failed to create WebSocket connection',
          originalError: error instanceof Error ? error : undefined,
          timestamp: Date.now(),
        };
        this.handleError(collaborationError);
        reject(collaborationError);
      }
    });
  }

  /**
   * Disconnect from the current collaboration session
   * Requirements: 4.1
   */
  disconnect(): void {
    // Clear reconnection timeout
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Clear heartbeat
    this.stopHeartbeat();

    // Close WebSocket connection
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection attempt
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    // Reset state
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.documentId = null;
    this.activeUsers.clear();
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = 0;
  }

  /**
   * Send an operation to other participants
   * Requirements: 4.2
   * 
   * @param op - The operation to send
   */
  sendOperation(op: Operation): void {
    const message: WebSocketMessage = {
      type: MessageType.OPERATION,
      payload: op,
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
    };

    this.sendMessage(message);
  }

  /**
   * Get list of active users in the session
   * Requirements: 4.1
   * 
   * @returns Array of active users
   */
  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Get current connection state
   * 
   * @returns Current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if currently connected
   * 
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Register an event handler
   * 
   * @param event - Event type to listen for
   * @param handler - Handler function
   */
  on(event: CollaborationEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   * 
   * @param event - Event type
   * @param handler - Handler function to remove
   */
  off(event: CollaborationEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered handlers
   * 
   * @param event - Event type
   * @param args - Event arguments
   */
  private emit(event: CollaborationEvent, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle WebSocket connection open
   * Requirements: 4.1, 4.2
   */
  private handleConnectionOpen(): void {
    const wasReconnecting = this.reconnectAttempts > 0;
    
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = 0;

    // Send connect message with user info
    const connectMessage: WebSocketMessage = {
      type: MessageType.CONNECT,
      payload: {
        userId: this.config.userId,
        userName: this.config.userName,
        userColor: this.config.userColor,
        documentId: this.documentId,
      },
      timestamp: Date.now(),
    };
    this.sendMessage(connectMessage);

    // Start heartbeat
    this.startHeartbeat();

    // Send queued messages
    this.flushMessageQueue();

    // Emit reconnected event if this was a reconnection
    if (wasReconnecting) {
      this.emit('reconnected');
    }
  }

  /**
   * Handle WebSocket connection close
   * Requirements: 7.5
   * 
   * @param event - Close event
   */
  private handleConnectionClose(event: CloseEvent): void {
    this.stopHeartbeat();

    const previousState = this.connectionState;
    const wasConnected = previousState === ConnectionState.CONNECTED;
    this.setConnectionState(ConnectionState.DISCONNECTED);

    // Attempt reconnection if enabled, not a normal close, and was previously connected or already reconnecting
    if (
      this.reconnectionConfig.enabled &&
      event.code !== 1000 && // Normal closure
      event.code !== 1001 && // Going away
      (wasConnected || this.reconnectAttempts > 0) &&
      this.reconnectAttempts < this.reconnectionConfig.maxAttempts
    ) {
      this.attemptReconnection();
    } else if (wasConnected || previousState === ConnectionState.CONNECTING || previousState === ConnectionState.RECONNECTING) {
      // Emit error if reconnection is not possible or we gave up
      const error: CollaborationError = {
        type: this.reconnectAttempts >= this.reconnectionConfig.maxAttempts 
          ? CollaborationErrorType.RECONNECTION_FAILED 
          : CollaborationErrorType.CONNECTION_FAILED,
        message: `Connection closed: ${event.reason || 'Unknown reason'}`,
        timestamp: Date.now(),
      };
      this.handleError(error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   * Requirements: 7.5
   */
  private attemptReconnection(): void {
    if (!this.documentId) return;

    this.reconnectAttempts++;
    this.setConnectionState(ConnectionState.RECONNECTING);

    // Calculate delay with exponential backoff
    if (this.currentReconnectDelay === 0) {
      this.currentReconnectDelay = this.reconnectionConfig.initialDelay;
    } else {
      this.currentReconnectDelay = Math.min(
        this.currentReconnectDelay * this.reconnectionConfig.backoffMultiplier,
        this.reconnectionConfig.maxDelay
      );
    }

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay: this.currentReconnectDelay,
      maxAttempts: this.reconnectionConfig.maxAttempts,
    });

    // Schedule reconnection
    this.reconnectTimeoutId = setTimeout(() => {
      if (this.documentId) {
        this.connect(this.documentId).catch((error) => {
          // Connection failed, will retry if attempts remain
          if (this.reconnectAttempts >= this.reconnectionConfig.maxAttempts) {
            const collaborationError: CollaborationError = {
              type: CollaborationErrorType.RECONNECTION_FAILED,
              message: 'Maximum reconnection attempts reached',
              originalError: error instanceof Error ? error : undefined,
              timestamp: Date.now(),
            };
            this.handleError(collaborationError);
          }
        });
      }
    }, this.currentReconnectDelay);
  }

  /**
   * Handle incoming WebSocket message
   * Requirements: 4.1, 4.2
   * 
   * @param event - Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case MessageType.USER_JOINED:
          this.handleUserJoined(message.payload);
          break;

        case MessageType.USER_LEFT:
          this.handleUserLeft(message.payload);
          break;

        case MessageType.USER_UPDATE:
          this.handleUserUpdate(message.payload);
          break;

        case MessageType.OPERATION:
          this.handleOperation(message.payload);
          break;

        case MessageType.CURSOR_UPDATE:
          this.handleCursorUpdate(message.payload);
          break;

        case MessageType.SELECTION_UPDATE:
          this.handleSelectionUpdate(message.payload);
          break;

        case MessageType.PONG:
          this.lastPongTime = Date.now();
          break;

        case MessageType.ERROR:
          this.handleServerError(message.payload);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      const collaborationError: CollaborationError = {
        type: CollaborationErrorType.INVALID_MESSAGE,
        message: 'Failed to parse WebSocket message',
        originalError: error instanceof Error ? error : undefined,
        timestamp: Date.now(),
      };
      this.handleError(collaborationError);
    }
  }

  /**
   * Handle user joined event
   * Requirements: 4.1
   */
  private handleUserJoined(user: CollaborationUser): void {
    this.activeUsers.set(user.id, user);
    this.emit('user-joined', user);
  }

  /**
   * Handle user left event
   * Requirements: 4.1
   */
  private handleUserLeft(payload: { userId: string }): void {
    const user = this.activeUsers.get(payload.userId);
    if (user) {
      this.activeUsers.delete(payload.userId);
      this.emit('user-left', user);
    }
  }

  /**
   * Handle user update event
   * Requirements: 4.1
   */
  private handleUserUpdate(user: CollaborationUser): void {
    this.activeUsers.set(user.id, user);
    this.emit('user-update', user);
  }

  /**
   * Handle operation event
   * Requirements: 4.2
   */
  private handleOperation(operation: Operation): void {
    this.emit('operation', operation);
  }

  /**
   * Handle cursor update event
   * Requirements: 4.1
   */
  private handleCursorUpdate(payload: { userId: string; cursor: { line: number; column: number } | null }): void {
    const user = this.activeUsers.get(payload.userId);
    if (user) {
      user.cursor = payload.cursor;
      user.lastActivity = Date.now();
      this.emit('cursor-update', payload);
    }
  }

  /**
   * Handle selection update event
   * Requirements: 4.1
   */
  private handleSelectionUpdate(payload: { userId: string; selection: { start: number; end: number } | null }): void {
    const user = this.activeUsers.get(payload.userId);
    if (user) {
      user.selection = payload.selection;
      user.lastActivity = Date.now();
      this.emit('selection-update', payload);
    }
  }

  /**
   * Handle server error
   */
  private handleServerError(payload: { message: string; code?: string }): void {
    const error: CollaborationError = {
      type: CollaborationErrorType.UNKNOWN,
      message: payload.message,
      timestamp: Date.now(),
    };
    this.handleError(error);
  }

  /**
   * Send a message through WebSocket
   * Requirements: 4.2, 7.5
   * 
   * @param message - Message to send
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        const collaborationError: CollaborationError = {
          type: CollaborationErrorType.MESSAGE_SEND_FAILED,
          message: 'Failed to send message',
          originalError: error instanceof Error ? error : undefined,
          timestamp: Date.now(),
        };
        this.handleError(collaborationError);

        // Queue message for retry
        this.queueMessage(message);
      }
    } else {
      // Queue message if not connected
      this.queueMessage(message);
    }
  }

  /**
   * Queue a message for later sending
   * Requirements: 7.5
   * 
   * @param message - Message to queue
   */
  private queueMessage(message: WebSocketMessage): void {
    if (!this.messageQueueConfig.enabled) return;

    // Add to queue
    this.messageQueue.push(message);

    // Enforce max queue size
    if (this.messageQueue.length > this.messageQueueConfig.maxSize) {
      this.messageQueue.shift(); // Remove oldest message
    }

    // Persist to storage if enabled
    if (this.messageQueueConfig.persist) {
      this.saveQueueToStorage();
    }
  }

  /**
   * Flush queued messages
   * Requirements: 7.5
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    // Clear persisted queue
    if (this.messageQueueConfig.persist) {
      this.clearQueueFromStorage();
    }

    // Send all queued messages
    messages.forEach(message => {
      this.sendMessage(message);
    });
  }

  /**
   * Save message queue to localStorage
   * Requirements: 7.5
   */
  private saveQueueToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(
        this.queueStorageKey,
        JSON.stringify(this.messageQueue)
      );
    } catch (error) {
      console.error('Failed to save message queue to storage:', error);
    }
  }

  /**
   * Load message queue from localStorage
   * Requirements: 7.5
   */
  private loadQueueFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.queueStorageKey);
      if (stored) {
        this.messageQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load message queue from storage:', error);
      this.messageQueue = [];
    }
  }

  /**
   * Clear message queue from localStorage
   * Requirements: 7.5
   */
  private clearQueueFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.removeItem(this.queueStorageKey);
    } catch (error) {
      console.error('Failed to clear message queue from storage:', error);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();

    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping
        const pingMessage: WebSocketMessage = {
          type: MessageType.PING,
          payload: {},
          timestamp: Date.now(),
        };
        this.sendMessage(pingMessage);

        // Check if we received pong recently
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > this.heartbeatInterval * 2) {
          // No pong received, connection might be dead
          console.warn('No pong received, closing connection');
          this.ws.close();
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  /**
   * Set connection state and emit event
   * 
   * @param state - New connection state
   */
  private setConnectionState(state: ConnectionState): void {
    const oldState = this.connectionState;
    this.connectionState = state;

    if (oldState !== state) {
      this.emit('connection-state-change', {
        oldState,
        newState: state,
      });
    }
  }

  /**
   * Handle error
   * 
   * @param error - Collaboration error
   */
  private handleError(error: CollaborationError): void {
    console.error('Collaboration error:', error);
    this.emit('error', error);
  }

  /**
   * Generate unique message ID
   * 
   * @returns Unique message ID
   */
  private generateMessageId(): string {
    return `${this.config.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): CollaborationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * Note: Requires reconnection to take effect for WebSocket URL changes
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<CollaborationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.reconnection) {
      this.reconnectionConfig = {
        ...this.reconnectionConfig,
        ...config.reconnection,
      };
    }

    if (config.messageQueue) {
      this.messageQueueConfig = {
        ...this.messageQueueConfig,
        ...config.messageQueue,
      };
    }
  }

  /**
   * Get message queue size
   * 
   * @returns Number of queued messages
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
    if (this.messageQueueConfig.persist) {
      this.clearQueueFromStorage();
    }
  }

  /**
   * Destroy the collaboration engine and clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
    this.activeUsers.clear();
    this.clearQueue();
  }
}
