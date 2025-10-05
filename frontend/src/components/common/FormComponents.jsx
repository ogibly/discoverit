/**
 * Consolidated Form Components
 * Reusable form components to reduce duplication
 */

import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// Form Field Component
export const FormField = ({
  label,
  error,
  required = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

// Form Input Component
export const FormInput = ({
  label,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <FormField label={label} error={error} required={required}>
      <Input
        className={cn(
          'w-full bg-slate-700/50 border-slate-600 text-white placeholder-slate-400',
          'focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
    </FormField>
  );
};

// Form Textarea Component
export const FormTextarea = ({
  label,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <FormField label={label} error={error} required={required}>
      <textarea
        className={cn(
          'w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg',
          'text-white placeholder-slate-400 resize-none',
          'focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:outline-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
    </FormField>
  );
};

// Form Select Component
export const FormSelect = ({
  label,
  error,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  return (
    <FormField label={label} error={error} required={required}>
      <select
        className={cn(
          'w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg',
          'text-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:outline-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

// Form Checkbox Component
export const FormCheckbox = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <FormField label={label} error={error}>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className={cn(
            'w-4 h-4 text-yellow-500 bg-slate-700/50 border-slate-600 rounded',
            'focus:ring-2 focus:ring-yellow-500/20 focus:ring-offset-0',
            error && 'border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
    </FormField>
  );
};

// Form Actions Component
export const FormActions = ({
  onCancel,
  onSave,
  onDelete,
  isLoading = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  deleteText = 'Delete',
  className = '',
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-end space-x-3 pt-6 border-t border-slate-700', className)} {...props}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
        >
          {cancelText}
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          disabled={isLoading}
          className="border-red-600 text-red-400 hover:bg-red-500/10"
        >
          {deleteText}
        </Button>
      )}
      {onSave && (
        <Button
          type="submit"
          onClick={onSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold"
        >
          {isLoading ? 'Saving...' : saveText}
        </Button>
      )}
    </div>
  );
};

// Form Section Component
export const FormSection = ({
  title,
  description,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Grid Component
export const FormGrid = ({
  columns = 2,
  children,
  className = '',
  ...props
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)} {...props}>
      {children}
    </div>
  );
};

export default {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormActions,
  FormSection,
  FormGrid
};
