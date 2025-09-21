import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }) => {
  return (
    <div className={cn(
      "inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, className }) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-background/50",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className }) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) return null;

  return (
    <div className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };