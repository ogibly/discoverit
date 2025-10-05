/**
 * Custom Hook: useToggle
 * Efficient boolean state management with multiple toggle options
 */

import { useState, useCallback, useMemo } from 'react';

export const useToggle = (initialValue = false, options = {}) => {
  const {
    onToggle = null,
    onTrue = null,
    onFalse = null
  } = options;

  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => {
      const newValue = !prev;
      
      if (onToggle) onToggle(newValue);
      if (newValue && onTrue) onTrue();
      if (!newValue && onFalse) onFalse();
      
      return newValue;
    });
  }, [onToggle, onTrue, onFalse]);

  const setTrue = useCallback(() => {
    setValue(true);
    if (onTrue) onTrue();
  }, [onTrue]);

  const setFalse = useCallback(() => {
    setValue(false);
    if (onFalse) onFalse();
  }, [onFalse]);

  const setValue = useCallback((newValue) => {
    setValue(newValue);
    if (onToggle) onToggle(newValue);
  }, [onToggle]);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  };
};

// Hook for multiple toggles
export const useToggles = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);

  const toggle = useCallback((key) => {
    setValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const setTrue = useCallback((key) => {
    setValues(prev => ({
      ...prev,
      [key]: true
    }));
  }, []);

  const setFalse = useCallback((key) => {
    setValues(prev => ({
      ...prev,
      [key]: false
    }));
  }, []);

  const setValue = useCallback((key, value) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const setAll = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    toggle,
    setTrue,
    setFalse,
    setValue,
    setAll,
    reset
  };
};

export default useToggle;
