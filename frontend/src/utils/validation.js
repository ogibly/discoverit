/**
 * Validation Utilities
 * Comprehensive validation system to reduce repetitive validation code
 */

// Common validation functions
export const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length >= min ? null : `Must be at least ${min} characters`;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length <= max ? null : `Must be no more than ${max} characters`;
  },

  min: (min) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return num >= min ? null : `Must be at least ${min}`;
  },

  max: (max) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return num <= max ? null : `Must be no more than ${max}`;
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? null : 'Please enter a valid phone number';
  },

  ip: (value) => {
    if (!value) return null;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(value) ? null : 'Please enter a valid IP address';
  },

  mac: (value) => {
    if (!value) return null;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(value) ? null : 'Please enter a valid MAC address';
  },

  confirmPassword: (password) => (value) => {
    return value === password ? null : 'Passwords do not match';
  },

  unique: (existingValues) => (value) => {
    if (!value) return null;
    return existingValues.includes(value) ? 'This value already exists' : null;
  }
};

// Field validation schemas
export const FIELD_VALIDATIONS = {
  username: [
    validators.required,
    validators.minLength(3),
    validators.maxLength(50),
    validators.pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  ],

  email: [
    validators.required,
    validators.email
  ],

  password: [
    validators.required,
    validators.minLength(8),
    validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],

  phone: [
    validators.required,
    validators.phone
  ],

  url: [
    validators.required,
    validators.url
  ],

  ip: [
    validators.required,
    validators.ip
  ],

  mac: [
    validators.required,
    validators.mac
  ],

  name: [
    validators.required,
    validators.minLength(2),
    validators.maxLength(100)
  ],

  description: [
    validators.maxLength(500)
  ]
};

// Validate single field
export const validateField = (value, validators) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

// Validate entire form
export const validateForm = (values, validationSchema) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationSchema).forEach(fieldName => {
    const fieldValidators = validationSchema[fieldName];
    const fieldValue = values[fieldName];
    
    const error = validateField(fieldValue, fieldValidators);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Create validation schema from field definitions
export const createValidationSchema = (fields) => {
  const schema = {};
  
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    const validators = [];
    
    if (fieldConfig.required) {
      validators.push(validators.required);
    }
    
    if (fieldConfig.minLength) {
      validators.push(validators.minLength(fieldConfig.minLength));
    }
    
    if (fieldConfig.maxLength) {
      validators.push(validators.maxLength(fieldConfig.maxLength));
    }
    
    if (fieldConfig.min) {
      validators.push(validators.min(fieldConfig.min));
    }
    
    if (fieldConfig.max) {
      validators.push(validators.max(fieldConfig.max));
    }
    
    if (fieldConfig.pattern) {
      validators.push(validators.pattern(fieldConfig.pattern, fieldConfig.patternMessage));
    }
    
    if (fieldConfig.type === 'email') {
      validators.push(validators.email);
    }
    
    if (fieldConfig.type === 'url') {
      validators.push(validators.url);
    }
    
    if (fieldConfig.type === 'phone') {
      validators.push(validators.phone);
    }
    
    if (fieldConfig.type === 'ip') {
      validators.push(validators.ip);
    }
    
    if (fieldConfig.type === 'mac') {
      validators.push(validators.mac);
    }
    
    if (fieldConfig.unique) {
      validators.push(validators.unique(fieldConfig.unique));
    }
    
    schema[fieldName] = validators;
  });
  
  return schema;
};

// Async validation support
export const createAsyncValidator = (asyncFunction, message) => {
  return async (value) => {
    try {
      const result = await asyncFunction(value);
      return result ? null : message;
    } catch (error) {
      return message;
    }
  };
};

// Validation middleware
export const withValidation = (Component, validationSchema) => {
  return (props) => {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validate = useCallback((values) => {
      const { isValid, errors: newErrors } = validateForm(values, validationSchema);
      setErrors(newErrors);
      return isValid;
    }, []);

    const handleBlur = useCallback((fieldName) => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    return (
      <Component
        {...props}
        errors={errors}
        touched={touched}
        validate={validate}
        onBlur={handleBlur}
      />
    );
  };
};

export default {
  validators,
  FIELD_VALIDATIONS,
  validateField,
  validateForm,
  createValidationSchema,
  createAsyncValidator,
  withValidation
};