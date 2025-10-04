import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('layout-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('layout-sidebar-width');
      return saved ? JSON.parse(saved) : 256;
    }
    return 256;
  });

  const [layoutPreferences, setLayoutPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('layout-preferences');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Save sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('layout-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Save sidebar width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('layout-sidebar-width', JSON.stringify(sidebarWidth));
    }
  }, [sidebarWidth]);

  // Save layout preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('layout-preferences', JSON.stringify(layoutPreferences));
    }
  }, [layoutPreferences]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const setSidebarState = useCallback((collapsed, width = null) => {
    setSidebarCollapsed(collapsed);
    if (width !== null) {
      setSidebarWidth(width);
    }
  }, []);

  const updateLayoutPreference = useCallback((key, value) => {
    setLayoutPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setSidebarCollapsed(false);
    setSidebarWidth(256);
    setLayoutPreferences({});
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('layout-sidebar-collapsed');
      localStorage.removeItem('layout-sidebar-width');
      localStorage.removeItem('layout-preferences');
    }
  }, []);

  const value = {
    sidebarCollapsed,
    sidebarWidth,
    layoutPreferences,
    toggleSidebar,
    setSidebarState,
    updateLayoutPreference,
    resetLayout
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
