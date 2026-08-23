# LazyLoadManager

Implements lazy loading for images and media to reduce initial page load time using the Intersection Observer API.

## Features

- **Intersection Observer Integration**: Efficient visibility detection without scroll event listeners
- **Image Placeholder System**: Multiple placeholder types (blur, skeleton, color, none)
- **Progressive Loading**: Load low-res preview first, then high-res image
- **Load Priority Queue**: Visible images load first, then nearby images
- **Loading State Management**: Track loading, loaded, and error states
- **Retry Logic**: Automatic retry on failed loads with exponential backoff
- **Concurrent Load Control**: Limit simultaneous image loads to prevent network congestion
- **React Hooks**: Easy integration with React components

## Requirements

Implements Requirement 3.6: Lazy load images and media to reduce initial page load time

## Installation

The LazyLoadManager is part of the `@ecodrix/erix-react` package:

```bash
npm install @ecodrix/erix-react
```

## Basic Usage

### Using React Hooks (Recommended)

```tsx
import { useLazyLoad } from '@ecodrix/erix-react';

function MyImage({ src }: { src: string }) {
  const { ref, isLoading, isLoaded, hasError } = useLazyLoad({ src });
  
  return (
    <div>
      <img ref={ref} alt="Lazy loaded" />
      {isLoading && <Spinner />}
      {hasError && <ErrorMessage />}
    </div>
  );
}
```

### Using the Manager Directly

```typescript
import { getLazyLoadManager } from '@ecodrix/erix-react';

const manager = getLazyLoadManager({
  rootMargin: '50px',
  threshold: 0.1,
  placeholderType: 'blur',
});

const imageElement = document.querySelector('img');
manager.observe(imageElement, 'https://example.com/image.jpg', {
  priority: 'high',
  onLoad: (element) => console.log('Image loaded!'),
  onError: (element, error) => console.error('Failed to load:', error),
});
```

## Configuration

### LazyLoadConfig

```typescript
interface LazyLoadConfig {
  // Root margin for Intersection Observer
  // Positive values load images before they enter viewport
  rootMargin: string; // Default: '50px'
  
  // Intersection threshold (0-1)
  threshold: number; // Default: 0.1
  
  // Type of placeholder to show while loading
  placeholderType: 'blur' | 'skeleton' | 'color' | 'none'; // Default: 'blur'
  
  // Enable progressive loading (low-res then high-res)
  progressiveLoading: boolean; // Default: true
  
  // Quality for low-res preview (0-1)
  lowResQuality: number; // Default: 0.1
  
  // Maximum concurrent image loads
  maxConcurrentLoads: number; // Default: 4
  
  // Retry failed loads
  retryOnError: boolean; // Default: true
  
  // Maximum retry attempts
  maxRetries: number; // Default: 3
  
  // Delay between retries in milliseconds
  retryDelay: number; // Default: 1000
  
  // Whether lazy loading is enabled
  enabled: boolean; // Default: true
}
```

## React Hooks

### useLazyLoad

Hook for lazy loading a single image.

```tsx
import { useLazyLoad } from '@ecodrix/erix-react';

function MyImage({ src, lowResSrc }: { src: string; lowResSrc?: string }) {
  const { ref, state, isLoading, isLoaded, hasError, load } = useLazyLoad({
    src,
    lowResSrc,
    priority: 'high',
    onLoad: (element) => console.log('Loaded!'),
    onError: (element, error) => console.error('Error:', error),
  });
  
  return (
    <div>
      <img ref={ref} alt="Lazy loaded" />
      {isLoading && <div>Loading...</div>}
      {hasError && <button onClick={load}>Retry</button>}
    </div>
  );
}
```

### useLazyImages

Hook for lazy loading multiple images.

```tsx
import { useLazyImages } from '@ecodrix/erix-react';

function ImageGallery({ images }: { images: string[] }) {
  const { refs, states, progress, allLoaded, loadAll } = useLazyImages({
    images: images.map(src => ({ src, priority: 'medium' })),
  });
  
  return (
    <div>
      <div>Progress: {Math.round(progress * 100)}%</div>
      <button onClick={loadAll} disabled={allLoaded}>
        Load All
      </button>
      
      {images.map((src, index) => (
        <img key={src} ref={refs[index]} alt="" />
      ))}
    </div>
  );
}
```

### useLazyLoadManager

Hook for accessing the lazy load manager and statistics.

```tsx
import { useLazyLoadManager } from '@ecodrix/erix-react';

function LazyLoadStats() {
  const { stats, loadAll, reset } = useLazyLoadManager();
  
  return (
    <div>
      <div>Total: {stats.total}</div>
      <div>Loaded: {stats.loaded}</div>
      <div>Loading: {stats.loading}</div>
      <div>Errors: {stats.error}</div>
      <button onClick={loadAll}>Load All</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Advanced Usage

### Progressive Loading

Load a low-resolution preview first, then the high-resolution image:

```tsx
const { ref } = useLazyLoad({
  src: 'https://example.com/image-hd.jpg',
  lowResSrc: 'https://example.com/image-preview.jpg',
  config: {
    progressiveLoading: true,
    placeholderType: 'blur',
  },
});
```

### Priority-Based Loading

Control which images load first:

```tsx
// High priority - loads immediately when visible
useLazyLoad({ src: heroImage, priority: 'high' });

// Medium priority - loads after high priority images
useLazyLoad({ src: contentImage, priority: 'medium' });

// Low priority - loads last
useLazyLoad({ src: footerImage, priority: 'low' });
```

### Custom Placeholder Types

```tsx
// Blur effect (default)
useLazyLoad({ src, config: { placeholderType: 'blur' } });

// Skeleton loading animation
useLazyLoad({ src, config: { placeholderType: 'skeleton' } });

// Solid color
useLazyLoad({ src, config: { placeholderType: 'color' } });

// No placeholder
useLazyLoad({ src, config: { placeholderType: 'none' } });
```

### Error Handling and Retry

```tsx
const { ref, hasError, load } = useLazyLoad({
  src,
  config: {
    retryOnError: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
  onError: (element, error) => {
    console.error('Failed to load image:', error);
    // Custom error handling
  },
});

// Manual retry
if (hasError) {
  return <button onClick={load}>Retry</button>;
}
```

### Controlling Concurrent Loads

Limit the number of images loading simultaneously:

```tsx
const manager = getLazyLoadManager({
  maxConcurrentLoads: 4, // Load max 4 images at once
});
```

### Load All Images

Force load all images immediately (bypass lazy loading):

```tsx
const { loadAll } = useLazyLoadManager();

// Load all images now
loadAll();
```

## API Reference

### LazyLoadManager Class

#### Methods

- `observe(element, src, options)`: Start observing an image element
- `unobserve(element)`: Stop observing an image element
- `loadAll()`: Load all images immediately
- `getState(element)`: Get the loading state of an image
- `getImageInfo(element)`: Get detailed information about an image
- `onLoad(callback)`: Register a callback for successful loads
- `onError(callback)`: Register a callback for load errors
- `getStats()`: Get statistics about lazy loading
- `updateConfig(config)`: Update configuration
- `getConfig()`: Get current configuration
- `reset()`: Reset to initial state
- `destroy()`: Clean up resources

#### Loading States

- `idle`: Image is queued but not loading yet
- `loading`: Image is currently loading
- `loaded`: Image loaded successfully
- `error`: Image failed to load

#### Priority Levels

- `high`: Load immediately when visible
- `medium`: Load after high priority images
- `low`: Load last

## Performance Considerations

### Optimal Configuration

```typescript
const config = {
  // Load images 50px before they enter viewport
  rootMargin: '50px',
  
  // Start loading when 10% of image is visible
  threshold: 0.1,
  
  // Limit concurrent loads to prevent network congestion
  maxConcurrentLoads: 4,
  
  // Enable progressive loading for better perceived performance
  progressiveLoading: true,
  
  // Retry failed loads automatically
  retryOnError: true,
  maxRetries: 3,
};
```

### Best Practices

1. **Use Progressive Loading**: Provide low-res previews for better UX
2. **Set Appropriate Priorities**: Hero images should be high priority
3. **Limit Concurrent Loads**: Prevent network congestion (4-6 is optimal)
4. **Use Placeholders**: Provide visual feedback during loading
5. **Handle Errors**: Provide retry mechanisms for failed loads
6. **Monitor Statistics**: Track loading performance with `getStats()`

### Browser Support

- **Intersection Observer**: Supported in all modern browsers
- **Fallback**: Automatically disables lazy loading in unsupported browsers

## Integration with ErixEditor

The LazyLoadManager integrates seamlessly with the ErixEditor for lazy loading images in documents:

```tsx
import { ErixEditor } from '@ecodrix/erix-react';
import { getLazyLoadManager } from '@ecodrix/erix-react';

function MyEditor() {
  const lazyLoadManager = getLazyLoadManager({
    rootMargin: '100px',
    progressiveLoading: true,
  });
  
  return (
    <ErixEditor
      initialContent="<p>Content with images...</p>"
      onImageInsert={(element, src) => {
        // Automatically lazy load inserted images
        lazyLoadManager.observe(element, src, {
          priority: 'medium',
        });
      }}
    />
  );
}
```

## Examples

See `LazyLoadExample.tsx` for complete working examples including:

- Basic lazy loading
- Progressive loading with previews
- Image gallery with multiple images
- Manager controls and statistics
- Custom placeholder types
- Priority-based loading

## Testing

```typescript
import { LazyLoadManager, resetLazyLoadManager } from '@ecodrix/erix-react';

describe('LazyLoadManager', () => {
  let manager: LazyLoadManager;
  
  beforeEach(() => {
    manager = new LazyLoadManager();
  });
  
  afterEach(() => {
    manager.destroy();
    resetLazyLoadManager();
  });
  
  it('should observe an image', () => {
    const img = document.createElement('img');
    const id = manager.observe(img, 'test.jpg');
    
    expect(id).toBeTruthy();
    expect(manager.getState(img)).toBe('idle');
  });
});
```

## Troubleshooting

### Images not loading

1. Check if Intersection Observer is supported in your browser
2. Verify the image URLs are correct and accessible
3. Check the `enabled` configuration option
4. Inspect the console for error messages

### Performance issues

1. Reduce `maxConcurrentLoads` if network is congested
2. Increase `rootMargin` to load images earlier
3. Use progressive loading with low-res previews
4. Monitor statistics with `getStats()`

### Memory leaks

1. Always call `unobserve()` when removing images
2. Call `destroy()` when unmounting components
3. Use the React hooks which handle cleanup automatically

## Related

- [PerformanceMonitor](./PerformanceMonitor.ts) - Performance tracking
- [VirtualScrollManager](./VirtualScrollManager.ts) - Virtual scrolling for large documents
- [ErixEditor](../../editor.ts) - Main editor component

## License

Part of the @ecodrix/erix-react package.
