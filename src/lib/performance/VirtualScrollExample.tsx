/**
 * Example component demonstrating VirtualScrollManager usage
 * 
 * This example shows how to implement virtual scrolling for a large document
 * with 10,000+ blocks while maintaining smooth performance.
 * 
 * Requirements: 3.2
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualScroll } from './useVirtualScroll';

/**
 * Example block data structure
 */
interface Block {
  id: string;
  content: string;
  type: 'paragraph' | 'heading' | 'code';
}

/**
 * Props for VirtualScrollExample component
 */
interface VirtualScrollExampleProps {
  /**
   * Array of blocks to render
   */
  blocks: Block[];
  
  /**
   * Height of each block in pixels
   */
  blockHeight?: number;
  
  /**
   * Container height in pixels
   */
  containerHeight?: number;
}

/**
 * Example component demonstrating virtual scrolling
 * 
 * This component efficiently renders large documents by only rendering
 * visible blocks plus a buffer zone.
 * 
 * Requirements: 3.2
 */
export function VirtualScrollExample({
  blocks,
  blockHeight = 24,
  containerHeight = 600,
}: VirtualScrollExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use virtual scroll hook
  const {
    visibleRange,
    scrollToBlock,
    offsetTop,
    totalHeight,
    stats,
    isActive,
  } = useVirtualScroll(containerRef, {
    totalBlocks: blocks.length,
    config: {
      itemHeight: blockHeight,
      bufferSize: 5,
      threshold: 100,
      enabled: true,
    },
    onRangeChange: (range) => {
      console.log('Visible range changed:', range);
    },
  });
  
  // Get visible blocks
  const visibleBlocks = useMemo(() => {
    if (!visibleRange) return blocks;
    return blocks.slice(visibleRange.start, visibleRange.end + 1);
  }, [blocks, visibleRange]);
  
  // Render block based on type
  const renderBlock = (block: Block, index: number) => {
    const actualIndex = visibleRange ? visibleRange.start + index : index;
    
    const style: React.CSSProperties = {
      height: blockHeight,
      padding: '4px 8px',
      borderBottom: '1px solid #eee',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
    
    switch (block.type) {
      case 'heading':
        return (
          <div key={block.id} style={{ ...style, fontWeight: 'bold', fontSize: '18px' }}>
            {actualIndex}. {block.content}
          </div>
        );
      case 'code':
        return (
          <div
            key={block.id}
            style={{
              ...style,
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
            }}
          >
            {actualIndex}. {block.content}
          </div>
        );
      default:
        return (
          <div key={block.id} style={style}>
            {actualIndex}. {block.content}
          </div>
        );
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Virtual Scrolling Example</h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div>
            <strong>Total Blocks:</strong> {stats.totalBlocks}
          </div>
          <div>
            <strong>Visible Blocks:</strong> {stats.visibleBlocks}
          </div>
          <div>
            <strong>Render %:</strong> {stats.renderPercentage.toFixed(2)}%
          </div>
          <div>
            <strong>Virtual Scroll:</strong> {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button onClick={() => scrollToBlock(0)}>
            Scroll to Top
          </button>
          <button onClick={() => scrollToBlock(Math.floor(blocks.length / 2))}>
            Scroll to Middle
          </button>
          <button onClick={() => scrollToBlock(blocks.length - 1)}>
            Scroll to Bottom
          </button>
          <button onClick={() => scrollToBlock(Math.floor(Math.random() * blocks.length))}>
            Scroll to Random
          </button>
        </div>
      </div>
      
      <div
        ref={containerRef}
        style={{
          height: containerHeight,
          overflow: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        {/* Spacer to maintain total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Rendered blocks with offset */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetTop}px)`,
            }}
          >
            {visibleBlocks.map((block, index) => renderBlock(block, index))}
          </div>
        </div>
      </div>
      
      {visibleRange && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Rendering blocks {visibleRange.start} to {visibleRange.end} (with buffer)
          <br />
          Viewport: {visibleRange.visibleStart} to {visibleRange.visibleEnd}
        </div>
      )}
    </div>
  );
}

/**
 * Generate sample blocks for testing
 * 
 * @param count - Number of blocks to generate
 * @returns Array of sample blocks
 */
export function generateSampleBlocks(count: number): Block[] {
  const blocks: Block[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = i % 10 === 0 ? 'heading' : i % 7 === 0 ? 'code' : 'paragraph';
    
    let content = '';
    switch (type) {
      case 'heading':
        content = `Heading ${i + 1}`;
        break;
      case 'code':
        content = `const block${i} = { id: '${i}', type: 'code' };`;
        break;
      default:
        content = `This is paragraph block ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    }
    
    blocks.push({
      id: `block-${i}`,
      content,
      type,
    });
  }
  
  return blocks;
}

/**
 * Demo component with 10,000 blocks
 */
export function VirtualScrollDemo() {
  const blocks = useMemo(() => generateSampleBlocks(10000), []);
  
  return (
    <div>
      <h1>Virtual Scrolling Demo - 10,000 Blocks</h1>
      <p>
        This demo shows virtual scrolling in action with 10,000 blocks.
        Only visible blocks (plus buffer) are rendered for optimal performance.
      </p>
      <VirtualScrollExample blocks={blocks} blockHeight={32} containerHeight={600} />
    </div>
  );
}

/**
 * Comparison demo showing performance difference
 */
export function VirtualScrollComparison() {
  const blocks = useMemo(() => generateSampleBlocks(1000), []);
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      <div>
        <h3>With Virtual Scrolling (Optimized)</h3>
        <VirtualScrollExample blocks={blocks} blockHeight={32} containerHeight={400} />
      </div>
      
      <div>
        <h3>Without Virtual Scrolling (All Rendered)</h3>
        <div
          style={{
            height: 400,
            overflow: 'auto',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          {blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                height: 32,
                padding: '4px 8px',
                borderBottom: '1px solid #eee',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {index}. {block.content}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Rendering all {blocks.length} blocks
        </div>
      </div>
    </div>
  );
}
