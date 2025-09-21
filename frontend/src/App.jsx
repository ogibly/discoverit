import React from 'react';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import DiscoveryDashboard from './components/DiscoveryDashboard';
import AssetManagement from './components/AssetManagement';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import OperationsExecution from './components/OperationsExecution';
import OperationsManagement from './components/OperationsManagement';
import Settings from './components/Settings';
import CredentialsManager from './components/CredentialsManager';
import UserManagement from './components/UserManagement';
import WorkflowGuide from './components/WorkflowGuide';
import ThemeToggle from './components/ThemeToggle';
import ScanStatusTracker from './components/ScanStatusTracker';
import ScanStatus from './components/ScanStatus';
import AdminSettings from './components/AdminSettings';
import { cn } from './utils/cn';

// Navigation component
const Navigation = () => {
	const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();
  const { user, logout, hasPermission } = useAuth();

  const workflowSteps = [
    { 
      path: '/', 
      label: 'Discovery', 
      icon: '🔍', 
      permission: 'assets:read', 
      description: 'Network discovery and asset management',
      step: 1,
      category: 'workflow'
    },
    { 
      path: '/assets', 
      label: 'Assets', 
      icon: '💻', 
      permission: 'assets:read', 
      description: 'Manage discovered assets',
      step: 2,
      category: 'workflow'
    }
  ];

  const managementItems = [
    { 
      path: '/operations-management', 
      label: 'Operations', 
      icon: '⚙️', 
      permission: 'admin', 
      description: 'Manage automation integrations',
      category: 'management'
    },
    { 
      path: '/credentials', 
      label: 'Credentials', 
      icon: '🔐', 
      permission: 'credentials:read', 
      description: 'Manage authentication credentials',
      category: 'management'
    },
    { 
      path: '/scan-status', 
      label: 'Scan Status', 
      icon: '📊', 
      permission: 'assets:read', 
      description: 'Monitor active scans and history',
      category: 'management'
    }
  ];

  const helpItems = [
    { 
      path: '/workflow', 
      label: 'Workflow Guide', 
      icon: '📖', 
      permission: null, 
      description: 'Complete workflow documentation',
      category: 'help'
    }
  ];

  const allNavItems = [...workflowSteps, ...managementItems, ...helpItems]
    .filter(item => !item.permission || hasPermission(item.permission));

  return (
      <div className="flex flex-col w-64 bg-gradient-to-b from-gray-900 via-black to-gray-900 border-r border-red-900/50">
        {/* Sophisticated Header */}
        <div className="px-6 py-4 border-b border-red-900/50 bg-gradient-to-r from-red-900/20 to-red-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-red-200 to-red-300 bg-clip-text text-transparent">DiscoverIT</h1>
            </div>
            {hasPermission('admin') && (
              <Link
                to="/admin-settings"
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 group",
                  location.pathname === '/admin-settings'
                    ? "bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-600/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 hover:border-gray-700/50 border border-transparent"
                )}
                title="Admin Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      
      <nav className="flex-grow px-4 py-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <div className="space-y-1">
            {workflowSteps.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-200 border-red-600/30 shadow-lg shadow-red-600/10"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-gray-100 border-transparent hover:border-gray-700/30"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Management Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
            MANAGE
          </h3>
          <div className="space-y-1">
            {managementItems.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-200 border-red-600/30 shadow-lg shadow-red-600/10"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-gray-100 border-transparent hover:border-gray-700/30"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            MORE
          </h3>
          <div className="space-y-1">
            {helpItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-200 border-orange-500/30 shadow-lg shadow-orange-500/10"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-gray-100 border-transparent hover:border-gray-700/30"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Status Message */}
      {statusMessage && (
        <div className="p-4 border-t border-red-900/50">
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-md p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-200">{statusMessage}</span>
              <button
                onClick={clearStatusMessage}
                className="text-red-300 hover:text-red-100 transition-colors"
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
      <div className="px-4 py-4 border-t border-red-900/50 bg-gradient-to-r from-gray-800/30 to-gray-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg ring-2 ring-red-600/20">
              <span className="text-xs font-bold text-white">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                {user?.role?.name || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle size="small" showLabel={false} />
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 transition-all duration-200 group"
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


// Main App component
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-red-500 border-r-red-600 border-b-red-700 border-l-red-800"></div>
          <div className="text-gray-300 font-medium">Loading DiscoverIT...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

	return (
    <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navigation />
      <div className="flex-grow overflow-hidden bg-gradient-to-br from-black/95 via-gray-900/90 to-black/95 backdrop-blur-sm">
        {/* Global Scan Status Tracker */}
        <ScanStatusTracker position="top-right" compact={true} />
        <Routes>
          <Route path="/" element={
            <ProtectedRoute requiredPermission="assets:read">
              <DiscoveryDashboard />
            </ProtectedRoute>
          } />
          <Route path="/assets" element={
            <ProtectedRoute requiredPermission="assets:read">
              <AssetManagement />
            </ProtectedRoute>
          } />
          <Route path="/assets/:id" element={
            <ProtectedRoute requiredPermission="assets:read">
              <AssetDetail />
            </ProtectedRoute>
          } />
                           <Route path="/operations-management" element={
                               <ProtectedRoute requiredPermission="admin">
                                   <OperationsManagement />
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
          <Route path="/scan-status" element={
            <ProtectedRoute requiredPermission="assets:read">
              <ScanStatus />
            </ProtectedRoute>
          } />
        </Routes>
			</div>
		</div>
	);
};

// Root App component with provider
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
