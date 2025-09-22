import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { cn } from '../utils/cn';

const DynamicSidebar = () => {
  const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();
  const { user, logout, hasPermission } = useAuth();
  
  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 16rem = 256px
  const [isHovered, setIsHovered] = useState(false);
  
  // Refs
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  // Minimum and maximum widths
  const MIN_WIDTH = 64; // 4rem - collapsed width
  const MAX_WIDTH = 320; // 20rem - maximum expanded width
  const COLLAPSED_WIDTH = 64;
  const EXPANDED_WIDTH = 256;

  // Navigation items
  const navigationItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ), 
      permission: 'assets:read'
    },
    { 
      path: '/discovery', 
      label: 'Discovery', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ), 
      permission: 'assets:read'
    },
    { 
      path: '/devices', 
      label: 'Devices', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ), 
      permission: 'assets:read'
    },
    { 
      path: '/assets', 
      label: 'Assets', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ), 
      permission: 'assets:read'
    },
    { 
      path: '/credentials', 
      label: 'Credentials', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ), 
      permission: 'credentials:read'
    }
  ];

  const adminItems = [
    { 
      path: '/admin-settings', 
      label: 'Global Settings', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      permission: 'admin'
    }
  ];

  const guideItems = [
    { 
      path: '/workflow', 
      label: 'Guide', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  // Filter items based on permissions
  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const filteredAdminItems = adminItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const savedWidth = localStorage.getItem('sidebar-width');
    
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedWidth !== null) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
        setIsCollapsed(newWidth <= MIN_WIDTH + 20); // Collapse if very narrow
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Toggle collapse
  const toggleCollapse = () => {
    if (isCollapsed) {
      setSidebarWidth(EXPANDED_WIDTH);
      setIsCollapsed(false);
    } else {
      setSidebarWidth(COLLAPSED_WIDTH);
      setIsCollapsed(true);
    }
  };

  // Handle double-click on resize handle to toggle
  const handleDoubleClick = () => {
    toggleCollapse();
  };

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        setSidebarWidth(COLLAPSED_WIDTH);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;
  const showLabels = !isCollapsed || isHovered;

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          "flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out relative",
          isResizing && "select-none"
        )}
        style={{ width: `${currentWidth}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Resize Handle */}
        <div
          ref={resizeHandleRef}
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors duration-200 z-10",
            isResizing && "bg-primary/30"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        />

        {/* Header */}
        <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            {showLabels && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">DiscoverIT</h1>
                <p className="text-xs text-muted-foreground truncate">Network Discovery & Asset Management</p>
              </div>
            )}
          </Link>
        </div>

        {/* Toggle Button */}
        <div className="px-3 py-2 border-b border-border">
          <button
            onClick={toggleCollapse}
            className={cn(
              "w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200",
              showLabels ? "justify-start space-x-2" : "justify-center"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg 
              className={cn("w-4 h-4 transition-transform duration-200", isCollapsed && "rotate-180")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {showLabels && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-grow px-3 py-3 space-y-1">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                showLabels ? "space-x-3" : "justify-center"
              )}
              title={!showLabels ? item.label : undefined}
            >
              <div className={cn(
                "transition-all duration-200 flex-shrink-0",
                location.pathname === item.path ? "scale-105" : "group-hover:scale-105"
              )}>
                {item.icon}
              </div>
              {showLabels && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {!showLabels && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Admin Section */}
        {filteredAdminItems.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            {showLabels && (
              <div className="px-3 py-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {filteredAdminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    showLabels ? "space-x-3" : "justify-center"
                  )}
                  title={!showLabels ? item.label : undefined}
                >
                  <div className={cn(
                    "transition-all duration-200 flex-shrink-0",
                    location.pathname === item.path ? "scale-105" : "group-hover:scale-105"
                  )}>
                    {item.icon}
                  </div>
                  {showLabels && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!showLabels && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Guide Section */}
        <div className="px-3 py-2 border-t border-border">
          <div className="space-y-1">
            {guideItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  showLabels ? "space-x-3" : "justify-center"
                )}
                title={!showLabels ? item.label : undefined}
              >
                <div className={cn(
                  "transition-all duration-200 flex-shrink-0",
                  location.pathname === item.path ? "scale-105" : "group-hover:scale-105"
                )}>
                  {item.icon}
                </div>
                {showLabels && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!showLabels && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-accent-foreground font-medium text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {showLabels && (
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role || 'User'}
                </p>
              </div>
            )}
            {showLabels && (
              <button
                onClick={logout}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-all duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && showLabels && (
          <div className="px-3 py-2 border-t border-border">
            <div className="p-2 bg-info/10 border border-info/20 rounded-md">
              <p className="text-xs text-info-foreground">{statusMessage}</p>
              <button
                onClick={clearStatusMessage}
                className="text-xs text-info-foreground/70 hover:text-info-foreground mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile when sidebar is expanded */}
      {!isCollapsed && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
};

export default DynamicSidebar;
