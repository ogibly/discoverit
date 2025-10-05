/**
 * Component Utilities
 * Utilities to reduce repetitive patterns and improve code efficiency
 */

import { useCallback, useMemo } from 'react';
import { cn } from './cn';

// Higher-order component for common props
export const withCommonProps = (Component) => {
  return (props) => {
    const commonProps = {
      className: cn('transition-all duration-200', props.className),
      ...props
    };
    return <Component {...commonProps} />;
  };
};

// Create standardized event handlers
export const createEventHandlers = (handlers) => {
  return Object.entries(handlers).reduce((acc, [key, handler]) => {
    acc[key] = useCallback(handler, []);
    return acc;
  }, {});
};

// Memoized component factory
export const createMemoizedComponent = (Component, areEqual) => {
  return React.memo(Component, areEqual);
};

// Component variant system
export const createVariantSystem = (baseClasses, variants) => {
  return (variant, className = '') => {
    return cn(baseClasses, variants[variant], className);
  };
};

// Form field factory
export const createFormField = (FieldComponent) => {
  return ({ name, label, error, required, ...props }) => (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <FieldComponent name={name} {...props} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};

// List item factory
export const createListItem = (ItemComponent) => {
  return ({ items, renderItem, emptyMessage, className = '' }) => {
    if (!items || items.length === 0) {
      return <div className="text-center py-8 text-slate-400">{emptyMessage}</div>;
    }

    return (
      <div className={cn('space-y-2', className)}>
        {items.map((item, index) => (
          <ItemComponent key={item.id || index} {...item}>
            {renderItem ? renderItem(item) : null}
          </ItemComponent>
        ))}
      </div>
    );
  };
};

// Modal factory
export const createModal = (ModalComponent) => {
  return ({ isOpen, onClose, title, children, size = 'md', ...props }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    };

    return (
      <ModalComponent
        isOpen={isOpen}
        onClose={onClose}
        className={cn('fixed inset-0 z-50 flex items-center justify-center', sizeClasses[size])}
        {...props}
      >
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        {children}
      </ModalComponent>
    );
  };
};

// Button factory
export const createButton = (ButtonComponent) => {
  return ({ variant = 'primary', size = 'md', loading = false, ...props }) => {
    const variantClasses = {
      primary: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600',
      outline: 'border border-slate-600 text-slate-300 hover:bg-slate-700/50',
      ghost: 'text-slate-300 hover:bg-slate-700/50'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    return (
      <ButtonComponent
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          loading && 'cursor-wait',
          props.className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
            Loading...
          </span>
        ) : (
          props.children
        )}
      </ButtonComponent>
    );
  };
};

// Card factory
export const createCard = (CardComponent) => {
  return ({ variant = 'default', padding = 'md', hover = false, ...props }) => {
    const variantClasses = {
      default: 'bg-slate-800/50 border border-slate-700',
      elevated: 'bg-slate-800/70 border border-slate-600 shadow-lg',
      flat: 'bg-slate-800/30 border border-slate-700'
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <CardComponent
        className={cn(
          'rounded-2xl transition-all duration-200',
          variantClasses[variant],
          paddingClasses[padding],
          hover && 'hover:shadow-xl hover:scale-[1.02] cursor-pointer',
          props.className
        )}
        {...props}
      />
    );
  };
};

// Badge factory
export const createBadge = (BadgeComponent) => {
  return ({ variant = 'default', size = 'md', ...props }) => {
    const variantClasses = {
      default: 'bg-slate-700 text-slate-300',
      success: 'bg-green-500/20 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      error: 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-sm'
    };

    return (
      <BadgeComponent
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variantClasses[variant],
          sizeClasses[size],
          props.className
        )}
        {...props}
      />
    );
  };
};

// Utility for creating standardized components
export const createComponent = (baseComponent, defaultProps = {}) => {
  return (props) => {
    return <baseComponent {...defaultProps} {...props} />;
  };
};

// Utility for creating compound components
export const createCompoundComponent = (components) => {
  const CompoundComponent = (props) => {
    return <components.Root {...props} />;
  };

  Object.keys(components).forEach(key => {
    CompoundComponent[key] = components[key];
  });

  return CompoundComponent;
};

export default {
  withCommonProps,
  createEventHandlers,
  createMemoizedComponent,
  createVariantSystem,
  createFormField,
  createListItem,
  createModal,
  createButton,
  createCard,
  createBadge,
  createComponent,
  createCompoundComponent
};
