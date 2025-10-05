/**
 * Custom Hook: useForm
 * Comprehensive form management with validation and error handling
 */

import { useState, useCallback, useMemo } from 'react';

export const useForm = (initialValues = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    validationSchema = null,
    onSubmit = null
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update single field value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validateOnChange) {
      validateField(name, value);
    }
  }, [validateOnChange]);

  // Update multiple field values
  const setValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      validateField(name, values[name]);
    }
  }, [validateOnBlur, values]);

  // Validate single field
  const validateField = useCallback((name, value) => {
    if (!validationSchema) return;

    try {
      const fieldSchema = validationSchema[name];
      if (fieldSchema) {
        const fieldErrors = fieldSchema.map(validator => validator(value)).filter(Boolean);
        setErrors(prev => ({
          ...prev,
          [name]: fieldErrors.length > 0 ? fieldErrors[0] : null
        }));
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [validationSchema]);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validationSchema) return { isValid: true, errors: {} };

    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const fieldSchema = validationSchema[fieldName];
      const fieldValue = values[fieldName];
      
      try {
        const fieldErrors = fieldSchema.map(validator => validator(fieldValue)).filter(Boolean);
        if (fieldErrors.length > 0) {
          newErrors[fieldName] = fieldErrors[0];
          isValid = false;
        }
      } catch (error) {
        console.error('Validation error for field:', fieldName, error);
        newErrors[fieldName] = 'Validation error';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  }, [validationSchema, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    if (validateOnSubmit) {
      const { isValid } = validateForm();
      if (!isValid) return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(values, { setErrors, setValues });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateOnSubmit, validateForm, onSubmit, values]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Clear field error
  const clearError = useCallback((fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: null }));
  }, []);

  // Get field props for input components
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
    touched: touched[name]
  }), [values, handleChange, handleBlur, errors, touched]);

  // Computed values
  const isValid = useMemo(() => Object.values(errors).every(error => !error), [errors]);
  const isDirty = useMemo(() => Object.keys(values).some(key => values[key] !== initialValues[key]), [values, initialValues]);
  const hasErrors = useMemo(() => Object.values(errors).some(error => !!error), [errors]);

  return {
    // Values
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    
    // Actions
    setValue,
    setValues,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    clearError,
    validateField,
    validateForm,
    getFieldProps
  };
};

export default useForm;
