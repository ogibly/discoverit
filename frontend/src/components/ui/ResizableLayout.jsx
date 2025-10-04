import React, { useState, useEffect, useCallback } from 'react';
import ResizablePanel from './ResizablePanel';
import { cn } from '../../utils/cn';

const ResizableLayout = ({ 
  children, 
  className = '', 
  direction = 'horizontal', // 'horizontal' or 'vertical'
  storageKey = null,
  defaultSizes = [],
  minSizes = [],
  maxSizes = [],
  resizable = true,
  gap = 0,
  ...props 
}) => {
  const [sizes, setSizes] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`resizable-layout-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved layout sizes:', e);
        }
      }
    }
    return defaultSizes;
  });

  // Save to localStorage when sizes change
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`resizable-layout-${storageKey}`, JSON.stringify(sizes));
    }
  }, [sizes, storageKey]);

  const handleSizeChange = useCallback((index, newSize) => {
    setSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = newSize;
      return newSizes;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setSizes(defaultSizes);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(`resizable-layout-${storageKey}`);
    }
  }, [defaultSizes, storageKey]);

  // Expose reset function to parent if needed
  useEffect(() => {
    if (props.onReset) {
      props.onReset(resetLayout);
    }
  }, [props.onReset, resetLayout]);

  const childrenArray = React.Children.toArray(children);
  const totalChildren = childrenArray.length;

  if (totalChildren === 0) return null;
  if (totalChildren === 1) return children;

  return (
    <div
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      style={{ gap: `${gap}px` }}
      {...props}
    >
      {childrenArray.map((child, index) => {
        const isLast = index === totalChildren - 1;
        const size = sizes[index] || defaultSizes[index] || 300;
        const minSize = minSizes[index] || 150;
        const maxSize = maxSizes[index] || null;

        return (
          <React.Fragment key={index}>
            <ResizablePanel
              size={size}
              minSize={minSize}
              maxSize={maxSize}
              direction={direction}
              resizable={resizable && !isLast}
              onSizeChange={(newSize) => handleSizeChange(index, newSize)}
              className="flex-shrink-0"
            >
              {child}
            </ResizablePanel>
            
            {/* Gap between panels */}
            {!isLast && gap > 0 && (
              <div 
                className={cn(
                  'flex-shrink-0 bg-border',
                  direction === 'horizontal' ? 'w-px' : 'h-px'
                )}
                style={{ 
                  [direction === 'horizontal' ? 'width' : 'height']: `${gap}px` 
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ResizableLayout;
