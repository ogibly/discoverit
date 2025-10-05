/**
 * Modern Enterprise Sidebar Component
 * Based on reference images analysis for state-of-the-art UI/UX
 * Features: Collapsible, Resizable, Modern Design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Maximize2,
  Minimize2,
  Network,
  Server,
  Shield,
  Activity,
  BarChart3,
  Users,
  Key,
  Scan,
  HardDrive,
  Cpu,
  Monitor,
  Router,
  Smartphone,
  Printer
} from 'lucide-react';

const ModernSidebar = ({ 
  children,
  className = '',
  storageKey = 'modern-sidebar',
  defaultCollapsed = false,
  collapsedWidth = 72,
  expandedWidth = 280,
  minWidth = 200,
  maxWidth = 400,
  resizable = true,
  showToggle = true,
  onToggle = null,
  ...props 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`modern-sidebar-${storageKey}`);
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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const tooltipRef = useRef(null);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`modern-sidebar-${storageKey}`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  // Handle resize
  const handleMouseDown = useCallback((e) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
  }, [resizable]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizable) return;
    
    const newWidth = e.clientX;
    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    setCurrentWidth(clampedWidth);
  }, [isResizing, resizable, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Handle tooltip
  const handleMouseEnter = useCallback((content) => {
    if (isCollapsed) {
      setTooltipContent(content);
      setShowTooltip(true);
    }
  }, [isCollapsed]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleMouseMoveTooltip = useCallback((e) => {
    if (isCollapsed && showTooltip) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isCollapsed, showTooltip]);

  // Event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isCollapsed && showTooltip) {
      document.addEventListener('mousemove', handleMouseMoveTooltip);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveTooltip);
      };
    }
  }, [isCollapsed, showTooltip, handleMouseMoveTooltip]);

  const toggleCollapse = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggle) {
      onToggle(newCollapsed);
    }
  }, [isCollapsed, onToggle]);

  const sidebarWidth = isCollapsed ? collapsedWidth : currentWidth;

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          'relative flex flex-col h-full bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300 ease-in-out',
          'shadow-lg',
          className
        )}
        style={{ width: `${sidebarWidth}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                  DiscoverIT
                </h1>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Network Management
                </p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm mx-auto">
              <span className="text-white font-bold text-sm">D</span>
            </div>
          )}
          
          {showToggle && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-md text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all duration-200"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Admin User
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Administrator
                  </p>
                </div>
              </div>
              <button
                className="p-1.5 rounded-md text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex justify-center">
              <button
                className="p-1.5 rounded-md text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {resizable && !isCollapsed && (
          <div
            ref={resizeHandleRef}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 transition-colors duration-200"
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && isCollapsed && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-2 py-1 text-sm text-white bg-secondary-900 rounded-md shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </>
  );
};

// Modern Navigation Component
export const ModernNavigation = ({ 
  items = [],
  className = '',
  ...props 
}) => {
  const [activeItem, setActiveItem] = useState('');

  const defaultItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Overview and analytics'
    },
    {
      id: 'discovery',
      label: 'Discovery',
      icon: Scan,
      path: '/discovery',
      description: 'Network device discovery'
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Database,
      path: '/assets',
      description: 'Asset inventory management'
    },
    {
      id: 'network',
      label: 'Network',
      icon: Network,
      path: '/network',
      description: 'Network topology and monitoring'
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: Activity,
      path: '/automation',
      description: 'Remote operations and automation'
    },
    {
      id: 'credentials',
      label: 'Credentials',
      icon: Key,
      path: '/credentials',
      description: 'Credential management'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      description: 'System configuration'
    }
  ];

  const navigationItems = items.length > 0 ? items : defaultItems;

  return (
    <nav className={cn('space-y-1 p-4', className)} {...props}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        
        return (
          <a
            key={item.id}
            href={item.path}
            className={cn(
              'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800'
            )}
            onClick={() => setActiveItem(item.id)}
            title={item.description}
          >
            <Icon className={cn(
              'w-5 h-5 transition-all duration-200',
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500 dark:text-secondary-500 group-hover:text-secondary-700 dark:group-hover:text-secondary-300'
            )} />
            <span className="ml-3 font-medium">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

// Modern Sidebar Section
export const ModernSidebarSection = ({ 
  title,
  children,
  className = '',
  ...props 
}) => {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {title && (
        <h3 className="px-3 mb-3 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

// Modern Sidebar Item
export const ModernSidebarItem = ({ 
  icon,
  label,
  description,
  active = false,
  onClick,
  className = '',
  ...props 
}) => {
  const Icon = icon;
  
  return (
    <button
      className={cn(
        'w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
        active
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-sm'
          : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800'
      )}
      onClick={onClick}
      title={description}
      {...props}
    >
      <Icon className={cn(
        'w-5 h-5 transition-all duration-200',
        active ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500 dark:text-secondary-500 group-hover:text-secondary-700 dark:group-hover:text-secondary-300'
      )} />
      <span className="ml-3 font-medium">{label}</span>
    </button>
  );
};

export default ModernSidebar;
