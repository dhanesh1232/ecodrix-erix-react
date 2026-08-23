/**
 * Accessibility Module Examples
 * 
 * This file demonstrates how to use the accessibility features
 * in the ErixEditor package.
 */

import React, { useState } from 'react';
import {
  useAccessibility,
  getAccessibilityManager,
  getKeyboardNavigationHandler,
  getFocusManager,
} from './index';

/**
 * Example 1: Basic Toolbar with ARIA Labels
 */
export function AccessibleToolbar() {
  const { ref, announceFormatting } = useAccessibility({
    applyAriaLabels: true,
  });

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const toggleBold = () => {
    setIsBold(!isBold);
    announceFormatting('bold', !isBold);
  };

  const toggleItalic = () => {
    setIsItalic(!isItalic);
    announceFormatting('italic', !isItalic);
  };

  return (
    <div ref={ref} role="toolbar" aria-label="Text formatting toolbar">
      <button
        onClick={toggleBold}
        aria-pressed={isBold}
        aria-label="Bold"
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={toggleItalic}
        aria-pressed={isItalic}
        aria-label="Italic"
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
    </div>
  );
}

/**
 * Example 2: Modal Dialog with Focus Trap
 */
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { ref, restoreFocus, announce } = useAccessibility({
    enableFocusTrap: isOpen,
  });

  const handleClose = () => {
    announce('Dialog closed', 'polite');
    onClose();
    restoreFocus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={ref} className="modal-content">
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Editor with Keyboard Shortcuts
 */
export function AccessibleEditor() {
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  const { announce, registerShortcut } = useAccessibility({
    shortcuts: [
      {
        key: 'b',
        modifiers: ['ctrl'],
        action: () => {
          applyFormatting('bold');
        },
        description: 'Format: Bold',
      },
      {
        key: 'i',
        modifiers: ['ctrl'],
        action: () => {
          applyFormatting('italic');
        },
        description: 'Format: Italic',
      },
      {
        key: 's',
        modifiers: ['ctrl'],
        action: (e) => {
          e.preventDefault();
          saveContent();
        },
        description: 'Save document',
      },
      {
        key: 'k',
        modifiers: ['ctrl'],
        action: () => {
          openCommandPalette();
        },
        description: 'Open command palette',
      },
    ],
  });

  const applyFormatting = (format: string) => {
    // Apply formatting logic here
    announce(`${format} applied`, 'polite');
  };

  const saveContent = () => {
    // Save logic here
    setIsSaved(true);
    announce('Document saved', 'polite');
  };

  const openCommandPalette = () => {
    // Open command palette logic
    announce('Command palette opened', 'polite');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  return (
    <div className="editor-container">
      <div className="editor-status" role="status" aria-live="polite">
        {isSaved ? 'All changes saved' : 'Unsaved changes'}
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        aria-label="Document content"
        placeholder="Start typing..."
      />
    </div>
  );
}

/**
 * Example 4: Dropdown Menu with Keyboard Navigation
 */
export function AccessibleDropdown({
  label,
  items,
}: {
  label: string;
  items: Array<{ label: string; action: () => void }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, trapFocus, restoreFocus, announce } = useAccessibility();

  const handleOpen = () => {
    setIsOpen(true);
    announce(`${label} menu opened`, 'polite');
    // Trap focus when menu opens
    setTimeout(() => {
      if (ref.current) {
        trapFocus();
      }
    }, 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    announce(`${label} menu closed`, 'polite');
    restoreFocus();
  };

  const handleItemClick = (item: { label: string; action: () => void }) => {
    item.action();
    announce(`${item.label} selected`, 'polite');
    handleClose();
  };

  return (
    <div className="dropdown">
      <button
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={label}
      >
        {label}
      </button>
      {isOpen && (
        <div
          ref={ref}
          role="menu"
          aria-label={`${label} menu`}
          className="dropdown-menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose();
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Form with Validation and Error Announcements
 */
export function AccessibleForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { announceError, announce } = useAccessibility();

  const validateEmail = (value: string) => {
    if (!value) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    
    if (validationError) {
      setError(validationError);
      announceError(validationError);
    } else {
      setError('');
      announce('Form submitted successfully', 'polite');
      // Submit form logic
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        {error && (
          <div id="email-error" role="alert" className="error-message">
            {error}
          </div>
        )}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Example 6: High Contrast Mode Toggle
 */
export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const { announce } = useAccessibility();

  const toggleHighContrast = () => {
    const manager = getAccessibilityManager();
    const newValue = !isHighContrast;
    
    manager.setHighContrastMode(newValue);
    setIsHighContrast(newValue);
    
    announce(
      `High contrast mode ${newValue ? 'enabled' : 'disabled'}`,
      'polite'
    );
  };

  return (
    <button
      onClick={toggleHighContrast}
      aria-pressed={isHighContrast}
      aria-label="Toggle high contrast mode"
    >
      {isHighContrast ? 'Disable' : 'Enable'} High Contrast
    </button>
  );
}

/**
 * Example 7: Keyboard Shortcuts Reference Panel
 */
export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const handler = getKeyboardNavigationHandler();
  const shortcuts = handler.getShortcutsByCategory();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="View keyboard shortcuts"
      >
        Keyboard Shortcuts (Ctrl+/)
      </button>
      {isOpen && (
        <AccessibleModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Keyboard Shortcuts"
        >
          <div className="shortcuts-list">
            {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="shortcuts-category">
                <h3>{category}</h3>
                <ul>
                  {categoryShortcuts.map((shortcut, index) => (
                    <li key={index}>
                      <span className="shortcut-description">
                        {shortcut.description}
                      </span>
                      <kbd className="shortcut-keys">
                        {handler.formatShortcut(shortcut)}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AccessibleModal>
      )}
    </>
  );
}

/**
 * Example 8: Complete Accessible Editor Component
 */
export function CompleteAccessibleEditor() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className="editor-app">
      <header>
        <h1>Accessible Editor</h1>
        <div className="header-controls">
          <HighContrastToggle />
          <button onClick={() => setShowShortcuts(true)}>
            Keyboard Shortcuts
          </button>
        </div>
      </header>

      <main>
        <AccessibleToolbar />
        <AccessibleEditor />
      </main>

      <footer>
        <button onClick={() => setIsModalOpen(true)}>
          Open Settings
        </button>
      </footer>

      <AccessibleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editor Settings"
      >
        <AccessibleForm />
      </AccessibleModal>

      {showShortcuts && (
        <KeyboardShortcutsPanel />
      )}
    </div>
  );
}

/**
 * Example 9: Using Accessibility Manager Directly
 */
export function DirectAccessibilityManagerExample() {
  const manager = getAccessibilityManager({
    announceChanges: true,
    keyboardShortcuts: true,
    focusManagement: true,
    highContrastMode: false,
  });

  const handleAction = () => {
    // Announce action to screen readers
    manager.announceToScreenReader('Action completed', 'polite');
  };

  const handleError = () => {
    // Announce error with assertive priority
    manager.announceError('An error occurred');
  };

  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      <button onClick={handleError}>Trigger Error</button>
    </div>
  );
}

/**
 * Example 10: Focus Management
 */
export function FocusManagementExample() {
  const focusManager = getFocusManager();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTrapFocus = () => {
    if (containerRef.current) {
      const cleanup = focusManager.trapFocus(containerRef.current);
      // Store cleanup function to call later
      (containerRef.current as any)._focusCleanup = cleanup;
    }
  };

  const handleReleaseFocus = () => {
    if (containerRef.current && (containerRef.current as any)._focusCleanup) {
      (containerRef.current as any)._focusCleanup();
      focusManager.restoreFocus();
    }
  };

  return (
    <div>
      <button onClick={handleTrapFocus}>Trap Focus</button>
      <div ref={containerRef} className="focus-container">
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      </div>
      <button onClick={handleReleaseFocus}>Release Focus</button>
    </div>
  );
}
