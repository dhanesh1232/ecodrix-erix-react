# Operational Transformation (OT) Implementation

## Overview

The `OperationalTransform` class implements the Operational Transformation algorithm for conflict-free collaborative editing. OT ensures that all clients converge to the same document state regardless of the order in which operations are received.

**Requirements:** 4.2, 4.3

## Key Concepts

### What is Operational Transformation?

Operational Transformation is a technique for maintaining consistency in collaborative editing systems. When multiple users edit a document concurrently, their operations may conflict. OT resolves these conflicts by transforming operations so that they can be applied in any order while maintaining convergence.

### Core Properties

1. **Convergence**: All clients reach the same final state
2. **Causality Preservation**: Operations maintain causal order
3. **Intention Preservation**: User intentions are preserved after transformation

### Operation Types

The OT implementation supports three types of operations:

- **INSERT**: Insert text at a specific position
- **DELETE**: Delete text from a specific position
- **RETAIN**: Skip over unchanged content (no-op)

## API Reference

### OperationalTransform Class

#### Constructor

```typescript
const ot = new OperationalTransform();
```

No configuration required. The class is stateless and can be reused for multiple transformations.

#### Methods

##### `transform(op1: Operation, op2: Operation): [Operation, Operation]`

Transform two concurrent operations against each other.

**Parameters:**
- `op1`: First operation
- `op2`: Second operation

**Returns:** Tuple of transformed operations `[op1', op2']`

**Throws:** `OperationError` if operations are invalid

**Example:**
```typescript
const op1 = {
  type: OperationType.INSERT,
  position: 5,
  content: 'Hello',
  userId: 'user1',
  timestamp: Date.now(),
};

const op2 = {
  type: OperationType.INSERT,
  position: 5,
  content: 'World',
  userId: 'user2',
  timestamp: Date.now(),
};

const [op1Prime, op2Prime] = ot.transform(op1, op2);
```

##### `apply(doc: string, op: Operation): string`

Apply an operation to a document.

**Parameters:**
- `doc`: Document string
- `op`: Operation to apply

**Returns:** Modified document

**Throws:** `OperationError` if operation cannot be applied

**Example:**
```typescript
let doc = 'Hello World';
const op = {
  type: OperationType.INSERT,
  position: 6,
  content: 'Beautiful ',
  userId: 'user1',
  timestamp: Date.now(),
};

doc = ot.apply(doc, op);
// Result: "Hello Beautiful World"
```

##### `compose(ops: Operation[]): Operation`

Compose multiple operations into a single operation.

**Parameters:**
- `ops`: Array of operations to compose

**Returns:** Single composed operation

**Throws:** `OperationError` if operations cannot be composed

**Example:**
```typescript
const ops = [
  { type: OperationType.INSERT, position: 0, content: 'Hello', userId: 'user1', timestamp: Date.now() },
  { type: OperationType.INSERT, position: 5, content: ' ', userId: 'user1', timestamp: Date.now() + 1 },
  { type: OperationType.INSERT, position: 6, content: 'World', userId: 'user1', timestamp: Date.now() + 2 },
];

const composed = ot.compose(ops);
// Result: Single INSERT operation with content "Hello World"
```

##### `invert(op: Operation, doc: string): Operation`

Create an operation that undoes the effect of the given operation.

**Parameters:**
- `op`: Operation to invert
- `doc`: Document before the operation was applied

**Returns:** Inverted operation

**Throws:** `OperationError` if operation cannot be inverted

**Example:**
```typescript
const doc = 'Hello World';
const op = {
  type: OperationType.INSERT,
  position: 6,
  content: 'Beautiful ',
  userId: 'user1',
  timestamp: Date.now(),
};

const undoOp = ot.invert(op, doc);
// Result: DELETE operation that removes "Beautiful "
```

##### `isNoOp(op: Operation): boolean`

Check if an operation is a no-op (has no effect).

**Parameters:**
- `op`: Operation to check

**Returns:** `true` if operation is a no-op

**Example:**
```typescript
const emptyInsert = {
  type: OperationType.INSERT,
  position: 5,
  content: '',
  userId: 'user1',
  timestamp: Date.now(),
};

const isNoOp = ot.isNoOp(emptyInsert);
// Result: true
```

##### `normalize(op: Operation): Operation`

Normalize an operation to canonical form.

**Parameters:**
- `op`: Operation to normalize

**Returns:** Normalized operation

**Example:**
```typescript
const op = {
  type: OperationType.INSERT,
  position: 5,
  content: '',
  userId: 'user1',
  timestamp: Date.now(),
};

const normalized = ot.normalize(op);
// Result: RETAIN operation with length 0
```

### Operation Interface

```typescript
interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;      // Required for INSERT
  length?: number;       // Required for DELETE and RETAIN
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

### OperationError Class

Custom error class for operation-related errors.

```typescript
class OperationError extends Error {
  constructor(message: string, operation?: Operation);
  operation?: Operation;
}
```

## Transformation Rules

### INSERT vs INSERT

When two users insert at the same position, a tie-breaking rule based on `userId` ensures consistency:

```typescript
// User 1 inserts "Hello" at position 5
// User 2 inserts "World" at position 5

// If user1 < user2 lexicographically:
// op1' = INSERT "Hello" at 5
// op2' = INSERT "World" at 10 (shifted by length of "Hello")
```

### INSERT vs DELETE

When one user inserts while another deletes:

```typescript
// Insert before delete: delete position shifts right
// Insert after delete: insert position shifts left
// Insert within delete range: delete length extends
```

### DELETE vs DELETE

When two users delete overlapping ranges:

```typescript
// Non-overlapping: simple position adjustment
// Completely overlapping: one becomes no-op
// Partially overlapping: both lengths reduced by overlap
```

## Usage Patterns

### Basic Collaborative Editing

```typescript
import { OperationalTransform } from '@ecodrix/erix-react';

const ot = new OperationalTransform();

// Initial document
let doc = 'Hello World';

// User 1 creates an operation
const op1 = {
  type: OperationType.INSERT,
  position: 6,
  content: 'Beautiful ',
  userId: 'user1',
  timestamp: Date.now(),
};

// User 2 creates a concurrent operation
const op2 = {
  type: OperationType.INSERT,
  position: 11,
  content: '!',
  userId: 'user2',
  timestamp: Date.now(),
};

// Transform operations
const [op1Prime, op2Prime] = ot.transform(op1, op2);

// Apply in any order - both converge to same result
let result1 = ot.apply(ot.apply(doc, op1), op2Prime);
let result2 = ot.apply(ot.apply(doc, op2), op1Prime);

console.log(result1 === result2); // true
// Both: "Hello Beautiful World!"
```

### Integration with CollaborationEngine

```typescript
import { CollaborationEngine, OperationalTransform } from '@ecodrix/erix-react';

const ot = new OperationalTransform();
const collaboration = new CollaborationEngine({
  websocketUrl: 'wss://api.example.com/collaboration',
  apiKey: 'your-api-key',
  userId: 'user-123',
  userName: 'John Doe',
  userColor: '#3b82f6',
});

// Listen for remote operations
collaboration.on('operation', (remoteOp) => {
  // Transform remote operation against pending local operations
  const [localOpPrime, remoteOpPrime] = ot.transform(localOp, remoteOp);
  
  // Apply transformed remote operation
  document = ot.apply(document, remoteOpPrime);
  
  // Update local operation
  localOp = localOpPrime;
});

// Send local operations
function handleLocalEdit(op: Operation) {
  // Apply locally
  document = ot.apply(document, op);
  
  // Broadcast to other users
  collaboration.sendOperation(op);
}
```

### Undo/Redo Implementation

```typescript
const undoStack: Operation[] = [];
const redoStack: Operation[] = [];
let doc = 'Hello World';

// Perform operation
function performOperation(op: Operation) {
  const beforeDoc = doc;
  doc = ot.apply(doc, op);
  
  // Store inverse for undo
  const undoOp = ot.invert(op, beforeDoc);
  undoStack.push(undoOp);
  redoStack.length = 0; // Clear redo stack
}

// Undo
function undo() {
  if (undoStack.length === 0) return;
  
  const undoOp = undoStack.pop()!;
  const beforeDoc = doc;
  doc = ot.apply(doc, undoOp);
  
  // Store inverse for redo
  const redoOp = ot.invert(undoOp, beforeDoc);
  redoStack.push(redoOp);
}

// Redo
function redo() {
  if (redoStack.length === 0) return;
  
  const redoOp = redoStack.pop()!;
  const beforeDoc = doc;
  doc = ot.apply(doc, redoOp);
  
  // Store inverse for undo
  const undoOp = ot.invert(redoOp, beforeDoc);
  undoStack.push(undoOp);
}
```

## Error Handling

The OT implementation validates all operations and throws `OperationError` for invalid operations:

```typescript
try {
  const result = ot.apply(doc, operation);
} catch (error) {
  if (error instanceof OperationError) {
    console.error('Operation failed:', error.message);
    console.error('Invalid operation:', error.operation);
    
    // Handle error appropriately
    // - Show error to user
    // - Log for debugging
    // - Attempt recovery
  }
}
```

Common error scenarios:
- Position out of bounds
- Missing required fields (content, length)
- Invalid operation type
- Negative position or length
- Missing userId or timestamp

## Performance Considerations

### Time Complexity

- `transform()`: O(1) - Constant time for pairwise transformation
- `apply()`: O(n) - Linear in document length for string operations
- `compose()`: O(m * n) - m operations, n average document length
- `invert()`: O(n) - Linear in operation size

### Memory Usage

- Operations are lightweight (< 1KB each)
- No internal state maintained
- Document strings are immutable (new strings created on apply)

### Optimization Tips

1. **Batch Operations**: Use `compose()` to reduce operation count
2. **Lazy Application**: Only apply operations when needed for display
3. **Operation Pruning**: Remove no-op operations with `isNoOp()`
4. **Normalize Operations**: Use `normalize()` for consistent representation

## Testing

The OT implementation includes comprehensive unit tests covering:

- All operation type combinations
- Edge cases (empty documents, unicode, emoji)
- Error handling
- Convergence property verification
- Overlapping operations
- Boundary conditions

Run tests:
```bash
npm test -- OperationalTransform.test.ts
```

## Limitations

### Current Implementation

1. **Text-Only**: Only supports plain text operations (no rich text formatting)
2. **Pairwise Transformation**: Transforms two operations at a time
3. **Simplified Composition**: Basic composition for sequential operations
4. **No Position Caching**: Recalculates positions on each transformation

### Future Enhancements

1. **Rich Text Support**: Extend to handle formatting operations
2. **N-way Transformation**: Optimize for multiple concurrent operations
3. **Advanced Composition**: Full OT composition algorithm
4. **Position Indexing**: Cache position calculations for performance
5. **CRDT Integration**: Hybrid OT/CRDT approach for better scalability

## References

- [Operational Transformation (Wikipedia)](https://en.wikipedia.org/wiki/Operational_transformation)
- [Understanding and Applying Operational Transformation](https://operational-transformation.github.io/)
- [Google Wave OT](https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html)

## Support

For issues, questions, or contributions:
- GitHub Issues: [ecodrix/erix-react](https://github.com/ecodrix/erix-react/issues)
- Documentation: [ecodrix.com/docs](https://ecodrix.com/docs)
- Email: support@ecodrix.com
