/**
 * React hook for performance monitoring
 * 
 * Provides easy integration of PerformanceMonitor with React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPerformanceMonitor, PerformanceMetrics, PerformanceConfig } from './PerformanceMonitor';

/**
 * Hook options
 */
export interface UsePerformanceOptions {
  config?: Partial<PerformanceConfig>;
  autoReport?: boolean;
  reportInterval?: number;
}

/**
 * Hook return value
 */
export interface UsePerformanceReturn {
  metrics: PerformanceMetrics | null;
  startMeasure: (label: string) => void;
  endMeasure: (label: string) => number;
  trackTypingLatency: (latency: number) => void;
  trackRenderTime: (renderTime: number) => void;
  updateDocumentSize: (size: number) => void;
  resetMetrics: () => void;
  getSummary: () => string;
}

/**
 * React hook for performance monitoring
 * 
 * @param options - Hook options
 * @returns Performance monitoring utilities and current metrics
 * 
 * @example
 * ```tsx
 * function MyEditor() {
 *   const { metrics, startMeasure, endMeasure } = usePerformance({
 *     autoReport: true,
 *     reportInterval: 5000,
 *   });
 * 
 *   const handleInput = () => {
 *     startMeasure('typing');
 *     // ... handle input ...
 *     const duration = endMeasure('typing');
 *   };
 * 
 *   return (
 *     <div>
 *       <Editor onInput={handleInput} />
 *       {metrics && (
 *         <div>Typing latency: {metrics.typingLatency.toFixed(0)}ms</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformance(
  options: UsePerformanceOptions = {}
): UsePerformanceReturn {
  const {
    config,
    autoReport = true,
    reportInterval = 5000,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const monitorRef = useRef(getPerformanceMonitor(config));

  // Set up automatic reporting
  useEffect(() => {
    const monitor = monitorRef.current;

    if (autoReport) {
      // Update config if reportInterval changed
      if (reportInterval !== monitor.getConfig().reportInterval) {
        monitor.updateConfig({ reportInterval });
      }

      // Set up reporting
      monitor.reportMetrics((m) => {
        setMetrics(m);
      });

      // Get initial metrics
      setMetrics(monitor.getMetrics());

      return () => {
        monitor.stopReporting();
      };
    }
  }, [autoReport, reportInterval]);

  // Memoized functions
  const startMeasure = useCallback((label: string) => {
    monitorRef.current.startMeasure(label);
  }, []);

  const endMeasure = useCallback((label: string): number => {
    return monitorRef.current.endMeasure(label);
  }, []);

  const trackTypingLatency = useCallback((latency: number) => {
    monitorRef.current.trackTypingLatency(latency);
  }, []);

  const trackRenderTime = useCallback((renderTime: number) => {
    monitorRef.current.trackRenderTime(renderTime);
  }, []);

  const updateDocumentSize = useCallback((size: number) => {
    monitorRef.current.updateDocumentSize(size);
  }, []);

  const resetMetrics = useCallback(() => {
    monitorRef.current.resetMetrics();
    setMetrics(monitorRef.current.getMetrics());
  }, []);

  const getSummary = useCallback((): string => {
    return monitorRef.current.getSummary();
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
    trackTypingLatency,
    trackRenderTime,
    updateDocumentSize,
    resetMetrics,
    getSummary,
  };
}

/**
 * Hook for measuring a specific operation
 * 
 * @param label - Unique label for the measurement
 * @returns Tuple of [start function, end function, duration]
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [startRender, endRender, renderDuration] = useMeasure('render');
 * 
 *   useEffect(() => {
 *     startRender();
 *     // ... rendering logic ...
 *     endRender();
 *   }, [startRender, endRender]);
 * 
 *   return <div>Render time: {renderDuration}ms</div>;
 * }
 * ```
 */
export function useMeasure(
  label: string
): [() => void, () => void, number | null] {
  const [duration, setDuration] = useState<number | null>(null);
  const monitorRef = useRef(getPerformanceMonitor());

  const start = useCallback(() => {
    monitorRef.current.startMeasure(label);
  }, [label]);

  const end = useCallback(() => {
    const d = monitorRef.current.endMeasure(label);
    setDuration(d);
  }, [label]);

  return [start, end, duration];
}

/**
 * Hook for tracking typing latency
 * 
 * @returns Function to record typing latency and current average
 * 
 * @example
 * ```tsx
 * function MyEditor() {
 *   const [recordLatency, avgLatency] = useTypingLatency();
 * 
 *   const handleInput = () => {
 *     const start = performance.now();
 *     // ... handle input ...
 *     const latency = performance.now() - start;
 *     recordLatency(latency);
 *   };
 * 
 *   return (
 *     <div>
 *       <Editor onInput={handleInput} />
 *       <div>Avg latency: {avgLatency?.toFixed(0)}ms</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTypingLatency(): [
  (latency: number) => void,
  number | null
] {
  const [avgLatency, setAvgLatency] = useState<number | null>(null);
  const monitorRef = useRef(getPerformanceMonitor());

  const recordLatency = useCallback((latency: number) => {
    monitorRef.current.trackTypingLatency(latency);
    const metrics = monitorRef.current.getMetrics();
    setAvgLatency(metrics.typingLatency);
  }, []);

  return [recordLatency, avgLatency];
}

/**
 * Hook for performance threshold monitoring
 * 
 * @param thresholds - Performance thresholds to check
 * @returns Current violations
 * 
 * @example
 * ```tsx
 * function PerformanceWarnings() {
 *   const violations = usePerformanceThresholds({
 *     typingLatency: 50,
 *     renderTime: 100,
 *   });
 * 
 *   if (violations.length === 0) return null;
 * 
 *   return (
 *     <div className="warnings">
 *       {violations.map((v, i) => (
 *         <div key={i}>{v}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceThresholds(
  thresholds: Partial<PerformanceMetrics>
): string[] {
  const [violations, setViolations] = useState<string[]>([]);
  const monitorRef = useRef(getPerformanceMonitor());

  useEffect(() => {
    const monitor = monitorRef.current;

    // Check thresholds periodically
    const intervalId = setInterval(() => {
      const result = monitor.checkThresholds(thresholds);
      setViolations(result.violations);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [thresholds]);

  return violations;
}
