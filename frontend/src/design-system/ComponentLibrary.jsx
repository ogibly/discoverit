/**
 * Enterprise Component Library
 * Reusable, accessible, and performant components
 */

import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import { cn } from '../utils/cn';
import { designTokens } from './DesignTokens';

// Enhanced Button Component with Enterprise Features
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  onClick,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 border border-neutral-300',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm',
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-lg',
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
        loading && 'cursor-wait',
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
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
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

Button.displayName = 'Button';

// Enhanced Input Component
export const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const baseClasses = 'block w-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-4 py-3 text-base rounded-lg',
  };
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            baseClasses,
            variants[error ? 'error' : variant],
            sizes[size],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            isFocused && 'ring-2',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Enhanced Card Component
export const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  ...props
}, ref) => {
  const baseClasses = 'bg-white border border-neutral-200 rounded-lg transition-all duration-200';
  
  const variants = {
    default: 'shadow-sm',
    elevated: 'shadow-md',
    flat: 'shadow-none',
  };
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Enhanced Badge Component
export const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-info-100 text-info-800',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
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

Badge.displayName = 'Badge';

// Loading Skeleton Component
export const Skeleton = forwardRef(({
  width,
  height,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-neutral-200 rounded',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Enhanced Modal Component
export const Modal = forwardRef(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  ...props
}, ref) => {
  const [isClosing, setIsClosing] = useState(false);
  
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);
  
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        <div
          ref={ref}
          className={cn(
            'relative bg-white rounded-lg shadow-xl transform transition-all duration-200',
            sizes[size],
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
            className
          )}
          {...props}
        >
          {title && (
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

// Enhanced Progress Component
export const Progress = forwardRef(({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const variants = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };
  
  return (
    <div className="space-y-1">
      {showValue && (
        <div className="flex justify-between text-sm text-neutral-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        ref={ref}
        className={cn(
          'w-full bg-neutral-200 rounded-full overflow-hidden',
          sizes[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

Progress.displayName = 'Progress';

export default {
  Button,
  Input,
  Card,
  Badge,
  Skeleton,
  Modal,
  Progress,
};
