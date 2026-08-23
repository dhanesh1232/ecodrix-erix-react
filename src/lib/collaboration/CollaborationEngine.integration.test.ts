/**
 * Integration tests for CollaborationEngine WebSocket functionality
 *
 * Tests cover:
 * - Connection establishment (Requirement 4.1)
 * - Reconnection logic with exponential backoff (Requirement 4.2)
 * - Message queuing for offline support (Requirement 7.5)
 *
 * **Validates: Requirements 4.1, 4.2, 7.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CollaborationEngine } from "./CollaborationEngine";
import type { CollaborationConfig, Operation } from "./types";
import { ConnectionState, MessageType, OperationType } from "./types";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static failNext = false; // Set to true to make next connection fail

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    const shouldFail = MockWebSocket.failNext;
    // Use Promise microtask instead of setTimeout so it works with fake timers
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        if (shouldFail) {
          this.readyState = MockWebSocket.CLOSED;
          this.onerror?.(new Event("error"));
          const closeEvent = new CloseEvent("close", {
            code: 1006,
            reason: "Connection failed",
          });
          this.onclose?.(closeEvent);
        } else {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.(new Event("open"));
        }
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    const closeEvent = new CloseEvent("close", {
      code: code || 1000,
      reason: reason || "",
    });
    this.onclose?.(closeEvent);
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any): void {
    if (this.readyState === MockWebSocket.OPEN) {
      const messageEvent = new MessageEvent("message", {
        data: JSON.stringify(data),
      });
      this.onmessage?.(messageEvent);
    }
  }

  // Helper method to simulate connection error
  simulateError(): void {
    this.onerror?.(new Event("error"));
  }
}

describe("CollaborationEngine - WebSocket Integration Tests", () => {
  let engine: CollaborationEngine;
  let config: CollaborationConfig;
  let mockWebSocket: MockWebSocket | null = null;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    // Reset failNext flag
    MockWebSocket.failNext = false;

    // Save original WebSocket
    originalWebSocket = global.WebSocket as any;

    // Mock WebSocket constructor
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocket = this;
      }
    } as any;

    // Mock localStorage
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] || null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    };
    global.localStorage = localStorageMock as any;

    // Create test configuration
    config = {
      websocketUrl: "wss://test.example.com/collaboration",
      apiKey: "test-api-key",
      userId: "user-123",
      userName: "Test User",
      userColor: "#FF0000",
      reconnection: {
        enabled: true,
        initialDelay: 100,
        maxDelay: 1000,
        maxAttempts: 3,
        backoffMultiplier: 2,
      },
      messageQueue: {
        enabled: true,
        maxSize: 50,
        persist: true,
      },
    };

    engine = new CollaborationEngine(config);
  });

  afterEach(() => {
    // Always restore real timers first to prevent fake timers leaking into next test
    vi.useRealTimers();
    // Clean up
    engine.destroy();
    mockWebSocket = null;
    global.WebSocket = originalWebSocket;
    vi.clearAllMocks();
  });

  describe("Connection Establishment (Requirement 4.1)", () => {
    it("should successfully establish WebSocket connection", async () => {
      const documentId = "doc-123";

      // Connect
      const connectPromise = engine.connect(documentId);

      // Wait for connection
      await connectPromise;

      // Verify connection state
      expect(engine.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(engine.isConnected()).toBe(true);
    });

    it("should include authentication parameters in WebSocket URL", async () => {
      const documentId = "doc-456";

      await engine.connect(documentId);

      // Verify WebSocket was created with correct URL
      expect(mockWebSocket).toBeTruthy();
      expect(mockWebSocket!.url).toContain(
        "wss://test.example.com/collaboration",
      );
      expect(mockWebSocket!.url).toContain("documentId=doc-456");
      expect(mockWebSocket!.url).toContain("userId=user-123");
      expect(mockWebSocket!.url).toContain("apiKey=test-api-key");
    });

    it("should send CONNECT message after connection opens", async () => {
      const documentId = "doc-789";

      await engine.connect(documentId);

      // Verify CONNECT message was sent
      expect(mockWebSocket?.sentMessages.length).toBeGreaterThan(0);
      const connectMessage = JSON.parse(mockWebSocket!.sentMessages[0]);
      expect(connectMessage.type).toBe(MessageType.CONNECT);
      expect(connectMessage.payload.userId).toBe("user-123");
      expect(connectMessage.payload.userName).toBe("Test User");
      expect(connectMessage.payload.userColor).toBe("#FF0000");
      expect(connectMessage.payload.documentId).toBe(documentId);
    });

    it("should emit connection-state-change event when connecting", async () => {
      const stateChanges: any[] = [];
      engine.on("connection-state-change", (change) => {
        stateChanges.push(change);
      });

      await engine.connect("doc-123");

      // Should have state changes: DISCONNECTED -> CONNECTING -> CONNECTED
      expect(stateChanges.length).toBeGreaterThanOrEqual(2);
      expect(stateChanges[0].newState).toBe(ConnectionState.CONNECTING);
      expect(stateChanges[stateChanges.length - 1].newState).toBe(
        ConnectionState.CONNECTED,
      );
    });

    it("should handle connection errors gracefully", async () => {
      vi.useFakeTimers();
      const documentId = "doc-error";
      MockWebSocket.failNext = true;

      const errorHandler = vi.fn();
      engine.on("error", errorHandler);

      // Attempt to connect
      const connectPromise = engine.connect(documentId);
      
      // Advance timers to trigger the failure in MockWebSocket
      await vi.advanceTimersByTimeAsync(10);
      
      await expect(connectPromise).rejects.toBeDefined();

      // Verify error was emitted
      expect(errorHandler).toHaveBeenCalled();
    });

    it("should track active users when USER_JOINED message is received", async () => {
      await engine.connect("doc-123");

      // Simulate user joined message
      const newUser = {
        id: "user-456",
        name: "Another User",
        color: "#00FF00",
        cursor: null,
        selection: null,
        lastActivity: Date.now(),
      };

      mockWebSocket?.simulateMessage({
        type: MessageType.USER_JOINED,
        payload: newUser,
        timestamp: Date.now(),
      });

      // Verify user is tracked
      const activeUsers = engine.getActiveUsers();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe("user-456");
      expect(activeUsers[0].name).toBe("Another User");
    });

    it("should emit user-joined event when user joins", async () => {
      const userJoinedHandler = vi.fn();
      engine.on("user-joined", userJoinedHandler);

      await engine.connect("doc-123");

      const newUser = {
        id: "user-789",
        name: "Third User",
        color: "#0000FF",
        cursor: null,
        selection: null,
        lastActivity: Date.now(),
      };

      mockWebSocket?.simulateMessage({
        type: MessageType.USER_JOINED,
        payload: newUser,
        timestamp: Date.now(),
      });

      expect(userJoinedHandler).toHaveBeenCalledWith(newUser);
    });
  });

  describe("Reconnection Logic (Requirement 4.2, 7.5)", () => {
    it("should attempt reconnection when connection is lost unexpectedly", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;
      expect(engine.isConnected()).toBe(true);

      const reconnectingHandler = vi.fn();
      engine.on("reconnecting", reconnectingHandler);

      // Make reconnection fail so state stays RECONNECTING
      MockWebSocket.failNext = true;

      // Simulate unexpected connection close (not normal closure)
      mockWebSocket?.close(1006, "Connection lost");

      // Wait for reconnection attempt
      await vi.advanceTimersByTimeAsync(150);
      await vi.advanceTimersByTimeAsync(10);

      expect(reconnectingHandler).toHaveBeenCalled();

      MockWebSocket.failNext = false;
    });

    it("should use exponential backoff for reconnection attempts", async () => {
      vi.useFakeTimers();
      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      const reconnectingHandler = vi.fn();
      engine.on("reconnecting", reconnectingHandler);

      // Make all reconnections fail so delays accumulate
      MockWebSocket.failNext = true;

      // Trigger first failure
      mockWebSocket?.close(1006, "Connection lost");
      
      // Wait for attempt 1 (100ms) + its failure
      await vi.advanceTimersByTimeAsync(110);
      await vi.advanceTimersByTimeAsync(10); // Process MockWebSocket timeout

      // Wait for attempt 2 (200ms) + its failure
      await vi.advanceTimersByTimeAsync(210);
      await vi.advanceTimersByTimeAsync(10);

      // Wait for attempt 3 (400ms) + its failure
      await vi.advanceTimersByTimeAsync(410);
      await vi.advanceTimersByTimeAsync(10);

      // Verify exponential backoff
      expect(reconnectingHandler).toHaveBeenCalledTimes(3);

      // Check that delays increase
      const calls = reconnectingHandler.mock.calls;
      expect(calls[0][0].delay).toBe(100);
      expect(calls[1][0].delay).toBe(200);
      expect(calls[2][0].delay).toBe(400);

      MockWebSocket.failNext = false;
    });

    it("should respect maxAttempts configuration", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      const errorHandler = vi.fn();
      engine.on("error", errorHandler);

      // Make all reconnections fail
      MockWebSocket.failNext = true;

      // Simulate multiple connection failures (maxAttempts is 3)
      for (let i = 0; i < 4; i++) {
        MockWebSocket.failNext = true;
        mockWebSocket?.close(1006, "Connection lost");
        await vi.advanceTimersByTimeAsync(1000); 
        await vi.advanceTimersByTimeAsync(10); // Process MockWebSocket timeout
      }

      MockWebSocket.failNext = false;

      // Should emit reconnection failed error after max attempts
      const errors = errorHandler.mock.calls.map((call) => call[0]);
      const reconnectionFailedError = errors.find(
        (err) => err.type === "reconnection-failed",
      );
      expect(reconnectionFailedError).toBeDefined();
    });

    it("should not attempt reconnection for normal closure", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      const reconnectingHandler = vi.fn();
      engine.on("reconnecting", reconnectingHandler);

      // Simulate normal closure (code 1000)
      mockWebSocket?.close(1000, "Normal closure");

      await vi.advanceTimersByTimeAsync(1000);

      // Should not attempt reconnection
      expect(reconnectingHandler).not.toHaveBeenCalled();
      expect(engine.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it("should emit reconnected event after successful reconnection", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      const reconnectedHandler = vi.fn();
      engine.on("reconnected", reconnectedHandler);

      // Simulate connection loss - reconnection will succeed (failNext=false)
      mockWebSocket?.close(1006, "Connection lost");

      // Advance time to trigger reconnection timeout
      await vi.advanceTimersByTimeAsync(150);
      await vi.advanceTimersByTimeAsync(10);

      expect(reconnectedHandler).toHaveBeenCalled();
    });

    it("should respect maxDelay configuration for backoff", async () => {
      vi.useFakeTimers();

      // Create engine with small maxDelay
      const customConfig = {
        ...config,
        reconnection: {
          enabled: true,
          initialDelay: 100,
          maxDelay: 300, // Cap at 300ms
          maxAttempts: 5,
          backoffMultiplier: 2,
        },
      };
      const customEngine = new CollaborationEngine(customConfig);

      const connectPromise = customEngine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      const reconnectingHandler = vi.fn();
      customEngine.on("reconnecting", reconnectingHandler);

      // Make all reconnections fail so delays accumulate
      MockWebSocket.failNext = true;

      // Simulate multiple failures
      for (let i = 0; i < 4; i++) {
        MockWebSocket.failNext = true;
        mockWebSocket?.close(1006, "Connection lost");
        await vi.advanceTimersByTimeAsync(500);
        await vi.advanceTimersByTimeAsync(10); // Process MockWebSocket timeout
      }

      MockWebSocket.failNext = false;

      // Check that delay is capped at maxDelay
      const calls = reconnectingHandler.mock.calls;
      expect(calls[0][0].delay).toBe(100);
      expect(calls[1][0].delay).toBe(200);
      expect(calls[2][0].delay).toBe(300); // Capped
      expect(calls[3][0].delay).toBe(300); // Still capped

      customEngine.destroy();
    });
  });

  describe("Message Queuing (Requirement 7.5)", () => {
    it("should queue messages when connection is not open", async () => {
      // Don't connect yet
      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Hello",
        userId: "user-123",
        timestamp: Date.now(),
      };

      // Send operation while disconnected
      engine.sendOperation(operation);

      // Verify message is queued
      expect(engine.getQueueSize()).toBe(1);
    });

    it("should flush queued messages after reconnection", async () => {
      vi.useFakeTimers();

      // Queue messages while disconnected
      const operation1: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Hello",
        userId: "user-123",
        timestamp: Date.now(),
      };

      const operation2: Operation = {
        type: OperationType.INSERT,
        position: 5,
        content: " World",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation1);
      engine.sendOperation(operation2);

      expect(engine.getQueueSize()).toBe(2);

      // Connect - messages are flushed on connection open
      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      // Verify queue is empty
      expect(engine.getQueueSize()).toBe(0);

      // Verify messages were sent
      const sentMessages = mockWebSocket?.sentMessages || [];
      const operationMessages = sentMessages
        .map((msg) => JSON.parse(msg))
        .filter((msg) => msg.type === MessageType.OPERATION);

      expect(operationMessages.length).toBeGreaterThanOrEqual(2);
    });

    it("should persist queue to localStorage when enabled", () => {
      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation);

      // Verify queue is persisted
      const stored = localStorage.getItem("erix-collaboration-queue");
      expect(stored).toBeTruthy();

      const queue = JSON.parse(stored!);
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe(MessageType.OPERATION);
    });

    it("should load persisted queue on initialization", () => {
      // Persist a queue
      const queueData = [
        {
          type: MessageType.OPERATION,
          payload: {
            type: OperationType.INSERT,
            position: 0,
            content: "Persisted",
            userId: "user-123",
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        },
      ];

      localStorage.setItem(
        "erix-collaboration-queue",
        JSON.stringify(queueData),
      );

      // Create new engine instance
      const newEngine = new CollaborationEngine(config);

      // Verify queue was loaded
      expect(newEngine.getQueueSize()).toBe(1);

      newEngine.destroy();
    });

    it("should respect maxSize configuration for queue", () => {
      // Send more messages than maxSize (50)
      for (let i = 0; i < 60; i++) {
        const operation: Operation = {
          type: OperationType.INSERT,
          position: i,
          content: `Message ${i}`,
          userId: "user-123",
          timestamp: Date.now(),
        };
        engine.sendOperation(operation);
      }

      // Verify queue size is capped
      expect(engine.getQueueSize()).toBe(50);
    });

    it("should clear queue when clearQueue is called", () => {
      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation);
      expect(engine.getQueueSize()).toBe(1);

      engine.clearQueue();
      expect(engine.getQueueSize()).toBe(0);

      // Verify localStorage is also cleared
      const stored = localStorage.getItem("erix-collaboration-queue");
      expect(stored).toBeNull();
    });

    it("should queue messages when send fails", async () => {
      await engine.connect("doc-123");

      // Mock send to throw error
      const originalSend = mockWebSocket!.send;
      mockWebSocket!.send = vi.fn(() => {
        throw new Error("Send failed");
      });

      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation);

      // Verify message was queued
      expect(engine.getQueueSize()).toBeGreaterThan(0);

      // Restore original send
      mockWebSocket!.send = originalSend;
    });

    it("should handle queue operations when localStorage is unavailable", () => {
      // Remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      const newEngine = new CollaborationEngine(config);

      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };

      // Should not throw error
      expect(() => newEngine.sendOperation(operation)).not.toThrow();

      newEngine.destroy();

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });
  });

  describe("Operation Broadcasting (Requirement 4.2)", () => {
    it("should broadcast operations to other participants", async () => {
      await engine.connect("doc-123");

      const operation: Operation = {
        type: OperationType.INSERT,
        position: 10,
        content: "New text",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation);

      // Verify operation message was sent
      const sentMessages = mockWebSocket?.sentMessages || [];
      const operationMessage = sentMessages
        .map((msg) => JSON.parse(msg))
        .find((msg) => msg.type === MessageType.OPERATION);

      expect(operationMessage).toBeDefined();
      expect(operationMessage.payload.type).toBe(OperationType.INSERT);
      expect(operationMessage.payload.content).toBe("New text");
      expect(operationMessage.payload.position).toBe(10);
    });

    it("should emit operation event when receiving operations from others", async () => {
      await engine.connect("doc-123");

      const operationHandler = vi.fn();
      engine.on("operation", operationHandler);

      const remoteOperation: Operation = {
        type: OperationType.DELETE,
        position: 5,
        length: 3,
        userId: "user-456",
        timestamp: Date.now(),
      };

      mockWebSocket?.simulateMessage({
        type: MessageType.OPERATION,
        payload: remoteOperation,
        timestamp: Date.now(),
      });

      expect(operationHandler).toHaveBeenCalledWith(remoteOperation);
    });

    it("should include message ID for operation tracking", async () => {
      await engine.connect("doc-123");

      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };

      engine.sendOperation(operation);

      const sentMessages = mockWebSocket?.sentMessages || [];
      const operationMessage = sentMessages
        .map((msg) => JSON.parse(msg))
        .find((msg) => msg.type === MessageType.OPERATION);

      expect(operationMessage.messageId).toBeDefined();
      expect(operationMessage.messageId).toContain("user-123");
    });
  });

  describe("Heartbeat and Connection Health", () => {
    it("should send PING messages periodically", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      // Clear initial messages
      mockWebSocket!.sentMessages = [];

      // Advance time by heartbeat interval (30 seconds)
      vi.advanceTimersByTime(30000);

      // Verify PING was sent
      const sentMessages = mockWebSocket?.sentMessages || [];
      const pingMessage = sentMessages
        .map((msg) => JSON.parse(msg))
        .find((msg) => msg.type === MessageType.PING);

      expect(pingMessage).toBeDefined();
    });

    it("should close connection if PONG is not received", async () => {
      vi.useFakeTimers();

      const connectPromise = engine.connect("doc-123");
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      // Don't send PONG response
      // Advance time past heartbeat timeout threshold
      // Interval = 30s. Fire at 30s (diff=30 < 60), 60s (diff=60 <= 60), 90s (diff=90 > 60)
      await vi.advanceTimersByTimeAsync(95000);

      // Connection should be closed
      expect(mockWebSocket?.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe("Cleanup and Resource Management", () => {
    it("should clean up resources on disconnect", async () => {
      await engine.connect("doc-123");

      // Add some users
      mockWebSocket?.simulateMessage({
        type: MessageType.USER_JOINED,
        payload: {
          id: "user-456",
          name: "User 2",
          color: "#00FF00",
          cursor: null,
          selection: null,
          lastActivity: Date.now(),
        },
        timestamp: Date.now(),
      });

      expect(engine.getActiveUsers()).toHaveLength(1);

      engine.disconnect();

      // Verify cleanup
      expect(engine.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(engine.getActiveUsers()).toHaveLength(0);
      expect(mockWebSocket?.readyState).toBe(MockWebSocket.CLOSED);
    });

    it("should clean up all resources on destroy", async () => {
      await engine.connect("doc-123");

      // Queue some messages
      const operation: Operation = {
        type: OperationType.INSERT,
        position: 0,
        content: "Test",
        userId: "user-123",
        timestamp: Date.now(),
      };
      engine.sendOperation(operation);

      engine.destroy();

      // Verify complete cleanup
      expect(engine.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(engine.getActiveUsers()).toHaveLength(0);
      expect(engine.getQueueSize()).toBe(0);
    });
  });
});
