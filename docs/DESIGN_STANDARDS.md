# DiscoverIT Design Standards

## Data Table Interface Standard

Based on the successful Devices interface redesign, this document establishes the standard design pattern for all data table interfaces in DiscoverIT.

### Core Design Principles

1. **Fixed Layout Structure**: Headers and filters stay fixed while content scrolls
2. **Advanced Search Capabilities**: JQL-style search with field suggestions
3. **Professional Table Design**: Clean, sortable columns with proper alignment
4. **Responsive Design**: Works seamlessly across all screen sizes
5. **Enhanced User Experience**: Intuitive interactions with hover effects and tooltips

### Standard Layout Structure

```jsx
<div className="h-screen bg-background flex flex-col">
  {/* Fixed Header */}
  <div className="flex-shrink-0 border-b border-border bg-background">
    <PageHeader
      title="Interface Title"
      subtitle="Interface description"
      metrics={[...]} // Key metrics cards
    />
  </div>

  {/* Fixed Search and Filter Bar */}
  <div className="flex-shrink-0 p-6 pb-4 border-b border-border bg-background">
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          {/* Advanced Search with JQL Support */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search with JQL syntax (e.g., field=value, field>value)..."
              value={searchTerm}
              onChange={handleSearchChange}
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
          {/* Filter Dropdown */}
          <select className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]">
            <option value="all">All Items</option>
            {/* Filter options */}
          </select>
          
          {/* Sort Dropdown */}
          <select className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]">
            <option value="default-desc">Default ↓</option>
            {/* Sort options */}
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {totalItems.length} items
          </span>
          {/* Additional statistics */}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-md">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm">
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm">
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Scrollable Content Area */}
  <div className="flex-1 overflow-auto p-6">
    <Card>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-400px)]">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50 sticky top-0 z-10">
              <tr>
                {/* Sortable Column Headers */}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort('field')}
                  title="Click to sort by field"
                >
                  <div className="flex items-center space-x-1">
                    <span>Field Name</span>
                    {sortBy === 'field' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </div>
                </th>
                {/* More columns... */}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Table rows */}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

### JQL Search Implementation

#### Search Field Definitions
```jsx
const searchFields = [
  { key: 'field_name', label: 'Field Label', type: 'string', example: 'field_name=value' },
  { key: 'numeric_field', label: 'Numeric Field', type: 'number', example: 'numeric_field>100' },
  { key: 'date_field', label: 'Date Field', type: 'date', example: 'date_field>2024-01-01' },
  { key: 'status_field', label: 'Status', type: 'string', example: 'status_field=active', options: ['active', 'inactive'] }
];
```

#### Query Parsing
```jsx
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
```

#### Field Value Extraction
```jsx
const getFieldValue = (item, field) => {
  switch (field) {
    case 'field_name': return item.fieldName;
    case 'numeric_field': return item.numericField;
    case 'date_field': return item.dateField;
    default: return null;
  }
};
```

#### Condition Evaluation
```jsx
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
```

### Required Features

#### 1. Fixed Layout
- Header stays fixed at top
- Search/filter bar stays fixed below header
- Only content area scrolls
- Table headers stay fixed during content scroll

#### 2. Advanced Search
- JQL-style syntax support
- Interactive field suggestions
- Real-time search suggestions dropdown
- Support for operators: `=`, `!=`, `>`, `<`, `>=`, `<=`

#### 3. Sortable Columns
- Clickable column headers
- Visual sort indicators (↑↓)
- Hover effects on sortable headers
- Tooltips explaining sort functionality

#### 4. Responsive Design
- Mobile-friendly layout
- Proper text truncation
- Responsive column widths
- Touch-friendly interactions

#### 5. Professional Styling
- Clean table design with proper spacing
- Consistent color scheme
- Hover effects and transitions
- Professional typography

### Implementation Checklist

- [ ] Fixed layout structure with proper flex classes
- [ ] JQL search implementation with field definitions
- [ ] Interactive search suggestions dropdown
- [ ] Sortable column headers with visual indicators
- [ ] Responsive design with proper breakpoints
- [ ] Professional styling with consistent colors
- [ ] Hover effects and smooth transitions
- [ ] Proper accessibility attributes
- [ ] Loading states and error handling
- [ ] Empty states with helpful messaging

### Interfaces to Update

Based on this standard, the following interfaces should be updated:

1. **Assets Interface** - Apply same pattern for asset management
2. **Scan History Interface** - Use for scan task management
3. **Scanner Management Interface** - Apply to scanner configuration
4. **User Management Interface** - Use for user administration
5. **Settings Interface** - Apply to configuration management
6. **Audit Log Interface** - Use for audit trail viewing

### Benefits of This Standard

1. **Consistency**: All data interfaces follow the same pattern
2. **Usability**: Advanced search capabilities across all interfaces
3. **Performance**: Fixed headers improve navigation efficiency
4. **Accessibility**: Consistent interaction patterns
5. **Maintainability**: Standardized code structure
6. **User Experience**: Professional, intuitive interface design

This standard ensures that all data table interfaces in DiscoverIT provide a consistent, professional, and highly functional user experience.
