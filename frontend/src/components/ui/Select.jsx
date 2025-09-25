import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

const Select = ({ value, onValueChange, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    onValueChange(newValue);
    setIsOpen(false);
  };

  const selectedChild = React.Children.toArray(children).find(
    child => child.props.value === selectedValue
  );

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm",
          "bg-background border border-border rounded-md",
          "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "transition-colors duration-200"
        )}
      >
        <span>{selectedChild?.props.children || selectedValue}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg">
          {React.Children.map(children, (child) => (
            <button
              key={child.props.value}
              type="button"
              onClick={() => handleSelect(child.props.value)}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-accent/50",
                "first:rounded-t-md last:rounded-b-md",
                "transition-colors duration-200",
                selectedValue === child.props.value && "bg-accent"
              )}
            >
              {child.props.children}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
};

const SelectContent = ({ children }) => {
  return <>{children}</>;
};

const SelectItem = ({ value, children }) => {
  return { value, children };
};

const SelectValue = ({ placeholder }) => {
  return placeholder;
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
