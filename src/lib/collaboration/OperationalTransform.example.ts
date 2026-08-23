/**
 * Usage Examples for OperationalTransform
 * 
 * This file demonstrates how to use the OperationalTransform class
 * for conflict-free collaborative editing.
 * 
 * Requirements: 4.2, 4.3
 */

import { OperationalTransform, OperationError } from './OperationalTransform';
import { OperationType, type Operation } from './types';

// Initialize the OT engine
const ot = new OperationalTransform();

/**
 * Example 1: Basic Operation Application
 * 
 * Shows how to apply INSERT and DELETE operations to a document.
 */
export function example1_BasicOperations() {
  console.log('=== Example 1: Basic Operations ===\n');

  let doc = 'Hello World';
  console.log('Initial document:', doc);

  // Insert operation
  const insertOp: Operation = {
    type: OperationType.INSERT,
    position: 6,
    content: 'Beautiful ',
    userId: 'user1',
    timestamp: Date.now(),
  };

  doc = ot.apply(doc, insertOp);
  console.log('After insert:', doc);
  // Output: "Hello Beautiful World"

  // Delete operation
  const deleteOp: Operation = {
    type: OperationType.DELETE,
    position: 6,
    length: 10,
    userId: 'user1',
    timestamp: Date.now(),
  };

  doc = ot.apply(doc, deleteOp);
  console.log('After delete:', doc);
  // Output: "Hello World"

  console.log('\n');
}

/**
 * Example 2: Concurrent Inserts
 * 
 * Shows how to handle two users inserting at different positions concurrently.
 */
export function example2_ConcurrentInserts() {
  console.log('=== Example 2: Concurrent Inserts ===\n');

  const doc = 'Hello World';
  console.log('Initial document:', doc);

  // User 1 inserts at position 6
  const op1: Operation = {
    type: OperationType.INSERT,
    position: 6,
    content: 'Beautiful ',
    userId: 'user1',
    timestamp: Date.now(),
  };

  // User 2 inserts at position 11 (concurrently, doesn't know about op1)
  const op2: Operation = {
    type: OperationType.INSERT,
    position: 11,
    content: '!',
    userId: 'user2',
    timestamp: Date.now(),
  };

  console.log('User 1 wants to insert "Beautiful " at position 6');
  console.log('User 2 wants to insert "!" at position 11');

  // Transform operations against each other
  const [op1Prime, op2Prime] = ot.transform(op1, op2);

  console.log('\nAfter transformation:');
  console.log('op1\' position:', op1Prime.position);
  console.log('op2\' position:', op2Prime.position);

  // Apply in both orders - should converge
  let result1 = doc;
  result1 = ot.apply(result1, op1);
  result1 = ot.apply(result1, op2Prime);

  let result2 = doc;
  result2 = ot.apply(result2, op2);
  result2 = ot.apply(result2, op1Prime);

  console.log('\nResult 1 (op1 then op2\'):', result1);
  console.log('Result 2 (op2 then op1\'):', result2);
  console.log('Converged:', result1 === result2);
  // Both output: "Hello Beautiful World!"

  console.log('\n');
}

/**
 * Example 3: Concurrent Insert and Delete
 * 
 * Shows how to handle one user inserting while another deletes.
 */
export function example3_InsertAndDelete() {
  console.log('=== Example 3: Concurrent Insert and Delete ===\n');

  const doc = 'Hello World';
  console.log('Initial document:', doc);

  // User 1 inserts
  const insert: Operation = {
    type: OperationType.INSERT,
    position: 6,
    content: 'Beautiful ',
    userId: 'user1',
    timestamp: Date.now(),
  };

  // User 2 deletes (concurrently)
  const del: Operation = {
    type: OperationType.DELETE,
    position: 6,
    length: 5,
    userId: 'user2',
    timestamp: Date.now(),
  };

  console.log('User 1 wants to insert "Beautiful " at position 6');
  console.log('User 2 wants to delete 5 characters at position 6');

  // Transform operations
  const [insertPrime, delPrime] = ot.transform(insert, del);

  console.log('\nAfter transformation:');
  console.log('insert\' position:', insertPrime.position);
  console.log('delete\' position:', delPrime.position);

  // Apply in both orders - should converge
  let result1 = doc;
  result1 = ot.apply(result1, insert);
  result1 = ot.apply(result1, delPrime);

  let result2 = doc;
  result2 = ot.apply(result2, del);
  result2 = ot.apply(result2, insertPrime);

  console.log('\nResult 1 (insert then delete\'):', result1);
  console.log('Result 2 (delete then insert\'):', result2);
  console.log('Converged:', result1 === result2);

  console.log('\n');
}

/**
 * Example 4: Overlapping Deletes
 * 
 * Shows how to handle two users deleting overlapping ranges.
 */
export function example4_OverlappingDeletes() {
  console.log('=== Example 4: Overlapping Deletes ===\n');

  const doc = 'Hello Beautiful World';
  console.log('Initial document:', doc);

  // User 1 deletes "Beautiful "
  const op1: Operation = {
    type: OperationType.DELETE,
    position: 6,
    length: 10,
    userId: 'user1',
    timestamp: Date.now(),
  };

  // User 2 deletes "ful Wor" (overlaps with op1)
  const op2: Operation = {
    type: OperationType.DELETE,
    position: 12,
    length: 7,
    userId: 'user2',
    timestamp: Date.now(),
  };

  console.log('User 1 wants to delete "Beautiful " (positions 6-16)');
  console.log('User 2 wants to delete "ful Wor" (positions 12-19)');

  // Transform operations
  const [op1Prime, op2Prime] = ot.transform(op1, op2);

  console.log('\nAfter transformation:');
  console.log('op1\' length:', op1Prime.length);
  console.log('op2\' length:', op2Prime.length);

  // Apply in both orders - should converge
  let result1 = doc;
  result1 = ot.apply(result1, op1);
  result1 = ot.apply(result1, op2Prime);

  let result2 = doc;
  result2 = ot.apply(result2, op2);
  result2 = ot.apply(result2, op1Prime);

  console.log('\nResult 1 (op1 then op2\'):', result1);
  console.log('Result 2 (op2 then op1\'):', result2);
  console.log('Converged:', result1 === result2);

  console.log('\n');
}

/**
 * Example 5: Operation Composition
 * 
 * Shows how to compose multiple operations into a single operation.
 */
export function example5_Composition() {
  console.log('=== Example 5: Operation Composition ===\n');

  // Multiple sequential operations from the same user
  const ops: Operation[] = [
    {
      type: OperationType.INSERT,
      position: 0,
      content: 'Hello',
      userId: 'user1',
      timestamp: Date.now(),
    },
    {
      type: OperationType.INSERT,
      position: 5,
      content: ' ',
      userId: 'user1',
      timestamp: Date.now() + 1,
    },
    {
      type: OperationType.INSERT,
      position: 6,
      content: 'World',
      userId: 'user1',
      timestamp: Date.now() + 2,
    },
  ];

  console.log('Original operations:');
  ops.forEach((op, i) => {
    console.log(`  ${i + 1}. INSERT "${op.content}" at position ${op.position}`);
  });

  // Compose into single operation
  const composed = ot.compose(ops);

  console.log('\nComposed operation:');
  console.log('  Type:', composed.type);
  console.log('  Content:', composed.content);
  console.log('  Position:', composed.position);
  console.log('  Metadata:', composed.metadata);

  // Apply composed operation
  let doc = '';
  doc = ot.apply(doc, composed);
  console.log('\nResult:', doc);
  // Output: "Hello World"

  console.log('\n');
}

/**
 * Example 6: Operation Inversion (Undo)
 * 
 * Shows how to invert operations for undo functionality.
 */
export function example6_Inversion() {
  console.log('=== Example 6: Operation Inversion (Undo) ===\n');

  let doc = 'Hello World';
  console.log('Initial document:', doc);

  // User performs an insert
  const insertOp: Operation = {
    type: OperationType.INSERT,
    position: 6,
    content: 'Beautiful ',
    userId: 'user1',
    timestamp: Date.now(),
  };

  doc = ot.apply(doc, insertOp);
  console.log('After insert:', doc);
  // Output: "Hello Beautiful World"

  // Create inverse operation for undo
  const undoOp = ot.invert(insertOp, 'Hello World');
  console.log('\nUndo operation:');
  console.log('  Type:', undoOp.type);
  console.log('  Position:', undoOp.position);
  console.log('  Length:', undoOp.length);

  // Apply undo
  doc = ot.apply(doc, undoOp);
  console.log('\nAfter undo:', doc);
  // Output: "Hello World"

  console.log('\n');
}

/**
 * Example 7: Error Handling
 * 
 * Shows how to handle invalid operations.
 */
export function example7_ErrorHandling() {
  console.log('=== Example 7: Error Handling ===\n');

  const doc = 'Hello';

  // Try to insert at invalid position
  const invalidInsert: Operation = {
    type: OperationType.INSERT,
    position: 100, // Out of bounds
    content: 'World',
    userId: 'user1',
    timestamp: Date.now(),
  };

  try {
    ot.apply(doc, invalidInsert);
  } catch (error) {
    if (error instanceof OperationError) {
      console.log('Caught OperationError:');
      console.log('  Message:', error.message);
      console.log('  Operation:', error.operation);
    }
  }

  // Try to delete beyond document length
  const invalidDelete: Operation = {
    type: OperationType.DELETE,
    position: 3,
    length: 10, // Exceeds document length
    userId: 'user1',
    timestamp: Date.now(),
  };

  try {
    ot.apply(doc, invalidDelete);
  } catch (error) {
    if (error instanceof OperationError) {
      console.log('\nCaught OperationError:');
      console.log('  Message:', error.message);
    }
  }

  console.log('\n');
}

/**
 * Example 8: Real-World Collaboration Scenario
 * 
 * Simulates a real-world collaborative editing session with multiple users.
 */
export function example8_RealWorldScenario() {
  console.log('=== Example 8: Real-World Collaboration Scenario ===\n');

  // Initial document
  let doc = 'The quick brown fox jumps over the lazy dog';
  console.log('Initial document:', doc);
  console.log('\n--- Collaborative Editing Session ---\n');

  // User 1: Replace "quick" with "slow"
  const user1_delete: Operation = {
    type: OperationType.DELETE,
    position: 4,
    length: 5,
    userId: 'user1',
    timestamp: Date.now(),
  };

  const user1_insert: Operation = {
    type: OperationType.INSERT,
    position: 4,
    content: 'slow',
    userId: 'user1',
    timestamp: Date.now() + 1,
  };

  // User 2: Add "very " before "lazy" (concurrently)
  const user2_insert: Operation = {
    type: OperationType.INSERT,
    position: 36,
    content: 'very ',
    userId: 'user2',
    timestamp: Date.now(),
  };

  console.log('User 1: Replace "quick" with "slow"');
  console.log('User 2: Add "very " before "lazy"');

  // Transform user2's operation against user1's operations
  const [user1_delete_prime, user2_insert_1] = ot.transform(user1_delete, user2_insert);
  const [user1_insert_prime, user2_insert_2] = ot.transform(user1_insert, user2_insert_1);

  // Apply all operations
  doc = ot.apply(doc, user1_delete);
  doc = ot.apply(doc, user1_insert);
  doc = ot.apply(doc, user2_insert_2);

  console.log('\nFinal document:', doc);
  // Output: "The slow brown fox jumps over the very lazy dog"

  console.log('\n');
}

/**
 * Example 9: Utility Functions
 * 
 * Shows how to use utility functions like isNoOp and normalize.
 */
export function example9_UtilityFunctions() {
  console.log('=== Example 9: Utility Functions ===\n');

  // Check if operation is a no-op
  const emptyInsert: Operation = {
    type: OperationType.INSERT,
    position: 5,
    content: '',
    userId: 'user1',
    timestamp: Date.now(),
  };

  console.log('Is empty insert a no-op?', ot.isNoOp(emptyInsert));
  // Output: true

  // Normalize operation
  const normalized = ot.normalize(emptyInsert);
  console.log('\nNormalized operation:');
  console.log('  Type:', normalized.type);
  console.log('  Length:', normalized.length);
  // Converts to RETAIN with length 0

  console.log('\n');
}

// Run all examples
if (require.main === module) {
  example1_BasicOperations();
  example2_ConcurrentInserts();
  example3_InsertAndDelete();
  example4_OverlappingDeletes();
  example5_Composition();
  example6_Inversion();
  example7_ErrorHandling();
  example8_RealWorldScenario();
  example9_UtilityFunctions();
}
