import React from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import ScanManager from './components/ScanManager';
import OperationsEnhanced from './components/OperationsEnhanced';
import Settings from './components/Settings';
import CredentialsManager from './components/CredentialsManager';
import ScannerManager from './components/ScannerManager';
import { cn } from './utils/cn';

// Navigation component
const Navigation = () => {
	const location = useLocation();
  const { statusMessage, clearStatusMessage } = useApp();

  const navItems = [
    { path: '/', label: 'Assets', icon: '🏠' },
    { path: '/scans', label: 'Scans', icon: '🔍' },
    { path: '/operations', label: 'Operations', icon: '⚙️' },
    { path: '/credentials', label: 'Credentials', icon: '🔐' },
    { path: '/scanners', label: 'Scanners', icon: '🖥️' },
    { path: '/settings', label: 'Settings', icon: '🔧' }
  ];

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
	return (
    <div className="flex h-screen bg-slate-50">
      <Navigation />
      <div className="flex-grow overflow-hidden">
				<Routes>
          <Route path="/" element={<AssetsPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/credentials" element={<CredentialsPage />} />
          <Route path="/scanners" element={<ScannersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
				</Routes>
			</div>
		</div>
	);
};

// Root App component with provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
	);
}

export default App;
