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
    default: 'bg-muted border-border',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    info: 'bg-info/10 border-info/20'
  };

  const textVariantClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info'
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
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset'
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
            'border-border'
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

export { CollapsibleGuidance };
export default CollapsibleGuidance;