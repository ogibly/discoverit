/**
 * Modern Enterprise Component Library
 * Based on reference images analysis for state-of-the-art UI/UX
 */

import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';
import { modernDesignTokens } from './ModernDesignTokens';

// Modern Button Component
export const ModernButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 text-secondary-900 dark:text-secondary-100 border border-secondary-200 dark:border-secondary-700',
    outline: 'bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-300 dark:border-secondary-600',
    ghost: 'bg-transparent hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
    danger: 'bg-error-600 hover:bg-error-700 text-white focus:ring-error-500 shadow-sm hover:shadow-md',
    success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 shadow-sm hover:shadow-md'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-xl'
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
});

// Modern Card Component
export const ModernCard = forwardRef(({ 
  children, 
  variant = 'default',
  padding = 'md',
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 transition-all duration-200';
  
  const variants = {
    default: 'shadow-sm hover:shadow-md',
    elevated: 'shadow-lg hover:shadow-xl',
    flat: 'shadow-none bg-secondary-50 dark:bg-secondary-900 border-transparent'
  };
  
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        paddings[padding],
        'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

// Modern Input Component
export const ModernInput = forwardRef(({ 
  type = 'text',
  variant = 'default',
  size = 'md',
  error = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 focus:border-primary-500 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100',
    error: 'bg-white dark:bg-secondary-800 border-error-500 focus:border-error-500 focus:ring-error-500 text-secondary-900 dark:text-secondary-100'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };
  
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        baseClasses,
        variants[error ? 'error' : variant],
        sizes[size],
        'border',
        className
      )}
      {...props}
    />
  );
});

// Modern Badge Component
export const ModernBadge = forwardRef(({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';
  
  const variants = {
    default: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200',
    primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200',
    success: 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200',
    warning: 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-200',
    error: 'bg-error-100 dark:bg-error-900 text-error-800 dark:text-error-200',
    info: 'bg-info-100 dark:bg-info-900 text-info-800 dark:text-info-200'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-full',
    md: 'px-2.5 py-1 text-sm rounded-full',
    lg: 'px-3 py-1.5 text-sm rounded-full'
  };
  
  return (
    <span
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

// Modern Progress Component
export const ModernProgress = forwardRef(({ 
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };
  
  const variants = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
    info: 'bg-info-600'
  };
  
  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm text-secondary-600 dark:text-secondary-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden', sizes[size])}>
        <div
          ref={ref}
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

// Modern KPI Card Component
export const ModernKPICard = forwardRef(({ 
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  className = '',
  ...props 
}, ref) => {
  const changeColors = {
    positive: 'text-success-600 dark:text-success-400',
    negative: 'text-error-600 dark:text-error-400',
    neutral: 'text-secondary-600 dark:text-secondary-400'
  };
  
  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
      </svg>
    ),
    stable: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  };
  
  return (
    <ModernCard
      ref={ref}
      className={cn('hover:shadow-lg transition-all duration-200', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn('text-sm font-medium', changeColors[changeType])}>
                {change}
              </span>
              {trend && trendIcons[trend] && (
                <span className={cn('ml-1', changeColors[changeType])}>
                  {trendIcons[trend]}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  );
});

// Modern Table Component
export const ModernTable = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn('w-full divide-y divide-secondary-200 dark:divide-secondary-700', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
});

// Modern Table Header
export const ModernTableHeader = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <thead
      ref={ref}
      className={cn('bg-secondary-50 dark:bg-secondary-800', className)}
      {...props}
    >
      {children}
    </thead>
  );
});

// Modern Table Body
export const ModernTableBody = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <tbody
      ref={ref}
      className={cn('divide-y divide-secondary-200 dark:divide-secondary-700 bg-white dark:bg-secondary-900', className)}
      {...props}
    >
      {children}
    </tbody>
  );
});

// Modern Table Row
export const ModernTableRow = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <tr
      ref={ref}
      className={cn('hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150', className)}
      {...props}
    >
      {children}
    </tr>
  );
});

// Modern Table Cell
export const ModernTableCell = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <td
      ref={ref}
      className={cn('px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100', className)}
      {...props}
    >
      {children}
    </td>
  );
});

// Modern Table Header Cell
export const ModernTableHeaderCell = forwardRef(({ 
  children,
  className = '',
  ...props 
}, ref) => {
  return (
    <th
      ref={ref}
      className={cn('px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </th>
  );
});

// Modern Loading Spinner
export const ModernLoadingSpinner = ({ 
  size = 'md',
  className = '',
  ...props 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <div className={cn('animate-spin', sizes[size], className)} {...props}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
};

// Modern Empty State Component
export const ModernEmptyState = ({ 
  icon,
  title,
  description,
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={cn('text-center py-12', className)} {...props}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-secondary-400 dark:text-secondary-600 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default {
  ModernButton,
  ModernCard,
  ModernInput,
  ModernBadge,
  ModernProgress,
  ModernKPICard,
  ModernTable,
  ModernTableHeader,
  ModernTableBody,
  ModernTableRow,
  ModernTableCell,
  ModernTableHeaderCell,
  ModernLoadingSpinner,
  ModernEmptyState
};
