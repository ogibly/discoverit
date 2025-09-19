import React from 'react';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import WorkflowDashboard from './components/WorkflowDashboard';
import AssetDiscovery from './components/AssetDiscovery';
import AssetManagement from './components/AssetManagement';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import OperationsExecution from './components/OperationsExecution';
import OperationsManagement from './components/OperationsManagement';
import Settings from './components/Settings';
import CredentialsManager from './components/CredentialsManager';
import ScannerManager from './components/ScannerManager';
import UserManagement from './components/UserManagement';
import WorkflowGuide from './components/WorkflowGuide';
import ThemeToggle from './components/ThemeToggle';
import { cn } from './utils/cn';

// Navigation component
const Navigation = () => {
	const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();
  const { user, logout, hasPermission } = useAuth();

  const workflowSteps = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: '🏠', 
      permission: 'assets:read', 
      description: 'Workflow overview and quick start',
      step: 0,
      category: 'workflow'
    },
    { 
      path: '/discovery', 
      label: 'Discovery', 
      icon: '🔍', 
      permission: 'discovery:read', 
      description: 'Discover network devices',
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
    },
    { 
      path: '/operations', 
      label: 'Operations', 
      icon: '⚙️', 
      permission: 'operations:read', 
      description: 'Run operations on assets',
      step: 3,
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
      path: '/scanners', 
      label: 'Scanners', 
      icon: '🖥️', 
      permission: 'scanners:read', 
      description: 'Manage scanner services',
      category: 'management'
    },
    { 
      path: '/users', 
      label: 'Users', 
      icon: '👥', 
      permission: 'users:read', 
      description: 'User and role management',
      category: 'management'
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: '🔧', 
      permission: 'settings:read', 
      description: 'Global system settings',
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
    <div className="flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">DiscoverIT</h1>
        <ThemeToggle size="small" showLabel={false} />
      </div>
      
      <nav className="flex-grow p-4 space-y-6">
        {/* Workflow Steps */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Workflow
          </h3>
          <div className="space-y-1">
            {workflowSteps.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span>{item.label}</span>
                    {item.step > 0 && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {item.step}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-600">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Management */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Management
          </h3>
          <div className="space-y-1">
            {managementItems.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span>{item.label}</span>
                  <div className="text-xs text-slate-500 group-hover:text-slate-600">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Help */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Help
          </h3>
          <div className="space-y-1">
            {helpItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span>{item.label}</span>
                  <div className="text-xs text-slate-500 group-hover:text-slate-600">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Status Message */}
      {statusMessage && (
        <div className="p-4 border-t border-slate-200">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">{statusMessage}</span>
              <button
                onClick={clearStatusMessage}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Menu */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.role?.name || 'No Role'}
              {user?.is_superuser && <span className="ml-1 text-red-600">• Admin</span>}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-slate-600"
            title="Logout"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

	return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      <div className="flex-grow overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute requiredPermission="assets:read">
              <WorkflowDashboard />
            </ProtectedRoute>
          } />
          <Route path="/discovery" element={
            <ProtectedRoute requiredPermission="discovery:read">
              <AssetDiscovery />
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
                           <Route path="/operations" element={
                               <ProtectedRoute requiredPermission="operations:read">
                                   <OperationsExecution />
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
          <Route path="/scanners" element={
            <ProtectedRoute requiredPermission="scanners:read">
              <ScannerManager />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredPermission="users:read">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredPermission="settings:read">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/workflow" element={<WorkflowGuide />} />
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
