/**
 * OperationalTransform
 * 
 * Implements Operational Transformation (OT) algorithm for conflict resolution
 * in real-time collaborative editing. OT ensures that all clients converge to
 * the same document state regardless of the order in which operations are received.
 * 
 * Key Properties:
 * - **Convergence**: All clients reach the same final state
 * - **Causality Preservation**: Operations maintain causal order
 * - **Intention Preservation**: User intentions are preserved after transformation
 * 
 * Supported Operations:
 * - INSERT: Insert text at a position
 * - DELETE: Delete text from a position
 * - RETAIN: Skip over unchanged content
 * 
 * Transformation Rules:
 * - INSERT vs INSERT: Adjust positions based on which came first
 * - INSERT vs DELETE: Adjust positions to account for the other operation
 * - DELETE vs DELETE: Handle overlapping deletes correctly
 * - RETAIN operations: Skip over unchanged content
 * 
 * Requirements: 4.2, 4.3
 * 
 * @example
 * ```typescript
 * const ot = new OperationalTransform();
 * 
 * // Two concurrent operations
 * const op1: Operation = {
 *   type: OperationType.INSERT,
 *   position: 5,
 *   content: 'Hello',
 *   userId: 'user1',
 *   timestamp: Date.now(),
 * };
 * 
 * const op2: Operation = {
 *   type: OperationType.INSERT,
 *   position: 5,
 *   content: 'World',
 *   userId: 'user2',
 *   timestamp: Date.now(),
 * };
 * 
 * // Transform operations against each other
 * const [op1Prime, op2Prime] = ot.transform(op1, op2);
 * 
 * // Apply operations to document
 * let doc = 'Test document';
 * doc = ot.apply(doc, op1Prime);
 * doc = ot.apply(doc, op2Prime);
 * ```
 */

import type { Operation } from './types';
import { OperationType } from './types';

/**
 * Error thrown when an operation is invalid or cannot be applied
 */
export class OperationError extends Error {
  constructor(message: string, public operation?: Operation) {
    super(message);
    this.name = 'OperationError';
  }
}

/**
 * OperationalTransform class
 * 
 * Implements the OT algorithm for conflict-free collaborative editing.
 * Provides methods to transform operations, apply operations to documents,
 * and compose multiple operations into a single operation.
 */
export class OperationalTransform {
  /**
   * Transform two concurrent operations against each other
   * 
   * Given two operations op1 and op2 that were created concurrently
   * (neither knows about the other), this method produces two new
   * operations op1' and op2' such that:
   * 
   * apply(apply(doc, op1), op2') = apply(apply(doc, op2), op1')
   * 
   * This ensures convergence: both clients reach the same final state.
   * 
   * Requirements: 4.3
   * 
   * @param op1 - First operation
   * @param op2 - Second operation
   * @returns Tuple of transformed operations [op1', op2']
   * @throws {OperationError} If operations are invalid
   */
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Validate operations
    this.validateOperation(op1);
    this.validateOperation(op2);

    // Handle RETAIN operations (pass-through)
    if (op1.type === OperationType.RETAIN) {
      return [op1, op2];
    }
    if (op2.type === OperationType.RETAIN) {
      return [op1, op2];
    }

    // Transform based on operation types
    if (op1.type === OperationType.INSERT && op2.type === OperationType.INSERT) {
      return this.transformInsertInsert(op1, op2);
    }

    if (op1.type === OperationType.INSERT && op2.type === OperationType.DELETE) {
      return this.transformInsertDelete(op1, op2);
    }

    if (op1.type === OperationType.DELETE && op2.type === OperationType.INSERT) {
      const [op2Prime, op1Prime] = this.transformInsertDelete(op2, op1);
      return [op1Prime, op2Prime];
    }

    if (op1.type === OperationType.DELETE && op2.type === OperationType.DELETE) {
      return this.transformDeleteDelete(op1, op2);
    }

    // Should never reach here if all cases are covered
    throw new OperationError('Unsupported operation type combination', op1);
  }

  /**
   * Transform two concurrent INSERT operations
   * 
   * When both users insert at the same position, we need to decide
   * which insertion comes first. We use a tie-breaking rule based on
   * userId to ensure consistency across all clients.
   * 
   * @param op1 - First INSERT operation
   * @param op2 - Second INSERT operation
   * @returns Transformed operations
   */
  private transformInsertInsert(op1: Operation, op2: Operation): [Operation, Operation] {
    const pos1 = op1.position;
    const pos2 = op2.position;
    const len1 = op1.content?.length || 0;
    const len2 = op2.content?.length || 0;

    if (pos1 < pos2) {
      // op1 is before op2, op2 needs to shift right
      return [
        op1,
        { ...op2, position: pos2 + len1 },
      ];
    }

    if (pos1 > pos2) {
      // op2 is before op1, op1 needs to shift right
      return [
        { ...op1, position: pos1 + len2 },
        op2,
      ];
    }

    // Same position - use tie-breaking rule
    // Insert with lexicographically smaller userId comes first
    if (op1.userId < op2.userId) {
      return [
        op1,
        { ...op2, position: pos2 + len1 },
      ];
    } else {
      return [
        { ...op1, position: pos1 + len2 },
        op2,
      ];
    }
  }

  /**
   * Transform INSERT and DELETE operations
   * 
   * When one user inserts while another deletes, we need to adjust
   * positions to account for the other operation.
   * 
   * @param insert - INSERT operation
   * @param del - DELETE operation
   * @returns Transformed operations
   */
  private transformInsertDelete(insert: Operation, del: Operation): [Operation, Operation] {
    const insertPos = insert.position;
    const deletePos = del.position;
    const insertLen = insert.content?.length || 0;
    const deleteLen = del.length || 0;

    if (insertPos <= deletePos) {
      // Insert is before or at delete position
      // Delete position shifts right by insert length
      return [
        insert,
        { ...del, position: deletePos + insertLen },
      ];
    }

    if (insertPos >= deletePos + deleteLen) {
      // Insert is after delete range
      // Insert position shifts left by delete length
      return [
        { ...insert, position: insertPos - deleteLen },
        del,
      ];
    }

    // Insert is within delete range
    // Insert happens first, then delete
    return [
      insert,
      { ...del, position: deletePos, length: deleteLen + insertLen },
    ];
  }

  /**
   * Transform two concurrent DELETE operations
   * 
   * When both users delete overlapping ranges, we need to handle
   * the overlap correctly to avoid deleting the same content twice.
   * 
   * @param op1 - First DELETE operation
   * @param op2 - Second DELETE operation
   * @returns Transformed operations
   */
  private transformDeleteDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    const pos1 = op1.position;
    const len1 = op1.length || 0;
    const end1 = pos1 + len1;

    const pos2 = op2.position;
    const len2 = op2.length || 0;
    const end2 = pos2 + len2;

    // No overlap - simple position adjustment
    if (end1 <= pos2) {
      // op1 is completely before op2
      return [
        op1,
        { ...op2, position: pos2 - len1 },
      ];
    }

    if (end2 <= pos1) {
      // op2 is completely before op1
      return [
        { ...op1, position: pos1 - len2 },
        op2,
      ];
    }

    // Overlapping deletes - need to handle carefully
    // Calculate the overlap
    const overlapStart = Math.max(pos1, pos2);
    const overlapEnd = Math.min(end1, end2);
    const overlapLen = overlapEnd - overlapStart;

    if (pos1 <= pos2 && end1 >= end2) {
      // op1 completely contains op2
      return [
        { ...op1, position: pos1, length: len1 - len2 },
        { ...op2, position: pos2 - (pos2 - pos1), length: 0 }, // op2 becomes no-op
      ];
    }

    if (pos2 <= pos1 && end2 >= end1) {
      // op2 completely contains op1
      return [
        { ...op1, position: pos1 - (pos1 - pos2), length: 0 }, // op1 becomes no-op
        { ...op2, position: pos2, length: len2 - len1 },
      ];
    }

    if (pos1 < pos2) {
      // op1 starts before op2, partial overlap
      return [
        { ...op1, position: pos1, length: len1 - overlapLen },
        { ...op2, position: pos1 + (len1 - overlapLen), length: len2 - overlapLen },
      ];
    } else {
      // op2 starts before op1, partial overlap
      return [
        { ...op1, position: pos2 + (len2 - overlapLen), length: len1 - overlapLen },
        { ...op2, position: pos2, length: len2 - overlapLen },
      ];
    }
  }

  /**
   * Apply an operation to a document
   * 
   * Takes a document string and an operation, and returns the
   * resulting document after applying the operation.
   * 
   * Requirements: 4.3
   * 
   * @param doc - Document string
   * @param op - Operation to apply
   * @returns Modified document
   * @throws {OperationError} If operation cannot be applied
   */
  apply(doc: string, op: Operation): string {
    this.validateOperation(op);

    switch (op.type) {
      case OperationType.INSERT:
        return this.applyInsert(doc, op);

      case OperationType.DELETE:
        return this.applyDelete(doc, op);

      case OperationType.RETAIN:
        // RETAIN is a no-op for document application
        return doc;

      default:
        throw new OperationError(`Unknown operation type: ${op.type}`, op);
    }
  }

  /**
   * Apply an INSERT operation to a document
   * 
   * @param doc - Document string
   * @param op - INSERT operation
   * @returns Modified document
   * @throws {OperationError} If operation is invalid
   */
  private applyInsert(doc: string, op: Operation): string {
    const position = op.position;
    const content = op.content || '';

    if (position < 0 || position > doc.length) {
      throw new OperationError(
        `Insert position ${position} is out of bounds (document length: ${doc.length})`,
        op
      );
    }

    return doc.slice(0, position) + content + doc.slice(position);
  }

  /**
   * Apply a DELETE operation to a document
   * 
   * @param doc - Document string
   * @param op - DELETE operation
   * @returns Modified document
   * @throws {OperationError} If operation is invalid
   */
  private applyDelete(doc: string, op: Operation): string {
    const position = op.position;
    const length = op.length || 0;

    if (position < 0 || position > doc.length) {
      throw new OperationError(
        `Delete position ${position} is out of bounds (document length: ${doc.length})`,
        op
      );
    }

    if (position + length > doc.length) {
      throw new OperationError(
        `Delete range [${position}, ${position + length}) exceeds document length ${doc.length}`,
        op
      );
    }

    return doc.slice(0, position) + doc.slice(position + length);
  }

  /**
   * Compose multiple operations into a single operation
   * 
   * Takes an array of operations and combines them into a single
   * operation that has the same effect as applying all operations
   * in sequence. This is useful for reducing the number of operations
   * that need to be stored or transmitted.
   * 
   * Note: This is a simplified composition that works for sequential
   * operations from the same user. For more complex scenarios, a full
   * OT composition algorithm would be needed.
   * 
   * Requirements: 4.3
   * 
   * @param ops - Array of operations to compose
   * @returns Single composed operation
   * @throws {OperationError} If operations cannot be composed
   */
  compose(ops: Operation[]): Operation {
    if (ops.length === 0) {
      throw new OperationError('Cannot compose empty operation list');
    }

    if (ops.length === 1) {
      return ops[0];
    }

    // Validate all operations
    ops.forEach(op => this.validateOperation(op));

    // For simplicity, we'll compose by applying operations to an empty document
    // and creating a single operation that represents the final state
    // This is a simplified approach - a full OT system would have more sophisticated composition

    // Check if all operations are from the same user
    const userId = ops[0].userId;
    if (!ops.every(op => op.userId === userId)) {
      throw new OperationError('Cannot compose operations from different users');
    }

    // Apply all operations to track the cumulative effect
    let doc = '';
    let maxLength = 0;

    for (const op of ops) {
      try {
        doc = this.apply(doc, op);
        maxLength = Math.max(maxLength, doc.length);
      } catch (error) {
        // If we can't apply sequentially, we can't compose
        throw new OperationError(
          `Cannot compose operations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          op
        );
      }
    }

    // Create a composed operation
    // This is a simplified version - in a real system, you'd want to preserve
    // the structure of operations more carefully
    const firstOp = ops[0];
    const lastOp = ops[ops.length - 1];

    // If the result is just an insert, return an insert operation
    if (doc.length > 0) {
      return {
        type: OperationType.INSERT,
        position: 0,
        content: doc,
        userId: userId,
        timestamp: lastOp.timestamp,
        metadata: {
          composed: true,
          operationCount: ops.length,
          originalTimestamps: ops.map(op => op.timestamp),
        },
      };
    }

    // If the result is empty, return a delete operation
    return {
      type: OperationType.DELETE,
      position: 0,
      length: maxLength,
      userId: userId,
      timestamp: lastOp.timestamp,
      metadata: {
        composed: true,
        operationCount: ops.length,
        originalTimestamps: ops.map(op => op.timestamp),
      },
    };
  }

  /**
   * Validate an operation
   * 
   * Checks that an operation has all required fields and valid values.
   * 
   * @param op - Operation to validate
   * @throws {OperationError} If operation is invalid
   */
  private validateOperation(op: Operation): void {
    if (!op) {
      throw new OperationError('Operation is null or undefined');
    }

    if (!op.type) {
      throw new OperationError('Operation type is required', op);
    }

    if (![OperationType.INSERT, OperationType.DELETE, OperationType.RETAIN].includes(op.type)) {
      throw new OperationError(`Invalid operation type: ${op.type}`, op);
    }

    if (typeof op.position !== 'number' || op.position < 0) {
      throw new OperationError(`Invalid position: ${op.position}`, op);
    }

    if (op.type === OperationType.INSERT) {
      if (typeof op.content !== 'string') {
        throw new OperationError('INSERT operation requires content string', op);
      }
      if (op.content.length === 0) {
        throw new OperationError('INSERT operation content cannot be empty', op);
      }
    }

    if (op.type === OperationType.DELETE) {
      if (typeof op.length !== 'number' || op.length <= 0) {
        throw new OperationError(`Invalid delete length: ${op.length}`, op);
      }
    }

    if (op.type === OperationType.RETAIN) {
      if (typeof op.length !== 'number' || op.length <= 0) {
        throw new OperationError(`Invalid retain length: ${op.length}`, op);
      }
    }

    if (!op.userId) {
      throw new OperationError('Operation userId is required', op);
    }

    if (typeof op.timestamp !== 'number' || op.timestamp <= 0) {
      throw new OperationError(`Invalid timestamp: ${op.timestamp}`, op);
    }
  }

  /**
   * Invert an operation
   * 
   * Creates an operation that undoes the effect of the given operation.
   * This is useful for implementing undo/redo functionality.
   * 
   * @param op - Operation to invert
   * @param doc - Document before the operation was applied
   * @returns Inverted operation
   * @throws {OperationError} If operation cannot be inverted
   */
  invert(op: Operation, doc: string): Operation {
    this.validateOperation(op);

    switch (op.type) {
      case OperationType.INSERT: {
        // Invert INSERT to DELETE
        const length = op.content?.length || 0;
        return {
          type: OperationType.DELETE,
          position: op.position,
          length: length,
          userId: op.userId,
          timestamp: Date.now(),
          metadata: {
            inverted: true,
            originalOperation: op,
          },
        };
      }

      case OperationType.DELETE: {
        // Invert DELETE to INSERT
        const length = op.length || 0;
        const deletedContent = doc.slice(op.position, op.position + length);
        return {
          type: OperationType.INSERT,
          position: op.position,
          content: deletedContent,
          userId: op.userId,
          timestamp: Date.now(),
          metadata: {
            inverted: true,
            originalOperation: op,
          },
        };
      }

      case OperationType.RETAIN:
        // RETAIN inverts to itself
        return { ...op, timestamp: Date.now() };

      default:
        throw new OperationError(`Cannot invert operation type: ${op.type}`, op);
    }
  }

  /**
   * Check if an operation is a no-op
   * 
   * A no-op operation has no effect on the document.
   * 
   * @param op - Operation to check
   * @returns True if operation is a no-op
   */
  isNoOp(op: Operation): boolean {
    if (op.type === OperationType.INSERT) {
      return !op.content || op.content.length === 0;
    }

    if (op.type === OperationType.DELETE) {
      return !op.length || op.length === 0;
    }

    if (op.type === OperationType.RETAIN) {
      return !op.length || op.length === 0;
    }

    return false;
  }

  /**
   * Normalize an operation
   * 
   * Ensures an operation is in a canonical form. This can help
   * with comparing operations and reducing redundancy.
   * 
   * @param op - Operation to normalize
   * @returns Normalized operation
   */
  normalize(op: Operation): Operation {
    const normalized = { ...op };

    // Remove no-op operations
    if (this.isNoOp(normalized)) {
      return {
        type: OperationType.RETAIN,
        position: normalized.position,
        length: 0,
        userId: normalized.userId,
        timestamp: normalized.timestamp,
      };
    }

    // Ensure metadata exists
    if (!normalized.metadata) {
      normalized.metadata = {};
    }

    return normalized;
  }
}
