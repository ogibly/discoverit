/**
 * Unified Enterprise Component Library
 * Single source of truth for all UI components with consistent design
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { cn } from '../utils/cn';
import { unifiedDesignTokens, componentVariants } from './UnifiedDesignTokens';

// Unified Button Component
export const UnifiedButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: `${componentVariants.button.primary.background} ${componentVariants.button.primary.text} ${componentVariants.button.primary.border} ${componentVariants.button.primary.shadow} ${componentVariants.button.primary.focus}`,
    secondary: `${componentVariants.button.secondary.background} ${componentVariants.button.secondary.text} ${componentVariants.button.secondary.border} ${componentVariants.button.secondary.shadow} ${componentVariants.button.secondary.focus}`,
    outline: `${componentVariants.button.outline.background} ${componentVariants.button.outline.text} ${componentVariants.button.outline.border} ${componentVariants.button.outline.shadow} ${componentVariants.button.outline.focus}`,
    ghost: `${componentVariants.button.ghost.background} ${componentVariants.button.ghost.text} ${componentVariants.button.ghost.border} ${componentVariants.button.ghost.shadow} ${componentVariants.button.ghost.focus}`,
    danger: `${componentVariants.button.danger.background} ${componentVariants.button.danger.text} ${componentVariants.button.danger.border} ${componentVariants.button.danger.shadow} ${componentVariants.button.danger.focus}`,
    success: `${componentVariants.button.success.background} ${componentVariants.button.success.text} ${componentVariants.button.success.border} ${componentVariants.button.success.shadow} ${componentVariants.button.success.focus}`
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-lg'
  };
  
  const handleClick = useCallback((e) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  }, [loading, disabled, onClick]);
  
  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);
  const handleMouseLeave = useCallback(() => setIsPressed(false), []);
  
  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isPressed && 'scale-95',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
});

UnifiedButton.displayName = 'UnifiedButton';

// Unified Card Component
export const UnifiedCard = forwardRef(({
  children,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: `${componentVariants.card.default.background} ${componentVariants.card.default.border} ${componentVariants.card.default.shadow} ${componentVariants.card.default.radius}`,
    elevated: `${componentVariants.card.elevated.background} ${componentVariants.card.elevated.border} ${componentVariants.card.elevated.shadow} ${componentVariants.card.elevated.radius}`,
    flat: `${componentVariants.card.flat.background} ${componentVariants.card.flat.border} ${componentVariants.card.flat.shadow} ${componentVariants.card.flat.radius}`
  };
  
  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
});

UnifiedCard.displayName = 'UnifiedCard';

// Unified Input Component
export const UnifiedInput = forwardRef(({
  type = 'text',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 text-sm transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-md';
  
  const variants = {
    default: `${componentVariants.input.default.background} ${componentVariants.input.default.border} ${componentVariants.input.default.focus} ${componentVariants.input.default.text} border`,
    error: `${componentVariants.input.error.background} ${componentVariants.input.error.border} ${componentVariants.input.error.focus} ${componentVariants.input.error.text} border`
  };
  
  return (
    <input
      ref={ref}
      type={type}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
});

UnifiedInput.displayName = 'UnifiedInput';

// Unified Badge Component
export const UnifiedBadge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100',
    success: 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-800 dark:text-warning-100',
    error: 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-100',
    info: 'bg-info-100 text-info-800 dark:bg-info-800 dark:text-info-100'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  };
  
  return (
    <span
      ref={ref}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
});

UnifiedBadge.displayName = 'UnifiedBadge';

// Unified Progress Component
export const UnifiedProgress = forwardRef(({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden';
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variants = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  };
  
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div
      ref={ref}
      className={cn(baseClasses, sizes[size], className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-out', variants[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});

UnifiedProgress.displayName = 'UnifiedProgress';

// Unified Loading Spinner Component
export const UnifiedLoadingSpinner = forwardRef(({
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };
  
  return (
    <div
      ref={ref}
      className={cn('animate-spin', sizes[size], className)}
      {...props}
    >
      <svg className="h-full w-full" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
});

UnifiedLoadingSpinner.displayName = 'UnifiedLoadingSpinner';

// Unified Modal Component
export const UnifiedModal = forwardRef(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={ref}
        className={cn(
          'relative w-full bg-white dark:bg-secondary-800 rounded-lg shadow-xl',
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
});

UnifiedModal.displayName = 'UnifiedModal';

// Export all components
export {
  UnifiedButton as Button,
  UnifiedCard as Card,
  UnifiedInput as Input,
  UnifiedBadge as Badge,
  UnifiedProgress as Progress,
  UnifiedLoadingSpinner as LoadingSpinner,
  UnifiedModal as Modal
};

export default {
  Button: UnifiedButton,
  Card: UnifiedCard,
  Input: UnifiedInput,
  Badge: UnifiedBadge,
  Progress: UnifiedProgress,
  LoadingSpinner: UnifiedLoadingSpinner,
  Modal: UnifiedModal
};
