/**
 * Performance monitoring utilities for ErixEditor
 * 
 * Exports:
 * - PerformanceMonitor: Main performance monitoring class
 * - PerformanceMetrics: Interface for performance metrics
 * - PerformanceConfig: Interface for configuration
 * - getPerformanceMonitor: Get singleton instance
 * - resetPerformanceMonitor: Reset singleton (for testing)
 * - usePerformance: React hook for performance monitoring
 * - useMeasure: React hook for measuring operations
 * - useTypingLatency: React hook for typing latency tracking
 * - usePerformanceThresholds: React hook for threshold monitoring
 * - VirtualScrollManager: Virtual scrolling manager for large documents
 * - getVirtualScrollManager: Get singleton instance
 * - resetVirtualScrollManager: Reset singleton (for testing)
 * - useVirtualScroll: React hook for virtual scrolling
 * - useSimpleVirtualScroll: Simplified virtual scroll hook
 * - useIsBlockVisible: Hook to check block visibility
 * - useVirtualScrollStats: Hook to get virtual scroll statistics
 */

export {
  PerformanceMonitor,
  getPerformanceMonitor,
  resetPerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceConfig,
} from './PerformanceMonitor';

export {
  usePerformance,
  useMeasure,
  useTypingLatency,
  usePerformanceThresholds,
  type UsePerformanceOptions,
  type UsePerformanceReturn,
} from './usePerformance';

export {
  VirtualScrollManager,
  getVirtualScrollManager,
  resetVirtualScrollManager,
  type VirtualScrollConfig,
  type VisibleRange,
  type ScrollPosition,
  type ScrollCallback,
  type RangeChangeCallback,
} from './VirtualScrollManager';

export {
  useVirtualScroll,
  useSimpleVirtualScroll,
  useIsBlockVisible,
  useVirtualScrollStats,
  type UseVirtualScrollOptions,
  type UseVirtualScrollReturn,
} from './useVirtualScroll';

export {
  LazyLoadManager,
  getLazyLoadManager,
  resetLazyLoadManager,
  type LazyLoadConfig,
  type LoadingState,
  type PlaceholderType,
  type LoadPriority,
  type LazyImageInfo,
  type LoadCallback,
  type ErrorCallback,
} from './LazyLoadManager';

export {
  useLazyLoad,
  useLazyLoadManager,
  useLazyImages,
  type UseLazyLoadOptions,
  type UseLazyLoadReturn,
  type UseLazyLoadManagerOptions,
  type UseLazyLoadManagerReturn,
  type UseLazyImagesOptions,
  type UseLazyImagesReturn,
} from './useLazyLoad';
