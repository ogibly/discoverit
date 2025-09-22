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
    <div className={cn("bg-card border-b border-border", className)}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-body text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {searchPlaceholder && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearch?.(e.target.value)}
                  className="pl-10 w-64 text-body"
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
