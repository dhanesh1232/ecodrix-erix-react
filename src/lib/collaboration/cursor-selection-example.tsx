/**
 * Cursor and Selection Synchronization Example
 * 
 * This example demonstrates how to use the cursor and selection synchronization
 * features for real-time collaboration in the ErixEditor.
 * 
 * Requirements: 4.1, 4.2
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CollaborationEngine,
  CursorManager,
  SelectionManager,
  UserColorManager,
  CollaborationOverlay,
} from './index';
import type { CursorPosition, SelectionRange } from './index';

/**
 * Example: Basic Cursor and Selection Synchronization
 * 
 * This example shows how to set up cursor and selection tracking
 * for a collaborative editing session.
 */
export const BasicCursorSelectionExample: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [collaboration] = useState(() => new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-123',
    userName: 'John Doe',
    userColor: '#3b82f6',
  }));
  const [cursorManager] = useState(() => new CursorManager({
    throttleInterval: 100, // Update every 100ms
    enabled: true,
  }));
  const [selectionManager] = useState(() => new SelectionManager({
    throttleInterval: 150, // Update every 150ms
    enabled: true,
  }));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect managers to collaboration engine
    cursorManager.setCollaborationEngine(collaboration);
    selectionManager.setCollaborationEngine(collaboration);

    // Connect to document
    const connectToDocument = async () => {
      try {
        await collaboration.connect('document-456');
        setIsConnected(true);
        console.log('Connected to collaboration session');
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    connectToDocument();

    // Cleanup
    return () => {
      collaboration.disconnect();
      cursorManager.destroy();
      selectionManager.destroy();
    };
  }, [collaboration, cursorManager, selectionManager]);

  // Track local cursor position
  const handleCursorChange = (position: CursorPosition) => {
    cursorManager.updateCursor(position);
  };

  // Track local selection
  const handleSelectionChange = (range: SelectionRange) => {
    selectionManager.updateSelection(range);
  };

  // Simulate cursor movement (in real app, this would come from editor events)
  const simulateCursorMove = () => {
    const position: CursorPosition = {
      line: Math.floor(Math.random() * 20),
      column: Math.floor(Math.random() * 80),
    };
    handleCursorChange(position);
  };

  // Simulate selection (in real app, this would come from editor events)
  const simulateSelection = () => {
    const start = Math.floor(Math.random() * 1000);
    const end = start + Math.floor(Math.random() * 100);
    const range: SelectionRange = { start, end };
    handleSelectionChange(range);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div
        ref={editorRef}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '14px',
          position: 'relative',
        }}
      >
        {/* Editor content would go here */}
        <p>Collaborative Editor</p>
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        
        <button onClick={simulateCursorMove}>Simulate Cursor Move</button>
        <button onClick={simulateSelection}>Simulate Selection</button>

        {/* Collaboration overlay for rendering remote cursors and selections */}
        {isConnected && (
          <CollaborationOverlay
            cursorManager={cursorManager}
            selectionManager={selectionManager}
            containerRef={editorRef}
            showCursorLabels={true}
            selectionOpacity={0.2}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Example: Advanced Cursor and Selection with User Colors
 * 
 * This example shows how to use the UserColorManager to assign
 * colors to users automatically.
 */
export const AdvancedCursorSelectionExample: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [userColorManager] = useState(() => new UserColorManager());
  const [collaboration] = useState(() => {
    // Assign color to current user
    const userColor = userColorManager.assignColor('user-123');
    
    return new CollaborationEngine({
      websocketUrl: 'wss://api.example.com/collaboration',
      apiKey: 'your-api-key',
      userId: 'user-123',
      userName: 'John Doe',
      userColor,
    });
  });
  const [cursorManager] = useState(() => new CursorManager());
  const [selectionManager] = useState(() => new SelectionManager());
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  useEffect(() => {
    // Connect managers
    cursorManager.setCollaborationEngine(collaboration);
    selectionManager.setCollaborationEngine(collaboration);

    // Listen for user events to assign colors
    collaboration.on('user-joined', (user: any) => {
      userColorManager.assignColor(user.id);
      setActiveUsers(collaboration.getActiveUsers().map(u => u.name));
    });

    collaboration.on('user-left', (user: any) => {
      userColorManager.releaseColor(user.id);
      setActiveUsers(collaboration.getActiveUsers().map(u => u.name));
    });

    // Connect
    collaboration.connect('document-456').catch(console.error);

    return () => {
      collaboration.disconnect();
      cursorManager.destroy();
      selectionManager.destroy();
      userColorManager.clear();
    };
  }, [collaboration, cursorManager, selectionManager, userColorManager]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h3>Active Users:</h3>
        <ul>
          {activeUsers.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>

      <div
        ref={editorRef}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          padding: '10px',
          position: 'relative',
        }}
      >
        <CollaborationOverlay
          cursorManager={cursorManager}
          selectionManager={selectionManager}
          containerRef={editorRef}
          showCursorLabels={true}
          selectionOpacity={0.25}
          cursorAnimationDuration={200}
          selectionAnimationDuration={200}
        />
      </div>
    </div>
  );
};

/**
 * Example: Custom Configuration
 * 
 * This example shows how to customize cursor and selection behavior.
 */
export const CustomConfigExample: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Custom cursor manager with faster updates
  const [cursorManager] = useState(() => new CursorManager({
    throttleInterval: 50, // Update every 50ms for smoother cursor
    enabled: true,
    staleTimeout: 10000, // Remove stale cursors after 10 seconds
  }));

  // Custom selection manager with slower updates
  const [selectionManager] = useState(() => new SelectionManager({
    throttleInterval: 200, // Update every 200ms to reduce bandwidth
    enabled: true,
    staleTimeout: 15000,
  }));

  // Custom color palette
  const [userColorManager] = useState(() => new UserColorManager([
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
  ]));

  const [collaboration] = useState(() => {
    const userColor = userColorManager.assignColor('user-123');
    return new CollaborationEngine({
      websocketUrl: 'wss://api.example.com/collaboration',
      apiKey: 'your-api-key',
      userId: 'user-123',
      userName: 'John Doe',
      userColor,
    });
  });

  useEffect(() => {
    cursorManager.setCollaborationEngine(collaboration);
    selectionManager.setCollaborationEngine(collaboration);
    collaboration.connect('document-456').catch(console.error);

    return () => {
      collaboration.disconnect();
      cursorManager.destroy();
      selectionManager.destroy();
    };
  }, [collaboration, cursorManager, selectionManager]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div
        ref={editorRef}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          padding: '10px',
          position: 'relative',
        }}
      >
        <CollaborationOverlay
          cursorManager={cursorManager}
          selectionManager={selectionManager}
          containerRef={editorRef}
          showCursorLabels={true}
          selectionOpacity={0.3}
          cursorAnimationDuration={100}
          selectionAnimationDuration={150}
        />
      </div>
    </div>
  );
};

/**
 * Example: Programmatic Control
 * 
 * This example shows how to programmatically control cursor and selection display.
 */
export const ProgrammaticControlExample: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [cursorManager] = useState(() => new CursorManager());
  const [selectionManager] = useState(() => new SelectionManager());
  const [collaboration] = useState(() => new CollaborationEngine({
    websocketUrl: 'wss://api.example.com/collaboration',
    apiKey: 'your-api-key',
    userId: 'user-123',
    userName: 'John Doe',
    userColor: '#3b82f6',
  }));

  const [showCursors, setShowCursors] = useState(true);
  const [showSelections, setShowSelections] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    cursorManager.setCollaborationEngine(collaboration);
    selectionManager.setCollaborationEngine(collaboration);
    collaboration.connect('document-456').catch(console.error);

    return () => {
      collaboration.disconnect();
      cursorManager.destroy();
      selectionManager.destroy();
    };
  }, [collaboration, cursorManager, selectionManager]);

  const toggleCursors = () => {
    const newState = !showCursors;
    setShowCursors(newState);
    cursorManager.setEnabled(newState);
  };

  const toggleSelections = () => {
    const newState = !showSelections;
    setShowSelections(newState);
    selectionManager.setEnabled(newState);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={toggleCursors}>
          {showCursors ? 'Hide' : 'Show'} Cursors
        </button>
        <button onClick={toggleSelections}>
          {showSelections ? 'Hide' : 'Show'} Selections
        </button>
        <button onClick={() => setShowLabels(!showLabels)}>
          {showLabels ? 'Hide' : 'Show'} Labels
        </button>
      </div>

      <div
        ref={editorRef}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          padding: '10px',
          position: 'relative',
        }}
      >
        <CollaborationOverlay
          cursorManager={cursorManager}
          selectionManager={selectionManager}
          containerRef={editorRef}
          showCursors={showCursors}
          showSelections={showSelections}
          showCursorLabels={showLabels}
        />
      </div>
    </div>
  );
};

/**
 * Default export with all examples
 */
export default {
  BasicCursorSelectionExample,
  AdvancedCursorSelectionExample,
  CustomConfigExample,
  ProgrammaticControlExample,
};
