/**
 * Formatting utilities
 */

// Date formatting
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return '-';
  }
};

// DateTime formatting
export const formatDateTime = (date, options = {}) => {
  if (!date) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Date(date).toLocaleString('en-US', defaultOptions);
  } catch {
    return '-';
  }
};

// Timezone-aware timestamp formatting
export const formatTimestamp = (timestamp, options = {}) => {
  if (!timestamp) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
    ...options
  };
  
  try {
    let date;
    
    // Handle different timestamp formats from the backend
    if (typeof timestamp === 'string') {
      // If it's an ISO string without timezone info, assume it's UTC
      if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
        // Add 'Z' to indicate UTC
        date = new Date(timestamp + 'Z');
      } else {
        // Already has timezone info
        date = new Date(timestamp);
      }
    } else {
      // Assume it's already a Date object or timestamp
      date = new Date(timestamp);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '-';
    }
    
    // Format in user's local timezone
    return date.toLocaleString(undefined, defaultOptions);
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error);
    return '-';
  }
};

// Relative time formatting
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  try {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(date);
  } catch {
    return '-';
  }
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Number formatting
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '-';
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  try {
    return new Intl.NumberFormat('en-US', defaultOptions).format(number);
  } catch {
    return number.toString();
  }
};

// Percentage formatting
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

// Scan progress formatting - ensures progress never exceeds 100%
export const formatScanProgress = (progress, decimals = 0) => {
  if (progress === null || progress === undefined) return '0%';
  
  // Cap progress at 100% and round to specified decimals
  const cappedProgress = Math.min(Math.max(progress, 0), 100);
  return `${cappedProgress.toFixed(decimals)}%`;
};

// Get capped progress value for progress bars
export const getCappedProgress = (progress) => {
  if (progress === null || progress === undefined) return 0;
  return Math.min(Math.max(progress, 0), 100);
};

// Duration formatting
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// MAC address formatting
export const formatMACAddress = (mac) => {
  if (!mac) return '-';
  
  // Remove any existing separators and convert to uppercase
  const cleanMac = mac.replace(/[:-]/g, '').toUpperCase();
  
  // Add colons every 2 characters
  return cleanMac.replace(/(.{2})/g, '$1:').slice(0, -1);
};

// IP address formatting
export const formatIPAddress = (ip) => {
  if (!ip) return '-';
  return ip;
};

// Truncate text
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Convert snake_case to Title Case
export const snakeToTitle = (text) => {
  if (!text) return '';
  return text
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

// Convert camelCase to Title Case
export const camelToTitle = (text) => {
  if (!text) return '';
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};
