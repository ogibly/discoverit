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
    default: 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
    primary: 'text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300',
    success: 'text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300',
    warning: 'text-yellow-400 hover:text-yellow-600 dark:text-yellow-500 dark:hover:text-yellow-300',
    danger: 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300'
  };

  return (
    <Tooltip content={content} position={position} {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
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
