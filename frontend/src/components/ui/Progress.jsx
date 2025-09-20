import React from 'react';
import { cn } from '../../utils/cn';

const Progress = React.forwardRef(({ className, value, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-blue-600 transition-all duration-300 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
Progress.displayName = 'Progress';

export { Progress };
