import React from 'react';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AssetsInterface from './components/AssetsInterface';
import UnifiedScanDevicesInterface from './components/UnifiedScanDevicesInterface';
import AssetDetail from './components/AssetDetail';
import CredentialsManager from './components/CredentialsManager';
import WorkflowGuide from './components/WorkflowGuide';
import ThemeToggle from './components/ThemeToggle';
import AdminSettings from './components/AdminSettings';
import { cn } from './utils/cn';

// Sophisticated Navigation Component
const Navigation = () => {
  const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();
  const { user, logout, hasPermission } = useAuth();

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
    },
  ];

  const guideItem = { 
    path: '/workflow', 
    label: 'Guide', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ), 
    permission: null
  };

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex flex-col w-64 bg-background border-r border-border">
      {/* Sophisticated Header */}
      <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <Link 
          to="/dashboard" 
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">DiscoverIT</h1>
            <p className="text-xs text-muted-foreground">Network Scanning & Asset Management</p>
          </div>
        </Link>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-grow px-3 py-3 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <div className={cn(
              "transition-all duration-200",
              location.pathname === item.path ? "scale-105" : "group-hover:scale-105"
            )}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        
        {/* Global Settings Section */}
        {hasPermission('admin') && (
          <div className="pt-4 border-t border-border">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Administration
              </h3>
              <Link
                to="/admin-settings"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  location.pathname === '/admin-settings'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "transition-all duration-200",
                  location.pathname === '/admin-settings' ? "scale-105" : "group-hover:scale-105"
                )}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="font-medium">Global Settings</span>
              </Link>
              
            </div>
          </div>
        )}
        
        {/* Guide section at the bottom */}
        <div className="pt-4 border-t border-border">
          <Link
            to={guideItem.path}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
              location.pathname === guideItem.path
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <div className={cn(
              "transition-all duration-200",
              location.pathname === guideItem.path ? "scale-110" : "group-hover:scale-105"
            )}>
              {guideItem.icon}
            </div>
            <span className="font-medium">{guideItem.label}</span>
          </Link>
        </div>
      </nav>
      
      {/* Status Message */}
      {statusMessage && (
        <div className="px-4 py-3 border-t border-border">
          <div className="bg-card border border-border rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-card-foreground">{statusMessage}</span>
              <button
                onClick={clearStatusMessage}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Sophisticated Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.role?.name || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle size="small" showLabel={false} />
            <button
              onClick={logout}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary"></div>
          <div className="text-muted-foreground font-medium">Loading DiscoverIT...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Navigation />
      <div className="flex-grow overflow-hidden bg-background">
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
      </div>
    </div>
  );
};

// Root App Component
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;