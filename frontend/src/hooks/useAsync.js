/**
 * Custom hook for handling async operations with loading, error, and success states
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export const useAsync = (asyncFunction, immediate = false) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await asyncFunction(...args);
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setData(null);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    loading,
    data,
    error,
    execute,
    reset: () => {
      setLoading(false);
      setData(null);
      setError(null);
    },
  };
};
