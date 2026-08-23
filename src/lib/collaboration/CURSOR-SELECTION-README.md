# Cursor and Selection Synchronization

This document describes the cursor and selection synchronization system for real-time collaboration in the ErixEditor.

## Overview

The cursor and selection synchronization system enables multiple users to see each other's cursor positions and text selections in real-time during collaborative editing sessions. This provides visual feedback about where other users are working in the document.

**Requirements Addressed:**
- **4.1**: Display cursor positions and selections for each user
- **4.2**: Broadcast changes to other participants within 200ms

## Architecture

The system consists of several components working together:

### Core Managers

1. **UserColorManager**: Assigns unique colors to users for visual differentiation
2. **CursorManager**: Tracks and broadcasts cursor positions
3. **SelectionManager**: Tracks and broadcasts selection ranges
4. **CollaborationEngine**: Handles WebSocket communication

### React Components

1. **RemoteCursor**: Renders a single remote user's cursor
2. **RemoteSelection**: Renders a single remote user's selection
3. **CollaborationOverlay**: Main component that renders all cursors and selections

## Features

### Cursor Tracking
- Real-time cursor position updates
- Throttled broadcasting (default: 100ms) to reduce network traffic
- Smooth cursor animations
- User name labels
- Automatic cleanup of stale cursors

### Selection Tracking
- Real-time selection range updates
- Throttled broadcasting (default: 150ms)
- Multi-line selection support
- Semi-transparent highlighting
- Color-coded by user

### User Color Management
- Automatic color assignment from predefined palette
- 20 distinct colors by default
- Color recycling when palette is exhausted
- Custom palette support

### Performance Optimizations
- Throttled updates to avoid excessive network traffic
- Stale cursor/selection cleanup
- React.memo for component optimization
- Efficient event handling

## Usage

### Basic Setup

```typescript
import {
  CollaborationEngine,
  CursorManager,
  SelectionManager,
  UserColorManager,
  CollaborationOverlay,
} from '@ecodrix/erix-react';

// 1. Create managers
const userColorManager = new UserColorManager();
const userColor = userColorManager.assignColor('user-123');

const collaboration = new CollaborationEngine({
  websocketUrl: 'wss://api.example.com/collaboration',
  apiKey: 'your-api-key',
  userId: 'user-123',
  userName: 'John Doe',
  userColor,
});

const cursorManager = new CursorManager({
  throttleInterval: 100, // Update every 100ms
  enabled: true,
});

const selectionManager = new SelectionManager({
  throttleInterval: 150, // Update every 150ms
  enabled: true,
});

// 2. Connect managers to collaboration engine
cursorManager.setCollaborationEngine(collaboration);
selectionManager.setCollaborationEngine(collaboration);

// 3. Connect to document
await collaboration.connect('document-456');

// 4. Update cursor position when user moves cursor
cursorManager.updateCursor({
  line: 10,
  column: 25,
});

// 5. Update selection when user selects text
selectionManager.updateSelection({
  start: 100,
  end: 150,
});
```

### React Integration

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { CollaborationOverlay } from '@ecodrix/erix-react';

const CollaborativeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [cursorManager] = useState(() => new CursorManager());
  const [selectionManager] = useState(() => new SelectionManager());
  const [collaboration] = useState(() => new CollaborationEngine({
    // ... config
  }));

  useEffect(() => {
    cursorManager.setCollaborationEngine(collaboration);
    selectionManager.setCollaborationEngine(collaboration);
    collaboration.connect('document-456');

    return () => {
      collaboration.disconnect();
      cursorManager.destroy();
      selectionManager.destroy();
    };
  }, []);

  return (
    <div ref={editorRef} style={{ position: 'relative' }}>
      {/* Your editor content */}
      
      {/* Collaboration overlay */}
      <CollaborationOverlay
        cursorManager={cursorManager}
        selectionManager={selectionManager}
        containerRef={editorRef}
        showCursorLabels={true}
        selectionOpacity={0.2}
      />
    </div>
  );
};
```

## API Reference

### UserColorManager

Manages color assignment for collaboration users.

#### Constructor

```typescript
new UserColorManager(customPalette?: string[])
```

#### Methods

- `assignColor(userId: string, preferredColor?: string): string` - Assign a color to a user
- `getColor(userId: string): string | null` - Get a user's assigned color
- `releaseColor(userId: string): void` - Release a user's color when they leave
- `getAllAssignments(): Map<string, UserColorAssignment>` - Get all color assignments
- `clear(): void` - Clear all assignments
- `setPalette(palette: string[]): void` - Update the color palette

### CursorManager

Manages cursor position tracking and broadcasting.

#### Constructor

```typescript
new CursorManager(config?: CursorManagerConfig)
```

**Config Options:**
- `throttleInterval?: number` - Throttle interval in ms (default: 100)
- `enabled?: boolean` - Enable cursor broadcasting (default: true)
- `staleTimeout?: number` - Timeout for stale cursors in ms (default: 30000)

#### Methods

- `setCollaborationEngine(engine: CollaborationEngine): void` - Connect to collaboration engine
- `updateCursor(position: CursorPosition): void` - Update local cursor position
- `getLocalCursor(): CursorPosition | null` - Get local cursor position
- `getRemoteCursors(): RemoteCursor[]` - Get all remote cursors
- `getRemoteCursor(userId: string): RemoteCursor | null` - Get specific remote cursor
- `onCursorUpdate(handler: Function): void` - Register cursor update handler
- `offCursorUpdate(handler: Function): void` - Unregister cursor update handler
- `clearLocalCursor(): void` - Clear local cursor
- `setEnabled(enabled: boolean): void` - Enable/disable cursor broadcasting
- `destroy(): void` - Clean up resources

### SelectionManager

Manages selection range tracking and broadcasting.

#### Constructor

```typescript
new SelectionManager(config?: SelectionManagerConfig)
```

**Config Options:**
- `throttleInterval?: number` - Throttle interval in ms (default: 150)
- `enabled?: boolean` - Enable selection broadcasting (default: true)
- `staleTimeout?: number` - Timeout for stale selections in ms (default: 30000)

#### Methods

- `setCollaborationEngine(engine: CollaborationEngine): void` - Connect to collaboration engine
- `updateSelection(range: SelectionRange): void` - Update local selection range
- `getLocalSelection(): SelectionRange | null` - Get local selection range
- `getRemoteSelections(): RemoteSelection[]` - Get all remote selections
- `getRemoteSelection(userId: string): RemoteSelection | null` - Get specific remote selection
- `onSelectionUpdate(handler: Function): void` - Register selection update handler
- `offSelectionUpdate(handler: Function): void` - Unregister selection update handler
- `clearLocalSelection(): void` - Clear local selection
- `setEnabled(enabled: boolean): void` - Enable/disable selection broadcasting
- `destroy(): void` - Clean up resources

### CollaborationOverlay Component

Main React component for rendering cursors and selections.

#### Props

```typescript
interface CollaborationOverlayProps {
  cursorManager: CursorManager;
  selectionManager: SelectionManager;
  containerRef: React.RefObject<HTMLElement>;
  showCursorLabels?: boolean; // default: true
  selectionOpacity?: number; // default: 0.2
  cursorAnimationDuration?: number; // default: 150ms
  selectionAnimationDuration?: number; // default: 150ms
  showCursors?: boolean; // default: true
  showSelections?: boolean; // default: true
}
```

## Configuration

### Throttle Intervals

Adjust throttle intervals to balance between responsiveness and network usage:

```typescript
// Fast updates (more network traffic)
const cursorManager = new CursorManager({
  throttleInterval: 50, // Update every 50ms
});

// Slower updates (less network traffic)
const selectionManager = new SelectionManager({
  throttleInterval: 300, // Update every 300ms
});
```

### Custom Color Palette

Provide a custom color palette for user identification:

```typescript
const userColorManager = new UserColorManager([
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Salmon
  '#98D8C8', // Mint
]);
```

### Stale Cursor/Selection Timeout

Configure how long to keep inactive cursors/selections:

```typescript
const cursorManager = new CursorManager({
  staleTimeout: 10000, // Remove after 10 seconds of inactivity
});
```

## Performance Considerations

### Network Traffic

The system implements throttling to reduce network traffic:
- Cursor updates: Default 100ms throttle (max 10 updates/second)
- Selection updates: Default 150ms throttle (max ~6.7 updates/second)

### Memory Management

- Automatic cleanup of stale cursors/selections
- Event listener cleanup on component unmount
- Efficient Map-based storage for user data

### Rendering Performance

- React.memo for component optimization
- CSS transitions for smooth animations
- Minimal re-renders with targeted state updates

## Troubleshooting

### Cursors Not Appearing

1. Check that `CollaborationEngine` is connected
2. Verify `cursorManager.setCollaborationEngine()` was called
3. Ensure `showCursors={true}` on `CollaborationOverlay`
4. Check browser console for errors

### Selections Not Highlighting

1. Verify `selectionManager.setCollaborationEngine()` was called
2. Ensure `showSelections={true}` on `CollaborationOverlay`
3. Check that selection ranges are valid (start <= end)
4. Verify container ref is properly set

### Laggy Cursor Updates

1. Reduce throttle interval for faster updates
2. Check network latency to WebSocket server
3. Verify no JavaScript errors blocking updates
4. Monitor browser performance

### Colors Not Assigned

1. Check that `UserColorManager` is instantiated
2. Verify `assignColor()` is called for each user
3. Ensure color palette is not empty
4. Check for duplicate user IDs

## Examples

See `cursor-selection-example.tsx` for complete working examples including:
- Basic cursor and selection synchronization
- Advanced usage with user color management
- Custom configuration
- Programmatic control

## Integration with ErixEditor

To integrate with the ErixEditor:

1. Track cursor position from editor events
2. Track selection changes from editor events
3. Convert editor coordinates to line/column format
4. Update managers when cursor/selection changes
5. Render `CollaborationOverlay` over editor content

```typescript
// Example integration
editor.on('cursorChange', (position) => {
  cursorManager.updateCursor({
    line: position.line,
    column: position.column,
  });
});

editor.on('selectionChange', (range) => {
  selectionManager.updateSelection({
    start: range.from,
    end: range.to,
  });
});
```

## Future Enhancements

Potential improvements for future versions:
- Cursor position prediction for smoother movement
- Selection range merging for overlapping selections
- Cursor tooltips with additional user information
- Customizable cursor and selection styles
- Accessibility improvements for screen readers
- Mobile touch gesture support

## License

This code is part of the @ecodrix/erix-react package and follows the same license.
