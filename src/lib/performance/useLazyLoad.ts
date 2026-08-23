/**
 * React hooks for lazy loading images
 *
 * Provides easy integration with React components for lazy loading functionality.
 *
 * Requirements: 3.6
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  LazyLoadManager,
  getLazyLoadManager,
  type LazyLoadConfig,
  type LoadingState,
  type LoadPriority,
} from "./LazyLoadManager";

/**
 * Options for useLazyLoad hook
 */
export interface UseLazyLoadOptions {
  /**
   * Source URL for the image
   */
  src: string;

  /**
   * Low-res preview URL (optional)
   */
  lowResSrc?: string;

  /**
   * Load priority
   */
  priority?: LoadPriority;

  /**
   * Configuration for the lazy load manager
   */
  config?: Partial<LazyLoadConfig>;

  /**
   * Callback when image loads successfully
   */
  onLoad?: (element: HTMLImageElement) => void;

  /**
   * Callback when image fails to load
   */
  onError?: (element: HTMLImageElement, error: Error) => void;
}

export { LoadPriority };
/**
 * Return type for useLazyLoad hook
 */
export interface UseLazyLoadReturn {
  /**
   * Ref to attach to the image element
   */
  ref: React.RefObject<HTMLImageElement | null>;

  /**
   * Current loading state
   */
  state: LoadingState;

  /**
   * Whether the image is currently loading
   */
  isLoading: boolean;

  /**
   * Whether the image has loaded successfully
   */
  isLoaded: boolean;

  /**
   * Whether the image failed to load
   */
  hasError: boolean;

  /**
   * Force load the image immediately
   */
  load: () => void;
}

/**
 * Hook for lazy loading a single image
 * Requirements: 3.6
 *
 * @param options - Configuration options
 * @returns Lazy load state and controls
 *
 * @example
 * ```tsx
 * function MyImage({ src }: { src: string }) {
 *   const { ref, isLoading, isLoaded } = useLazyLoad({ src });
 *
 *   return (
 *     <div>
 *       <img ref={ref} alt="Lazy loaded" />
 *       {isLoading && <Spinner />}
 *       {isLoaded && <CheckIcon />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyLoad(options: UseLazyLoadOptions): UseLazyLoadReturn {
  const { src, lowResSrc, priority, config, onLoad, onError } = options;

  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const managerRef = useRef<LazyLoadManager | null>(null);
  const imageIdRef = useRef<string>("");

  // Initialize manager
  useEffect(() => {
    managerRef.current = getLazyLoadManager(config);
  }, [config]);

  // Observe image element
  useEffect(() => {
    const element = ref.current;
    const manager = managerRef.current;

    if (!element || !manager) return;

    // Observe the image
    const imageId = manager.observe(element, src, {
      lowResSrc,
      priority,
      onLoad,
      onError,
    });

    imageIdRef.current = imageId;

    // Set up state tracking
    const checkState = () => {
      const currentState = manager.getState(imageId);
      if (currentState) {
        setState(currentState);
      }
    };

    // Check state periodically
    const intervalId = setInterval(checkState, 100);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (imageId) {
        manager.unobserve(imageId);
      }
    };
  }, [src, lowResSrc, priority, onLoad, onError]);

  // Force load function
  const load = useCallback(() => {
    const manager = managerRef.current;
    const imageId = imageIdRef.current;

    if (manager && imageId) {
      const imageInfo = manager.getImageInfo(imageId);
      if (imageInfo && imageInfo.state === "idle") {
        manager.loadAll();
      }
    }
  }, []);

  return {
    ref,
    state,
    isLoading: state === "loading",
    isLoaded: state === "loaded",
    hasError: state === "error",
    load,
  };
}

/**
 * Options for useLazyLoadManager hook
 */
export interface UseLazyLoadManagerOptions {
  /**
   * Configuration for the lazy load manager
   */
  config?: Partial<LazyLoadConfig>;
}

/**
 * Return type for useLazyLoadManager hook
 */
export interface UseLazyLoadManagerReturn {
  /**
   * The lazy load manager instance
   */
  manager: LazyLoadManager;

  /**
   * Current statistics
   */
  stats: {
    total: number;
    idle: number;
    loading: number;
    loaded: number;
    error: number;
    queueSize: number;
    activeLoads: number;
  };

  /**
   * Load all images immediately
   */
  loadAll: () => void;

  /**
   * Reset the manager
   */
  reset: () => void;
}

/**
 * Hook for accessing the lazy load manager
 * Requirements: 3.6
 *
 * @param options - Configuration options
 * @returns Lazy load manager and controls
 *
 * @example
 * ```tsx
 * function ImageGallery() {
 *   const { manager, stats, loadAll } = useLazyLoadManager();
 *
 *   return (
 *     <div>
 *       <button onClick={loadAll}>Load All Images</button>
 *       <p>Loaded: {stats.loaded} / {stats.total}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyLoadManager(
  options: UseLazyLoadManagerOptions = {},
): UseLazyLoadManagerReturn {
  const { config } = options;

  const [stats, setStats] = useState({
    total: 0,
    idle: 0,
    loading: 0,
    loaded: 0,
    error: 0,
    queueSize: 0,
    activeLoads: 0,
  });

  const managerRef = useRef<LazyLoadManager | null>(null);

  // Initialize manager
  useEffect(() => {
    managerRef.current = getLazyLoadManager(config);
  }, [config]);

  // Update stats periodically
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    const updateStats = () => {
      setStats(manager.getStats());
    };

    // Update immediately
    updateStats();

    // Update every second
    const intervalId = setInterval(updateStats, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const loadAll = useCallback(() => {
    managerRef.current?.loadAll();
  }, []);

  const reset = useCallback(() => {
    managerRef.current?.reset();
    setStats({
      total: 0,
      idle: 0,
      loading: 0,
      loaded: 0,
      error: 0,
      queueSize: 0,
      activeLoads: 0,
    });
  }, []);

  return {
    manager: managerRef.current!,
    stats,
    loadAll,
    reset,
  };
}

/**
 * Options for useLazyImages hook
 */
export interface UseLazyImagesOptions {
  /**
   * Array of image sources
   */
  images: Array<{
    src: string;
    lowResSrc?: string;
    priority?: LoadPriority;
  }>;

  /**
   * Configuration for the lazy load manager
   */
  config?: Partial<LazyLoadConfig>;
}

/**
 * Return type for useLazyImages hook
 */
export interface UseLazyImagesReturn {
  /**
   * Array of refs to attach to image elements
   */
  refs: React.RefObject<HTMLImageElement>[];

  /**
   * Array of loading states for each image
   */
  states: LoadingState[];

  /**
   * Overall loading progress (0-1)
   */
  progress: number;

  /**
   * Whether all images are loaded
   */
  allLoaded: boolean;

  /**
   * Load all images immediately
   */
  loadAll: () => void;
}

/**
 * Hook for lazy loading multiple images
 * Requirements: 3.6
 *
 * @param options - Configuration options
 * @returns Lazy load state and controls for multiple images
 *
 * @example
 * ```tsx
 * function ImageGallery({ images }: { images: string[] }) {
 *   const { refs, states, progress } = useLazyImages({
 *     images: images.map(src => ({ src })),
 *   });
 *
 *   return (
 *     <div>
 *       <p>Progress: {Math.round(progress * 100)}%</p>
 *       {images.map((src, index) => (
 *         <img key={src} ref={refs[index]} alt="" />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyImages(
  options: UseLazyImagesOptions,
): UseLazyImagesReturn {
  const { images, config } = options;

  const refs = useRef<React.RefObject<HTMLImageElement>[]>([]);
  const [states, setStates] = useState<LoadingState[]>([]);
  const managerRef = useRef<LazyLoadManager | null>(null);
  const imageIdsRef = useRef<string[]>([]);

  // Initialize refs
  if (refs.current.length !== images.length) {
    refs.current = images.map(() => ({ current: null! }));
  }

  // Initialize manager
  useEffect(() => {
    managerRef.current = getLazyLoadManager(config);
  }, [config]);

  // Observe all images
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    // Observe each image
    const imageIds = refs.current.map((ref, index) => {
      const element = ref.current;
      if (!element) return "";

      const image = images[index];
      return manager.observe(element, image.src, {
        lowResSrc: image.lowResSrc,
        priority: image.priority,
      });
    });

    imageIdsRef.current = imageIds;

    // Set up state tracking
    const checkStates = () => {
      const currentStates = imageIds.map((id) => {
        if (!id) return "idle" as LoadingState;
        return manager.getState(id) || "idle";
      });
      setStates(currentStates);
    };

    // Check states periodically
    const intervalId = setInterval(checkStates, 100);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      imageIds.forEach((id) => {
        if (id) {
          manager.unobserve(id);
        }
      });
    };
  }, [images, config]);

  // Calculate progress
  const progress =
    states.length > 0
      ? states.filter((state) => state === "loaded").length / states.length
      : 0;

  const allLoaded =
    states.length > 0 && states.every((state) => state === "loaded");

  const loadAll = useCallback(() => {
    managerRef.current?.loadAll();
  }, []);

  return {
    refs: refs.current,
    states,
    progress,
    allLoaded,
    loadAll,
  };
}
