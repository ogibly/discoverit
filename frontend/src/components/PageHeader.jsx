import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';

const PageHeader = ({ 
  title, 
  subtitle, 
  actions = [], 
  searchPlaceholder = "Search...",
  onSearch,
  searchValue,
  className = ""
}) => {
  return (
    <div className={cn("bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700", className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {searchPlaceholder && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearch?.(e.target.value)}
                  className="pl-10 w-64 text-sm"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size={action.size || "sm"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={action.className}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
