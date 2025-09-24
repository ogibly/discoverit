/**
 * Custom hook for API calls with loading states and error handling
 */
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v2';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios({
        url: `${API_BASE}${endpoint}`,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, options = {}) => 
    apiCall(endpoint, { method: 'GET', ...options }), [apiCall]);
  
  const post = useCallback((endpoint, data, options = {}) => 
    apiCall(endpoint, { method: 'POST', data, ...options }), [apiCall]);
  
  const put = useCallback((endpoint, data, options = {}) => 
    apiCall(endpoint, { method: 'PUT', data, ...options }), [apiCall]);
  
  const del = useCallback((endpoint, options = {}) => 
    apiCall(endpoint, { method: 'DELETE', ...options }), [apiCall]);

  return {
    loading,
    error,
    apiCall,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
  };
};
