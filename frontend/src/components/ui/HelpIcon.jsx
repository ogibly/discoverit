import React from 'react';
import Tooltip from './Tooltip';
import { cn } from '../../utils/cn';

const HelpIcon = ({ 
  content, 
  size = 'sm',
  variant = 'default',
  position = 'top',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg'
  };

  const variantClasses = {
    default: 'text-muted-foreground hover:text-foreground',
    primary: 'text-primary hover:text-primary/80',
    success: 'text-success hover:text-success/80',
    warning: 'text-warning hover:text-warning/80',
    danger: 'text-error hover:text-error/80'
  };

  return (
    <Tooltip content={content} position={position} {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label="Help information"
      >
        <svg 
          className="w-full h-full" 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
    </Tooltip>
  );
};

export { HelpIcon };
export default HelpIcon;