import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

const ResizablePanel = ({ 
  children, 
  className = '', 
  minSize = 200, 
  maxSize = null, 
  defaultSize = null,
  size = null,
  onSizeChange = null,
  direction = 'horizontal', // 'horizontal' or 'vertical'
  resizable = true,
  handleClassName = '',
  ...props 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState(size || defaultSize || 300);
  const panelRef = useRef(null);
  const startPosRef = useRef(null);
  const startSizeRef = useRef(null);

  // Update size when prop changes
  useEffect(() => {
    if (size !== null && size !== currentSize) {
      setCurrentSize(size);
    }
  }, [size, currentSize]);

  const handleMouseDown = useCallback((e) => {
    if (!resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = currentSize;
    
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [resizable, direction, currentSize]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !startPosRef.current || !startSizeRef.current) return;
    
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPosRef.current;
    const newSize = startSizeRef.current + delta;
    
    // Apply constraints
    let constrainedSize = newSize;
    if (minSize !== null) constrainedSize = Math.max(constrainedSize, minSize);
    if (maxSize !== null) constrainedSize = Math.min(constrainedSize, maxSize);
    
    setCurrentSize(constrainedSize);
    onSizeChange?.(constrainedSize);
  }, [isResizing, direction, minSize, maxSize, onSizeChange]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const panelStyle = {
    [direction === 'horizontal' ? 'width' : 'height']: `${currentSize}px`,
    [direction === 'horizontal' ? 'minWidth' : 'minHeight']: `${minSize}px`,
    [direction === 'horizontal' ? 'maxWidth' : 'maxHeight']: maxSize ? `${maxSize}px` : 'none',
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex-shrink-0 overflow-hidden',
        className
      )}
      style={panelStyle}
      {...props}
    >
      {children}
      
      {resizable && (
        <div
          className={cn(
            'absolute top-0 bg-transparent hover:bg-primary/20 transition-colors duration-200',
            direction === 'horizontal' 
              ? 'right-0 w-1 h-full cursor-col-resize hover:w-2' 
              : 'bottom-0 h-1 w-full cursor-row-resize hover:h-2',
            handleClassName
          )}
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            'absolute bg-border hover:bg-primary transition-colors duration-200',
            direction === 'horizontal' 
              ? 'right-0 w-px h-full' 
              : 'bottom-0 h-px w-full'
          )} />
        </div>
      )}
    </div>
  );
};

export default ResizablePanel;
