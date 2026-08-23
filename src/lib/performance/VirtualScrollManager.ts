/**
 * VirtualScrollManager
 * 
 * Implements virtual scrolling for large documents to maintain performance
 * by rendering only visible content plus buffer zones.
 * 
 * Key features:
 * - Calculates visible range based on viewport and scroll position
 * - Renders only visible blocks plus buffer zones
 * - Tracks scroll position dynamically
 * - Optimizes for documents with 10,000+ words
 * 
 * Requirements: 3.2
 */

export interface VirtualScrollConfig {
  /**
   * Height of each block/item in pixels
   * Used for calculating visible range
   */
  itemHeight: number;
  
  /**
   * Number of items to render above and below visible area
   * Provides smooth scrolling without blank spaces
   */
  bufferSize: number;
  
  /**
   * Number of blocks before enabling virtual scrolling
   * Below this threshold, render all blocks normally
   */
  threshold: number;
  
  /**
   * Whether virtual scrolling is enabled
   */
  enabled: boolean;
}

/**
 * Default configuration for VirtualScrollManager
 */
const DEFAULT_CONFIG: VirtualScrollConfig = {
  itemHeight: 24, // Approximate line height in pixels
  bufferSize: 5, // Render 5 extra blocks above and below
  threshold: 100, // Enable for documents with 100+ blocks
  enabled: true,
};

/**
 * Represents the visible range of blocks
 */
export interface VisibleRange {
  /**
   * Index of first visible block (including buffer)
   */
  start: number;
  
  /**
   * Index of last visible block (including buffer)
   */
  end: number;
  
  /**
   * Index of first visible block (without buffer)
   */
  visibleStart: number;
  
  /**
   * Index of last visible block (without buffer)
   */
  visibleEnd: number;
  
  /**
   * Total number of blocks in the document
   */
  total: number;
}

/**
 * Scroll position information
 */
export interface ScrollPosition {
  /**
   * Current scroll top position in pixels
   */
  scrollTop: number;
  
  /**
   * Viewport height in pixels
   */
  viewportHeight: number;
  
  /**
   * Total scrollable height in pixels
   */
  scrollHeight: number;
  
  /**
   * Scroll percentage (0-1)
   */
  scrollPercentage: number;
}

/**
 * Callback types for virtual scroll events
 */
export type ScrollCallback = (position: ScrollPosition) => void;
export type RangeChangeCallback = (range: VisibleRange) => void;

/**
 * VirtualScrollManager class
 * 
 * Manages virtual scrolling for large documents by calculating visible ranges
 * and optimizing block rendering based on scroll position.
 * 
 * Requirements: 3.2 - Handle documents with 10,000+ words without performance degradation
 */
export class VirtualScrollManager {
  private config: VirtualScrollConfig;
  private totalBlocks: number = 0;
  private currentRange: VisibleRange | null = null;
  private scrollPosition: ScrollPosition = {
    scrollTop: 0,
    viewportHeight: 0,
    scrollHeight: 0,
    scrollPercentage: 0,
  };
  
  // Callbacks
  private scrollCallbacks: Set<ScrollCallback> = new Set();
  private rangeChangeCallbacks: Set<RangeChangeCallback> = new Set();
  
  // RAF for smooth updates
  private rafId: number | null = null;
  private pendingUpdate: boolean = false;

  constructor(config: Partial<VirtualScrollConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enable virtual scrolling
   * Requirements: 3.2
   */
  enable(): void {
    this.config.enabled = true;
    this.recalculateRange();
  }

  /**
   * Disable virtual scrolling
   * Requirements: 3.2
   */
  disable(): void {
    this.config.enabled = false;
    this.currentRange = null;
    
    // Cancel any pending RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Check if virtual scrolling should be active
   * Requirements: 3.2
   * 
   * @returns True if virtual scrolling should be active
   */
  isActive(): boolean {
    return this.config.enabled && this.totalBlocks >= this.config.threshold;
  }

  /**
   * Update the total number of blocks in the document
   * Requirements: 3.2
   * 
   * @param total - Total number of blocks
   */
  setTotalBlocks(total: number): void {
    this.totalBlocks = total;
    this.recalculateRange();
  }

  /**
   * Get the total number of blocks
   * 
   * @returns Total number of blocks
   */
  getTotalBlocks(): number {
    return this.totalBlocks;
  }

  /**
   * Update scroll position and recalculate visible range
   * Requirements: 3.2
   * 
   * @param scrollTop - Current scroll top position in pixels
   * @param viewportHeight - Viewport height in pixels
   * @param scrollHeight - Total scrollable height in pixels
   */
  updateScrollPosition(
    scrollTop: number,
    viewportHeight: number,
    scrollHeight: number
  ): void {
    // Update scroll position
    this.scrollPosition = {
      scrollTop,
      viewportHeight,
      scrollHeight,
      scrollPercentage: scrollHeight > 0 ? scrollTop / (scrollHeight - viewportHeight) : 0,
    };

    // Notify scroll callbacks
    this.notifyScrollCallbacks();

    // Schedule range recalculation using RAF for smooth updates
    this.scheduleRangeUpdate();
  }

  /**
   * Schedule a range update using requestAnimationFrame
   * Requirements: 3.2
   */
  private scheduleRangeUpdate(): void {
    if (this.pendingUpdate) return;

    this.pendingUpdate = true;
    this.rafId = requestAnimationFrame(() => {
      this.pendingUpdate = false;
      this.rafId = null;
      this.recalculateRange();
    });
  }

  /**
   * Calculate the visible range based on current scroll position
   * Requirements: 3.2
   * 
   * @returns The calculated visible range
   */
  private calculateVisibleRange(): VisibleRange {
    const { scrollTop, viewportHeight } = this.scrollPosition;
    const { itemHeight, bufferSize } = this.config;

    // Calculate visible block indices (without buffer)
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + viewportHeight) / itemHeight);

    // Add buffer zones above and below
    const start = Math.max(0, visibleStart - bufferSize);
    const end = Math.min(this.totalBlocks - 1, visibleEnd + bufferSize);

    return {
      start,
      end,
      visibleStart: Math.max(0, visibleStart),
      visibleEnd: Math.min(this.totalBlocks - 1, visibleEnd),
      total: this.totalBlocks,
    };
  }

  /**
   * Recalculate the visible range and notify callbacks if changed
   * Requirements: 3.2
   */
  private recalculateRange(): void {
    if (!this.isActive()) {
      // If virtual scrolling is not active, render all blocks
      const allRange: VisibleRange = {
        start: 0,
        end: this.totalBlocks - 1,
        visibleStart: 0,
        visibleEnd: this.totalBlocks - 1,
        total: this.totalBlocks,
      };
      
      if (!this.rangesEqual(this.currentRange, allRange)) {
        this.currentRange = allRange;
        this.notifyRangeChangeCallbacks();
      }
      return;
    }

    const newRange = this.calculateVisibleRange();

    // Only notify if range has changed
    if (!this.rangesEqual(this.currentRange, newRange)) {
      this.currentRange = newRange;
      this.notifyRangeChangeCallbacks();
    }
  }

  /**
   * Check if two ranges are equal
   * 
   * @param range1 - First range
   * @param range2 - Second range
   * @returns True if ranges are equal
   */
  private rangesEqual(range1: VisibleRange | null, range2: VisibleRange): boolean {
    if (!range1) return false;
    return (
      range1.start === range2.start &&
      range1.end === range2.end &&
      range1.total === range2.total
    );
  }

  /**
   * Get the current visible range
   * Requirements: 3.2
   * 
   * @returns Current visible range or null if not calculated yet
   */
  getVisibleRange(): VisibleRange | null {
    return this.currentRange ? { ...this.currentRange } : null;
  }

  /**
   * Scroll to a specific block index
   * Requirements: 3.2
   * 
   * @param index - Block index to scroll to
   * @param behavior - Scroll behavior ('auto' | 'smooth')
   * @returns The calculated scroll position
   */
  scrollToBlock(index: number, behavior: ScrollBehavior = 'smooth'): number {
    if (index < 0 || index >= this.totalBlocks) {
      console.warn(`VirtualScrollManager: Invalid block index ${index}`);
      return this.scrollPosition.scrollTop;
    }

    const scrollTop = index * this.config.itemHeight;
    
    // Return the calculated position
    // The actual scrolling should be handled by the consumer
    return scrollTop;
  }

  /**
   * Get the current scroll position
   * 
   * @returns Current scroll position
   */
  getScrollPosition(): ScrollPosition {
    return { ...this.scrollPosition };
  }

  /**
   * Calculate the offset for the visible range
   * This is used to position the rendered blocks correctly
   * Requirements: 3.2
   * 
   * @returns Offset in pixels from the top
   */
  getOffsetTop(): number {
    if (!this.currentRange) return 0;
    return this.currentRange.start * this.config.itemHeight;
  }

  /**
   * Calculate the total height of all blocks
   * Requirements: 3.2
   * 
   * @returns Total height in pixels
   */
  getTotalHeight(): number {
    return this.totalBlocks * this.config.itemHeight;
  }

  /**
   * Calculate the height of the visible range
   * 
   * @returns Height in pixels
   */
  getVisibleHeight(): number {
    if (!this.currentRange) return 0;
    const blockCount = this.currentRange.end - this.currentRange.start + 1;
    return blockCount * this.config.itemHeight;
  }

  /**
   * Register a callback for scroll position changes
   * 
   * @param callback - Function to call when scroll position changes
   * @returns Unsubscribe function
   */
  onScroll(callback: ScrollCallback): () => void {
    this.scrollCallbacks.add(callback);
    return () => {
      this.scrollCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for visible range changes
   * 
   * @param callback - Function to call when visible range changes
   * @returns Unsubscribe function
   */
  onRangeChange(callback: RangeChangeCallback): () => void {
    this.rangeChangeCallbacks.add(callback);
    return () => {
      this.rangeChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify all scroll callbacks
   */
  private notifyScrollCallbacks(): void {
    this.scrollCallbacks.forEach(callback => {
      try {
        callback(this.scrollPosition);
      } catch (error) {
        console.error('VirtualScrollManager: Error in scroll callback', error);
      }
    });
  }

  /**
   * Notify all range change callbacks
   */
  private notifyRangeChangeCallbacks(): void {
    if (!this.currentRange) return;
    
    this.rangeChangeCallbacks.forEach(callback => {
      try {
        callback(this.currentRange!);
      } catch (error) {
        console.error('VirtualScrollManager: Error in range change callback', error);
      }
    });
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<VirtualScrollConfig>): void {
    const oldThreshold = this.config.threshold;
    const oldEnabled = this.config.enabled;
    
    this.config = { ...this.config, ...config };
    
    // Recalculate if threshold or enabled state changed
    if (
      oldThreshold !== this.config.threshold ||
      oldEnabled !== this.config.enabled
    ) {
      this.recalculateRange();
    }
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): VirtualScrollConfig {
    return { ...this.config };
  }

  /**
   * Check if a block index is currently visible
   * 
   * @param index - Block index to check
   * @returns True if the block is in the visible range
   */
  isBlockVisible(index: number): boolean {
    if (!this.currentRange) return false;
    return index >= this.currentRange.start && index <= this.currentRange.end;
  }

  /**
   * Check if a block index is in the actual viewport (without buffer)
   * 
   * @param index - Block index to check
   * @returns True if the block is in the viewport
   */
  isBlockInViewport(index: number): boolean {
    if (!this.currentRange) return false;
    return (
      index >= this.currentRange.visibleStart &&
      index <= this.currentRange.visibleEnd
    );
  }

  /**
   * Get statistics about the current state
   * 
   * @returns Statistics object
   */
  getStats(): {
    totalBlocks: number;
    visibleBlocks: number;
    bufferBlocks: number;
    renderPercentage: number;
    isActive: boolean;
  } {
    const visibleBlocks = this.currentRange
      ? this.currentRange.end - this.currentRange.start + 1
      : this.totalBlocks;
    
    const bufferBlocks = this.currentRange
      ? (this.currentRange.start - this.currentRange.visibleStart) +
        (this.currentRange.visibleEnd - this.currentRange.end)
      : 0;

    return {
      totalBlocks: this.totalBlocks,
      visibleBlocks,
      bufferBlocks,
      renderPercentage: this.totalBlocks > 0
        ? (visibleBlocks / this.totalBlocks) * 100
        : 0,
      isActive: this.isActive(),
    };
  }

  /**
   * Reset the virtual scroll manager to initial state
   */
  reset(): void {
    this.totalBlocks = 0;
    this.currentRange = null;
    this.scrollPosition = {
      scrollTop: 0,
      viewportHeight: 0,
      scrollHeight: 0,
      scrollPercentage: 0,
    };
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.pendingUpdate = false;
  }

  /**
   * Destroy the virtual scroll manager and clean up resources
   */
  destroy(): void {
    this.disable();
    this.scrollCallbacks.clear();
    this.rangeChangeCallbacks.clear();
    this.reset();
  }
}

/**
 * Create a singleton instance of VirtualScrollManager
 */
let virtualScrollManagerInstance: VirtualScrollManager | null = null;

/**
 * Get or create the global VirtualScrollManager instance
 * 
 * @param config - Optional configuration
 * @returns The VirtualScrollManager instance
 */
export function getVirtualScrollManager(
  config?: Partial<VirtualScrollConfig>
): VirtualScrollManager {
  if (!virtualScrollManagerInstance) {
    virtualScrollManagerInstance = new VirtualScrollManager(config);
  } else if (config) {
    virtualScrollManagerInstance.updateConfig(config);
  }
  return virtualScrollManagerInstance;
}

/**
 * Reset the global VirtualScrollManager instance
 * Useful for testing
 */
export function resetVirtualScrollManager(): void {
  if (virtualScrollManagerInstance) {
    virtualScrollManagerInstance.destroy();
    virtualScrollManagerInstance = null;
  }
}
