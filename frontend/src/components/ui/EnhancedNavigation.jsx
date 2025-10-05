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
      permission: null,
      badge: null
    },
    { 
      path: '/discovery', 
      label: 'Discovery', 
      icon: Search,
      description: 'Network scanning and discovery',
      permission: 'discovery:read',
      badge: null
    },
    { 
      path: '/assets', 
      label: 'Assets', 
      icon: Database,
      description: 'Asset management and inventory',
      permission: 'assets:read',
      badge: null
    },
    { 
      path: '/credentials', 
      label: 'Credentials', 
      icon: Key,
      description: 'Credential management',
      permission: 'credentials:read',
      badge: null
    }
  ];

  const adminItems = [
    { 
      path: '/admin-settings', 
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
        'group flex items-center rounded-2xl transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
        isActive
          ? 'bg-gradient-to-r from-slate-600 to-slate-700 dark:from-yellow-500 dark:to-orange-500 text-white dark:text-slate-900 shadow-lg shadow-slate-500/25 dark:shadow-yellow-500/25'
          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50',
        isCollapsed 
          ? 'justify-center w-12 h-12 mx-auto my-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50' 
          : 'space-x-4 px-4 py-4'
      )}
      onMouseEnter={() => handleItemHover(item, true)}
      onMouseLeave={() => handleItemHover(item, false)}
      data-tooltip={isCollapsed ? item.label : ''}
      title={isCollapsed ? item.description : ''}
    >
      <div className={cn(
        'flex-shrink-0 transition-all duration-300',
        isActive ? 'scale-110' : 'group-hover:scale-105',
        isCollapsed ? 'mx-auto' : ''
      )}>
        <item.icon className={cn(
          "transition-all duration-300",
          isCollapsed ? "w-6 h-6" : "w-6 h-6"
        )} />
      </div>
      
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold truncate text-lg">{item.label}</span>
            {isActive && (
              <ChevronRight className="w-5 h-5 flex-shrink-0" />
            )}
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
            {item.description}
          </p>
        </div>
      )}
    </Link>
  );

  return (
    <nav className={cn(
      "flex flex-col h-full",
      isCollapsed ? "space-y-2 p-3" : "space-y-4 p-6"
    )}>
      {/* Main Navigation */}
      <div className={cn(
        "space-y-2",
        isCollapsed && "space-y-1"
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
      </div>

      {/* Admin Section - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="pt-6 border-t border-slate-300 dark:border-slate-700">
          <div className="px-4 py-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Administration
            </h3>
          </div>
          
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
        </div>
      )}

      {/* Admin Items - Show as clean icons when collapsed */}
      {isCollapsed && (
        <div className="space-y-1">
          <div className="w-6 h-px bg-slate-300 dark:bg-slate-700 mx-auto my-2" />
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

      {/* Spacer to push footer items to bottom */}
      <div className="flex-1" />

      {/* Guide - Bottom Navigation Item */}
      <div className={cn(
        "border-t border-slate-300 dark:border-slate-700",
        isCollapsed ? "pt-2" : "pt-6"
      )}>
        {isCollapsed && <div className="w-6 h-px bg-slate-300 dark:bg-slate-700 mx-auto mb-2" />}
        <NavItem
          item={guideItem}
          isActive={location.pathname === guideItem.path}
          isCollapsed={isCollapsed}
        />
      </div>

    </nav>
  );
};

export default EnhancedNavigation;
