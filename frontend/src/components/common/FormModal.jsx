import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitVariant = 'default',
  cancelVariant = 'outline',
  isLoading = false,
  isDisabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-body text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
          <Button
            variant={cancelVariant}
            onClick={onCancel || onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={submitVariant}
            onClick={onSubmit}
            disabled={isDisabled || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Common form field components
export const FormField = ({
  label,
  error,
  required = false,
  children,
  className = ''
}) => (
  <div className={cn("space-y-2", className)}>
    <label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-destructive">{error}</p>
    )}
  </div>
);

export const FormInput = ({
  label,
  error,
  required = false,
  className = '',
  ...props
}) => (
  <FormField label={label} error={error} required={required} className={className}>
    <Input {...props} />
  </FormField>
);

export const FormTextarea = ({
  label,
  error,
  required = false,
  className = '',
  rows = 3,
  ...props
}) => (
  <FormField label={label} error={error} required={required} className={className}>
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      rows={rows}
      {...props}
    />
  </FormField>
);

export const FormSelect = ({
  label,
  error,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  ...props
}) => (
  <FormField label={label} error={error} required={required} className={className}>
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FormField>
);

export const FormCheckbox = ({
  label,
  error,
  required = false,
  className = '',
  ...props
}) => (
  <FormField label={label} error={error} required={required} className={className}>
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        className="rounded border-border"
        {...props}
      />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  </FormField>
);

export const FormTags = ({
  label,
  error,
  required = false,
  value = [],
  onChange,
  placeholder = 'Add tags...',
  className = ''
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
};

export default FormModal;
