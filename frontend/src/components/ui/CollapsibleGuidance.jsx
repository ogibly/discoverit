import React, { useState } from 'react';
import { cn } from '../../utils/cn';

const CollapsibleGuidance = ({ 
  title, 
  children, 
  defaultOpen = false,
  variant = 'default',
  icon = '💡',
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantClasses = {
    default: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
  };

  const textVariantClasses = {
    default: 'text-slate-700 dark:text-slate-300',
    primary: 'text-blue-700 dark:text-blue-300',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    info: 'text-blue-700 dark:text-blue-300'
  };

  return (
    <div 
      className={cn(
        'border rounded-lg transition-all duration-200',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between text-left',
          'hover:bg-opacity-80 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
        )}
        aria-expanded={isOpen}
        aria-controls="guidance-content"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <span className={cn(
            'font-medium text-sm',
            textVariantClasses[variant]
          )}>
            {title}
          </span>
        </div>
        <svg
          className={cn(
            'w-5 h-5 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
            textVariantClasses[variant]
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          id="guidance-content"
          className={cn(
            'px-4 pb-4 border-t border-opacity-50',
            'animate-in slide-in-from-top-2 duration-200',
            variant === 'default' ? 'border-slate-200 dark:border-slate-700' : 'border-current'
          )}
        >
          <div className={cn(
            'pt-3 text-sm leading-relaxed',
            textVariantClasses[variant]
          )}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleGuidance;
