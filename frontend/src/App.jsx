import React from 'react';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import ScanManager from './components/ScanManager';
import OperationsEnhanced from './components/OperationsEnhanced';
import Settings from './components/Settings';
import CredentialsManager from './components/CredentialsManager';
import ScannerManager from './components/ScannerManager';
import AssetDiscovery from './components/AssetDiscovery';
import UserManagement from './components/UserManagement';
import WorkflowGuide from './components/WorkflowGuide';
import { cn } from './utils/cn';

// Navigation component
const Navigation = () => {
	const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { path: '/', label: 'Assets', icon: '🏠', permission: 'assets:read', description: 'View and manage discovered assets' },
    { path: '/discovery', label: 'Discovery', icon: '🔍', permission: 'discovery:read', description: 'Discover network devices and create assets' },
    { path: '/operations', label: 'Operations', icon: '⚙️', permission: 'operations:read', description: 'Run operations on assets and groups' },
    { path: '/credentials', label: 'Credentials', icon: '🔐', permission: 'credentials:read', description: 'Manage authentication credentials' },
    { path: '/scanners', label: 'Scanners', icon: '🖥️', permission: 'scanners:read', description: 'Manage scanner service instances' },
    { path: '/users', label: 'Users', icon: '👥', permission: 'users:read', description: 'User and role management' },
    { path: '/settings', label: 'Settings', icon: '🔧', permission: 'settings:read', description: 'Global system settings' },
    { path: '/workflow', label: 'Workflow Guide', icon: '📖', permission: null, description: 'Complete workflow documentation' }
  ].filter(item => !item.permission || hasPermission(item.permission));

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200">
      <div className="flex items-center justify-center h-16 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">DiscoverIT</h1>
      </div>
      
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center space-x-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              location.pathname === item.path
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
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

// Assets page component
const AssetsPage = () => {
  const { selectedAsset, setSelectedAsset } = useApp();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex gap-6 p-6 min-h-0">
        <div className="flex-grow">
          <AssetList />
        </div>
        <div className="w-1/3">
          <AssetDetail asset={selectedAsset} />
        </div>
      </div>
    </div>
  );
};

// Discovery page component
const DiscoveryPage = () => {
  return (
    <div className="p-6">
      <AssetDiscovery />
    </div>
  );
};

// Scans page component
const ScansPage = () => {
  return (
    <div className="p-6">
      <ScanManager />
    </div>
  );
};

// Operations page component
const OperationsPage = () => {
  return (
    <div className="p-6">
      <OperationsEnhanced />
    </div>
  );
};

// Credentials page component
const CredentialsPage = () => {
  return (
    <div className="p-6">
      <CredentialsManager />
    </div>
  );
};

// Scanners page component
const ScannersPage = () => {
  return (
    <div className="p-6">
      <ScannerManager />
    </div>
  );
};

// Settings page component
const SettingsPage = () => {
  return (
    <div className="p-6">
      <Settings />
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
    <div className="flex h-screen bg-slate-50">
      <Navigation />
      <div className="flex-grow overflow-hidden">
				<Routes>
          <Route path="/" element={
            <ProtectedRoute requiredPermission="assets:read">
              <AssetsPage />
            </ProtectedRoute>
          } />
          <Route path="/discovery" element={
            <ProtectedRoute requiredPermission="discovery:read">
              <DiscoveryPage />
            </ProtectedRoute>
          } />
          <Route path="/operations" element={
            <ProtectedRoute requiredPermission="operations:read">
              <OperationsPage />
            </ProtectedRoute>
          } />
          <Route path="/credentials" element={
            <ProtectedRoute requiredPermission="credentials:read">
              <CredentialsPage />
            </ProtectedRoute>
          } />
          <Route path="/scanners" element={
            <ProtectedRoute requiredPermission="scanners:read">
              <ScannersPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredPermission="users:read">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredPermission="settings:read">
              <SettingsPage />
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
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
