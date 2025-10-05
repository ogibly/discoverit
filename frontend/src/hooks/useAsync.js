/**
 * Custom Hook: useAsync
 * Efficient async state management with loading, error, and success states
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useAsync = (asyncFunction, options = {}) => {
  const {
    immediate = false,
    dependencies = [],
    onSuccess = null,
    onError = null,
    onFinally = null,
    retryCount = 0,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState({
    data: null,
    error: null,
    loading: false,
    success: false
  });

  const [retryAttempts, setRetryAttempts] = useState(0);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Execute async function
  const execute = useCallback(async (...args) => {
    if (!asyncFunction) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    setRetryAttempts(0);

    try {
      const result = await asyncFunction(...args);
      
      if (isMountedRef.current) {
        setState({
          data: result,
          error: null,
          loading: false,
          success: true
        });
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
      
      return result;
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
          success: false
        }));
        
        if (onError) {
          onError(error);
        }
      }
      
      throw error;
    } finally {
      if (isMountedRef.current) {
        if (onFinally) {
          onFinally();
        }
      }
    }
  }, [asyncFunction, onSuccess, onError, onFinally]);

  // Retry function
  const retry = useCallback(async (...args) => {
    if (retryAttempts >= retryCount) return;

    setRetryAttempts(prev => prev + 1);
    
    if (retryDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        execute(...args);
      }, retryDelay);
    } else {
      execute(...args);
    }
  }, [retryAttempts, retryCount, retryDelay, execute]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      success: false
    });
    setRetryAttempts(0);
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && asyncFunction) {
      execute();
    }
  }, [immediate, execute]);

  // Execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0 && asyncFunction) {
      execute();
    }
  }, dependencies);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    retryAttempts,
    canRetry: retryAttempts < retryCount
  };
};

// Hook for multiple async operations
export const useAsyncAll = (asyncFunctions, options = {}) => {
  const {
    immediate = false,
    dependencies = [],
    onSuccess = null,
    onError = null,
    onFinally = null
  } = options;

  const [state, setState] = useState({
    data: [],
    errors: [],
    loading: false,
    success: false,
    completed: 0,
    total: asyncFunctions.length
  });

  const executeAll = useCallback(async (...args) => {
    setState(prev => ({
      ...prev,
      loading: true,
      errors: [],
      completed: 0
    }));

    const results = [];
    const errors = [];

    try {
      for (let i = 0; i < asyncFunctions.length; i++) {
        try {
          const result = await asyncFunctions[i](...args);
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
        
        setState(prev => ({
          ...prev,
          completed: i + 1
        }));
      }

      setState({
        data: results,
        errors,
        loading: false,
        success: errors.length === 0,
        completed: asyncFunctions.length,
        total: asyncFunctions.length
      });

      if (onSuccess) {
        onSuccess(results);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error,
        loading: false,
        success: false
      }));

      if (onError) {
        onError(error);
      }
    } finally {
      if (onFinally) {
        onFinally();
      }
    }
  }, [asyncFunctions, onSuccess, onError, onFinally]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && asyncFunctions.length > 0) {
      executeAll();
    }
  }, [immediate, executeAll]);

  // Execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0 && asyncFunctions.length > 0) {
      executeAll();
    }
  }, dependencies);

  return {
    ...state,
    executeAll
  };
};

export default useAsync;