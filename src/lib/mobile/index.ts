/**
 * Mobile detection and optimization utilities for ErixEditor
 * 
 * This module provides mobile viewport detection, touch target validation,
 * and mobile-specific UI optimizations.
 * 
 * @module mobile
 */

export {
  MobileAdapter,
  createMobileAdapter,
  isMobile,
  validateTouchTargetSize,
  DEFAULT_MOBILE_CONFIG,
  type MobileAdapterConfig,
} from './MobileAdapter';

export {
  useMobileDetection,
  useIsMobile,
  useIsTouchDevice,
  useViewportSize,
} from './useMobileDetection';
