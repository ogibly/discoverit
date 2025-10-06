/**
 * Unified Application Entry Point
 * Single, consistent application structure with unified design system
 */

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UnifiedThemeProvider } from './contexts/UnifiedThemeContext';
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
import UnifiedLayout from './components/layout/UnifiedLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Main Application Component
const AppContent = () => {
  const { user } = useAuth();
  const { statusMessage, clearStatusMessage } = useApp();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <UnifiedLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/discovery" element={
          <ProtectedRoute>
            <UnifiedScanDevicesInterface />
          </ProtectedRoute>
        } />
        <Route path="/assets" element={
          <ProtectedRoute>
            <AssetsInterface />
          </ProtectedRoute>
        } />
        <Route path="/assets/:id" element={
          <ProtectedRoute>
            <AssetDetail />
          </ProtectedRoute>
        } />
        <Route path="/credentials" element={
          <ProtectedRoute>
            <CredentialsManager />
          </ProtectedRoute>
        } />
        <Route path="/guide" element={
          <ProtectedRoute>
            <WorkflowGuide />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UnifiedLayout>
  );
};

// Main Application with Providers
const UnifiedApp = () => {
  return (
    <ErrorBoundary>
      <UnifiedThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </UnifiedThemeProvider>
    </ErrorBoundary>
  );
};

export default UnifiedApp;
