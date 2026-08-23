"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { MobileAdapter, MobileAdapterConfig } from './MobileAdapter';

/**
 * React hook for mobile detection and mobile-specific utilities
 * 
 * @param config - Optional configuration for the MobileAdapter
 * @returns Object with mobile state and utility functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTouchDevice, adapter } = useMobileDetection();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMobileDetection(config?: Partial<MobileAdapterConfig>) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  
  const adapterRef = useRef<MobileAdapter | null>(null);

  // Initialize adapter
  useEffect(() => {
    adapterRef.current = new MobileAdapter(config);
    
    // Set initial values
    setIsMobile(adapterRef.current.isMobile());
    setIsTouchDevice(adapterRef.current.isTouchDevice());
    setViewportWidth(adapterRef.current.getViewportWidth());
    setViewportHeight(adapterRef.current.getViewportHeight());

    // Subscribe to changes
    const unsubscribe = adapterRef.current.subscribe((mobile) => {
      setIsMobile(mobile);
      setViewportWidth(adapterRef.current!.getViewportWidth());
      setViewportHeight(adapterRef.current!.getViewportHeight());
    });

    // Handle resize for viewport dimensions
    const handleResize = () => {
      if (adapterRef.current) {
        setViewportWidth(adapterRef.current.getViewportWidth());
        setViewportHeight(adapterRef.current.getViewportHeight());
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      adapterRef.current?.destroy();
    };
  }, [config]);

  // Memoize utility functions
  const utilities = useMemo(() => ({
    validateTouchTarget: (element: HTMLElement) => 
      adapterRef.current?.validateTouchTarget(element) ?? false,
    
    getTouchTargetValidation: (element: HTMLElement) => 
      adapterRef.current?.getTouchTargetValidation(element) ?? {
        valid: false,
        width: 0,
        height: 0,
        minSize: 44,
      },
    
    applyTouchOptimizations: (element: HTMLElement) => 
      adapterRef.current?.applyTouchOptimizations(element),
    
    adjustMenuPosition: (
      menu: HTMLElement,
      targetElement: HTMLElement,
      preferredPosition?: 'top' | 'bottom' | 'auto'
    ) => 
      adapterRef.current?.adjustMenuPosition(menu, targetElement, preferredPosition),
    
    enableBottomSheet: (menu: HTMLElement) => 
      adapterRef.current?.enableBottomSheet(menu),
    
    preventViewportZoom: (input: HTMLInputElement | HTMLTextAreaElement) => 
      adapterRef.current?.preventViewportZoom(input),
    
    triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => 
      adapterRef.current?.triggerHaptic(type),
  }), []);

  return {
    /** Whether the current viewport is mobile */
    isMobile,
    /** Whether the device supports touch */
    isTouchDevice,
    /** Current viewport width in pixels */
    viewportWidth,
    /** Current viewport height in pixels */
    viewportHeight,
    /** The MobileAdapter instance for advanced usage */
    adapter: adapterRef.current,
    /** Utility functions for mobile optimizations */
    ...utilities,
  };
}

/**
 * Simplified hook that only returns mobile state
 * 
 * @param breakpoint - Breakpoint in pixels (default: 768)
 * @returns Boolean indicating if viewport is mobile
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
 * }
 * ```
 */
export function useIsMobile(breakpoint = 768): boolean {
  const { isMobile } = useMobileDetection({ breakpoint });
  return isMobile;
}

/**
 * Hook for touch device detection
 * 
 * @returns Boolean indicating if device supports touch
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isTouch = useIsTouchDevice();
 *   return <div>{isTouch ? 'Touch enabled' : 'Mouse/keyboard'}</div>;
 * }
 * ```
 */
export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useMobileDetection();
  return isTouchDevice;
}

/**
 * Hook for viewport dimensions
 * 
 * @returns Object with viewport width and height
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { width, height } = useViewportSize();
 *   return <div>Viewport: {width}x{height}</div>;
 * }
 * ```
 */
export function useViewportSize(): { width: number; height: number } {
  const { viewportWidth, viewportHeight } = useMobileDetection();
  return { width: viewportWidth, height: viewportHeight };
}
