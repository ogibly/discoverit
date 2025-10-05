/**
 * Consolidated Loading States Component
 * Reusable loading components for different scenarios
 */

import React from 'react';
import { cn } from '../../utils/cn';

// Skeleton Loader Component
export const SkeletonLoader = ({ 
  className = '', 
  variant = 'default',
  lines = 1,
  ...props 
}) => {
  const baseClasses = 'animate-pulse bg-slate-700/50 rounded';
  
  if (variant === 'card') {
    return (
      <div className={cn('p-6 bg-slate-800/50 rounded-2xl border border-slate-700', className)} {...props}>
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-slate-700/50 rounded-2xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-700/50 rounded w-full"></div>
          <div className="h-3 bg-slate-700/50 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden', className)} {...props}>
        <div className="p-6 border-b border-slate-700">
          <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
        </div>
        <div className="divide-y divide-slate-700">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
                </div>
                <div className="w-16 h-6 bg-slate-700/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <div className="w-8 h-8 bg-slate-700/50 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-slate-700/50 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-5 bg-slate-700/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={cn(baseClasses, className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-700/50 rounded mb-2" style={{ width: `${100 - i * 10}%` }}></div>
      ))}
    </div>
  );
};

// Spinner Component
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-slate-300 border-t-yellow-500',
        sizeClasses[size]
      )}></div>
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = 'Loading...',
  className = '',
  ...props 
}) => {
  if (!isLoading) return children;

  return (
    <div className={cn('relative', className)} {...props}>
      {children}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-8 text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Loading Button Component
export const LoadingButton = ({ 
  isLoading, 
  loadingText = 'Loading...',
  children, 
  className = '',
  ...props 
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
        'bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-4 py-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon = '📋',
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )} {...props}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-lg mb-8 max-w-md">{description}</p>
      {action && action}
    </div>
  );
};

// Loading Grid Component
export const LoadingGrid = ({ 
  count = 6, 
  variant = 'card',
  className = '',
  ...props 
}) => {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader key={i} variant={variant} />
      ))}
    </div>
  );
};

export default {
  SkeletonLoader,
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  EmptyState,
  LoadingGrid
};
