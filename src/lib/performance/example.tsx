/**
 * Example usage of PerformanceMonitor
 * 
 * This file demonstrates how to use the PerformanceMonitor
 * in a React component with the ErixEditor.
 */

import React, { useEffect, useState } from 'react';
import { usePerformance, usePerformanceThresholds } from './usePerformance';
import type { PerformanceMetrics } from './PerformanceMonitor';

/**
 * Example: Performance Dashboard Component
 * 
 * Displays real-time performance metrics for the editor
 */
export function PerformanceDashboard() {
  const { metrics } = usePerformance({
    autoReport: true,
    reportInterval: 2000, // Update every 2 seconds
  });

  if (!metrics) {
    return <div>Loading performance metrics...</div>;
  }

  return (
    <div className="performance-dashboard">
      <h3>Editor Performance</h3>
      <div className="metrics-grid">
        <MetricCard
          label="Initialization"
          value={metrics.initTime}
          unit="ms"
          threshold={3000}
        />
        <MetricCard
          label="Typing Latency"
          value={metrics.typingLatency}
          unit="ms"
          threshold={50}
        />
        <MetricCard
          label="Render Time"
          value={metrics.renderTime}
          unit="ms"
          threshold={100}
        />
        <MetricCard
          label="Memory Usage"
          value={metrics.memoryUsage}
          unit="MB"
          threshold={100}
        />
        <MetricCard
          label="Document Size"
          value={metrics.documentSize / 1024}
          unit="KB"
          threshold={1000}
        />
      </div>
    </div>
  );
}

/**
 * Example: Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  threshold?: number;
}

function MetricCard({ label, value, unit, threshold }: MetricCardProps) {
  const isWarning = threshold !== undefined && value > threshold;
  
  return (
    <div className={`metric-card ${isWarning ? 'warning' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value.toFixed(1)} <span className="metric-unit">{unit}</span>
      </div>
      {isWarning && (
        <div className="metric-warning">
          Exceeds threshold ({threshold} {unit})
        </div>
      )}
    </div>
  );
}

/**
 * Example: Performance Warnings Component
 * 
 * Shows warnings when performance thresholds are exceeded
 */
export function PerformanceWarnings() {
  const violations = usePerformanceThresholds({
    typingLatency: 50,
    renderTime: 100,
    memoryUsage: 100,
  });

  if (violations.length === 0) {
    return null;
  }

  return (
    <div className="performance-warnings">
      <h4>⚠️ Performance Warnings</h4>
      <ul>
        {violations.map((violation, index) => (
          <li key={index}>{violation}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example: Editor with Performance Monitoring
 * 
 * Demonstrates how to integrate performance monitoring
 * with editor operations
 */
export function EditorWithPerformance() {
  const {
    metrics,
    startMeasure,
    endMeasure,
    trackTypingLatency,
    updateDocumentSize,
  } = usePerformance({
    autoReport: true,
    reportInterval: 5000,
  });

  const [content, setContent] = useState('');

  // Track typing latency
  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const start = performance.now();
    
    // Simulate input processing
    const newContent = event.currentTarget.textContent || '';
    setContent(newContent);
    
    const latency = performance.now() - start;
    trackTypingLatency(latency);
    updateDocumentSize(newContent.length);
  };

  // Track render time
  useEffect(() => {
    startMeasure('render');
    
    return () => {
      endMeasure('render');
    };
  });

  return (
    <div className="editor-container">
      <div
        contentEditable
        onInput={handleInput}
        className="editor-content"
      >
        {content}
      </div>
      
      {metrics && (
        <div className="editor-stats">
          <span>Typing: {metrics.typingLatency.toFixed(0)}ms</span>
          <span>Render: {metrics.renderTime.toFixed(0)}ms</span>
          <span>Size: {(metrics.documentSize / 1024).toFixed(1)}KB</span>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Performance Summary Component
 * 
 * Shows a detailed performance summary
 */
export function PerformanceSummary() {
  const { getSummary } = usePerformance();
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const updateSummary = () => {
      setSummary(getSummary());
    };

    updateSummary();
    const intervalId = setInterval(updateSummary, 5000);

    return () => clearInterval(intervalId);
  }, [getSummary]);

  return (
    <div className="performance-summary">
      <h3>Performance Summary</h3>
      <pre>{summary}</pre>
    </div>
  );
}

/**
 * Example: Complete Performance Monitoring Setup
 * 
 * Shows how to set up comprehensive performance monitoring
 * for an editor application
 */
export function EditorApp() {
  return (
    <div className="editor-app">
      <header>
        <h1>Editor with Performance Monitoring</h1>
        <PerformanceWarnings />
      </header>
      
      <main>
        <EditorWithPerformance />
      </main>
      
      <aside>
        <PerformanceDashboard />
        <PerformanceSummary />
      </aside>
    </div>
  );
}

/**
 * Example CSS (for reference)
 */
export const exampleStyles = `
.performance-dashboard {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.metric-card {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 2px solid #e0e0e0;
}

.metric-card.warning {
  border-color: #ff9800;
  background: #fff3e0;
}

.metric-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.metric-unit {
  font-size: 0.875rem;
  font-weight: normal;
  color: #999;
}

.metric-warning {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #f57c00;
}

.performance-warnings {
  padding: 1rem;
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  margin-bottom: 1rem;
}

.performance-warnings h4 {
  margin: 0 0 0.5rem 0;
  color: #f57c00;
}

.performance-warnings ul {
  margin: 0;
  padding-left: 1.5rem;
}

.editor-container {
  position: relative;
}

.editor-content {
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.editor-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.performance-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.performance-summary pre {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
}
`;
