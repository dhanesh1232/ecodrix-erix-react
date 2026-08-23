/**
 * PerformanceMonitor
 * 
 * Tracks and reports performance metrics for the ErixEditor including:
 * - Initialization time
 * - Typing latency
 * - Render time
 * - Memory usage
 * - Document size
 * 
 * Requirements: 3.1, 18.2
 */

export interface PerformanceMetrics {
  initTime: number;
  typingLatency: number;
  renderTime: number;
  memoryUsage: number;
  documentSize: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of operations to measure
  reportInterval: number; // milliseconds between reports
  trackMemory: boolean;
}

/**
 * Default configuration for PerformanceMonitor
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0, // Track 100% of operations by default
  reportInterval: 5000, // Report every 5 seconds
  trackMemory: true,
};

/**
 * Measurement data structure
 */
interface Measurement {
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * PerformanceMonitor class
 * 
 * Provides comprehensive performance monitoring for the editor including
 * timing measurements, memory tracking, and metric reporting.
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private measurements: Map<string, Measurement> = new Map();
  private metrics: PerformanceMetrics = {
    initTime: 0,
    typingLatency: 0,
    renderTime: 0,
    memoryUsage: 0,
    documentSize: 0,
  };
  private typingLatencies: number[] = [];
  private renderTimes: number[] = [];
  private reportCallback: ((metrics: PerformanceMetrics) => void) | null = null;
  private reportIntervalId: number | null = null;
  private initStartTime: number = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.initStartTime = this.now();
    }
  }

  /**
   * Get current high-resolution timestamp
   * Requirements: 3.1
   */
  private now(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * Check if we should sample this measurement based on sample rate
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Start measuring a performance metric
   * Requirements: 3.1
   * 
   * @param label - Unique identifier for the measurement
   */
  startMeasure(label: string): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const measurement: Measurement = {
      label,
      startTime: this.now(),
    };

    this.measurements.set(label, measurement);

    // Use Performance API mark if available
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${label}-start`);
      } catch (e) {
        // Silently fail if mark fails
      }
    }
  }

  /**
   * End measuring a performance metric and return the duration
   * Requirements: 3.1
   * 
   * @param label - Unique identifier for the measurement
   * @returns Duration in milliseconds, or 0 if measurement not found
   */
  endMeasure(label: string): number {
    if (!this.config.enabled) return 0;

    const measurement = this.measurements.get(label);
    if (!measurement) return 0;

    const endTime = this.now();
    const duration = endTime - measurement.startTime;

    measurement.endTime = endTime;
    measurement.duration = duration;

    // Use Performance API measure if available
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
      } catch (e) {
        // Silently fail if measure fails
      }
    }

    // Update specific metrics based on label
    this.updateMetrics(label, duration);

    // Clean up measurement
    this.measurements.delete(label);

    return duration;
  }

  /**
   * Update metrics based on measurement label and duration
   * Requirements: 3.1
   */
  private updateMetrics(label: string, duration: number): void {
    if (label === 'init') {
      this.metrics.initTime = duration;
    } else if (label.startsWith('typing-')) {
      this.typingLatencies.push(duration);
      // Keep only last 100 measurements
      if (this.typingLatencies.length > 100) {
        this.typingLatencies.shift();
      }
      // Calculate average typing latency
      this.metrics.typingLatency = 
        this.typingLatencies.reduce((a, b) => a + b, 0) / this.typingLatencies.length;
    } else if (label.startsWith('render-')) {
      this.renderTimes.push(duration);
      // Keep only last 100 measurements
      if (this.renderTimes.length > 100) {
        this.renderTimes.shift();
      }
      // Calculate average render time
      this.metrics.renderTime = 
        this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    }
  }

  /**
   * Measure initialization time
   * Requirements: 3.1
   * 
   * Call this when editor initialization is complete
   */
  markInitComplete(): void {
    if (!this.config.enabled || this.initStartTime === 0) return;

    const duration = this.now() - this.initStartTime;
    this.metrics.initTime = duration;
  }

  /**
   * Track typing latency
   * Requirements: 3.1
   * 
   * @param latency - Typing latency in milliseconds
   */
  trackTypingLatency(latency: number): void {
    if (!this.config.enabled) return;

    this.typingLatencies.push(latency);
    // Keep only last 100 measurements
    if (this.typingLatencies.length > 100) {
      this.typingLatencies.shift();
    }
    // Calculate average typing latency
    this.metrics.typingLatency = 
      this.typingLatencies.reduce((a, b) => a + b, 0) / this.typingLatencies.length;
  }

  /**
   * Track render time
   * Requirements: 3.1
   * 
   * @param renderTime - Render time in milliseconds
   */
  trackRenderTime(renderTime: number): void {
    if (!this.config.enabled) return;

    this.renderTimes.push(renderTime);
    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
    // Calculate average render time
    this.metrics.renderTime = 
      this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
  }

  /**
   * Update memory usage metric
   * Requirements: 3.1
   * 
   * Uses Performance Memory API if available
   */
  updateMemoryUsage(): void {
    if (!this.config.enabled || !this.config.trackMemory) return;

    // Check if Performance Memory API is available
    if (
      typeof performance !== 'undefined' &&
      'memory' in performance &&
      performance.memory
    ) {
      const memory = performance.memory as {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
      };
      
      if (memory.usedJSHeapSize) {
        // Convert bytes to megabytes
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024);
      }
    }
  }

  /**
   * Update document size metric
   * Requirements: 3.1
   * 
   * @param size - Document size in bytes or characters
   */
  updateDocumentSize(size: number): void {
    if (!this.config.enabled) return;
    this.metrics.documentSize = size;
  }

  /**
   * Get current performance metrics
   * Requirements: 3.1, 18.2
   * 
   * @returns Current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    // Update memory usage before returning metrics
    this.updateMemoryUsage();
    
    return { ...this.metrics };
  }

  /**
   * Register a callback for periodic metric reporting
   * Requirements: 18.2
   * 
   * @param callback - Function to call with metrics
   */
  reportMetrics(callback: (metrics: PerformanceMetrics) => void): void {
    this.reportCallback = callback;

    // Clear existing interval if any
    if (this.reportIntervalId !== null) {
      clearInterval(this.reportIntervalId);
    }

    // Set up periodic reporting
    if (this.config.enabled && this.config.reportInterval > 0) {
      this.reportIntervalId = window.setInterval(() => {
        if (this.reportCallback) {
          this.reportCallback(this.getMetrics());
        }
      }, this.config.reportInterval);
    }
  }

  /**
   * Stop periodic metric reporting
   * Requirements: 18.2
   */
  stopReporting(): void {
    if (this.reportIntervalId !== null) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }
    this.reportCallback = null;
  }

  /**
   * Get performance entries from Performance API
   * Requirements: 3.1
   * 
   * @param type - Type of entries to retrieve (mark, measure, navigation, etc.)
   * @returns Array of performance entries
   */
  getPerformanceEntries(type?: string): PerformanceEntry[] {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    try {
      if (type) {
        return performance.getEntriesByType(type);
      }
      return performance.getEntries();
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear all performance measurements
   * Requirements: 3.1
   */
  clearMeasurements(): void {
    this.measurements.clear();
    
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      try {
        performance.clearMarks();
        performance.clearMeasures();
      } catch (e) {
        // Silently fail
      }
    }
  }

  /**
   * Reset all metrics to initial state
   * Requirements: 3.1
   */
  resetMetrics(): void {
    this.metrics = {
      initTime: 0,
      typingLatency: 0,
      renderTime: 0,
      memoryUsage: 0,
      documentSize: 0,
    };
    this.typingLatencies = [];
    this.renderTimes = [];
    this.clearMeasurements();
  }

  /**
   * Get a summary of performance metrics
   * Requirements: 18.2
   * 
   * @returns Human-readable performance summary
   */
  getSummary(): string {
    const metrics = this.getMetrics();
    
    return `Performance Summary:
  - Init Time: ${metrics.initTime.toFixed(2)}ms
  - Typing Latency: ${metrics.typingLatency.toFixed(2)}ms (avg)
  - Render Time: ${metrics.renderTime.toFixed(2)}ms (avg)
  - Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
  - Document Size: ${metrics.documentSize} bytes`;
  }

  /**
   * Check if performance is within acceptable thresholds
   * Requirements: 3.1
   * 
   * @param thresholds - Performance thresholds to check against
   * @returns Object indicating which metrics exceed thresholds
   */
  checkThresholds(thresholds: Partial<PerformanceMetrics>): {
    passed: boolean;
    violations: string[];
  } {
    const metrics = this.getMetrics();
    const violations: string[] = [];

    if (thresholds.initTime && metrics.initTime > thresholds.initTime) {
      violations.push(`Init time ${metrics.initTime.toFixed(2)}ms exceeds threshold ${thresholds.initTime}ms`);
    }

    if (thresholds.typingLatency && metrics.typingLatency > thresholds.typingLatency) {
      violations.push(`Typing latency ${metrics.typingLatency.toFixed(2)}ms exceeds threshold ${thresholds.typingLatency}ms`);
    }

    if (thresholds.renderTime && metrics.renderTime > thresholds.renderTime) {
      violations.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds threshold ${thresholds.renderTime}ms`);
    }

    if (thresholds.memoryUsage && metrics.memoryUsage > thresholds.memoryUsage) {
      violations.push(`Memory usage ${metrics.memoryUsage.toFixed(2)}MB exceeds threshold ${thresholds.memoryUsage}MB`);
    }

    if (thresholds.documentSize && metrics.documentSize > thresholds.documentSize) {
      violations.push(`Document size ${metrics.documentSize} bytes exceeds threshold ${thresholds.documentSize} bytes`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart reporting if interval changed
    if ('reportInterval' in config && this.reportCallback) {
      this.reportMetrics(this.reportCallback);
    }
  }

  /**
   * Get current configuration
   * 
   * @returns Current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Destroy the performance monitor and clean up resources
   */
  destroy(): void {
    this.stopReporting();
    this.clearMeasurements();
    this.measurements.clear();
    this.typingLatencies = [];
    this.renderTimes = [];
  }
}

/**
 * Create a singleton instance of PerformanceMonitor
 */
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get or create the global PerformanceMonitor instance
 * 
 * @param config - Optional configuration
 * @returns The PerformanceMonitor instance
 */
export function getPerformanceMonitor(
  config?: Partial<PerformanceConfig>
): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
  } else if (config) {
    performanceMonitorInstance.updateConfig(config);
  }
  return performanceMonitorInstance;
}

/**
 * Reset the global PerformanceMonitor instance
 * Useful for testing
 */
export function resetPerformanceMonitor(): void {
  if (performanceMonitorInstance) {
    performanceMonitorInstance.destroy();
    performanceMonitorInstance = null;
  }
}
