/**
 * Validation utilities
 */

// IP Address validation
export const isValidIP = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// Subnet validation (CIDR notation)
export const isValidSubnet = (subnet) => {
  const subnetRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  return subnetRegex.test(subnet);
};

// MAC Address validation
export const isValidMAC = (mac) => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Required field validation
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Minimum length validation
export const hasMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

// Maximum length validation
export const hasMaxLength = (value, maxLength) => {
  return !value || value.toString().length <= maxLength;
};

// Numeric validation
export const isNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Positive number validation
export const isPositiveNumber = (value) => {
  return isNumeric(value) && parseFloat(value) > 0;
};

// Port number validation
export const isValidPort = (port) => {
  const portNum = parseInt(port);
  return portNum >= 1 && portNum <= 65535;
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (rule.required && !isRequired(value)) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }
      
      if (value && rule.minLength && !hasMinLength(value, rule.minLength)) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        return;
      }
      
      if (value && rule.maxLength && !hasMaxLength(value, rule.maxLength)) {
        errors[field] = rule.message || `${field} must be no more than ${rule.maxLength} characters`;
        return;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} format is invalid`;
        return;
      }
      
      if (value && rule.custom && !rule.custom(value)) {
        errors[field] = rule.message || `${field} is invalid`;
        return;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
