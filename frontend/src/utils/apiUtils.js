/**
 * API Utilities
 * Comprehensive API management to reduce repetitive API code
 */

import axios from 'axios';

// API client configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// CRUD operations factory
export const createCrudApi = (baseUrl) => ({
  getAll: (params = {}) => api.get(baseUrl, { params }),
  getById: (id) => api.get(`${baseUrl}/${id}`),
  create: (data) => api.post(baseUrl, data),
  update: (id, data) => api.put(`${baseUrl}/${id}`, data),
  patch: (id, data) => api.patch(`${baseUrl}/${id}`, data),
  delete: (id) => api.delete(`${baseUrl}/${id}`),
  search: (query, params = {}) => api.get(`${baseUrl}/search`, { params: { q: query, ...params } }),
});

// Resource-specific APIs
export const resources = {
  assets: createCrudApi('/assets'),
  devices: createCrudApi('/devices'),
  scans: createCrudApi('/scans'),
  users: createCrudApi('/users'),
  settings: createCrudApi('/settings'),
};

// Batch operations
export const batchOperations = {
  create: (items) => api.post('/batch/create', { items }),
  update: (items) => api.post('/batch/update', { items }),
  delete: (ids) => api.post('/batch/delete', { ids }),
};

// File operations
export const fileOperations = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  
  download: (url, filename) => {
    return apiClient.get(url, { responseType: 'blob' })
      .then(response => {
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      });
  },
};

// Error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return data.message || 'Validation error.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return data.message || 'An error occurred. Please try again.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

// Retry mechanism
export const withRetry = (apiCall, maxRetries = 3, delay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall(...args);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  };
};

// Cache management
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const withCache = (apiCall, cacheKey, duration = CACHE_DURATION) => {
  return async (...args) => {
    const key = `${cacheKey}-${JSON.stringify(args)}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data;
    }
    
    try {
      const data = await apiCall(...args);
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      throw error;
    }
  };
};

// Request deduplication
const pendingRequests = new Map();

export const withDeduplication = (apiCall) => {
  return async (...args) => {
    const key = `${apiCall.name}-${JSON.stringify(args)}`;
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    
    const promise = apiCall(...args).finally(() => {
      pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, promise);
    return promise;
  };
};

// API hooks
export const useApi = (apiCall, options = {}) => {
  const { immediate = false, dependencies = [] } = options;
  
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });
  
  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [apiCall]);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);
  
  return { ...state, execute };
};

export default {
  api,
  resources,
  batchOperations,
  fileOperations,
  handleApiError,
  withRetry,
  withCache,
  withDeduplication,
  useApi,
};
