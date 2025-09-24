import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const StandardList = ({
  // Data
  items = [],
  loading = false,
  
  // Configuration
  title = "Items",
  subtitle = "Manage your items",
  itemName = "item",
  itemNamePlural = "items",
  
  // Search and filtering
  searchPlaceholder = "Search items...",
  searchValue = "",
  onSearchChange = () => {},
  filterOptions = [],
  filterValue = "all",
  onFilterChange = () => {},
  
  // Sorting
  sortOptions = [],
  sortValue = "name",
  onSortChange = () => {},
  sortOrder = "asc",
  onSortOrderChange = () => {},
  
  // View mode
  viewMode = "table",
  onViewModeChange = () => {},
  
  // Selection
  selectedItems = [],
  onItemSelect = () => {},
  onSelectAll = () => {},
  
  // Actions
  onCreateClick = () => {},
  createButtonText = "Create Item",
  onBulkDelete = () => {},
  
  // Statistics
  statistics = [],
  
  // Rendering
  renderItem = () => null,
  renderItemCard = () => null,
  renderItemRow = () => null,
  tableHeaders = null,
  
  // Empty state
  emptyStateIcon = "📋",
  emptyStateTitle = "No items found",
  emptyStateDescription = "Create your first item to get started.",
  
  // Custom actions
  customActions = [],
  
  // Styling
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (searchValue) {
        const searchLower = searchValue.toLowerCase();
        const searchableFields = [
          item.name,
          item.title,
          item.description,
          item.ip_address,
          item.hostname,
          item.mac_address,
          item.credential_type,
          item.device_type,
          ...(item.labels || []).map(label => label.name)
        ].filter(Boolean);
        
        if (!searchableFields.some(field => 
          field.toString().toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }
      
      // Type filter
      if (filterValue !== "all") {
        if (item.credential_type && item.credential_type !== filterValue) return false;
        if (item.device_type && item.device_type !== filterValue) return false;
        if (item.status && item.status !== filterValue) return false;
      }
      
      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortValue) {
        case 'name':
        case 'title':
          aValue = (a.name || a.title || '').toLowerCase();
          bValue = (b.name || b.title || '').toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'last_seen':
          aValue = new Date(a.last_seen || 0);
          bValue = new Date(b.last_seen || 0);
          break;
        case 'ip_address':
          aValue = a.ip_address || '';
          bValue = b.ip_address || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = (a[sortValue] || '').toString().toLowerCase();
          bValue = (b[sortValue] || '').toString().toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [items, searchValue, filterValue, sortValue, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allSelected = paginatedItems.length > 0 && paginatedItems.every(item => selectedItems.includes(item.id));

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, filterValue, sortValue, sortOrder]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">{title}</h2>
          <p className="text-caption text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {statistics.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={cn("text-2xl font-bold", stat.color || "text-primary")}>
                {stat.value}
              </div>
              <div className="text-caption text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              {filterOptions.length > 0 && (
                <select
                  value={filterValue}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              )}
              {sortOptions.length > 0 && (
                <select
                  value={sortValue}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {sortOptions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              )}
              <Button onClick={onCreateClick} className="ml-2">
                {createButtonText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statistics.map((stat, index) => (
            <Card key={index} className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-2xl font-bold", stat.color || "text-primary")}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor || "bg-primary/20")}>
                    <span className={cn("text-lg", stat.iconColor || "text-primary")}>
                      {stat.icon}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedItems.length} {selectedItems.length === 1 ? itemName : itemNamePlural} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAll([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                {onBulkDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDelete(selectedItems)}
                    className="text-error hover:text-error hover:bg-error/10 border-error/20"
                  >
                    Delete Selected
                  </Button>
                )}
                {customActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => action.onClick(selectedItems)}
                    className={action.className}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-subheading text-foreground mb-2">Loading {itemNamePlural}...</h3>
          </CardContent>
        </Card>
      ) : filteredAndSortedItems.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">{emptyStateIcon}</div>
            <h3 className="text-subheading text-foreground mb-2">{emptyStateTitle}</h3>
            <p className="text-body text-muted-foreground">
              {emptyStateDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">View:</span>
              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className={cn(
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
                    viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ⊞
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange('table')}
                  className={cn(
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
                    viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ☰
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? itemName : itemNamePlural}
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => (
                <div key={item.id}>
                  {renderItemCard ? renderItemCard(item) : renderItem(item)}
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <Card className="surface-elevated">
              <CardContent className="p-0">
                <div className="overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => onSelectAll(allSelected ? [] : paginatedItems.map(item => item.id))}
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                        </th>
                        {renderItemRow && (
                          tableHeaders ? tableHeaders : (
                            <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
                              {itemNamePlural}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => onItemSelect(item.id)}
                              className="rounded border-border text-primary focus:ring-ring"
                            />
                          </td>
                          {renderItemRow ? renderItemRow(item) : (
                            <td className="px-6 py-4">
                              {renderItem(item)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="px-3 py-1"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StandardList;
