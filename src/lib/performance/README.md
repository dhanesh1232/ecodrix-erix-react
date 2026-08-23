# Performance Monitor

The PerformanceMonitor provides comprehensive performance tracking for the ErixEditor, including initialization time, typing latency, render time, memory usage, and document size metrics.

## Features

- **Initialization Time Tracking**: Measure how long the editor takes to initialize
- **Typing Latency Monitoring**: Track average typing response time
- **Render Time Measurement**: Monitor rendering performance
- **Memory Usage Tracking**: Track JavaScript heap memory usage
- **Document Size Tracking**: Monitor document size changes
- **Periodic Reporting**: Automatic metric reporting at configurable intervals
- **Performance Thresholds**: Check if metrics exceed acceptable limits
- **Browser Performance API Integration**: Uses native Performance API when available

## Requirements

This implementation satisfies:
- **Requirement 3.1**: Performance optimization for large documents
- **Requirement 18.2**: Analytics and usage tracking

## Usage

### Basic Usage

```typescript
import { PerformanceMonitor } from '@ecodrix/erix-react';

// Create a performance monitor
const monitor = new PerformanceMonitor({
  enabled: true,
  sampleRate: 1.0, // Track 100% of operations
  reportInterval: 5000, // Report every 5 seconds
  trackMemory: true,
});

// Mark initialization start (done automatically in constructor)
// ... editor initialization code ...

// Mark initialization complete
monitor.markInitComplete();

// Measure a specific operation
monitor.startMeasure('render-content');
// ... rendering code ...
const duration = monitor.endMeasure('render-content');
console.log(`Render took ${duration}ms`);

// Track typing latency
monitor.trackTypingLatency(45); // 45ms

// Update document size
monitor.updateDocumentSize(50000); // 50KB

// Get current metrics
const metrics = monitor.getMetrics();
console.log(metrics);
// {
//   initTime: 250,
//   typingLatency: 45,
//   renderTime: 120,
//   memoryUsage: 25.5,
//   documentSize: 50000
// }
```

### Periodic Reporting

```typescript
// Set up automatic reporting
monitor.reportMetrics((metrics) => {
  console.log('Performance Report:', metrics);
  
  // Send to analytics service
  analytics.track('editor_performance', metrics);
});

// Stop reporting when done
monitor.stopReporting();
```

### Using the Singleton

```typescript
import { getPerformanceMonitor } from '@ecodrix/erix-react';

// Get or create the global instance
const monitor = getPerformanceMonitor({
  enabled: true,
  reportInterval: 10000,
});

// Use the monitor
monitor.startMeasure('typing-1');
// ... typing code ...
monitor.endMeasure('typing-1');
```

### Performance Thresholds

```typescript
// Check if performance meets requirements
const result = monitor.checkThresholds({
  initTime: 3000, // 3 seconds max
  typingLatency: 50, // 50ms max
  renderTime: 100, // 100ms max
  memoryUsage: 100, // 100MB max
});

if (!result.passed) {
  console.warn('Performance issues detected:');
  result.violations.forEach(v => console.warn(`  - ${v}`));
}
```

### React Integration

```typescript
import { useEffect, useState } from 'react';
import { getPerformanceMonitor, PerformanceMetrics } from '@ecodrix/erix-react';

function EditorPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    // Set up reporting
    monitor.reportMetrics((m) => {
      setMetrics(m);
    });

    return () => {
      monitor.stopReporting();
    };
  }, []);

  if (!metrics) return null;

  return (
    <div className="performance-stats">
      <div>Init: {metrics.initTime.toFixed(0)}ms</div>
      <div>Typing: {metrics.typingLatency.toFixed(0)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
      <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
    </div>
  );
}
```

## API Reference

### PerformanceMonitor

#### Constructor

```typescript
constructor(config?: Partial<PerformanceConfig>)
```

Creates a new PerformanceMonitor instance with optional configuration.

#### Methods

##### `startMeasure(label: string): void`

Start measuring a performance metric. The label should be unique for each measurement.

```typescript
monitor.startMeasure('render-toolbar');
```

##### `endMeasure(label: string): number`

End a measurement and return the duration in milliseconds.

```typescript
const duration = monitor.endMeasure('render-toolbar');
```

##### `markInitComplete(): void`

Mark editor initialization as complete and record the initialization time.

```typescript
monitor.markInitComplete();
```

##### `trackTypingLatency(latency: number): void`

Track a typing latency measurement. The monitor maintains a rolling average of the last 100 measurements.

```typescript
monitor.trackTypingLatency(42);
```

##### `trackRenderTime(renderTime: number): void`

Track a render time measurement. The monitor maintains a rolling average of the last 100 measurements.

```typescript
monitor.trackRenderTime(85);
```

##### `updateMemoryUsage(): void`

Update the memory usage metric using the Performance Memory API (if available).

```typescript
monitor.updateMemoryUsage();
```

##### `updateDocumentSize(size: number): void`

Update the document size metric.

```typescript
monitor.updateDocumentSize(document.length);
```

##### `getMetrics(): PerformanceMetrics`

Get the current performance metrics.

```typescript
const metrics = monitor.getMetrics();
```

##### `reportMetrics(callback: (metrics: PerformanceMetrics) => void): void`

Register a callback for periodic metric reporting.

```typescript
monitor.reportMetrics((metrics) => {
  console.log('Performance:', metrics);
});
```

##### `stopReporting(): void`

Stop periodic metric reporting.

```typescript
monitor.stopReporting();
```

##### `getSummary(): string`

Get a human-readable summary of performance metrics.

```typescript
console.log(monitor.getSummary());
```

##### `checkThresholds(thresholds: Partial<PerformanceMetrics>): { passed: boolean; violations: string[] }`

Check if current metrics exceed specified thresholds.

```typescript
const result = monitor.checkThresholds({
  typingLatency: 50,
  renderTime: 100,
});
```

##### `resetMetrics(): void`

Reset all metrics to initial state.

```typescript
monitor.resetMetrics();
```

##### `clearMeasurements(): void`

Clear all active measurements.

```typescript
monitor.clearMeasurements();
```

##### `destroy(): void`

Clean up resources and stop reporting.

```typescript
monitor.destroy();
```

### Interfaces

#### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  initTime: number;        // Initialization time in ms
  typingLatency: number;   // Average typing latency in ms
  renderTime: number;      // Average render time in ms
  memoryUsage: number;     // Memory usage in MB
  documentSize: number;    // Document size in bytes
}
```

#### PerformanceConfig

```typescript
interface PerformanceConfig {
  enabled: boolean;        // Enable/disable monitoring
  sampleRate: number;      // 0-1, percentage of operations to measure
  reportInterval: number;  // Milliseconds between reports
  trackMemory: boolean;    // Enable memory tracking
}
```

## Performance Considerations

### Sample Rate

For production environments with high traffic, consider reducing the sample rate to minimize overhead:

```typescript
const monitor = new PerformanceMonitor({
  sampleRate: 0.1, // Track only 10% of operations
});
```

### Memory Tracking

Memory tracking uses the Performance Memory API, which may not be available in all browsers. The monitor gracefully handles this:

```typescript
const monitor = new PerformanceMonitor({
  trackMemory: true, // Will only track if API is available
});
```

### Browser Compatibility

The PerformanceMonitor uses the following browser APIs:
- `performance.now()` - High-resolution timestamps
- `performance.mark()` / `performance.measure()` - Performance marks
- `performance.memory` - Memory usage (Chrome only)

All APIs are used with fallbacks for maximum compatibility.

## Best Practices

1. **Use Descriptive Labels**: Use clear, consistent labels for measurements
   ```typescript
   monitor.startMeasure('render-toolbar');
   monitor.startMeasure('typing-123');
   ```

2. **Clean Up Measurements**: Always call `endMeasure()` for every `startMeasure()`
   ```typescript
   monitor.startMeasure('operation');
   try {
     // ... operation code ...
   } finally {
     monitor.endMeasure('operation');
   }
   ```

3. **Use Singleton for Global Metrics**: Use `getPerformanceMonitor()` for application-wide tracking
   ```typescript
   const monitor = getPerformanceMonitor();
   ```

4. **Set Appropriate Thresholds**: Define thresholds based on your performance requirements
   ```typescript
   const thresholds = {
     typingLatency: 50,  // Requirement 3.1: < 50ms
     initTime: 3000,     // < 3 seconds
   };
   ```

5. **Monitor in Production**: Use sampling to track real-world performance
   ```typescript
   const monitor = new PerformanceMonitor({
     sampleRate: 0.05, // 5% sampling in production
     reportInterval: 60000, // Report every minute
   });
   ```

## Examples

### Measuring Editor Operations

```typescript
const monitor = getPerformanceMonitor();

// Measure initialization
monitor.startMeasure('init');
const editor = new ErixEditor(config);
monitor.endMeasure('init');
monitor.markInitComplete();

// Measure typing
editor.on('beforeInput', () => {
  monitor.startMeasure(`typing-${Date.now()}`);
});

editor.on('afterInput', (event) => {
  const duration = monitor.endMeasure(`typing-${event.timestamp}`);
  monitor.trackTypingLatency(duration);
});

// Measure rendering
editor.on('beforeRender', () => {
  monitor.startMeasure('render');
});

editor.on('afterRender', () => {
  const duration = monitor.endMeasure('render');
  monitor.trackRenderTime(duration);
});
```

### Performance Dashboard

```typescript
import { getPerformanceMonitor } from '@ecodrix/erix-react';

function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    monitor.reportMetrics((m) => {
      setMetrics(m);
      
      // Check thresholds
      const result = monitor.checkThresholds({
        typingLatency: 50,
        renderTime: 100,
        memoryUsage: 100,
      });
      
      setViolations(result.violations);
    });

    return () => monitor.stopReporting();
  }, []);

  return (
    <div>
      <h2>Performance Metrics</h2>
      {metrics && (
        <div>
          <Metric label="Init Time" value={metrics.initTime} unit="ms" />
          <Metric label="Typing Latency" value={metrics.typingLatency} unit="ms" />
          <Metric label="Render Time" value={metrics.renderTime} unit="ms" />
          <Metric label="Memory Usage" value={metrics.memoryUsage} unit="MB" />
        </div>
      )}
      
      {violations.length > 0 && (
        <div className="warnings">
          <h3>Performance Warnings</h3>
          {violations.map((v, i) => (
            <div key={i} className="warning">{v}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Testing

```typescript
import { PerformanceMonitor, resetPerformanceMonitor } from '@ecodrix/erix-react';

describe('PerformanceMonitor', () => {
  afterEach(() => {
    resetPerformanceMonitor();
  });

  it('should measure operation duration', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.startMeasure('test');
    // Simulate work
    const duration = monitor.endMeasure('test');
    
    expect(duration).toBeGreaterThan(0);
  });

  it('should track typing latency', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.trackTypingLatency(45);
    monitor.trackTypingLatency(50);
    
    const metrics = monitor.getMetrics();
    expect(metrics.typingLatency).toBe(47.5);
  });
});
```

## Related

- [AccessibilityManager](../accessibility/README.md) - Accessibility features
- [MobileAdapter](../mobile/README.md) - Mobile optimizations
- [ErixEditor](../../components/ErixEditor/README.md) - Main editor component
