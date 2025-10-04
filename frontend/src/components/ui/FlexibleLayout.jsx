import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  GripVertical,
  MoreHorizontal
} from 'lucide-react';

const FlexibleLayout = ({ 
  children, 
  className = '', 
  storageKey = 'flexible-layout',
  defaultLayout = 'horizontal', // 'horizontal', 'vertical', 'grid'
  defaultSizes = [300, 500, 300],
  minSizes = [200, 300, 200],
  maxSizes = [800, 1200, 800],
  resizable = true,
  gap = 8,
  showControls = true,
  onLayoutChange = null,
  ...props 
}) => {
  const [layout, setLayout] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`flexible-layout-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved layout:', e);
        }
      }
    }
    return defaultLayout;
  });

  const [sizes, setSizes] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`flexible-layout-sizes-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved sizes:', e);
        }
      }
    }
    return defaultSizes;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeIndex, setResizeIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Save layout to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`flexible-layout-${storageKey}`, JSON.stringify(layout));
    }
    onLayoutChange?.(layout);
  }, [layout, storageKey, onLayoutChange]);

  // Save sizes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`flexible-layout-sizes-${storageKey}`, JSON.stringify(sizes));
    }
  }, [sizes, storageKey]);

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
  }, []);

  const handleSizeChange = useCallback((index, newSize) => {
    setSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = newSize;
      return newSizes;
    });
  }, []);

  const handleResizeStart = useCallback((index, e) => {
    if (!resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeIndex(index);
    
    const startPos = layout === 'horizontal' ? e.clientX : e.clientY;
    const startSizes = [...sizes];
    
    const handleMouseMove = (e) => {
      const currentPos = layout === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      
      const newSizes = [...startSizes];
      const currentSize = newSizes[index];
      const nextSize = newSizes[index + 1];
      
      const newCurrentSize = Math.max(
        minSizes[index] || 200,
        Math.min(maxSizes[index] || 800, currentSize + delta)
      );
      const newNextSize = Math.max(
        minSizes[index + 1] || 200,
        Math.min(maxSizes[index + 1] || 800, nextSize - delta)
      );
      
      newSizes[index] = newCurrentSize;
      newSizes[index + 1] = newNextSize;
      
      setSizes(newSizes);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = layout === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [resizable, layout, sizes, minSizes, maxSizes]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setSizes(defaultSizes);
    setLayout(defaultLayout);
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.removeItem(`flexible-layout-${storageKey}`);
      localStorage.removeItem(`flexible-layout-sizes-${storageKey}`);
    }
  }, [defaultSizes, defaultLayout, storageKey]);

  const childrenArray = React.Children.toArray(children);
  const totalChildren = childrenArray.length;

  if (totalChildren === 0) return null;
  if (totalChildren === 1) return children;

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex-col';
      case 'grid':
        return 'grid grid-cols-2 gap-4 p-2';
      default:
        return 'flex-row';
    }
  };

  const getPanelStyle = (index) => {
    if (layout === 'grid') {
      return {
        gridColumn: index === 0 ? '1' : '2',
        gridRow: index < 2 ? '1' : '2',
      };
    }
    
    return {
      [layout === 'horizontal' ? 'width' : 'height']: `${sizes[index] || defaultSizes[index] || 300}px`,
      [layout === 'horizontal' ? 'minWidth' : 'minHeight']: `${minSizes[index] || 200}px`,
      [layout === 'horizontal' ? 'maxWidth' : 'maxHeight']: `${maxSizes[index] || 800}px`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full w-full bg-background',
        getLayoutClasses(),
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
      style={{ gap: `${gap}px` }}
      {...props}
    >
      {/* Layout Controls */}
      {showControls && (
        <div className={cn(
          "absolute z-10 flex items-center space-x-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg",
          layout === 'grid' ? 'top-2 right-2' : 'top-4 right-4'
        )}>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleLayoutChange('horizontal')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                layout === 'horizontal' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title="Horizontal layout"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleLayoutChange('vertical')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                layout === 'vertical' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title="Vertical layout"
            >
              <GripVertical className="w-4 h-4 rotate-90" />
            </button>
            
            <button
              onClick={() => handleLayoutChange('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                layout === 'grid' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title="Grid layout"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-4 bg-border" />
          
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            title="Reset layout"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Panels */}
      {childrenArray.map((child, index) => {
        const isLast = index === totalChildren - 1;
        const panelStyle = getPanelStyle(index);
        
        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                'relative flex-shrink-0 overflow-hidden',
                layout === 'grid' && 'rounded-lg border border-border bg-background shadow-sm'
              )}
              style={panelStyle}
            >
              {child}
            </div>
            
            {/* Resize Handle */}
            {resizable && !isLast && layout !== 'grid' && (
              <div
                className={cn(
                  'flex-shrink-0 bg-transparent hover:bg-primary/20 transition-colors duration-200 cursor-col-resize group',
                  layout === 'horizontal' 
                    ? 'w-1 h-full' 
                    : 'h-1 w-full cursor-row-resize'
                )}
                onMouseDown={(e) => handleResizeStart(index, e)}
              >
                <div className={cn(
                  'absolute bg-border hover:bg-primary transition-colors duration-200',
                  layout === 'horizontal' 
                    ? 'right-0 w-px h-full group-hover:w-0.5' 
                    : 'bottom-0 h-px w-full group-hover:h-0.5'
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FlexibleLayout;
