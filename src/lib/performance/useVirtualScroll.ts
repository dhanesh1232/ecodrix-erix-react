/**
 * React hooks for VirtualScrollManager
 *
 * Provides React integration for virtual scrolling functionality
 *
 * Requirements: 3.2
 */

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import {
  VirtualScrollManager,
  VirtualScrollConfig,
  VisibleRange,
  ScrollPosition,
} from "./VirtualScrollManager";

/**
 * Options for useVirtualScroll hook
 */
export interface UseVirtualScrollOptions {
  /**
   * Total number of blocks/items in the document
   */
  totalBlocks: number;

  /**
   * Virtual scroll configuration
   */
  config?: Partial<VirtualScrollConfig>;

  /**
   * Callback when visible range changes
   */
  onRangeChange?: (range: VisibleRange) => void;

  /**
   * Callback when scroll position changes
   */
  onScroll?: (position: ScrollPosition) => void;
}

/**
 * Return type for useVirtualScroll hook
 */
export interface UseVirtualScrollReturn {
  /**
   * Current visible range
   */
  visibleRange: VisibleRange | null;

  /**
   * Current scroll position
   */
  scrollPosition: ScrollPosition;

  /**
   * Whether virtual scrolling is active
   */
  isActive: boolean;

  /**
   * Scroll to a specific block index
   */
  scrollToBlock: (index: number, behavior?: ScrollBehavior) => void;

  /**
   * Get offset for positioning rendered blocks
   */
  offsetTop: number;

  /**
   * Total height of all blocks
   */
  totalHeight: number;

  /**
   * Statistics about current state
   */
  stats: {
    totalBlocks: number;
    visibleBlocks: number;
    bufferBlocks: number;
    renderPercentage: number;
    isActive: boolean;
  };

  /**
   * The VirtualScrollManager instance
   */
  manager: VirtualScrollManager;
}

/**
 * React hook for virtual scrolling
 *
 * Manages virtual scrolling for large lists/documents by tracking scroll position
 * and calculating visible ranges.
 *
 * Requirements: 3.2
 *
 * @param containerRef - Ref to the scrollable container element
 * @param options - Virtual scroll options
 * @returns Virtual scroll state and methods
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { visibleRange, scrollToBlock, offsetTop, totalHeight } = useVirtualScroll(
 *   containerRef,
 *   {
 *     totalBlocks: 1000,
 *     config: { itemHeight: 24, bufferSize: 5 },
 *   }
 * );
 *
 * return (
 *   <div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetTop}px)` }}>
 *         {visibleRange && blocks.slice(visibleRange.start, visibleRange.end + 1).map((block, i) => (
 *           <div key={visibleRange.start + i}>{block}</div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: UseVirtualScrollOptions,
): UseVirtualScrollReturn {
  const { totalBlocks, config, onRangeChange, onScroll } = options;

  // Create manager instance
  const managerRef = useRef<VirtualScrollManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new VirtualScrollManager(config);
  }

  // State
  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollTop: 0,
    viewportHeight: 0,
    scrollHeight: 0,
    scrollPercentage: 0,
  });
  const [isActive, setIsActive] = useState(false);
  const [offsetTop, setOffsetTop] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);
  const [stats, setStats] = useState({
    totalBlocks: 0,
    visibleBlocks: 0,
    bufferBlocks: 0,
    renderPercentage: 0,
    isActive: false,
  });

  // Update total blocks when it changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setTotalBlocks(totalBlocks);
      setIsActive(managerRef.current.isActive());
      setTotalHeight(managerRef.current.getTotalHeight());
      setStats(managerRef.current.getStats());
    }
  }, [totalBlocks]);

  // Update config when it changes
  useEffect(() => {
    if (managerRef.current && config) {
      managerRef.current.updateConfig(config);
      setIsActive(managerRef.current.isActive());
      setTotalHeight(managerRef.current.getTotalHeight());
    }
  }, [config]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    const manager = managerRef.current;

    if (!container || !manager) return;

    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    manager.updateScrollPosition(scrollTop, viewportHeight, scrollHeight);
  }, [containerRef]);

  // Subscribe to manager events
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    // Subscribe to range changes
    const unsubscribeRange = manager.onRangeChange((range) => {
      setVisibleRange(range);
      setOffsetTop(manager.getOffsetTop());
      setStats(manager.getStats());

      if (onRangeChange) {
        onRangeChange(range);
      }
    });

    // Subscribe to scroll changes
    const unsubscribeScroll = manager.onScroll((position) => {
      setScrollPosition(position);

      if (onScroll) {
        onScroll(position);
      }
    });

    return () => {
      unsubscribeRange();
      unsubscribeScroll();
    };
  }, [onRangeChange, onScroll]);

  // Attach scroll listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    handleScroll();

    // Add scroll listener
    container.addEventListener("scroll", handleScroll, { passive: true });

    // Add resize observer to handle viewport size changes
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef, handleScroll]);

  // Scroll to block function
  const scrollToBlock = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      const manager = managerRef.current;

      if (!container || !manager) return;

      const scrollTop = manager.scrollToBlock(index, behavior);
      container.scrollTo({ top: scrollTop, behavior });
    },
    [containerRef],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  return {
    visibleRange,
    scrollPosition,
    isActive,
    scrollToBlock,
    offsetTop,
    totalHeight,
    stats,
    manager: managerRef.current!,
  };
}

/**
 * Simpler hook for basic virtual scrolling without callbacks
 *
 * Requirements: 3.2
 *
 * @param containerRef - Ref to the scrollable container element
 * @param totalBlocks - Total number of blocks
 * @param itemHeight - Height of each block in pixels
 * @returns Visible range and helper values
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { visibleRange, offsetTop, totalHeight } = useSimpleVirtualScroll(
 *   containerRef,
 *   1000,
 *   24
 * );
 * ```
 */
export function useSimpleVirtualScroll(
  containerRef: RefObject<HTMLElement>,
  totalBlocks: number,
  itemHeight: number = 24,
): {
  visibleRange: VisibleRange | null;
  offsetTop: number;
  totalHeight: number;
  isActive: boolean;
} {
  const { visibleRange, offsetTop, totalHeight, isActive } = useVirtualScroll(
    containerRef,
    {
      totalBlocks,
      config: { itemHeight },
    },
  );

  return { visibleRange, offsetTop, totalHeight, isActive };
}

/**
 * Hook to check if a specific block is visible
 *
 * @param manager - VirtualScrollManager instance
 * @param blockIndex - Index of the block to check
 * @returns True if the block is visible
 */
export function useIsBlockVisible(
  manager: VirtualScrollManager | null,
  blockIndex: number,
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!manager) {
      setIsVisible(false);
      return;
    }

    // Initial check
    setIsVisible(manager.isBlockVisible(blockIndex));

    // Subscribe to range changes
    const unsubscribe = manager.onRangeChange(() => {
      setIsVisible(manager.isBlockVisible(blockIndex));
    });

    return unsubscribe;
  }, [manager, blockIndex]);

  return isVisible;
}

/**
 * Hook to get virtual scroll statistics
 *
 * @param manager - VirtualScrollManager instance
 * @returns Statistics object
 */
export function useVirtualScrollStats(manager: VirtualScrollManager | null): {
  totalBlocks: number;
  visibleBlocks: number;
  bufferBlocks: number;
  renderPercentage: number;
  isActive: boolean;
} {
  const [stats, setStats] = useState({
    totalBlocks: 0,
    visibleBlocks: 0,
    bufferBlocks: 0,
    renderPercentage: 0,
    isActive: false,
  });

  useEffect(() => {
    if (!manager) {
      setStats({
        totalBlocks: 0,
        visibleBlocks: 0,
        bufferBlocks: 0,
        renderPercentage: 0,
        isActive: false,
      });
      return;
    }

    // Initial stats
    setStats(manager.getStats());

    // Subscribe to range changes
    const unsubscribe = manager.onRangeChange(() => {
      setStats(manager.getStats());
    });

    return unsubscribe;
  }, [manager]);

  return stats;
}
