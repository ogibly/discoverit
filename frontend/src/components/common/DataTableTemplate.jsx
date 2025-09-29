import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import PageHeader from '../PageHeader';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  RefreshCw,
  Plus
} from 'lucide-react';

/**
 * DataTableTemplate - Reusable component following the DiscoverIT design standard
 * 
 * This component provides a consistent interface for all data table views in DiscoverIT,
 * including JQL-style search, sticky headers, sortable columns, and responsive design.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of items to display
 * @param {Array} props.searchFields - JQL search field definitions
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {Array} props.metrics - Metrics to display in header
 * @param {Function} props.renderItemCard - Function to render item in card view
 * @param {Function} props.renderItemRow - Function to render item in table row
 * @param {Function} props.onRefresh - Function to refresh data
 * @param {Function} props.onCreate - Function to create new item
 * @param {string} props.createButtonText - Text for create button
 * @param {boolean} props.loading - Loading state
 * @param {string} props.emptyStateIcon - Icon for empty state
 * @param {string} props.emptyStateTitle - Title for empty state
 * @param {string} props.emptyStateDescription - Description for empty state
 * @param {string} props.emptyStateActionText - Text for empty state action button
 * @param {Function} props.emptyStateAction - Function for empty state action
 */
const DataTableTemplate = ({
  // Data
  items = [],
  loading = false,
  
  // Configuration
  title = "Items",
  subtitle = "Manage your items",
  metrics = [],
  
  // Search configuration
  searchFields = [],
  searchPlaceholder = "Search items (e.g., field=value, field>value)...",
  
  // Filter and sort options
  filterOptions = [
    { value: 'all', label: 'All Items' }
  ],
  sortOptions = [
    { value: 'name-asc', label: 'Name ↑' },
    { value: 'name-desc', label: 'Name ↓' }
  ],
  
  // Render functions
  renderItemCard,
  renderItemRow,
  
  // Actions
  onRefresh,
  onCreate,
  createButtonText = "Create Item",
  
  // Empty state
  emptyStateIcon = "📋",
  emptyStateTitle = "No items found",
  emptyStateDescription = "No items match your search criteria.",
  emptyStateActionText = "Create Item",
  emptyStateAction,
  
  // Additional props
  ...props
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Search suggestion logic
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    if (value.length > 0) {
      const lastWord = value.split(' ').pop();
      const suggestions = searchFields.filter(field => 
        field.key.toLowerCase().includes(lastWord.toLowerCase()) ||
        field.label.toLowerCase().includes(lastWord.toLowerCase())
      ).map(field => ({
        ...field,
        display: `${field.key}=${field.example.split('=')[1] || 'value'}`
      }));
      
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(suggestions.length > 0);
    } else {
      setShowSearchSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  // Parse JQL-style search query
  const parseSearchQuery = (query) => {
    if (!query.trim()) return { type: 'simple', value: '' };
    
    const jqlPattern = /^(\w+)\s*(=|<|>|<=|>=|!=)\s*(.+)$/;
    const match = query.match(jqlPattern);
    
    if (match) {
      const [, field, operator, value] = match;
      return { type: 'jql', field, operator, value: value.trim() };
    }
    
    return { type: 'simple', value: query };
  };

  // Get field value for JQL queries
  const getFieldValue = (item, field) => {
    // This should be customized for each implementation
    return item[field] || null;
  };

  // Evaluate JQL condition
  const evaluateJQLCondition = (itemValue, operator, searchValue) => {
    if (itemValue === null || itemValue === undefined) return false;
    
    const itemStr = String(itemValue).toLowerCase();
    const searchStr = String(searchValue).toLowerCase();
    
    switch (operator) {
      case '=': return itemStr === searchStr;
      case '!=': return itemStr !== searchStr;
      case '>': return Number(itemValue) > Number(searchValue);
      case '<': return Number(itemValue) < Number(searchValue);
      case '>=': return Number(itemValue) >= Number(searchValue);
      case '<=': return Number(itemValue) <= Number(searchValue);
      default: return itemStr.includes(searchStr);
    }
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    let filtered = items.filter(item => {
      // Parse search query
      const searchQuery = parseSearchQuery(searchTerm);
      let matchesSearch = true;
      
      if (searchQuery.type === 'jql') {
        const { field, operator, value } = searchQuery;
        const itemValue = getFieldValue(item, field);
        
        if (itemValue !== null && itemValue !== undefined) {
          matchesSearch = evaluateJQLCondition(itemValue, operator, value);
        } else {
          matchesSearch = false;
        }
      } else if (searchQuery.type === 'simple' && searchQuery.value) {
        // Simple search - should be customized for each implementation
        const searchValue = searchQuery.value.toLowerCase();
        matchesSearch = Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchValue)
        );
      }
      
      const matchesFilter = filterType === 'all' || 
        (item.status && item.status === filterType);
      
      return matchesSearch && matchesFilter;
    });
    
    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || a.title || '';
          bValue = b.name || b.title || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [items, searchTerm, filterType, sortBy, sortOrder]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return { total: 0 };
    }
    
    return {
      total: items.length,
      filtered: filteredItems.length
    };
  }, [items, filteredItems]);

  // Event handlers
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const currentQuery = searchTerm.split(' ').slice(0, -1).join(' ');
    const newQuery = currentQuery ? `${currentQuery} ${suggestion.display}` : suggestion.display;
    handleSearchChange(newQuery);
    setShowSearchSuggestions(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        <PageHeader
          title={title}
          subtitle={subtitle}
          metrics={metrics}
        />
      </div>

      {/* Fixed Search and Filter Bar */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-border bg-background">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="pl-10"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b border-border">
                      Available fields (JQL-style):
                    </div>
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="font-medium">{suggestion.display}</div>
                        <div className="text-xs text-muted-foreground">{suggestion.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-sm text-muted-foreground">
                Showing {filteredItems.length} of {items.length} items
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh data"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>
              )}
              
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-r-none"
                  title="Card view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">{emptyStateIcon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{emptyStateTitle}</h3>
              <p className="text-muted-foreground mb-6">{emptyStateDescription}</p>
              {(onCreate || emptyStateAction) && (
                <Button
                  onClick={onCreate || emptyStateAction}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createButtonText || emptyStateActionText}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <div key={item.id || index} className="min-h-0">
                {renderItemCard ? renderItemCard(item) : (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{item.name || item.title || 'Item'}</h4>
                      <p className="text-sm text-muted-foreground">Default card view</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[calc(100vh-400px)]">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('name')}
                        title="Click to sort by name"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {sortBy === 'name' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-muted/50 transition-colors">
                        {renderItemRow ? renderItemRow(item) : (
                          <>
                            <td className="px-6 py-4">
                              <div className="font-medium">{item.name || item.title || 'Item'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-muted-foreground">Default row view</div>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">View</Button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataTableTemplate;
