/**
 * Unit tests for PerformanceMonitor
 *
 * Note: These tests require Vitest to be configured.
 * Run with: npm test or pnpm test
 *
 * Requirements: 3.1, 18.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  PerformanceMonitor,
  getPerformanceMonitor,
  resetPerformanceMonitor,
} from "./PerformanceMonitor";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset singleton before each test
    resetPerformanceMonitor();
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe("constructor", () => {
    it("should create instance with default config", () => {
      const config = monitor.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.sampleRate).toBe(1.0);
      expect(config.reportInterval).toBe(5000);
      expect(config.trackMemory).toBe(true);
    });

    it("should create instance with custom config", () => {
      const customMonitor = new PerformanceMonitor({
        enabled: false,
        sampleRate: 0.5,
        reportInterval: 10000,
        trackMemory: false,
      });
      const config = customMonitor.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.sampleRate).toBe(0.5);
      expect(config.reportInterval).toBe(10000);
      expect(config.trackMemory).toBe(false);
      customMonitor.destroy();
    });

    it("should initialize with zero metrics", () => {
      const metrics = monitor.getMetrics();
      expect(metrics.initTime).toBe(0);
      expect(metrics.typingLatency).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.documentSize).toBe(0);
    });
  });

  describe("startMeasure() and endMeasure()", () => {
    it("should measure operation duration", () => {
      monitor.startMeasure("test-operation");

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      const duration = monitor.endMeasure("test-operation");
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it("should return 0 for non-existent measurement", () => {
      const duration = monitor.endMeasure("non-existent");
      expect(duration).toBe(0);
    });

    it("should not measure when disabled", () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.startMeasure("test");
      const duration = disabledMonitor.endMeasure("test");
      expect(duration).toBe(0);
      disabledMonitor.destroy();
    });

    it("should update init time metric", () => {
      monitor.startMeasure("init");
      const duration = monitor.endMeasure("init");

      const metrics = monitor.getMetrics();
      expect(metrics.initTime).toBe(duration);
    });

    it("should update typing latency metric", () => {
      monitor.startMeasure("typing-1");
      const duration = monitor.endMeasure("typing-1");

      const metrics = monitor.getMetrics();
      expect(metrics.typingLatency).toBe(duration);
    });

    it("should update render time metric", () => {
      monitor.startMeasure("render-1");
      const duration = monitor.endMeasure("render-1");

      const metrics = monitor.getMetrics();
      expect(metrics.renderTime).toBe(duration);
    });
  });

  describe("markInitComplete()", () => {
    it("should record initialization time", () => {
      // Wait a bit to simulate initialization
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      monitor.markInitComplete();

      const metrics = monitor.getMetrics();
      expect(metrics.initTime).toBeGreaterThan(0);
      expect(metrics.initTime).toBeGreaterThanOrEqual(10);
    });

    it("should not record when disabled", () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.markInitComplete();

      const metrics = disabledMonitor.getMetrics();
      expect(metrics.initTime).toBe(0);
      disabledMonitor.destroy();
    });
  });

  describe("trackTypingLatency()", () => {
    it("should track single latency", () => {
      monitor.trackTypingLatency(45);

      const metrics = monitor.getMetrics();
      expect(metrics.typingLatency).toBe(45);
    });

    it("should calculate average of multiple latencies", () => {
      monitor.trackTypingLatency(40);
      monitor.trackTypingLatency(60);

      const metrics = monitor.getMetrics();
      expect(metrics.typingLatency).toBe(50);
    });

    it("should maintain rolling average of last 100 measurements", () => {
      // Add 101 measurements
      for (let i = 0; i < 101; i++) {
        monitor.trackTypingLatency(i);
      }

      const metrics = monitor.getMetrics();
      // Should average last 100 (1-100), not including 0
      const expected = ((1 + 100) * 100) / 2 / 100; // Sum of 1 to 100 divided by 100
      expect(metrics.typingLatency).toBe(expected);
    });

    it("should not track when disabled", () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.trackTypingLatency(45);

      const metrics = disabledMonitor.getMetrics();
      expect(metrics.typingLatency).toBe(0);
      disabledMonitor.destroy();
    });
  });

  describe("trackRenderTime()", () => {
    it("should track single render time", () => {
      monitor.trackRenderTime(85);

      const metrics = monitor.getMetrics();
      expect(metrics.renderTime).toBe(85);
    });

    it("should calculate average of multiple render times", () => {
      monitor.trackRenderTime(80);
      monitor.trackRenderTime(100);

      const metrics = monitor.getMetrics();
      expect(metrics.renderTime).toBe(90);
    });

    it("should maintain rolling average of last 100 measurements", () => {
      // Add 101 measurements
      for (let i = 0; i < 101; i++) {
        monitor.trackRenderTime(i);
      }

      const metrics = monitor.getMetrics();
      // Should average last 100 (1-100), not including 0
      const expected = ((1 + 100) * 100) / 2 / 100;
      expect(metrics.renderTime).toBe(expected);
    });

    it("should not track when disabled", () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.trackRenderTime(85);

      const metrics = disabledMonitor.getMetrics();
      expect(metrics.renderTime).toBe(0);
      disabledMonitor.destroy();
    });
  });

  describe("updateDocumentSize()", () => {
    it("should update document size", () => {
      monitor.updateDocumentSize(50000);

      const metrics = monitor.getMetrics();
      expect(metrics.documentSize).toBe(50000);
    });

    it("should not update when disabled", () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.updateDocumentSize(50000);

      const metrics = disabledMonitor.getMetrics();
      expect(metrics.documentSize).toBe(0);
      disabledMonitor.destroy();
    });
  });

  describe("getMetrics()", () => {
    it("should return current metrics", () => {
      monitor.trackTypingLatency(45);
      monitor.trackRenderTime(85);
      monitor.updateDocumentSize(50000);

      const metrics = monitor.getMetrics();
      expect(metrics.typingLatency).toBe(45);
      expect(metrics.renderTime).toBe(85);
      expect(metrics.documentSize).toBe(50000);
    });

    it("should return a copy of metrics", () => {
      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe("reportMetrics()", () => {
    it("should call callback with metrics", () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      monitor.reportMetrics(callback);

      // Should not call immediately
      expect(callback).not.toHaveBeenCalled();

      // Should call after interval
      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          initTime: expect.any(Number),
          typingLatency: expect.any(Number),
          renderTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          documentSize: expect.any(Number),
        }),
      );

      vi.useRealTimers();
    });

    it("should call callback multiple times", () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      monitor.reportMetrics(callback);

      vi.advanceTimersByTime(15000); // 3 intervals
      expect(callback).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it("should clear previous interval when called again", () => {
      vi.useFakeTimers();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      monitor.reportMetrics(callback1);
      monitor.reportMetrics(callback2);

      vi.advanceTimersByTime(5000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("should not report when disabled", () => {
      vi.useFakeTimers();
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      const callback = vi.fn();

      disabledMonitor.reportMetrics(callback);
      vi.advanceTimersByTime(5000);

      expect(callback).not.toHaveBeenCalled();

      vi.useRealTimers();
      disabledMonitor.destroy();
    });
  });

  describe("stopReporting()", () => {
    it("should stop periodic reporting", () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      monitor.reportMetrics(callback);
      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);

      monitor.stopReporting();
      vi.advanceTimersByTime(10000);
      expect(callback).toHaveBeenCalledTimes(1); // No additional calls

      vi.useRealTimers();
    });
  });

  describe("getSummary()", () => {
    it("should return formatted summary", () => {
      monitor.trackTypingLatency(45);
      monitor.trackRenderTime(85);
      monitor.updateDocumentSize(50000);

      const summary = monitor.getSummary();
      expect(summary).toContain("Performance Summary");
      expect(summary).toContain("Typing Latency: 45.00ms");
      expect(summary).toContain("Render Time: 85.00ms");
      expect(summary).toContain("Document Size: 50000 bytes");
    });
  });

  describe("checkThresholds()", () => {
    it("should pass when all metrics are within thresholds", () => {
      monitor.trackTypingLatency(40);
      monitor.trackRenderTime(80);

      const result = monitor.checkThresholds({
        typingLatency: 50,
        renderTime: 100,
      });

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should fail when metrics exceed thresholds", () => {
      monitor.trackTypingLatency(60);
      monitor.trackRenderTime(120);

      const result = monitor.checkThresholds({
        typingLatency: 50,
        renderTime: 100,
      });

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0]).toContain("Typing latency");
      expect(result.violations[1]).toContain("Render time");
    });

    it("should check init time threshold", () => {
      monitor.startMeasure("init");
      // Simulate long init
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }
      monitor.endMeasure("init");

      const result = monitor.checkThresholds({
        initTime: 30,
      });

      expect(result.passed).toBe(false);
      expect(result.violations[0]).toContain("Init time");
    });

    it("should check memory usage threshold", () => {
      // Mock performance.memory
      const originalMemory = (performance as any).memory;
      (performance as any).memory = {
        usedJSHeapSize: 150 * 1024 * 1024, // 150MB
      };

      const result = monitor.checkThresholds({
        memoryUsage: 100,
      });

      expect(result.passed).toBe(false);
      expect(result.violations[0]).toContain("Memory usage");

      // Restore
      (performance as any).memory = originalMemory;
    });

    it("should check document size threshold", () => {
      monitor.updateDocumentSize(2000000); // 2MB

      const result = monitor.checkThresholds({
        documentSize: 1000000, // 1MB
      });

      expect(result.passed).toBe(false);
      expect(result.violations[0]).toContain("Document size");
    });
  });

  describe("resetMetrics()", () => {
    it("should reset all metrics to zero", () => {
      monitor.trackTypingLatency(45);
      monitor.trackRenderTime(85);
      monitor.updateDocumentSize(50000);

      monitor.resetMetrics();

      const metrics = monitor.getMetrics();
      expect(metrics.initTime).toBe(0);
      expect(metrics.typingLatency).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.documentSize).toBe(0);
    });

    it("should clear measurement history", () => {
      monitor.startMeasure("test");
      monitor.resetMetrics();

      const duration = monitor.endMeasure("test");
      expect(duration).toBe(0);
    });
  });

  describe("clearMeasurements()", () => {
    it("should clear active measurements", () => {
      monitor.startMeasure("test1");
      monitor.startMeasure("test2");

      monitor.clearMeasurements();

      expect(monitor.endMeasure("test1")).toBe(0);
      expect(monitor.endMeasure("test2")).toBe(0);
    });
  });

  describe("updateConfig()", () => {
    it("should update configuration", () => {
      monitor.updateConfig({ sampleRate: 0.5 });
      expect(monitor.getConfig().sampleRate).toBe(0.5);
    });

    it("should restart reporting with new interval", () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      monitor.reportMetrics(callback);
      monitor.updateConfig({ reportInterval: 2000 });

      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("destroy()", () => {
    it("should stop reporting", () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      monitor.reportMetrics(callback);
      monitor.destroy();

      vi.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should clear measurements", () => {
      monitor.startMeasure("test");
      monitor.destroy();

      expect(monitor.endMeasure("test")).toBe(0);
    });
  });

  describe("sampling", () => {
    it("should respect sample rate", () => {
      const sampledMonitor = new PerformanceMonitor({ sampleRate: 0 });

      sampledMonitor.startMeasure("test");
      const duration = sampledMonitor.endMeasure("test");

      // With 0% sample rate, should not measure
      expect(duration).toBe(0);

      sampledMonitor.destroy();
    });
  });
});

describe("Singleton functions", () => {
  afterEach(() => {
    resetPerformanceMonitor();
  });

  describe("getPerformanceMonitor()", () => {
    it("should return singleton instance", () => {
      const instance1 = getPerformanceMonitor();
      const instance2 = getPerformanceMonitor();
      expect(instance1).toBe(instance2);
    });

    it("should create instance with config on first call", () => {
      const instance = getPerformanceMonitor({ sampleRate: 0.5 });
      expect(instance.getConfig().sampleRate).toBe(0.5);
    });

    it("should update config on subsequent calls", () => {
      const instance1 = getPerformanceMonitor({ sampleRate: 0.5 });
      const instance2 = getPerformanceMonitor({ reportInterval: 10000 });

      expect(instance1).toBe(instance2);
      expect(instance2.getConfig().sampleRate).toBe(0.5);
      expect(instance2.getConfig().reportInterval).toBe(10000);
    });
  });

  describe("resetPerformanceMonitor()", () => {
    it("should destroy and reset singleton instance", () => {
      const instance1 = getPerformanceMonitor();
      resetPerformanceMonitor();
      const instance2 = getPerformanceMonitor();

      expect(instance1).not.toBe(instance2);
    });
  });
});

describe("Performance API integration", () => {
  it("should use performance.now() when available", () => {
    const monitor = new PerformanceMonitor();

    monitor.startMeasure("test");
    const duration = monitor.endMeasure("test");

    expect(duration).toBeGreaterThanOrEqual(0);
    monitor.destroy();
  });

  it("should create performance marks when available", () => {
    const monitor = new PerformanceMonitor();

    monitor.startMeasure("test-mark");
    monitor.endMeasure("test-mark");

    // Check if marks were created
    const entries = monitor.getPerformanceEntries("mark");
    const hasStartMark = entries.some((e) => e.name === "test-mark-start");
    const hasEndMark = entries.some((e) => e.name === "test-mark-end");

    expect(hasStartMark || hasEndMark).toBe(true);
    monitor.destroy();
  });
});
