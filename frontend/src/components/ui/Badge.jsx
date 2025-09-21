import React from 'react';
import { cn } from '../../utils/cn';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-red-900 text-red-200 border border-red-800',
    secondary: 'bg-gray-800 text-gray-200 border border-gray-700',
    destructive: 'bg-red-800 text-red-100 border border-red-700',
    success: 'bg-green-900 text-green-200 border border-green-800',
    warning: 'bg-yellow-900 text-yellow-200 border border-yellow-800',
    outline: 'border border-gray-600 text-gray-200 bg-transparent'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium shadow-sm',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
