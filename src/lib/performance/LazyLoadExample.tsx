/**
 * Example component demonstrating LazyLoadManager usage
 *
 * Shows various use cases:
 * - Basic lazy loading with useLazyLoad hook
 * - Multiple images with useLazyImages hook
 * - Manager controls with useLazyLoadManager hook
 * - Different placeholder types
 * - Progressive loading
 * - Priority-based loading
 *
 * Requirements: 3.6
 */

import React, { useState } from "react";
import {
  useLazyLoad,
  useLazyImages,
  useLazyLoadManager,
  type LoadPriority,
} from "./useLazyLoad";

/**
 * Example 1: Basic lazy loading with single image
 */
export function BasicLazyImage({ src, alt }: { src: string; alt: string }) {
  const { ref, isLoading, isLoaded, hasError, load } = useLazyLoad({
    src,
    priority: "medium",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "300px" }}>
      <img
        ref={ref}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isLoaded ? 1 : 0.5,
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="spinner">Loading...</div>
        </div>
      )}

      {hasError && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "red",
          }}
        >
          Failed to load image
        </div>
      )}

      {!isLoaded && !isLoading && (
        <button
          onClick={load}
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
          }}
        >
          Load Now
        </button>
      )}
    </div>
  );
}

/**
 * Example 2: Progressive loading with low-res preview
 */
export function ProgressiveLazyImage({
  src,
  lowResSrc,
  alt,
}: {
  src: string;
  lowResSrc: string;
  alt: string;
}) {
  const { ref, isLoading, isLoaded } = useLazyLoad({
    src,
    lowResSrc,
    priority: "high",
    config: {
      progressiveLoading: true,
      placeholderType: "blur",
    },
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "300px" }}>
      <img
        ref={ref}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Loading HD...
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Image gallery with multiple lazy-loaded images
 */
export function LazyImageGallery({ images }: { images: string[] }) {
  const { refs, states, progress, allLoaded, loadAll } = useLazyImages({
    images: images.map((src, index) => ({
      src,
      priority: index < 3 ? "high" : "medium", // First 3 images have high priority
    })),
    config: {
      placeholderType: "skeleton",
      maxConcurrentLoads: 4,
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "10px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <div>
          <strong>Progress:</strong> {Math.round(progress * 100)}%
          <div
            style={{
              width: "200px",
              height: "8px",
              background: "#e0e0e0",
              borderRadius: "4px",
              marginTop: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "#4caf50",
                transition: "width 0.3s ease-in-out",
              }}
            />
          </div>
        </div>

        <button
          onClick={loadAll}
          disabled={allLoaded}
          style={{
            padding: "8px 16px",
            background: allLoaded ? "#ccc" : "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: allLoaded ? "not-allowed" : "pointer",
          }}
        >
          {allLoaded ? "All Loaded" : "Load All"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "16px",
        }}
      >
        {images.map((src, index) => (
          <div
            key={src}
            style={{
              position: "relative",
              aspectRatio: "16/9",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#f0f0f0",
            }}
          >
            <img
              ref={refs[index]}
              alt={`Gallery image ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {states[index] === "loading" && "⏳ Loading..."}
              {states[index] === "loaded" && "✓ Loaded"}
              {states[index] === "error" && "✗ Error"}
              {states[index] === "idle" && "⏸ Queued"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Manager controls and statistics
 */
export function LazyLoadManagerControls() {
  const { stats, loadAll, reset } = useLazyLoadManager({
    config: {
      maxConcurrentLoads: 4,
      retryOnError: true,
      maxRetries: 3,
    },
  });

  return (
    <div
      style={{
        padding: "20px",
        background: "#f5f5f5",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Lazy Load Manager</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <StatCard label="Total Images" value={stats.total} />
        <StatCard label="Loaded" value={stats.loaded} color="#4caf50" />
        <StatCard label="Loading" value={stats.loading} color="#2196f3" />
        <StatCard label="Queued" value={stats.idle} color="#ff9800" />
        <StatCard label="Errors" value={stats.error} color="#f44336" />
        <StatCard label="Queue Size" value={stats.queueSize} />
        <StatCard label="Active Loads" value={stats.activeLoads} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={loadAll}
          style={{
            padding: "8px 16px",
            background: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Load All
        </button>

        <button
          onClick={reset}
          style={{
            padding: "8px 16px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Helper component for displaying statistics
 */
function StatCard({
  label,
  value,
  color = "#666",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        background: "white",
        borderRadius: "4px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

/**
 * Example 5: Complete demo with all features
 */
export function LazyLoadDemo() {
  const [placeholderType, setPlaceholderType] = useState<
    "blur" | "skeleton" | "color" | "none"
  >("blur");
  const [priority, setPriority] = useState<LoadPriority>("medium");

  // Sample images (replace with actual URLs)
  const sampleImages = [
    "https://picsum.photos/400/300?random=1",
    "https://picsum.photos/400/300?random=2",
    "https://picsum.photos/400/300?random=3",
    "https://picsum.photos/400/300?random=4",
    "https://picsum.photos/400/300?random=5",
    "https://picsum.photos/400/300?random=6",
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Lazy Load Manager Demo</h1>

      <div style={{ marginBottom: "30px" }}>
        <h2>Configuration</h2>
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label>
              Placeholder Type:
              <select
                value={placeholderType}
                onChange={(e) => setPlaceholderType(e.target.value as any)}
                style={{ marginLeft: "8px", padding: "4px" }}
              >
                <option value="blur">Blur</option>
                <option value="skeleton">Skeleton</option>
                <option value="color">Color</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Priority:
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LoadPriority)}
                style={{ marginLeft: "8px", padding: "4px" }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <LazyLoadManagerControls />

      <div style={{ marginBottom: "30px" }}>
        <h2>Single Image Example</h2>
        <BasicLazyImage
          src="https://picsum.photos/800/400?random=single"
          alt="Single lazy loaded image"
        />
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Progressive Loading Example</h2>
        <ProgressiveLazyImage
          src="https://picsum.photos/800/400?random=progressive"
          lowResSrc="https://picsum.photos/80/40?random=progressive"
          alt="Progressive lazy loaded image"
        />
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Image Gallery Example</h2>
        <LazyImageGallery images={sampleImages} />
      </div>
    </div>
  );
}

export default LazyLoadDemo;
