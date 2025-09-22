import React, { useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import { formatDate, formatRelativeTime } from '../../utils/apiHelpers';

const DataTable = ({
  data = [],
  columns = [],
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortBy = 'name',
  sortOrder = 'asc',
  onSortChange,
  selectedItems = [],
  onSelectionChange,
  onSelectAll,
  viewMode = 'table',
  onViewModeChange,
  actions = [],
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  pagination = null
}) => {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = column.accessor ? item[column.accessor] : item[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  const handleSort = (columnKey) => {
    if (onSortChange) {
      const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(columnKey, newOrder);
    }
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll(sortedData.map(item => item.id));
    }
  };

  const isAllSelected = selectedItems.length === sortedData.length && sortedData.length > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < sortedData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">No data found</div>
        <div className="text-sm text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onSearchChange && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
          
          {selectedItems.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedItems.length} selected
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onViewModeChange && (
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('table')}
                className={cn(
                  "px-3 py-1 text-sm",
                  viewMode === 'table' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                📋
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  "px-3 py-1 text-sm",
                  viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                🔲
              </Button>
            </div>
          )}
          
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || (action.requiresSelection && selectedItems.length === 0)}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {viewMode === 'table' ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {onSelectionChange && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={input => {
                          if (input) input.indeterminate = isPartiallySelected;
                        }}
                        onChange={handleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                        column.sortable && "cursor-pointer hover:text-foreground"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            <svg
                              className={cn(
                                "h-3 w-3",
                                sortBy === column.key && sortOrder === 'asc' ? "text-primary" : "text-muted-foreground"
                              )}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                            <svg
                              className={cn(
                                "h-3 w-3 -mt-1",
                                sortBy === column.key && sortOrder === 'desc' ? "text-primary" : "text-muted-foreground"
                              )}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-muted/30">
                    {onSelectionChange && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => onSelectionChange(item.id)}
                          className="rounded border-border"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.render ? (
                          column.render(item[column.accessor || column.key], item)
                        ) : (
                          <span>{item[column.accessor || column.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedData.map((item, index) => (
            <div
              key={item.id || index}
              className={cn(
                "border border-border rounded-lg p-4 hover:shadow-md transition-shadow",
                selectedItems.includes(item.id) && "ring-2 ring-primary"
              )}
            >
              {onSelectionChange && (
                <div className="flex justify-between items-start mb-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => onSelectionChange(item.id)}
                    className="rounded border-border"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key}>
                    <div className="text-xs text-muted-foreground font-medium">
                      {column.header}
                    </div>
                    <div className="text-sm">
                      {column.render ? (
                        column.render(item[column.accessor || column.key], item)
                      ) : (
                        <span>{item[column.accessor || column.key]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.start} to {pagination.end} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrevious}
              disabled={!pagination.hasPrevious}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Common column renderers
export const columnRenderers = {
  status: (value) => (
    <Badge variant={value === 'active' ? 'default' : 'secondary'}>
      {value}
    </Badge>
  ),
  
  date: (value) => (
    <span className="text-sm text-muted-foreground">
      {formatDate(value)}
    </span>
  ),
  
  relativeTime: (value) => (
    <span className="text-sm text-muted-foreground">
      {formatRelativeTime(value)}
    </span>
  ),
  
  boolean: (value) => (
    <Badge variant={value ? 'default' : 'secondary'}>
      {value ? 'Yes' : 'No'}
    </Badge>
  ),
  
  actions: (value, item, actions = []) => (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          onClick={() => action.onClick(item)}
          disabled={action.disabled && action.disabled(item)}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  )
};

export default DataTable;
