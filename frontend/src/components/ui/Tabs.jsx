import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }) => {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  
  const currentValue = value !== undefined ? value : selectedValue;
  
  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-slate-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        selectedValue === value
          ? 'bg-slate-700 text-slate-100 shadow-sm'
          : 'text-slate-400 hover:text-slate-100',
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = useContext(TabsContext);
  
  if (selectedValue !== value) {
    return null;
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'mt-2 ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
