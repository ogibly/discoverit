/**
 * Custom Hook: useLocalStorage
 * Efficiently manages localStorage with error handling and SSR support
 */

import { useState, useEffect, useCallback } from 'react';

export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = false,
    onError = (error) => console.warn(`useLocalStorage error for key "${key}":`, error)
  } = options;

  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError(error);
      return initialValue;
    }
  });

  // Set value in localStorage and state
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      onError(error);
    }
  }, [key, serialize, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(error);
    }
  }, [key, initialValue]);

  // Sync across tabs if enabled
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          onError(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, syncAcrossTabs, onError]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;