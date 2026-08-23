/**
 * Unit tests for OperationalTransform
 * 
 * Tests the OT algorithm implementation including:
 * - Transform correctness for all operation type combinations
 * - Operation application to documents
 * - Operation composition
 * - Edge cases and error handling
 * - Convergence property verification
 * 
 * Requirements: 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import { OperationalTransform, OperationError } from './OperationalTransform';
import { OperationType, type Operation } from './types';

describe('OperationalTransform', () => {
  const ot = new OperationalTransform();

  // Helper function to create operations
  const createInsert = (position: number, content: string, userId = 'user1'): Operation => ({
    type: OperationType.INSERT,
    position,
    content,
    userId,
    timestamp: Date.now(),
  });

  const createDelete = (position: number, length: number, userId = 'user1'): Operation => ({
    type: OperationType.DELETE,
    position,
    length,
    userId,
    timestamp: Date.now(),
  });

  const createRetain = (position: number, length: number, userId = 'user1'): Operation => ({
    type: OperationType.RETAIN,
    position,
    length,
    userId,
    timestamp: Date.now(),
  });

  describe('transform', () => {
    describe('INSERT vs INSERT', () => {
      it('should handle inserts at different positions', () => {
        const op1 = createInsert(5, 'Hello');
        const op2 = createInsert(10, 'World');

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.position).toBe(5);
        expect(op2Prime.position).toBe(15); // Shifted by length of 'Hello'
      });

      it('should handle inserts at the same position with tie-breaking', () => {
        const op1 = createInsert(5, 'Hello', 'user1');
        const op2 = createInsert(5, 'World', 'user2');

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        // user1 < user2 lexicographically, so op1 comes first
        expect(op1Prime.position).toBe(5);
        expect(op2Prime.position).toBe(10); // Shifted by length of 'Hello'
      });

      it('should handle inserts at the same position with reverse tie-breaking', () => {
        const op1 = createInsert(5, 'Hello', 'user2');
        const op2 = createInsert(5, 'World', 'user1');

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        // user1 < user2 lexicographically, so op2 comes first
        expect(op1Prime.position).toBe(10); // Shifted by length of 'World'
        expect(op2Prime.position).toBe(5);
      });

      it('should handle insert before another insert', () => {
        const op1 = createInsert(3, 'ABC');
        const op2 = createInsert(8, 'XYZ');

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.position).toBe(3);
        expect(op2Prime.position).toBe(11); // 8 + 3
      });
    });

    describe('INSERT vs DELETE', () => {
      it('should handle insert before delete', () => {
        const insert = createInsert(5, 'Hello');
        const del = createDelete(10, 3);

        const [insertPrime, delPrime] = ot.transform(insert, del);

        expect(insertPrime.position).toBe(5);
        expect(delPrime.position).toBe(15); // Shifted by length of 'Hello'
      });

      it('should handle insert after delete', () => {
        const insert = createInsert(15, 'Hello');
        const del = createDelete(5, 3);

        const [insertPrime, delPrime] = ot.transform(insert, del);

        expect(insertPrime.position).toBe(12); // Shifted left by delete length
        expect(delPrime.position).toBe(5);
      });

      it('should handle insert within delete range', () => {
        const insert = createInsert(7, 'Hello');
        const del = createDelete(5, 10);

        const [insertPrime, delPrime] = ot.transform(insert, del);

        expect(insertPrime.position).toBe(7);
        expect(delPrime.position).toBe(5);
        expect(delPrime.length).toBe(15); // Extended by insert length
      });

      it('should handle insert at delete start position', () => {
        const insert = createInsert(5, 'Hello');
        const del = createDelete(5, 3);

        const [insertPrime, delPrime] = ot.transform(insert, del);

        expect(insertPrime.position).toBe(5);
        expect(delPrime.position).toBe(10); // Shifted by insert length
      });
    });

    describe('DELETE vs INSERT', () => {
      it('should handle delete before insert', () => {
        const del = createDelete(5, 3);
        const insert = createInsert(15, 'Hello');

        const [delPrime, insertPrime] = ot.transform(del, insert);

        expect(delPrime.position).toBe(5);
        expect(insertPrime.position).toBe(12); // Shifted left by delete length
      });

      it('should handle delete after insert', () => {
        const del = createDelete(10, 3);
        const insert = createInsert(5, 'Hello');

        const [delPrime, insertPrime] = ot.transform(del, insert);

        expect(delPrime.position).toBe(15); // Shifted right by insert length
        expect(insertPrime.position).toBe(5);
      });
    });

    describe('DELETE vs DELETE', () => {
      it('should handle non-overlapping deletes', () => {
        const op1 = createDelete(5, 3);
        const op2 = createDelete(15, 3);

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.position).toBe(5);
        expect(op2Prime.position).toBe(12); // Shifted left by first delete
      });

      it('should handle delete before another delete', () => {
        const op1 = createDelete(5, 3);
        const op2 = createDelete(20, 5);

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.position).toBe(5);
        expect(op2Prime.position).toBe(17); // 20 - 3
      });

      it('should handle completely overlapping deletes (op1 contains op2)', () => {
        const op1 = createDelete(5, 10);
        const op2 = createDelete(7, 3);

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.position).toBe(5);
        expect(op1Prime.length).toBe(7); // Reduced by op2 length
        expect(op2Prime.length).toBe(0); // Becomes no-op
      });

      it('should handle completely overlapping deletes (op2 contains op1)', () => {
        const op1 = createDelete(7, 3);
        const op2 = createDelete(5, 10);

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        expect(op1Prime.length).toBe(0); // Becomes no-op
        expect(op2Prime.position).toBe(5);
        expect(op2Prime.length).toBe(7); // Reduced by op1 length
      });

      it('should handle partially overlapping deletes (op1 starts first)', () => {
        const op1 = createDelete(5, 8); // Deletes [5, 13)
        const op2 = createDelete(10, 8); // Deletes [10, 18)

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        // Overlap is [10, 13), length 3
        expect(op1Prime.position).toBe(5);
        expect(op1Prime.length).toBe(5); // 8 - 3
        expect(op2Prime.position).toBe(10); // Adjusted
        expect(op2Prime.length).toBe(5); // 8 - 3
      });

      it('should handle partially overlapping deletes (op2 starts first)', () => {
        const op1 = createDelete(10, 8); // Deletes [10, 18)
        const op2 = createDelete(5, 8); // Deletes [5, 13)

        const [op1Prime, op2Prime] = ot.transform(op1, op2);

        // Overlap is [10, 13), length 3
        expect(op1Prime.position).toBe(10); // Adjusted
        expect(op1Prime.length).toBe(5); // 8 - 3
        expect(op2Prime.position).toBe(5);
        expect(op2Prime.length).toBe(5); // 8 - 3
      });
    });

    describe('RETAIN operations', () => {
      it('should pass through retain operations', () => {
        const retain = createRetain(5, 10);
        const insert = createInsert(7, 'Hello');

        const [retainPrime, insertPrime] = ot.transform(retain, insert);

        expect(retainPrime).toEqual(retain);
        expect(insertPrime).toEqual(insert);
      });
    });
  });

  describe('apply', () => {
    it('should apply INSERT operation', () => {
      const doc = 'Hello World';
      const op = createInsert(6, 'Beautiful ');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello Beautiful World');
    });

    it('should apply INSERT at start', () => {
      const doc = 'World';
      const op = createInsert(0, 'Hello ');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello World');
    });

    it('should apply INSERT at end', () => {
      const doc = 'Hello';
      const op = createInsert(5, ' World');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello World');
    });

    it('should apply DELETE operation', () => {
      const doc = 'Hello Beautiful World';
      const op = createDelete(6, 10);

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello World');
    });

    it('should apply DELETE at start', () => {
      const doc = 'Hello World';
      const op = createDelete(0, 6);

      const result = ot.apply(doc, op);

      expect(result).toBe('World');
    });

    it('should apply DELETE at end', () => {
      const doc = 'Hello World';
      const op = createDelete(5, 6);

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello');
    });

    it('should handle RETAIN as no-op', () => {
      const doc = 'Hello World';
      const op = createRetain(5, 6);

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello World');
    });

    it('should throw error for INSERT out of bounds', () => {
      const doc = 'Hello';
      const op = createInsert(10, 'World');

      expect(() => ot.apply(doc, op)).toThrow(OperationError);
    });

    it('should throw error for DELETE out of bounds', () => {
      const doc = 'Hello';
      const op = createDelete(3, 10);

      expect(() => ot.apply(doc, op)).toThrow(OperationError);
    });
  });

  describe('compose', () => {
    it('should compose sequential INSERT operations', () => {
      const ops = [
        createInsert(0, 'Hello'),
        createInsert(5, ' '),
        createInsert(6, 'World'),
      ];

      const composed = ot.compose(ops);

      expect(composed.type).toBe(OperationType.INSERT);
      expect(composed.content).toBe('Hello World');
      expect(composed.metadata?.composed).toBe(true);
      expect(composed.metadata?.operationCount).toBe(3);
    });

    it('should return single operation if only one provided', () => {
      const op = createInsert(5, 'Hello');
      const composed = ot.compose([op]);

      expect(composed).toEqual(op);
    });

    it('should throw error for empty operation list', () => {
      expect(() => ot.compose([])).toThrow(OperationError);
    });

    it('should throw error for operations from different users', () => {
      const ops = [
        createInsert(0, 'Hello', 'user1'),
        createInsert(5, 'World', 'user2'),
      ];

      expect(() => ot.compose(ops)).toThrow(OperationError);
    });
  });

  describe('invert', () => {
    it('should invert INSERT to DELETE', () => {
      const doc = 'Hello World';
      const op = createInsert(6, 'Beautiful ');

      const inverted = ot.invert(op, doc);

      expect(inverted.type).toBe(OperationType.DELETE);
      expect(inverted.position).toBe(6);
      expect(inverted.length).toBe(10);
    });

    it('should invert DELETE to INSERT', () => {
      const doc = 'Hello Beautiful World';
      const op = createDelete(6, 10);

      const inverted = ot.invert(op, doc);

      expect(inverted.type).toBe(OperationType.INSERT);
      expect(inverted.position).toBe(6);
      expect(inverted.content).toBe('Beautiful ');
    });

    it('should invert RETAIN to itself', () => {
      const doc = 'Hello World';
      const op = createRetain(5, 6);

      const inverted = ot.invert(op, doc);

      expect(inverted.type).toBe(OperationType.RETAIN);
      expect(inverted.position).toBe(5);
      expect(inverted.length).toBe(6);
    });
  });

  describe('isNoOp', () => {
    it('should identify empty INSERT as no-op', () => {
      const op = createInsert(5, '');
      expect(ot.isNoOp(op)).toBe(true);
    });

    it('should identify zero-length DELETE as no-op', () => {
      const op = createDelete(5, 0);
      expect(ot.isNoOp(op)).toBe(true);
    });

    it('should identify zero-length RETAIN as no-op', () => {
      const op = createRetain(5, 0);
      expect(ot.isNoOp(op)).toBe(true);
    });

    it('should identify valid INSERT as not no-op', () => {
      const op = createInsert(5, 'Hello');
      expect(ot.isNoOp(op)).toBe(false);
    });
  });

  describe('normalize', () => {
    it('should convert no-op operations to RETAIN', () => {
      const op = createInsert(5, '');
      const normalized = ot.normalize(op);

      expect(normalized.type).toBe(OperationType.RETAIN);
      expect(normalized.length).toBe(0);
    });

    it('should add metadata if missing', () => {
      const op = createInsert(5, 'Hello');
      delete op.metadata;

      const normalized = ot.normalize(op);

      expect(normalized.metadata).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should throw error for null operation', () => {
      expect(() => ot.transform(null as any, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for missing type', () => {
      const op = { position: 5, content: 'Hello', userId: 'user1', timestamp: Date.now() } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for invalid type', () => {
      const op = { type: 'invalid', position: 5, userId: 'user1', timestamp: Date.now() } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for negative position', () => {
      const op = createInsert(-1, 'Hello');
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for INSERT without content', () => {
      const op = { type: OperationType.INSERT, position: 5, userId: 'user1', timestamp: Date.now() } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for DELETE without length', () => {
      const op = { type: OperationType.DELETE, position: 5, userId: 'user1', timestamp: Date.now() } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for missing userId', () => {
      const op = { type: OperationType.INSERT, position: 5, content: 'Hello', timestamp: Date.now() } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });

    it('should throw error for invalid timestamp', () => {
      const op = { type: OperationType.INSERT, position: 5, content: 'Hello', userId: 'user1', timestamp: -1 } as any;
      expect(() => ot.transform(op, createInsert(5, 'Hello'))).toThrow(OperationError);
    });
  });

  describe('convergence property', () => {
    it('should ensure convergence for concurrent inserts', () => {
      const doc = 'Hello World';
      const op1 = createInsert(6, 'Beautiful ', 'user1');
      const op2 = createInsert(11, '!', 'user2');

      // Transform operations
      const [op1Prime, op2Prime] = ot.transform(op1, op2);

      // Apply in both orders
      const result1 = ot.apply(ot.apply(doc, op1), op2Prime);
      const result2 = ot.apply(ot.apply(doc, op2), op1Prime);

      // Both should converge to the same result
      expect(result1).toBe(result2);
    });

    it('should ensure convergence for concurrent deletes', () => {
      const doc = 'Hello Beautiful World';
      const op1 = createDelete(6, 10, 'user1'); // Delete 'Beautiful '
      const op2 = createDelete(16, 5, 'user2'); // Delete 'World'

      // Transform operations
      const [op1Prime, op2Prime] = ot.transform(op1, op2);

      // Apply in both orders
      const result1 = ot.apply(ot.apply(doc, op1), op2Prime);
      const result2 = ot.apply(ot.apply(doc, op2), op1Prime);

      // Both should converge to the same result
      expect(result1).toBe(result2);
    });

    it('should ensure convergence for insert and delete', () => {
      const doc = 'Hello World';
      const op1 = createInsert(6, 'Beautiful ', 'user1');
      const op2 = createDelete(6, 5, 'user2'); // Delete 'World'

      // Transform operations
      const [op1Prime, op2Prime] = ot.transform(op1, op2);

      // Apply in both orders
      const result1 = ot.apply(ot.apply(doc, op1), op2Prime);
      const result2 = ot.apply(ot.apply(doc, op2), op1Prime);

      // Both should converge to the same result
      expect(result1).toBe(result2);
    });

    it('should ensure convergence for multiple concurrent operations', () => {
      const doc = 'Test';
      const op1 = createInsert(0, 'A', 'user1');
      const op2 = createInsert(4, 'B', 'user2');

      // For proper three-way convergence, we need to transform operations correctly
      // Let's test a simpler case: two concurrent operations applied in both orders
      
      // Transform op1 and op2
      const [op1Prime, op2Prime] = ot.transform(op1, op2);

      // Apply in both orders
      let result1 = doc;
      result1 = ot.apply(result1, op1);
      result1 = ot.apply(result1, op2Prime);

      let result2 = doc;
      result2 = ot.apply(result2, op2);
      result2 = ot.apply(result2, op1Prime);

      // Both should converge
      expect(result1).toBe(result2);
      expect(result1).toBe('ATestB');
    });
  });

  describe('edge cases', () => {
    it('should handle empty document', () => {
      const doc = '';
      const op = createInsert(0, 'Hello');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello');
    });

    it('should handle single character operations', () => {
      const doc = 'Hello';
      const op = createInsert(5, '!');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello!');
    });

    it('should handle very long content', () => {
      const doc = 'Test';
      const longContent = 'A'.repeat(10000);
      const op = createInsert(4, longContent);

      const result = ot.apply(doc, op);

      expect(result).toBe('Test' + longContent);
      expect(result.length).toBe(10004);
    });

    it('should handle unicode characters', () => {
      const doc = 'Hello';
      const op = createInsert(5, ' 世界');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello 世界');
    });

    it('should handle emoji', () => {
      const doc = 'Hello';
      const op = createInsert(5, ' 👋🌍');

      const result = ot.apply(doc, op);

      expect(result).toBe('Hello 👋🌍');
    });
  });
});
