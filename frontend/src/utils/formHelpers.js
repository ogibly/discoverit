/**
 * Form helper utilities for consistent form handling across the application
 */

import { validateForm, VALIDATION_RULES } from './validation';

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
  requiredText: [VALIDATION_RULES.required, VALIDATION_RULES.minLength(1)],
  
  // Optional text fields
  optionalText: [VALIDATION_RULES.optionalString],
  
  // Required email
  requiredEmail: [VALIDATION_RULES.required, VALIDATION_RULES.email],
  
  // Optional email
  optionalEmail: [VALIDATION_RULES.optionalString, VALIDATION_RULES.email],
  
  // Required IP address
  requiredIp: [VALIDATION_RULES.required, VALIDATION_RULES.ipAddress],
  
  // Optional IP address
  optionalIp: [VALIDATION_RULES.optionalString, VALIDATION_RULES.ipAddress],
  
  // Required CIDR
  requiredCidr: [VALIDATION_RULES.required, VALIDATION_RULES.cidr],
  
  // Optional integer with range
  optionalIntegerRange: (min, max) => [
    VALIDATION_RULES.optionalInteger,
    VALIDATION_RULES.range(min, max)
  ],
  
  // Required integer with range
  requiredIntegerRange: (min, max) => [
    VALIDATION_RULES.required,
    VALIDATION_RULES.range(min, max)
  ],
  
  // Optional number
  optionalNumber: [VALIDATION_RULES.optionalNumber],
  
  // Required number
  requiredNumber: [VALIDATION_RULES.required, VALIDATION_RULES.positiveNumber],
  
  // Text with max length
  textWithMaxLength: (maxLength) => [
    VALIDATION_RULES.optionalString,
    VALIDATION_RULES.maxLength(maxLength)
  ],
  
  // Required text with max length
  requiredTextWithMaxLength: (maxLength) => [
    VALIDATION_RULES.required,
    VALIDATION_RULES.minLength(1),
    VALIDATION_RULES.maxLength(maxLength)
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
      username: [VALIDATION_RULES.required, VALIDATION_RULES.username],
      email: COMMON_VALIDATIONS.requiredEmail,
      full_name: COMMON_VALIDATIONS.textWithMaxLength(255),
      password: [VALIDATION_RULES.required, VALIDATION_RULES.password]
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
      port: [VALIDATION_RULES.optionalNumber, VALIDATION_RULES.range(1, 65535)]
    }
  }
};
