/**
 * Modern Enterprise Application
 * State-of-the-art UI/UX with comprehensive theming and modern components
 */

import React, { useState } from 'react';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModernThemeProvider, useModernTheme } from './contexts/ModernThemeContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AssetsInterface from './components/AssetsInterface';
import UnifiedScanDevicesInterface from './components/UnifiedScanDevicesInterface';
import AssetDetail from './components/AssetDetail';
import CredentialsManager from './components/CredentialsManager';
import WorkflowGuide from './components/WorkflowGuide';
import AdminSettings from './components/AdminSettings';
import ModernSidebar, { ModernNavigation } from './components/ui/ModernSidebar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { cn } from './utils/cn';
import { 
  ModernButton,
  ModernCard,
  ModernLoadingSpinner
} from './design-system/ModernComponentLibrary';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Settings,
  Bell,
  Search
} from 'lucide-react';

// Modern Header Component
const ModernHeader = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useModernTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
              DiscoverIT
            </h1>
            <span className="text-sm text-secondary-500 dark:text-secondary-400">
              Network Management Platform
            </span>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search devices, assets, operations..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </ModernButton>

            {/* Notifications */}
            <div className="relative">
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </ModernButton>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {user?.full_name || user?.username || 'Admin User'}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {user?.role?.name || 'Administrator'}
                  </p>
                </div>
              </div>
              
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Modern Navigation Items
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    path: '/dashboard',
    description: 'Network overview and analytics'
  },
  {
    id: 'discovery',
    label: 'Discovery',
    icon: 'Scan',
    path: '/discovery',
    description: 'Device discovery and scanning'
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: 'Database',
    path: '/assets',
    description: 'Asset inventory management'
  },
  {
    id: 'network',
    label: 'Network',
    icon: 'Network',
    path: '/network',
    description: 'Network topology and monitoring'
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: 'Activity',
    path: '/automation',
    description: 'Remote operations and automation'
  },
  {
    id: 'credentials',
    label: 'Credentials',
    icon: 'Key',
    path: '/credentials',
    description: 'Credential management'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/admin-settings',
    description: 'System configuration'
  }
];

// Main App Content
const ModernAppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme, isDark } = useModernTheme();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="flex flex-col items-center space-y-4">
          <ModernLoadingSpinner size="xl" />
          <div className="text-secondary-600 dark:text-secondary-400 font-medium">
            Loading DiscoverIT...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className={cn(
      'flex h-screen',
      isDark ? 'bg-secondary-900' : 'bg-secondary-50'
    )}>
      {/* Modern Sidebar */}
      <ModernSidebar
        storageKey="modern-sidebar"
        defaultCollapsed={false}
        expandedWidth={280}
        collapsedWidth={72}
        minWidth={200}
        maxWidth={400}
        resizable={true}
        showToggle={true}
      >
        <ModernNavigation items={navigationItems} />
      </ModernSidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Header */}
        <ModernHeader />
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute requiredPermission="assets:read">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/discovery" element={
              <ProtectedRoute requiredPermission="assets:read">
                <UnifiedScanDevicesInterface />
              </ProtectedRoute>
            } />
            <Route path="/assets" element={
              <ProtectedRoute requiredPermission="assets:read">
                <AssetsInterface />
              </ProtectedRoute>
            } />
            <Route path="/assets/:id" element={
              <ProtectedRoute requiredPermission="assets:read">
                <AssetDetail />
              </ProtectedRoute>
            } />
            <Route path="/credentials" element={
              <ProtectedRoute requiredPermission="credentials:read">
                <CredentialsManager />
              </ProtectedRoute>
            } />
            <Route path="/admin-settings" element={
              <ProtectedRoute requiredPermission="admin">
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/users" element={<Navigate to="/admin-settings" replace />} />
            <Route path="/settings" element={<Navigate to="/admin-settings" replace />} />
            <Route path="/scanners" element={<Navigate to="/admin-settings" replace />} />
            <Route path="/workflow" element={<WorkflowGuide />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Root App Component
function ModernApp() {
  return (
    <ErrorBoundary>
      <ModernThemeProvider>
        <AuthProvider>
          <LayoutProvider>
            <AppProvider>
              <ModernAppContent />
            </AppProvider>
          </LayoutProvider>
        </AuthProvider>
      </ModernThemeProvider>
    </ErrorBoundary>
  );
}

export default ModernApp;
