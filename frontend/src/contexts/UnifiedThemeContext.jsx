/**
 * Unified Theme Context
 * Single source of truth for theming across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../design-system/UnifiedDesignTokens';

const UnifiedThemeContext = createContext();

export const useUnifiedTheme = () => {
  const context = useContext(UnifiedThemeContext);
  if (!context) {
    throw new Error('useUnifiedTheme must be used within a UnifiedThemeProvider');
  }
  return context;
};

export const UnifiedThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isDark, setIsDark] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('discoverit-theme') || 'light';
    setTheme(savedTheme);
    setIsDark(savedTheme === 'dark');
  }, []);

  // Update document class and localStorage when theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('discoverit-theme', theme);
    setIsDark(theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  const currentTheme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    currentTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setTheme
  };

  return (
    <UnifiedThemeContext.Provider value={value}>
      {children}
    </UnifiedThemeContext.Provider>
  );
};

export default UnifiedThemeContext;
