/**
 * Modern Theme Context
 * Comprehensive light and dark mode support with enterprise-grade theming
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { modernDesignTokens, lightTheme, darkTheme } from '../design-system/ModernDesignTokens';

const ModernThemeContext = createContext();

export const useModernTheme = () => {
  const context = useContext(ModernThemeContext);
  if (!context) {
    throw new Error('useModernTheme must be used within a ModernThemeProvider');
  }
  return context;
};

export const ModernThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('modern-theme');
      if (saved) {
        return saved;
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [systemTheme, setSystemTheme] = useState('light');

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('modern-theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setSystemThemeMode = () => setTheme(systemTheme);

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const isDark = theme === 'dark';

  const value = {
    theme,
    isDark,
    currentTheme,
    systemTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme: setSystemThemeMode,
    designTokens: modernDesignTokens
  };

  return (
    <ModernThemeContext.Provider value={value}>
      {children}
    </ModernThemeContext.Provider>
  );
};

export default ModernThemeProvider;
