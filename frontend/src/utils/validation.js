/**
 * Client-side validation utilities for forms
 */

// Validation rules
export const VALIDATION_RULES = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },
  
  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },
  
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  url: (value) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'Please enter a valid URL (starting with http:// or https://)';
    }
    return null;
  },
  
  ldapUri: (value) => {
    if (value && !/^(ldap|ldaps):\/\/.+/.test(value)) {
      return 'Please enter a valid LDAP URI (starting with ldap:// or ldaps://)';
    }
    return null;
  },
  
  port: (value) => {
    if (value && (isNaN(value) || value < 1 || value > 65535)) {
      return 'Port must be a number between 1 and 65535';
    }
    return null;
  },
  
  positiveNumber: (value) => {
    if (value && (isNaN(value) || value <= 0)) {
      return 'Must be a positive number';
    }
    return null;
  },
  
  range: (min, max) => (value) => {
    if (value && (isNaN(value) || value < min || value > max)) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  },
  
  cidr: (value) => {
    if (value && !/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(value)) {
      return 'Please enter a valid CIDR notation (e.g., 192.168.1.0/24)';
    }
    return null;
  },
  
  ipAddress: (value) => {
    if (value && !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      return 'Please enter a valid IP address';
    }
    return null;
  },
  
  username: (value) => {
    if (value && !/^[a-zA-Z0-9_-]{3,}$/.test(value)) {
      return 'Username must be at least 3 characters and contain only letters, numbers, underscores, and hyphens';
    }
    return null;
  },
  
  password: (value) => {
    if (value && value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  }
};

// Field-specific validation rules
export const FIELD_VALIDATIONS = {
  // LDAP Configuration
  ldapName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  ldapServerUri: [VALIDATION_RULES.required, VALIDATION_RULES.ldapUri, VALIDATION_RULES.maxLength(500)],
  ldapUserBaseDn: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(500)],
  ldapBindDn: [VALIDATION_RULES.maxLength(500)],
  ldapBindPassword: [VALIDATION_RULES.maxLength(500)],
  ldapUserSearchFilter: [VALIDATION_RULES.maxLength(500)],
  ldapGroupBaseDn: [VALIDATION_RULES.maxLength(500)],
  ldapGroupSearchFilter: [VALIDATION_RULES.maxLength(500)],
  ldapConnectionTimeout: [VALIDATION_RULES.range(1, 300)],
  ldapReadTimeout: [VALIDATION_RULES.range(1, 300)],
  ldapMaxConnections: [VALIDATION_RULES.range(1, 100)],
  ldapRetryAttempts: [VALIDATION_RULES.range(1, 10)],
  ldapSyncInterval: [VALIDATION_RULES.range(1, 1440)],
  
  // User Management
  username: [VALIDATION_RULES.required, VALIDATION_RULES.username],
  email: [VALIDATION_RULES.required, VALIDATION_RULES.email],
  fullName: [VALIDATION_RULES.maxLength(255)],
  password: [VALIDATION_RULES.required, VALIDATION_RULES.password],
  
  // Credentials
  credentialName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  credentialUsername: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  credentialPassword: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(500)],
  credentialDescription: [VALIDATION_RULES.maxLength(500)],
  
  // Scanner Configuration
  scannerName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  scannerUrl: [VALIDATION_RULES.required, VALIDATION_RULES.url],
  scannerTimeout: [VALIDATION_RULES.positiveNumber],
  scannerMaxConcurrent: [VALIDATION_RULES.positiveNumber],
  
  // Asset Management
  assetName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  assetIp: [VALIDATION_RULES.required, VALIDATION_RULES.ipAddress],
  assetDescription: [VALIDATION_RULES.maxLength(500)],
  
  // Subnet Management
  subnetName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  subnetCidr: [VALIDATION_RULES.required, VALIDATION_RULES.cidr],
  subnetGateway: [VALIDATION_RULES.ipAddress],
  subnetVlanId: [VALIDATION_RULES.range(1, 4094)],
  
  // Role Management
  roleName: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1), VALIDATION_RULES.maxLength(100)],
  roleDescription: [VALIDATION_RULES.maxLength(500)]
};

// Validation function
export const validateField = (value, validations) => {
  for (const validation of validations) {
    const error = validation(value);
    if (error) {
      return error;
    }
  }
  return null;
};

// Validate entire form
export const validateForm = (formData, fieldValidations) => {
  const errors = {};
  let isValid = true;
  
  for (const [fieldName, validations] of Object.entries(fieldValidations)) {
    const value = formData[fieldName];
    const error = validateField(value, validations);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

// Helper to check if form has any errors
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Helper to get first error message
export const getFirstError = (errors) => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
};

// Helper to clear specific field error
export const clearFieldError = (errors, fieldName) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};
