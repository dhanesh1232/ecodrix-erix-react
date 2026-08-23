/**
 * LazyLoadManager
 * 
 * Implements lazy loading for images and media to reduce initial page load time.
 * Uses Intersection Observer API for efficient visibility detection.
 * 
 * Key features:
 * - Intersection Observer integration for visibility detection
 * - Image placeholder system (blur-up, skeleton, low-quality preview)
 * - Progressive loading (load low-res first, then high-res)
 * - Load priority queue (visible images load first, then nearby images)
 * - Loading state management (loading, loaded, error)
 * - Support for different image formats and sizes
 * 
 * Requirements: 3.6
 */

/**
 * Loading state for an image
 */
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Placeholder type for images
 */
export type PlaceholderType = 'blur' | 'skeleton' | 'color' | 'none';

/**
 * Priority level for loading
 */
export type LoadPriority = 'high' | 'medium' | 'low';

/**
 * Configuration for LazyLoadManager
 */
export interface LazyLoadConfig {
  /**
   * Root margin for Intersection Observer
   * Positive values load images before they enter viewport
   * Default: '50px' (load 50px before visible)
   */
  rootMargin: string;
  
  /**
   * Intersection threshold (0-1)
   * 0 = load as soon as any pixel is visible
   * 1 = load only when fully visible
   * Default: 0.1
   */
  threshold: number;
  
  /**
   * Type of placeholder to show while loading
   * Default: 'blur'
   */
  placeholderType: PlaceholderType;
  
  /**
   * Enable progressive loading (low-res then high-res)
   * Default: true
   */
  progressiveLoading: boolean;
  
  /**
   * Quality for low-res preview (0-1)
   * Only used if progressiveLoading is true
   * Default: 0.1
   */
  lowResQuality: number;
  
  /**
   * Maximum concurrent image loads
   * Default: 4
   */
  maxConcurrentLoads: number;
  
  /**
   * Retry failed loads
   * Default: true
   */
  retryOnError: boolean;
  
  /**
   * Maximum retry attempts
   * Default: 3
   */
  maxRetries: number;
  
  /**
   * Delay between retries in milliseconds
   * Default: 1000
   */
  retryDelay: number;
  
  /**
   * Whether lazy loading is enabled
   * Default: true
   */
  enabled: boolean;
}

/**
 * Default configuration for LazyLoadManager
 */
const DEFAULT_CONFIG: LazyLoadConfig = {
  rootMargin: '50px',
  threshold: 0.1,
  placeholderType: 'blur',
  progressiveLoading: true,
  lowResQuality: 0.1,
  maxConcurrentLoads: 4,
  retryOnError: true,
  maxRetries: 3,
  retryDelay: 1000,
  enabled: true,
};

/**
 * Information about a lazy-loaded image
 */
export interface LazyImageInfo {
  /**
   * Unique identifier for the image
   */
  id: string;
  
  /**
   * The image element
   */
  element: HTMLImageElement;
  
  /**
   * Original source URL (high-res)
   */
  src: string;
  
  /**
   * Low-res preview URL (optional)
   */
  lowResSrc?: string;
  
  /**
   * Current loading state
   */
  state: LoadingState;
  
  /**
   * Load priority
   */
  priority: LoadPriority;
  
  /**
   * Number of retry attempts
   */
  retryCount: number;
  
  /**
   * Timestamp when added to queue
   */
  timestamp: number;
  
  /**
   * Whether the image is currently in viewport
   */
  isVisible: boolean;
  
  /**
   * Callback when loading completes
   */
  onLoad?: (element: HTMLImageElement) => void;
  
  /**
   * Callback when loading fails
   */
  onError?: (element: HTMLImageElement, error: Error) => void;
}

/**
 * Callback types for lazy load events
 */
export type LoadCallback = (info: LazyImageInfo) => void;
export type ErrorCallback = (info: LazyImageInfo, error: Error) => void;

/**
 * LazyLoadManager class
 * 
 * Manages lazy loading of images using Intersection Observer API.
 * Implements placeholder system, progressive loading, and priority queue.
 * 
 * Requirements: 3.6 - Lazy load images and media to reduce initial page load time
 */
export class LazyLoadManager {
  private config: LazyLoadConfig;
  private observer: IntersectionObserver | null = null;
  private images: Map<string, LazyImageInfo> = new Map();
  private loadQueue: LazyImageInfo[] = [];
  private activeLoads: Set<string> = new Set();
  
  // Callbacks
  private loadCallbacks: Set<LoadCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  
  // ID counter for generating unique IDs
  private idCounter: number = 0;

  constructor(config: Partial<LazyLoadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.initializeObserver();
    }
  }

  /**
   * Initialize the Intersection Observer
   * Requirements: 3.6
   */
  private initializeObserver(): void {
    // Check if Intersection Observer is supported
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('LazyLoadManager: IntersectionObserver not supported, lazy loading disabled');
      this.config.enabled = false;
      return;
    }

    const options: IntersectionObserverInit = {
      root: null, // Use viewport as root
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const imageId = (entry.target as HTMLElement).dataset.lazyId;
        if (!imageId) return;

        const imageInfo = this.images.get(imageId);
        if (!imageInfo) return;

        // Update visibility state
        imageInfo.isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Image entered viewport, add to load queue with high priority
          this.updatePriority(imageInfo, 'high');
          this.addToQueue(imageInfo);
        } else {
          // Image left viewport, lower priority
          if (imageInfo.state === 'idle') {
            this.updatePriority(imageInfo, 'low');
          }
        }
      });

      // Process the queue
      this.processQueue();
    }, options);
  }

  /**
   * Generate a unique ID for an image
   */
  private generateId(): string {
    return `lazy-image-${++this.idCounter}`;
  }

  /**
   * Observe an image element for lazy loading
   * Requirements: 3.6
   * 
   * @param element - The image element to observe
   * @param src - The source URL to load
   * @param options - Optional configuration
   * @returns The image ID
   */
  observe(
    element: HTMLImageElement,
    src: string,
    options: {
      lowResSrc?: string;
      priority?: LoadPriority;
      onLoad?: (element: HTMLImageElement) => void;
      onError?: (element: HTMLImageElement, error: Error) => void;
    } = {}
  ): string {
    if (!this.config.enabled) {
      // If lazy loading is disabled, load immediately
      element.src = src;
      return '';
    }

    const id = this.generateId();
    
    // Store image info
    const imageInfo: LazyImageInfo = {
      id,
      element,
      src,
      lowResSrc: options.lowResSrc,
      state: 'idle',
      priority: options.priority || 'medium',
      retryCount: 0,
      timestamp: Date.now(),
      isVisible: false,
      onLoad: options.onLoad,
      onError: options.onError,
    };

    this.images.set(id, imageInfo);
    
    // Set data attribute for identification
    element.dataset.lazyId = id;
    
    // Apply placeholder
    this.applyPlaceholder(element);
    
    // Start observing
    if (this.observer) {
      this.observer.observe(element);
    }

    return id;
  }

  /**
   * Stop observing an image element
   * Requirements: 3.6
   * 
   * @param element - The image element or image ID
   */
  unobserve(element: HTMLImageElement | string): void {
    const id = typeof element === 'string' ? element : element.dataset.lazyId;
    if (!id) return;

    const imageInfo = this.images.get(id);
    if (!imageInfo) return;

    // Stop observing
    if (this.observer) {
      this.observer.unobserve(imageInfo.element);
    }

    // Remove from queue
    this.removeFromQueue(id);
    
    // Remove from active loads
    this.activeLoads.delete(id);
    
    // Remove from images map
    this.images.delete(id);
    
    // Clean up data attribute
    delete imageInfo.element.dataset.lazyId;
  }

  /**
   * Apply placeholder to an image element
   * Requirements: 3.6
   * 
   * @param element - The image element
   */
  private applyPlaceholder(element: HTMLImageElement): void {
    const { placeholderType } = this.config;

    switch (placeholderType) {
      case 'blur':
        // Apply blur effect with low-quality preview
        element.style.filter = 'blur(10px)';
        element.style.transition = 'filter 0.3s ease-in-out';
        break;
      
      case 'skeleton':
        // Apply skeleton loading animation
        element.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
        element.style.backgroundSize = '200% 100%';
        element.style.animation = 'skeleton-loading 1.5s infinite';
        break;
      
      case 'color':
        // Apply solid color placeholder
        element.style.backgroundColor = '#f0f0f0';
        break;
      
      case 'none':
        // No placeholder
        break;
    }
  }

  /**
   * Remove placeholder from an image element
   * Requirements: 3.6
   * 
   * @param element - The image element
   */
  private removePlaceholder(element: HTMLImageElement): void {
    const { placeholderType } = this.config;

    switch (placeholderType) {
      case 'blur':
        element.style.filter = 'none';
        break;
      
      case 'skeleton':
        element.style.background = 'none';
        element.style.animation = 'none';
        break;
      
      case 'color':
        element.style.backgroundColor = 'transparent';
        break;
      
      case 'none':
        break;
    }
  }

  /**
   * Add an image to the load queue
   * Requirements: 3.6
   * 
   * @param imageInfo - The image info to add
   */
  private addToQueue(imageInfo: LazyImageInfo): void {
    // Don't add if already in queue or loaded
    if (
      imageInfo.state !== 'idle' ||
      this.loadQueue.includes(imageInfo)
    ) {
      return;
    }

    this.loadQueue.push(imageInfo);
    
    // Sort queue by priority (high > medium > low) and timestamp
    this.sortQueue();
  }

  /**
   * Remove an image from the load queue
   * 
   * @param imageId - The image ID to remove
   */
  private removeFromQueue(imageId: string): void {
    this.loadQueue = this.loadQueue.filter(info => info.id !== imageId);
  }

  /**
   * Sort the load queue by priority and timestamp
   * Requirements: 3.6
   */
  private sortQueue(): void {
    const priorityOrder: Record<LoadPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    this.loadQueue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Update the priority of an image
   * Requirements: 3.6
   * 
   * @param imageInfo - The image info
   * @param priority - The new priority
   */
  private updatePriority(imageInfo: LazyImageInfo, priority: LoadPriority): void {
    imageInfo.priority = priority;
    this.sortQueue();
  }

  /**
   * Process the load queue
   * Requirements: 3.6
   */
  private processQueue(): void {
    // Load images up to max concurrent loads
    while (
      this.activeLoads.size < this.config.maxConcurrentLoads &&
      this.loadQueue.length > 0
    ) {
      const imageInfo = this.loadQueue.shift();
      if (!imageInfo) break;

      this.loadImage(imageInfo);
    }
  }

  /**
   * Load an image
   * Requirements: 3.6
   * 
   * @param imageInfo - The image info to load
   */
  private async loadImage(imageInfo: LazyImageInfo): Promise<void> {
    // Mark as loading
    imageInfo.state = 'loading';
    this.activeLoads.add(imageInfo.id);

    try {
      // Progressive loading: load low-res first if available
      if (
        this.config.progressiveLoading &&
        imageInfo.lowResSrc &&
        imageInfo.retryCount === 0
      ) {
        await this.loadImageSrc(imageInfo.element, imageInfo.lowResSrc);
      }

      // Load high-res image
      await this.loadImageSrc(imageInfo.element, imageInfo.src);

      // Mark as loaded
      imageInfo.state = 'loaded';
      this.removePlaceholder(imageInfo.element);

      // Call onLoad callback
      if (imageInfo.onLoad) {
        imageInfo.onLoad(imageInfo.element);
      }

      // Notify load callbacks
      this.notifyLoadCallbacks(imageInfo);
    } catch (error) {
      // Handle error
      await this.handleLoadError(imageInfo, error as Error);
    } finally {
      // Remove from active loads
      this.activeLoads.delete(imageInfo.id);
      
      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Load an image source
   * Requirements: 3.6
   * 
   * @param element - The image element
   * @param src - The source URL
   * @returns Promise that resolves when image loads
   */
  private loadImageSrc(element: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        element.src = src;
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * Handle image load error
   * Requirements: 3.6
   * 
   * @param imageInfo - The image info
   * @param error - The error that occurred
   */
  private async handleLoadError(imageInfo: LazyImageInfo, error: Error): Promise<void> {
    imageInfo.retryCount++;

    // Check if we should retry
    if (
      this.config.retryOnError &&
      imageInfo.retryCount <= this.config.maxRetries
    ) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      // Add back to queue
      imageInfo.state = 'idle';
      this.addToQueue(imageInfo);
      this.processQueue();
    } else {
      // Max retries reached, mark as error
      imageInfo.state = 'error';
      
      // Call onError callback
      if (imageInfo.onError) {
        imageInfo.onError(imageInfo.element, error);
      }

      // Notify error callbacks
      this.notifyErrorCallbacks(imageInfo, error);
    }
  }

  /**
   * Load all images immediately (bypass lazy loading)
   * Requirements: 3.6
   */
  loadAll(): void {
    // Add all idle images to queue with high priority
    this.images.forEach(imageInfo => {
      if (imageInfo.state === 'idle') {
        imageInfo.priority = 'high';
        this.addToQueue(imageInfo);
      }
    });

    // Process queue
    this.processQueue();
  }

  /**
   * Get the loading state of an image
   * 
   * @param element - The image element or image ID
   * @returns The loading state or null if not found
   */
  getState(element: HTMLImageElement | string): LoadingState | null {
    const id = typeof element === 'string' ? element : element.dataset.lazyId;
    if (!id) return null;

    const imageInfo = this.images.get(id);
    return imageInfo ? imageInfo.state : null;
  }

  /**
   * Get information about an image
   * 
   * @param element - The image element or image ID
   * @returns The image info or null if not found
   */
  getImageInfo(element: HTMLImageElement | string): LazyImageInfo | null {
    const id = typeof element === 'string' ? element : element.dataset.lazyId;
    if (!id) return null;

    const imageInfo = this.images.get(id);
    return imageInfo ? { ...imageInfo } : null;
  }

  /**
   * Register a callback for successful image loads
   * 
   * @param callback - Function to call when an image loads
   * @returns Unsubscribe function
   */
  onLoad(callback: LoadCallback): () => void {
    this.loadCallbacks.add(callback);
    return () => {
      this.loadCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for image load errors
   * 
   * @param callback - Function to call when an image fails to load
   * @returns Unsubscribe function
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notify all load callbacks
   */
  private notifyLoadCallbacks(imageInfo: LazyImageInfo): void {
    this.loadCallbacks.forEach(callback => {
      try {
        callback(imageInfo);
      } catch (error) {
        console.error('LazyLoadManager: Error in load callback', error);
      }
    });
  }

  /**
   * Notify all error callbacks
   */
  private notifyErrorCallbacks(imageInfo: LazyImageInfo, error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(imageInfo, error);
      } catch (err) {
        console.error('LazyLoadManager: Error in error callback', err);
      }
    });
  }

  /**
   * Get statistics about lazy loading
   * 
   * @returns Statistics object
   */
  getStats(): {
    total: number;
    idle: number;
    loading: number;
    loaded: number;
    error: number;
    queueSize: number;
    activeLoads: number;
  } {
    const stats = {
      total: this.images.size,
      idle: 0,
      loading: 0,
      loaded: 0,
      error: 0,
      queueSize: this.loadQueue.length,
      activeLoads: this.activeLoads.size,
    };

    this.images.forEach(imageInfo => {
      stats[imageInfo.state]++;
    });

    return stats;
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<LazyLoadConfig>): void {
    const oldEnabled = this.config.enabled;
    
    this.config = { ...this.config, ...config };
    
    // Reinitialize observer if enabled state changed
    if (oldEnabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.initializeObserver();
      } else {
        this.destroy();
      }
    } else if (
      this.config.enabled &&
      (config.rootMargin !== undefined || config.threshold !== undefined)
    ) {
      // Recreate observer with new settings
      this.destroyObserver();
      this.initializeObserver();
      
      // Re-observe all images
      this.images.forEach(imageInfo => {
        if (this.observer && imageInfo.state === 'idle') {
          this.observer.observe(imageInfo.element);
        }
      });
    }
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): LazyLoadConfig {
    return { ...this.config };
  }

  /**
   * Destroy the observer
   */
  private destroyObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Reset the lazy load manager to initial state
   */
  reset(): void {
    // Unobserve all images
    this.images.forEach(imageInfo => {
      if (this.observer) {
        this.observer.unobserve(imageInfo.element);
      }
      delete imageInfo.element.dataset.lazyId;
    });

    this.images.clear();
    this.loadQueue = [];
    this.activeLoads.clear();
    this.idCounter = 0;
  }

  /**
   * Destroy the lazy load manager and clean up resources
   */
  destroy(): void {
    this.destroyObserver();
    this.reset();
    this.loadCallbacks.clear();
    this.errorCallbacks.clear();
  }
}

/**
 * Create a singleton instance of LazyLoadManager
 */
let lazyLoadManagerInstance: LazyLoadManager | null = null;

/**
 * Get or create the global LazyLoadManager instance
 * 
 * @param config - Optional configuration
 * @returns The LazyLoadManager instance
 */
export function getLazyLoadManager(
  config?: Partial<LazyLoadConfig>
): LazyLoadManager {
  if (!lazyLoadManagerInstance) {
    lazyLoadManagerInstance = new LazyLoadManager(config);
  } else if (config) {
    lazyLoadManagerInstance.updateConfig(config);
  }
  return lazyLoadManagerInstance;
}

/**
 * Reset the global LazyLoadManager instance
 * Useful for testing
 */
export function resetLazyLoadManager(): void {
  if (lazyLoadManagerInstance) {
    lazyLoadManagerInstance.destroy();
    lazyLoadManagerInstance = null;
  }
}
