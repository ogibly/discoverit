/**
 * Form helper utilities for consistent form handling across the application
 */

import { validateForm, validators } from './validation';

/**
 * Clean form data by converting empty strings to null for optional fields
 * This prevents 422 errors from the backend when empty strings are sent for optional fields
 */
export const cleanFormData = (formData, optionalFields = []) => {
  const cleaned = { ...formData };
  
  optionalFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  return cleaned;
};

/**
 * Convert string numbers to actual numbers for numeric fields
 */
export const convertNumericFields = (formData, numericFields = []) => {
  const converted = { ...formData };
  
  numericFields.forEach(field => {
    if (converted[field] !== null && converted[field] !== undefined && converted[field] !== '') {
      const num = Number(converted[field]);
      if (!isNaN(num)) {
        converted[field] = num;
      }
    }
  });
  
  return converted;
};

/**
 * Standard form validation and submission handler
 * This prevents common validation issues and provides consistent error handling
 */
export const handleFormSubmission = async ({
  formData,
  validations,
  setFormErrors,
  setError,
  submitFunction,
  onSuccess,
  onError,
  optionalFields = [],
  numericFields = []
}) => {
  try {
    // Validate form
    const { isValid, errors } = validateForm(formData, validations);
    setFormErrors(errors);
    
    if (!isValid) {
      setError('Please fix the validation errors before submitting.');
      return false;
    }
    
    // Clean and prepare form data
    let cleanedData = cleanFormData(formData, optionalFields);
    cleanedData = convertNumericFields(cleanedData, numericFields);
    
    // Submit the form
    await submitFunction(cleanedData);
    
    // Clear errors on success
    setFormErrors({});
    setError(null);
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error('Form submission error:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    setError(errorMessage);
    
    if (onError) {
      onError(error);
    }
    
    return false;
  }
};

/**
 * Standard field change handler that clears field errors when user starts typing
 */
export const createFieldChangeHandler = (fieldName, setFormData, setFormErrors) => {
  return (value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear field error when user starts typing
    setFormErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
  };
};

/**
 * Standard form reset handler
 */
export const createFormResetHandler = (defaultFormData, setFormData, setFormErrors, setError) => {
  return () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setError(null);
  };
};

/**
 * Common validation patterns for different field types
 */
export const COMMON_VALIDATIONS = {
  // Required text fields
  requiredText: [validators.required, validators.minLength(1)],
  
  // Optional text fields
  optionalText: [validators.optionalString],
  
  // Required email
  requiredEmail: [validators.required, validators.email],
  
  // Optional email
  optionalEmail: [validators.optionalString, validators.email],
  
  // Required IP address
  requiredIp: [validators.required, validators.ipAddress],
  
  // Optional IP address
  optionalIp: [validators.optionalString, validators.ipAddress],
  
  // Required CIDR
  requiredCidr: [validators.required, validators.cidr],
  
  // Optional integer with range
  optionalIntegerRange: (min, max) => [
    validators.optionalInteger,
    validators.range(min, max)
  ],
  
  // Required integer with range
  requiredIntegerRange: (min, max) => [
    validators.required,
    validators.range(min, max)
  ],
  
  // Optional number
  optionalNumber: [validators.optionalNumber],
  
  // Required number
  requiredNumber: [validators.required, validators.positiveNumber],
  
  // Text with max length
  textWithMaxLength: (maxLength) => [
    validators.optionalString,
    validators.maxLength(maxLength)
  ],
  
  // Required text with max length
  requiredTextWithMaxLength: (maxLength) => [
    validators.required,
    validators.minLength(1),
    validators.maxLength(maxLength)
  ]
};

/**
 * Common field configurations for different types of forms
 */
export const COMMON_FIELD_CONFIGS = {
  // Subnet form fields
  subnet: {
    optionalFields: ['gateway', 'vlan_id', 'location', 'department', 'description'],
    numericFields: ['vlan_id'],
    validations: {
      name: COMMON_VALIDATIONS.requiredTextWithMaxLength(100),
      cidr: COMMON_VALIDATIONS.requiredCidr,
      gateway: COMMON_VALIDATIONS.optionalIp,
      vlan_id: COMMON_VALIDATIONS.optionalIntegerRange(1, 4094),
      location: COMMON_VALIDATIONS.textWithMaxLength(255),
      department: COMMON_VALIDATIONS.textWithMaxLength(255),
      description: COMMON_VALIDATIONS.textWithMaxLength(500)
    }
  },
  
  // User form fields
  user: {
    optionalFields: ['full_name'],
    numericFields: [],
    validations: {
      username: [validators.required, validators.username],
      email: COMMON_VALIDATIONS.requiredEmail,
      full_name: COMMON_VALIDATIONS.textWithMaxLength(255),
      password: [validators.required, validators.password]
    }
  },
  
  // Credential form fields
  credential: {
    optionalFields: ['description', 'domain', 'port', 'ssh_private_key', 'ssh_passphrase'],
    numericFields: ['port'],
    validations: {
      name: COMMON_VALIDATIONS.requiredTextWithMaxLength(100),
      description: COMMON_VALIDATIONS.textWithMaxLength(500),
      username: COMMON_VALIDATIONS.requiredTextWithMaxLength(100),
      password: COMMON_VALIDATIONS.requiredTextWithMaxLength(500),
      domain: COMMON_VALIDATIONS.textWithMaxLength(255),
      port: [validators.optionalNumber, validators.range(1, 65535)]
    }
  }
};


