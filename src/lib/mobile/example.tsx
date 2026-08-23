/**
 * Example usage of Mobile Detection utilities
 *
 * This file demonstrates how to use the mobile detection and optimization
 * features in real-world scenarios.
 */

import React, { useRef, useEffect } from "react";
import { useMobileDetection, useIsMobile } from "./useMobileDetection";

/**
 * Example 1: Simple mobile detection
 */
export function SimpleMobileExample() {
  const isMobile = useIsMobile();

  return (
    <div>
      <h2>Current Device</h2>
      <p>You are on a {isMobile ? "mobile" : "desktop"} device</p>
    </div>
  );
}

/**
 * Example 2: Responsive toolbar with touch optimizations
 */
export function ResponsiveToolbar() {
  const { isMobile, applyTouchOptimizations } = useMobileDetection();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Apply touch optimizations to all buttons
    buttonRefs.current.forEach((button) => {
      if (button) {
        applyTouchOptimizations(button);
      }
    });
  }, [applyTouchOptimizations]);

  const buttons = ["Bold", "Italic", "Underline", "Link"];

  return (
    <div
      className={`toolbar ${isMobile ? "toolbar-mobile" : "toolbar-desktop"}`}
    >
      {buttons.map((label, index) => (
        <button
          key={label}
          ref={(el) => {
            buttonRefs.current[index] = el as HTMLButtonElement;
          }}
          className="toolbar-button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Example 3: Mobile menu with bottom sheet
 */
export function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isMobile, enableBottomSheet } = useMobileDetection();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && isMobile && menuRef.current) {
      enableBottomSheet(menuRef.current);
    }
  }, [isOpen, isMobile, enableBottomSheet]);

  if (!isOpen) return null;

  return (
    <>
      <div className="menu-overlay" onClick={onClose} />
      <div ref={menuRef} className="menu">
        <h3>Menu</h3>
        <ul>
          <li>Option 1</li>
          <li>Option 2</li>
          <li>Option 3</li>
        </ul>
      </div>
    </>
  );
}

/**
 * Example 4: Touch target validation
 */
export function ValidatedButton({ children }: { children: React.ReactNode }) {
  const { validateTouchTarget, getTouchTargetValidation } =
    useMobileDetection();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isValid, setIsValid] = React.useState(true);

  useEffect(() => {
    if (buttonRef.current) {
      const validation = getTouchTargetValidation(buttonRef.current);
      setIsValid(validation.valid);

      if (!validation.valid) {
        console.warn(
          `Button too small: ${validation.width}x${validation.height}px ` +
            `(minimum: ${validation.minSize}px)`,
        );
      }
    }
  }, [getTouchTargetValidation]);

  return (
    <button
      ref={buttonRef}
      className={isValid ? "button-valid" : "button-invalid"}
      title={isValid ? "Touch target size OK" : "Touch target too small"}
    >
      {children}
    </button>
  );
}

/**
 * Example 5: Haptic feedback on interaction
 */
export function HapticButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { triggerHaptic } = useMobileDetection();

  const handleClick = () => {
    triggerHaptic("medium");
    onClick();
  };

  return <button onClick={handleClick}>{children}</button>;
}

/**
 * Example 6: Prevent viewport zoom on input
 */
export function MobileInput({ placeholder }: { placeholder?: string }) {
  const { preventViewportZoom } = useMobileDetection();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      preventViewportZoom(inputRef.current);
    }
  }, [preventViewportZoom]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="mobile-input"
    />
  );
}

/**
 * Example 7: Adaptive menu positioning
 */
export function AdaptivePopover({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { adjustMenuPosition } = useMobileDetection();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      adjustMenuPosition(menuRef.current, triggerRef.current, "auto");
    }
  }, [isOpen, adjustMenuPosition]);

  return (
    <div className="popover">
      <button ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </button>
      {isOpen && (
        <div ref={menuRef} className="popover-menu">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Example 8: Viewport size tracking
 */
export function ViewportInfo() {
  const { viewportWidth, viewportHeight, isMobile, isTouchDevice } =
    useMobileDetection();

  return (
    <div className="viewport-info">
      <h3>Viewport Information</h3>
      <dl>
        <dt>Width:</dt>
        <dd>{viewportWidth}px</dd>

        <dt>Height:</dt>
        <dd>{viewportHeight}px</dd>

        <dt>Device Type:</dt>
        <dd>{isMobile ? "Mobile" : "Desktop"}</dd>

        <dt>Touch Support:</dt>
        <dd>{isTouchDevice ? "Yes" : "No"}</dd>
      </dl>
    </div>
  );
}

/**
 * Example 9: Complete responsive editor toolbar
 */
export function EditorToolbar() {
  const { isMobile, isTouchDevice, applyTouchOptimizations, triggerHaptic } =
    useMobileDetection();

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current && isTouchDevice) {
      applyTouchOptimizations(buttonRef.current);
    }
  }, [isTouchDevice, applyTouchOptimizations]);

  const handleFormat = (format: string) => {
    if (isTouchDevice) {
      triggerHaptic("light");
    }
    console.log(`Applying format: ${format}`);
  };

  return (
    <div className={`editor-toolbar ${isMobile ? "compact" : "full"}`}>
      <div className="toolbar-group">
        <button
          ref={buttonRef}
          onClick={() => handleFormat("bold")}
          className="toolbar-btn"
        >
          <strong>B</strong>
        </button>
        <button onClick={() => handleFormat("italic")} className="toolbar-btn">
          <em>I</em>
        </button>
        <button
          onClick={() => handleFormat("underline")}
          className="toolbar-btn"
        >
          <u>U</u>
        </button>
      </div>

      {!isMobile && (
        <div className="toolbar-group">
          <button className="toolbar-btn">Link</button>
          <button className="toolbar-btn">Image</button>
          <button className="toolbar-btn">Code</button>
        </div>
      )}
    </div>
  );
}
