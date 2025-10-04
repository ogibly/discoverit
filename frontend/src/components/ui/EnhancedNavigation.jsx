import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  Home,
  Search,
  Database,
  Settings,
  BookOpen,
  User,
  Shield,
  Network,
  HardDrive,
  Key,
  Users,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const EnhancedNavigation = ({ isCollapsed = false, onItemHover = null }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const navigationItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview and analytics',
      permission: null
    },
    { 
      path: '/discovery', 
      label: 'Discovery', 
      icon: Search,
      description: 'Network scanning and discovery',
      permission: 'discovery:read'
    },
    { 
      path: '/assets', 
      label: 'Assets', 
      icon: Database,
      description: 'Asset management and inventory',
      permission: 'assets:read'
    },
    { 
      path: '/credentials', 
      label: 'Credentials', 
      icon: Key,
      description: 'Credential management',
      permission: 'credentials:read'
    }
  ];

  const adminItems = [
    { 
      path: '/admin', 
      label: 'Admin Settings', 
      icon: Settings,
      description: 'System configuration',
      permission: 'admin'
    }
  ];

  const guideItem = { 
    path: '/workflow', 
    label: 'Guide', 
    icon: BookOpen,
    description: 'User guide and help',
    permission: null
  };

  const handleItemHover = useCallback((item, isHovering) => {
    setHoveredItem(isHovering ? item : null);
    onItemHover?.(item, isHovering);
  }, [onItemHover]);

  const NavItem = ({ item, isActive, isCollapsed }) => (
    <Link
      to={item.path}
      className={cn(
        'group flex items-center rounded-xl transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-md',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        isCollapsed 
          ? 'justify-center w-12 h-12 mx-auto' 
          : 'space-x-3 px-3 py-3'
      )}
      onMouseEnter={() => handleItemHover(item, true)}
      onMouseLeave={() => handleItemHover(item, false)}
      data-tooltip={isCollapsed ? item.label : ''}
      title={isCollapsed ? item.description : ''}
    >
      <div className={cn(
        'flex-shrink-0 transition-all duration-200',
        isActive ? 'scale-110' : 'group-hover:scale-105',
        isCollapsed ? 'mx-auto' : ''
      )}>
        <item.icon className={cn(
          "transition-all duration-200",
          isCollapsed ? "w-6 h-6" : "w-5 h-5"
        )} />
      </div>
      
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{item.label}</span>
            {isActive && (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.description}
          </p>
        </div>
      )}
    </Link>
  );

  return (
    <nav className={cn(
      "flex flex-col",
      isCollapsed ? "space-y-3 p-2" : "space-y-2 p-3"
    )}>
      {/* Main Navigation */}
      <div className={cn(
        "space-y-1",
        isCollapsed && "space-y-3"
      )}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}
        
        {/* Guide - Main Navigation Item */}
        <NavItem
          item={guideItem}
          isActive={location.pathname === guideItem.path}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Admin Section - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="pt-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </h3>
          </div>
          
          <div className="space-y-1">
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Items - Show as clean icons when collapsed */}
      {isCollapsed && (
        <div className="space-y-3">
          {adminItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            );
          })}
        </div>
      )}

      {/* Quick Actions - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="pt-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200">
              <Network className="w-4 h-4" />
              <span>Start New Scan</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </button>
            
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200">
              <HardDrive className="w-4 h-4" />
              <span>Import Assets</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default EnhancedNavigation;
