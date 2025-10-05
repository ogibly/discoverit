/**
 * Accessibility Utilities
 * Utilities for enhancing accessibility and keyboard navigation
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Focus management hook
export const useFocusManagement = () => {
  const focusHistory = useRef([]);
  const currentFocus = useRef(null);

  const saveFocus = useCallback(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      focusHistory.current.push(document.activeElement);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusHistory.current.length > 0) {
      const lastFocused = focusHistory.current.pop();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }
  }, []);

  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { saveFocus, restoreFocus, trapFocus };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (items, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (!Array.isArray(items) || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect(items[focusedIndex], focusedIndex);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  }, [items, onSelect, focusedIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return { focusedIndex, setFocusedIndex, containerRef };
};

// Screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);

  const announce = useCallback((message, priority = 'polite') => {
    const announcement = {
      id: Date.now(),
      message,
      priority
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);
  }, []);

  return { announcements, announce };
};

// ARIA live region component
export const AriaLiveRegion = ({ announcements }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcements.map(announcement => (
        <div key={announcement.id}>
          {announcement.message}
        </div>
      ))}
    </div>
  );
};

// Skip link component using Tailwind CSS
export const SkipLink = ({ href, children, className = '' }) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2 focus:bg-yellow-500 focus:text-slate-900',
        'focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500/20',
        className
      )}
    >
      {children}
    </a>
  );
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows High Contrast Mode
      if (window.matchMedia('(-ms-high-contrast: active)').matches) {
        setIsHighContrast(true);
        return;
      }

      // Check for forced-colors media query
      if (window.matchMedia('(forced-colors: active)').matches) {
        setIsHighContrast(true);
        return;
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsHighContrast(true);
        return;
      }

      setIsHighContrast(false);
    };

    checkHighContrast();

    const mediaQueries = [
      window.matchMedia('(-ms-high-contrast: active)'),
      window.matchMedia('(forced-colors: active)'),
      window.matchMedia('(prefers-reduced-motion: reduce)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', checkHighContrast);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', checkHighContrast);
      });
    };
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Color scheme detection
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => setColorScheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

// Accessible button component using Tailwind CSS
export const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}) => {
  const buttonRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && !loading && onClick) {
        onClick(e);
      }
    }
  }, [disabled, loading, onClick]);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600',
    outline: 'border border-slate-600 text-slate-300 hover:bg-slate-700/50',
    ghost: 'text-slate-300 hover:bg-slate-700/50'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled || loading}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Accessible form field component using Tailwind CSS
export const AccessibleFormField = ({
  label,
  error,
  required = false,
  helpText,
  children,
  className = ''
}) => {
  const fieldId = useRef(`field-${Math.random().toString(36).substr(2, 9)}`);
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`);
  const helpId = useRef(`help-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label 
          htmlFor={fieldId.current}
          className="block text-sm font-medium text-slate-300"
        >
          {label}
          {required && (
            <span className="text-red-400 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}
      {helpText && (
        <p id={helpId.current} className="text-sm text-slate-400">
          {helpText}
        </p>
      )}
      <div>
        {children}
      </div>
      {error && (
        <p 
          id={errorId.current}
          className="text-sm text-red-400 animate-shake"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible table component using Tailwind CSS
export const AccessibleTable = ({ 
  children, 
  caption,
  className = '',
  striped = false,
  hover = true
}) => {
  return (
    <div className="overflow-x-auto">
      <table 
        className={cn(
          'w-full border-collapse',
          striped && 'divide-y divide-slate-700',
          className
        )}
        role="table"
        aria-label={caption}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
};

// Accessible modal component using Tailwind CSS
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  const modalRef = useRef(null);
  const { trapFocus } = useFocusManagement();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef);
      return cleanup;
    }
  }, [isOpen, trapFocus]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={cn(
          'bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl',
          'w-full mx-4 max-h-[90vh] overflow-auto',
          'animate-scale-in-up',
          sizeClasses[size],
          className
        )}
      >
        <div className="p-6 border-b border-slate-700">
          <h2 id="modal-title" className="text-2xl font-bold text-white">
            {title}
          </h2>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default {
  useFocusManagement,
  useKeyboardNavigation,
  useScreenReaderAnnouncements,
  AriaLiveRegion,
  SkipLink,
  useHighContrastMode,
  useReducedMotion,
  useColorScheme,
  AccessibleButton,
  AccessibleFormField,
  AccessibleTable,
  AccessibleModal
};
