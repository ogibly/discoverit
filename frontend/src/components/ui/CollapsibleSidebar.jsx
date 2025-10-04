import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

const CollapsibleSidebar = ({ 
  children, 
  className = '', 
  storageKey = 'sidebar-state',
  defaultCollapsed = false,
  collapsedWidth = 64,
  expandedWidth = 256,
  minWidth = 200,
  maxWidth = 400,
  resizable = true,
  showToggle = true,
  togglePosition = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  onToggle = null,
  ...props 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`collapsible-sidebar-${storageKey}`);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    }
    return defaultCollapsed;
  });

  const [currentWidth, setCurrentWidth] = useState(expandedWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`collapsible-sidebar-${storageKey}`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  // Save width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && !isCollapsed) {
      localStorage.setItem(`collapsible-sidebar-width-${storageKey}`, JSON.stringify(currentWidth));
    }
  }, [currentWidth, storageKey, isCollapsed]);

  // Load saved width on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && !isCollapsed) {
      const saved = localStorage.getItem(`collapsible-sidebar-width-${storageKey}`);
      if (saved) {
        try {
          const savedWidth = JSON.parse(saved);
          setCurrentWidth(Math.max(minWidth, Math.min(maxWidth, savedWidth)));
        } catch (e) {
          console.warn('Failed to parse saved sidebar width:', e);
        }
      }
    }
  }, [storageKey, minWidth, maxWidth, isCollapsed]);

  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  }, [isCollapsed, onToggle]);

  const handleMouseDown = useCallback((e) => {
    if (!resizable || isCollapsed) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = currentWidth;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setCurrentWidth(constrainedWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [resizable, isCollapsed, currentWidth, minWidth, maxWidth]);

  const getToggleButtonPosition = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    };
    return positions[togglePosition] || positions['top-right'];
  };

  const sidebarWidth = isCollapsed ? collapsedWidth : currentWidth;

  return (
    <div
      className={cn(
        'relative flex-shrink-0 bg-background border-r border-border transition-all duration-300 ease-in-out',
        isCollapsed ? 'overflow-hidden' : 'overflow-visible',
        className
      )}
      style={{ width: `${sidebarWidth}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={handleToggle}
          className={cn(
            'absolute z-50 p-2 rounded-full bg-background border border-border shadow-lg hover:shadow-xl transition-all duration-200',
            'hover:bg-accent hover:border-accent-foreground',
            getToggleButtonPosition()
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Resize Handle */}
      {resizable && !isCollapsed && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-primary/20 cursor-col-resize transition-colors duration-200 z-40"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute right-0 w-px h-full bg-border hover:bg-primary transition-colors duration-200" />
        </div>
      )}

      {/* Sidebar Content */}
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        style={{ 
          width: isCollapsed ? 0 : `${currentWidth}px`,
          overflow: isCollapsed ? 'hidden' : 'visible'
        }}
      >
        {children}
      </div>

      {/* Collapsed State Content */}
      {isCollapsed && (
        <div className="h-full flex flex-col items-center py-4 space-y-4">
          {/* Show minimal content when collapsed */}
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          
          {/* Navigation icons only */}
          <div className="flex flex-col space-y-2">
            {/* This would be populated with icon-only navigation items */}
          </div>
        </div>
      )}

      {/* Hover overlay for collapsed state */}
      {isCollapsed && isHovered && (
        <div className="absolute top-0 left-0 w-64 h-full bg-background border-r border-border shadow-xl z-30">
          <div className="p-4">
            {/* Expanded content on hover */}
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSidebar;
