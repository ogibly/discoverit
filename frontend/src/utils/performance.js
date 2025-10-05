/**
 * Performance Optimization Utilities
 * Utilities for optimizing React component performance
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce hook for search inputs
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll/resize events
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Memoized filter function
export const useMemoizedFilter = (items, filterFn, deps) => {
  return useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter(filterFn);
  }, [items, ...deps]);
};

// Memoized sort function
export const useMemoizedSort = (items, sortFn, deps) => {
  return useMemo(() => {
    if (!Array.isArray(items)) return [];
    return [...items].sort(sortFn);
  }, [items, ...deps]);
};

// Virtual scrolling hook
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasIntersected, options]);

  return [ref, isIntersecting, hasIntersected];
};

// Batch state updates
export const useBatchedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const batchRef = useRef([]);
  const timeoutRef = useRef();

  const batchedSetState = useCallback((updates) => {
    batchRef.current.push(updates);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = { ...prevState };
        batchRef.current.forEach(update => {
          if (typeof update === 'function') {
            newState = update(newState);
          } else {
            newState = { ...newState, ...update };
          }
        });
        batchRef.current = [];
        return newState;
      });
    }, 0);
  }, []);

  return [state, batchedSetState];
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`);
    }
    
    startTime.current = Date.now();
  });

  return renderCount.current;
};

// Memoized search function
export const createSearchFunction = (searchFields) => {
  return useCallback((items, searchTerm) => {
    if (!searchTerm || !Array.isArray(items)) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  }, [searchFields]);
};

// Optimized sort function
export const createSortFunction = (sortBy, sortOrder) => {
  return useCallback((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    
    // Handle different data types
    if (sortBy === 'ip') {
      // Sort IPs numerically
      aVal = aVal.split('.').map(Number);
      bVal = bVal.split('.').map(Number);
    } else if (sortBy.includes('_at') || sortBy.includes('date')) {
      // Sort dates
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  }, [sortBy, sortOrder]);
};

// Pagination hook
export const usePagination = (items, itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

export default {
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
};
