/**
 * Advanced Skeleton Components
 * Sophisticated loading states with smooth animations
 */

import React from 'react';
import { cn } from '../../utils/cn';

// Base skeleton component
const Skeleton = ({ 
  className = '', 
  variant = 'default',
  animate = true,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'bg-slate-700/50 rounded',
        animate && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

// Card skeleton
export const CardSkeleton = ({ className = '', ...props }) => (
  <div className={cn('p-6 bg-slate-800/50 rounded-2xl border border-slate-700', className)} {...props}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="flex space-x-2 mt-4">
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, className = '', ...props }) => (
  <div className={cn('bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden', className)} {...props}>
    <div className="p-6 border-b border-slate-700">
      <Skeleton className="h-4 w-1/4" />
    </div>
    <div className="divide-y divide-slate-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="w-16 h-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// List skeleton
export const ListSkeleton = ({ items = 5, className = '', ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-12 h-5 rounded" />
      </div>
    ))}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = ({ className = '', ...props }) => (
  <div className={cn('space-y-6', className)} {...props}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton = ({ fields = 4, className = '', ...props }) => (
  <div className={cn('space-y-6', className)} {...props}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-3 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ className = '', ...props }) => (
  <div className={cn('p-6 bg-slate-800/50 rounded-2xl border border-slate-700', className)} {...props}>
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="h-64 flex items-end space-x-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1" 
          style={{ height: `${Math.random() * 100 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

// Navigation skeleton
export const NavigationSkeleton = ({ className = '', ...props }) => (
  <div className={cn('space-y-4', className)} {...props}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        <Skeleton className="w-6 h-6 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

// Shimmer effect
export const ShimmerSkeleton = ({ className = '', ...props }) => (
  <div
    className={cn(
      'relative overflow-hidden bg-slate-700/50 rounded',
      'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
      className
    )}
    {...props}
  />
);

// Progressive loading skeleton
export const ProgressiveSkeleton = ({ 
  items = 6, 
  className = '', 
  ...props 
}) => {
  const [visibleItems, setVisibleItems] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisibleItems(prev => Math.min(prev + 1, items));
    }, 200);

    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'transition-opacity duration-300',
            i < visibleItems ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center space-x-3 p-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="w-12 h-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading states for different components
export const LoadingStates = {
  Card: CardSkeleton,
  Table: TableSkeleton,
  List: ListSkeleton,
  Dashboard: DashboardSkeleton,
  Form: FormSkeleton,
  Chart: ChartSkeleton,
  Navigation: NavigationSkeleton,
  Shimmer: ShimmerSkeleton,
  Progressive: ProgressiveSkeleton
};

export default LoadingStates;
