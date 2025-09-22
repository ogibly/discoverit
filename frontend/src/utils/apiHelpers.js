import axios from 'axios';

/**
 * Common API error handler
 * @param {Error} error - The error object
 * @param {string} operation - The operation being performed
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, operation = 'operation') => {
  console.error(`Failed to ${operation}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || error.response.statusText;
    return `Failed to ${operation}: ${message}`;
  } else if (error.request) {
    // Request was made but no response received
    return `Network error: Unable to ${operation}. Please check your connection.`;
  } else {
    // Something else happened
    return `Error: ${error.message}`;
  }
};

/**
 * Generic API operation wrapper with error handling
 * @param {Function} apiCall - The API function to call
 * @param {string} operation - Description of the operation
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Promise} Promise that resolves with the result
 */
export const withErrorHandling = async (apiCall, operation, onSuccess, onError) => {
  try {
    const result = await apiCall();
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    const errorMessage = handleApiError(error, operation);
    if (onError) onError(errorMessage);
    throw error;
  }
};

/**
 * Common CRUD operations for API endpoints
 */
export const createCrudOperations = (api, endpoint) => {
  return {
    // Create
    create: async (data) => {
      return withErrorHandling(
        () => api.post(`/${endpoint}`, data),
        `create ${endpoint}`,
        null,
        null
      );
    },

    // Read (single)
    get: async (id) => {
      return withErrorHandling(
        () => api.get(`/${endpoint}/${id}`),
        `get ${endpoint}`,
        null,
        null
      );
    },

    // Read (list)
    list: async (params = {}) => {
      return withErrorHandling(
        () => api.get(`/${endpoint}`, { params }),
        `list ${endpoint}`,
        null,
        null
      );
    },

    // Update
    update: async (id, data) => {
      return withErrorHandling(
        () => api.put(`/${endpoint}/${id}`, data),
        `update ${endpoint}`,
        null,
        null
      );
    },

    // Delete
    delete: async (id) => {
      return withErrorHandling(
        () => api.delete(`/${endpoint}/${id}`),
        `delete ${endpoint}`,
        null,
        null
      );
    },

    // Bulk delete
    bulkDelete: async (ids) => {
      return withErrorHandling(
        () => Promise.all(ids.map(id => api.delete(`/${endpoint}/${id}`))),
        `bulk delete ${endpoint}`,
        null,
        null
      );
    }
  };
};

/**
 * Common form validation rules
 */
export const validationRules = {
  required: (message = 'This field is required') => ({
    required: message
  }),

  email: (message = 'Please enter a valid email address') => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: message
  }),

  url: (message = 'Please enter a valid URL') => ({
    pattern: /^https?:\/\/.+/,
    patternMessage: message
  }),

  ipAddress: (message = 'Please enter a valid IP address') => ({
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    patternMessage: message
  }),

  minLength: (length, message) => ({
    minLength: length,
    minLengthMessage: message || `Minimum length is ${length} characters`
  }),

  maxLength: (length, message) => ({
    maxLength: length,
    maxLengthMessage: message || `Maximum length is ${length} characters`
  }),

  custom: (validator, message) => ({
    custom: validator,
    customMessage: message || 'Invalid value'
  })
};

/**
 * Common status colors and text
 */
export const statusConfig = {
  active: { color: 'text-green-600', bg: 'bg-green-100', text: 'Active' },
  inactive: { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Inactive' },
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending' },
  running: { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Running' },
  completed: { color: 'text-green-600', bg: 'bg-green-100', text: 'Completed' },
  failed: { color: 'text-red-600', bg: 'bg-red-100', text: 'Failed' },
  cancelled: { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Cancelled' }
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Never';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'Never';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};
