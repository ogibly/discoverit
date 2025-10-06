/**
 * Unified Layout Component
 * Consistent layout structure across the application
 */

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedTheme } from '../../contexts/UnifiedThemeContext';
import { UnifiedButton, UnifiedCard } from '../../design-system/UnifiedComponentLibrary';
import { cn } from '../../utils/cn';
import {
  Home,
  Search,
  Database,
  Settings,
  BookOpen,
  User,
  LogOut,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const UnifiedLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useUnifiedTheme();
  const location = useLocation();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      path: '/discovery',
      label: 'Network Discovery',
      icon: Search,
      description: 'Scan and discover devices'
    },
    {
      path: '/assets',
      label: 'Assets',
      icon: Database,
      description: 'Manage discovered assets'
    },
    {
      path: '/credentials',
      label: 'Credentials',
      icon: User,
      description: 'Manage access credentials'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Application settings'
    },
    {
      path: '/guide',
      label: 'Guide',
      icon: BookOpen,
      description: 'User guide and help'
    }
  ];

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold">DiscoverIT</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          "hidden lg:block"
        )}>
          {/* Desktop Sidebar Header */}
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold text-primary-600">DiscoverIT</h1>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-md text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.label}</div>
                      {!sidebarCollapsed && (
                        <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                    {user?.email}
                  </div>
                </div>
              )}
              <UnifiedButton
                variant="ghost"
                size="sm"
                onClick={logout}
                className="p-1"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </UnifiedButton>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-secondary-800">
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-primary-600">DiscoverIT</h1>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          : "text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.label}</div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {user?.full_name || user?.username}
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="p-1"
                  >
                    <LogOut className="h-4 w-4" />
                  </UnifiedButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
