import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Home,
  Search,
  Database,
  Settings,
  BookOpen,
  User,
  LogOut,
  Moon,
  Sun,
  Maximize2,
  Minimize2
} from 'lucide-react';

const EnhancedSidebar = ({ 
  children, 
  className = '', 
  storageKey = 'enhanced-sidebar',
  defaultCollapsed = false,
  collapsedWidth = 72,
  expandedWidth = 280,
  minWidth = 200,
  maxWidth = 500,
  resizable = true,
  showToggle = true,
  onToggle = null,
  ...props 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`enhanced-sidebar-${storageKey}`);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    }
    return defaultCollapsed;
  });

  const [currentWidth, setCurrentWidth] = useState(expandedWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`enhanced-sidebar-${storageKey}`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  // Save width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && !isCollapsed) {
      localStorage.setItem(`enhanced-sidebar-width-${storageKey}`, JSON.stringify(currentWidth));
    }
  }, [currentWidth, storageKey, isCollapsed]);

  // Load saved width on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`enhanced-sidebar-width-${storageKey}`);
      if (saved) {
        const width = JSON.parse(saved);
        setCurrentWidth(Math.max(minWidth, Math.min(maxWidth, width)));
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  const handleToggle = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  }, [onToggle]);

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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [resizable, isCollapsed, currentWidth, minWidth, maxWidth]);

  const handleMouseEnter = useCallback((e) => {
    if (isCollapsed) {
      setIsHovered(true);
      setShowTooltip(true);
      setTooltipContent(e.target.getAttribute('data-tooltip') || '');
    }
  }, [isCollapsed]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowTooltip(false);
  }, []);

  const sidebarStyle = {
    width: isCollapsed ? `${collapsedWidth}px` : `${currentWidth}px`,
    minWidth: isCollapsed ? `${collapsedWidth}px` : `${minWidth}px`,
    maxWidth: isCollapsed ? `${collapsedWidth}px` : `${maxWidth}px`,
  };

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col h-full bg-background border-r border-border transition-all duration-300 ease-in-out',
          'shadow-lg',
          className
        )}
        style={sidebarStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">D</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">DiscoverIT</h1>
                <p className="text-xs text-muted-foreground">Network Discovery</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
          )}
          
          {showToggle && (
            <button
              onClick={handleToggle}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                'hover:bg-accent/50 hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                isCollapsed ? 'mx-auto' : ''
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer with User Info */}
        <div className="p-4 border-t border-border bg-muted/20">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">System Administrator</p>
                <p className="text-xs text-muted-foreground truncate">Administrator</p>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1.5 rounded-md hover:bg-accent/50 transition-colors" title="Toggle theme">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-accent/50 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1.5 rounded-md hover:bg-accent/50 transition-colors" title="Toggle theme">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-accent/50 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {resizable && !isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-primary/20 cursor-col-resize transition-colors duration-200 group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute right-0 w-px h-full bg-border group-hover:bg-primary group-hover:w-0.5 transition-all duration-200" />
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {showTooltip && isCollapsed && (
        <div className="fixed left-16 top-1/2 transform -translate-y-1/2 z-50 bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg border border-border">
          <div className="text-sm font-medium">{tooltipContent}</div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
        </div>
      )}
    </>
  );
};

export default EnhancedSidebar;
