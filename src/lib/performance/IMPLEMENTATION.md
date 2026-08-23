# Performance Monitor Implementation

This document describes the implementation details of the PerformanceMonitor system for the ErixEditor.

## Overview

The PerformanceMonitor provides comprehensive performance tracking capabilities including:
- Initialization time measurement
- Typing latency tracking with rolling averages
- Render time monitoring
- Memory usage tracking via Performance Memory API
- Document size tracking
- Periodic metric reporting
- Performance threshold validation

## Architecture

### Core Components

1. **PerformanceMonitor Class** (`PerformanceMonitor.ts`)
   - Main class for performance tracking
   - Manages measurements and metrics
   - Provides reporting API
   - Singleton pattern support

2. **React Hooks** (`usePerformance.ts`)
   - `usePerformance`: Main hook for performance monitoring
   - `useMeasure`: Hook for measuring specific operations
   - `useTypingLatency`: Hook for typing latency tracking
   - `usePerformanceThresholds`: Hook for threshold monitoring

3. **Example Components** (`example.tsx`)
   - Demonstrates usage patterns
   - Provides reference implementations

## Implementation Details

### Measurement System

The PerformanceMonitor uses a dual measurement approach:

1. **Custom Measurements**: Using `performance.now()` for high-resolution timing
2. **Performance API**: Using `performance.mark()` and `performance.measure()` when available

```typescript
// Start measurement
startMeasure(label: string) {
  const measurement = {
    label,
    startTime: performance.now(),
  };
  this.measurements.set(label, measurement);
  performance.mark(`${label}-start`);
}

// End measurement
endMeasure(label: string): number {
  const measurement = this.measurements.get(label);
  const endTime = performance.now();
  const duration = endTime - measurement.startTime;
  
  performance.mark(`${label}-end`);
  performance.measure(label, `${label}-start`, `${label}-end`);
  
  return duration;
}
```

### Rolling Averages

Typing latency and render time use rolling averages to smooth out variations:

```typescript
private typingLatencies: number[] = [];

trackTypingLatency(latency: number) {
  this.typingLatencies.push(latency);
  
  // Keep only last 100 measurements
  if (this.typingLatencies.length > 100) {
    this.typingLatencies.shift();
  }
  
  // Calculate average
  this.metrics.typingLatency = 
    this.typingLatencies.reduce((a, b) => a + b, 0) / 
    this.typingLatencies.length;
}
```

### Memory Tracking

Memory tracking uses the Performance Memory API (Chrome only):

```typescript
updateMemoryUsage() {
  if (performance.memory && performance.memory.usedJSHeapSize) {
    // Convert bytes to megabytes
    this.metrics.memoryUsage = 
      performance.memory.usedJSHeapSize / (1024 * 1024);
  }
}
```

### Periodic Reporting

The monitor supports automatic periodic reporting:

```typescript
reportMetrics(callback: (metrics: PerformanceMetrics) => void) {
  this.reportCallback = callback;
  
  this.reportIntervalId = setInterval(() => {
    if (this.reportCallback) {
      this.reportCallback(this.getMetrics());
    }
  }, this.config.reportInterval);
}
```

### Sampling

To reduce overhead in production, the monitor supports sampling:

```typescript
private shouldSample(): boolean {
  return Math.random() < this.config.sampleRate;
}

startMeasure(label: string) {
  if (!this.shouldSample()) return;
  // ... measurement code ...
}
```

## Performance Considerations

### Overhead

The PerformanceMonitor is designed to have minimal overhead:

1. **Sampling**: Use `sampleRate` to reduce measurement frequency
2. **Lazy Updates**: Memory usage is only updated when metrics are requested
3. **Efficient Storage**: Uses Map for O(1) measurement lookup
4. **Limited History**: Keeps only last 100 measurements for averages

### Memory Management

1. **WeakMap**: Not used here as measurements need to be tracked by string labels
2. **Circular Buffer**: Rolling averages use array shifting to limit memory
3. **Cleanup**: `destroy()` method clears all data structures

### Browser Compatibility

The implementation gracefully handles missing APIs:

```typescript
private now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now(); // Fallback
}
```

## Integration Points

### Editor Initialization

```typescript
// In ErixEditor constructor
const monitor = getPerformanceMonitor();
monitor.startMeasure('init');

// ... initialization code ...

monitor.endMeasure('init');
monitor.markInitComplete();
```

### Typing Events

```typescript
// In input handler
editor.on('beforeInput', () => {
  monitor.startMeasure(`typing-${Date.now()}`);
});

editor.on('afterInput', (event) => {
  const duration = monitor.endMeasure(`typing-${event.timestamp}`);
  monitor.trackTypingLatency(duration);
});
```

### Render Cycle

```typescript
// In render method
useEffect(() => {
  monitor.startMeasure('render');
  
  return () => {
    const duration = monitor.endMeasure('render');
    monitor.trackRenderTime(duration);
  };
});
```

### Document Changes

```typescript
// When content changes
editor.on('change', (content) => {
  monitor.updateDocumentSize(content.length);
});
```

## Testing Strategy

### Unit Tests

Test individual methods and functionality:

```typescript
describe('PerformanceMonitor', () => {
  it('should measure operation duration', () => {
    const monitor = new PerformanceMonitor();
    monitor.startMeasure('test');
    // Simulate work
    const duration = monitor.endMeasure('test');
    expect(duration).toBeGreaterThan(0);
  });

  it('should calculate rolling average', () => {
    const monitor = new PerformanceMonitor();
    monitor.trackTypingLatency(40);
    monitor.trackTypingLatency(60);
    const metrics = monitor.getMetrics();
    expect(metrics.typingLatency).toBe(50);
  });
});
```

### Integration Tests

Test with actual editor operations:

```typescript
describe('Editor Performance', () => {
  it('should track typing latency', async () => {
    const monitor = getPerformanceMonitor();
    const editor = new ErixEditor();
    
    // Simulate typing
    await editor.type('Hello');
    
    const metrics = monitor.getMetrics();
    expect(metrics.typingLatency).toBeLessThan(50);
  });
});
```

### Performance Tests

Validate that monitoring doesn't impact performance:

```typescript
describe('Monitor Overhead', () => {
  it('should have minimal overhead', () => {
    const monitor = new PerformanceMonitor({ sampleRate: 1.0 });
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      monitor.startMeasure(`test-${i}`);
      monitor.endMeasure(`test-${i}`);
    }
    const duration = performance.now() - start;
    
    // Should complete 1000 measurements in < 100ms
    expect(duration).toBeLessThan(100);
  });
});
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  reportInterval: 5000,
  trackMemory: true,
};
```

### Production Configuration

```typescript
const productionConfig: PerformanceConfig = {
  enabled: true,
  sampleRate: 0.05, // 5% sampling
  reportInterval: 60000, // Report every minute
  trackMemory: true,
};
```

### Development Configuration

```typescript
const devConfig: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0, // Track everything
  reportInterval: 2000, // Report every 2 seconds
  trackMemory: true,
};
```

## Metrics

### PerformanceMetrics Interface

```typescript
interface PerformanceMetrics {
  initTime: number;        // Initialization time in ms
  typingLatency: number;   // Average typing latency in ms
  renderTime: number;      // Average render time in ms
  memoryUsage: number;     // Memory usage in MB
  documentSize: number;    // Document size in bytes
}
```

### Thresholds

Based on requirements:

- **Init Time**: < 3000ms (3 seconds)
- **Typing Latency**: < 50ms (Requirement 3.1)
- **Render Time**: < 100ms
- **Memory Usage**: < 100MB
- **Document Size**: No hard limit, but track for analytics

## Future Enhancements

1. **Network Metrics**: Track API call latency
2. **Bundle Size Tracking**: Monitor JavaScript bundle size
3. **First Contentful Paint**: Track FCP metric
4. **Time to Interactive**: Track TTI metric
5. **Long Task Detection**: Identify blocking operations
6. **Custom Metrics**: Allow registration of custom metrics
7. **Performance Budget**: Enforce performance budgets
8. **Regression Detection**: Alert on performance regressions

## Related Requirements

- **Requirement 3.1**: Performance optimization for large documents
  - Typing latency < 50ms
  - Virtual scrolling for 100+ blocks
  - Debouncing for expensive operations

- **Requirement 18.2**: Analytics and usage tracking
  - Performance metric tracking
  - Feature usage frequency
  - Error rates and types

## References

- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Performance Memory API](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)
- [User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API)
- [Web Vitals](https://web.dev/vitals/)
