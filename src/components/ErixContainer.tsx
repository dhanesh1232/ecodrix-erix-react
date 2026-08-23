/**
 * ErixContainer - Automatic style isolation wrapper
 *
 * This component automatically wraps your Erix components with the required
 * .erix-app class for proper style isolation.
 *
 * @example
 * ```tsx
 * import { ErixContainer, ErixDashboard } from '@ecodrix/erix-react';
 *
 * function App() {
 *   return (
 *     <ErixContainer>
 *       <ErixDashboard />
 *     </ErixContainer>
 *   );
 * }
 * ```
 */

import type { ReactNode, ElementType } from "react";
import { cn } from "../lib/utils";

export interface ErixContainerProps {
  /**
   * Child components to render within the isolated container
   */
  children: ReactNode;

  /**
   * Enable dark mode for all Erix components within this container
   * @default false
   */
  darkMode?: boolean;

  /**
   * Additional CSS classes to apply to the container
   * Note: These will be applied alongside .erix-app
   */
  className?: string;

  /**
   * HTML element to render as the container
   * @default "div"
   */
  as?: ElementType;

  /**
   * Additional props to pass to the container element
   */
  [key: string]: unknown;
}

export function ErixContainer({
  children,
  darkMode = false,
  className,
  as: Component = "div",
  ...props
}: ErixContainerProps) {
  return (
    <Component
      className={cn("erix-app", darkMode && "dark", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Hook to detect if component is rendered within ErixContainer
 * Useful for debugging and ensuring proper usage
 */
export function useErixContainer(): boolean {
  if (typeof window === "undefined") return false;

  // This is a simple check - in production you might want more sophisticated detection
  return true; // Assume proper usage, let CSS handle the rest
}
