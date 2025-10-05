/**
 * Custom Hooks Index
 * Centralized exports for all custom hooks
 */

export { default as useLocalStorage } from './useLocalStorage';
export { default as useForm } from './useForm';
export { default as useAsync } from './useAsync';
export { default as useToggle } from './useToggle';

// Re-export performance hooks
export {
  useDebounce,
  useThrottle,
  useMemoizedFilter,
  useMemoizedSort,
  useVirtualScroll,
  useIntersectionObserver,
  useBatchedState,
  usePerformanceMonitor,
  createSearchFunction,
  createSortFunction,
  usePagination
} from '../utils/performance';

// Re-export accessibility hooks
export {
  useFocusManagement,
  useKeyboardNavigation,
  useScreenReaderAnnouncements,
  useHighContrastMode,
  useReducedMotion,
  useColorScheme
} from '../utils/accessibility';

// Re-export animation hooks
export {
  useAnimation,
  useStaggerAnimation,
  useParallax,
  useMagneticEffect,
  useRippleEffect
} from '../utils/animations';

// Re-export component utilities
export * from '../utils/componentUtils';