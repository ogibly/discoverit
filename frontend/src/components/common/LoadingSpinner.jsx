import React from 'react';
import { cn } from '../../utils/cn';

const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  text = 'Loading...',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
      {showText && text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
