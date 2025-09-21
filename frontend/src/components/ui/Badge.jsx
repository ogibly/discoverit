import React from 'react';
import { cn } from '../../utils/cn';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-blue-900 text-blue-200 border border-blue-800',
    secondary: 'bg-slate-800 text-slate-200 border border-slate-700',
    destructive: 'bg-red-900 text-red-200 border border-red-800',
    success: 'bg-green-900 text-green-200 border border-green-800',
    warning: 'bg-yellow-900 text-yellow-200 border border-yellow-800',
    outline: 'border border-slate-600 text-slate-200 bg-transparent'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
