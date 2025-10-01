import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';
import { formatTimestampSafe } from '../utils/formatters';
import PageHeader from './PageHeader';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Network,
  Server,
  Smartphone,
  Monitor,
  Router,
  Printer,
  Shield,
  Zap,
  Info,
  Plus,
  Download,
  Upload
} from 'lucide-react';

const AssetsInterface = () => {
  const {
    assets,
    selectedAssets,
    selectedAsset,
    loading,
    toggleAssetSelection,
    selectAllAssets,
    setSelectedAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    bulkDeleteAssets,
    fetchAssets,
    api
  } = useApp();

  const { user } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Search field definitions (JQL-style)
  const searchFields = [
    { key: 'name', label: 'Asset Name', type: 'string', example: 'name=server01' },
    { key: 'ip', label: 'IP Address', type: 'string', example: 'ip=192.168.1.1' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'string', example: 'manufacturer=Dell' },
    { key: 'model', label: 'Model', type: 'string', example: 'model=PowerEdge' },
    { key: 'device_type', label: 'Device Type', type: 'string', example: 'device_type=Server' },
    { key: 'status', label: 'Status', type: 'string', example: 'status=active', options: ['active', 'inactive'] },
    { key: 'location', label: 'Location', type: 'string', example: 'location=datacenter' },
    { key: 'created_at', label: 'Created Date', type: 'date', example: 'created_at>2024-01-01' },
    { key: 'labels', label: 'Labels', type: 'string', example: 'labels=production' }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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

  // Get asset field value for JQL queries
  const getAssetFieldValue = (asset, field) => {
    switch (field) {
      case 'name': return asset.name;
      case 'ip': return asset.primary_ip;
      case 'manufacturer': return asset.manufacturer;
      case 'model': return asset.model;
      case 'device_type': return asset.device_type;
      case 'status': return asset.is_active ? 'active' : 'inactive';
      case 'location': return asset.location;
      case 'created_at': return asset.created_at;
      case 'labels': return asset.labels?.map(l => l.name).join(', ') || '';
      default: return null;
    }
  };

  // Evaluate JQL condition
  const evaluateJQLCondition = (assetValue, operator, searchValue) => {
    if (assetValue === null || assetValue === undefined) return false;
    
    const assetStr = String(assetValue).toLowerCase();
    const searchStr = String(searchValue).toLowerCase();
    
    switch (operator) {
      case '=': return assetStr === searchStr;
      case '!=': return assetStr !== searchStr;
      case '>': return Number(assetValue) > Number(searchValue);
      case '<': return Number(assetValue) < Number(searchValue);
      case '>=': return Number(assetValue) >= Number(searchValue);
      case '<=': return Number(assetValue) <= Number(searchValue);
      default: return assetStr.includes(searchStr);
    }
  };

  // Helper functions - defined before useMemo to avoid initialization errors
  const determineAssetType = (deviceType, manufacturer) => {
    if (deviceType) return deviceType;
    if (manufacturer?.toLowerCase().includes('cisco')) return 'Router';
    if (manufacturer?.toLowerCase().includes('dell')) return 'Server';
    if (manufacturer?.toLowerCase().includes('hp')) return 'Server';
    return 'Network Device';
  };

  const getAssetIcon = (assetType, manufacturer) => {
    if (assetType === 'Router') return <Router className="w-5 h-5" />;
    if (assetType === 'Printer') return <Printer className="w-5 h-5" />;
    if (assetType === 'Server') return <Server className="w-5 h-5" />;
    if (assetType === 'Workstation') return <Monitor className="w-5 h-5" />;
    return <Network className="w-5 h-5" />;
  };

  // Enhanced asset data processing
  const processedAssets = useMemo(() => {
    if (!assets || !Array.isArray(assets)) {
      return [];
    }
    
    return assets.map(asset => {
      const assetType = determineAssetType(asset.device_type, asset.manufacturer);
      const assetIcon = getAssetIcon(assetType, asset.manufacturer);
      
      return {
        ...asset,
        assetType,
        assetIcon,
        status: asset.is_active ? 'active' : 'inactive',
        labelsText: asset.labels?.map(l => l.name).join(', ') || 'No labels'
      };
    });
  }, [assets]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    if (!processedAssets || !Array.isArray(processedAssets)) {
      return [];
    }
    
    let filtered = processedAssets.filter(asset => {
      // Parse search query
      const searchQuery = parseSearchQuery(searchTerm);
      let matchesSearch = true;
      
      if (searchQuery.type === 'jql') {
        const { field, operator, value } = searchQuery;
        const assetValue = getAssetFieldValue(asset, field);
        
        if (assetValue !== null && assetValue !== undefined) {
          matchesSearch = evaluateJQLCondition(assetValue, operator, value);
        } else {
          matchesSearch = false;
        }
      } else if (searchQuery.type === 'simple' && searchQuery.value) {
        // Simple search across multiple fields
        const searchValue = searchQuery.value.toLowerCase();
        matchesSearch = 
          asset.name?.toLowerCase().includes(searchValue) ||
          asset.primary_ip?.toLowerCase().includes(searchValue) ||
          asset.manufacturer?.toLowerCase().includes(searchValue) ||
          asset.model?.toLowerCase().includes(searchValue) ||
          asset.device_type?.toLowerCase().includes(searchValue) ||
          asset.location?.toLowerCase().includes(searchValue) ||
          asset.labelsText?.toLowerCase().includes(searchValue);
      }
      
      const matchesFilter = filterType === 'all' ||
        (filterType === 'active' && asset.is_active) ||
        (filterType === 'inactive' && !asset.is_active) ||
        (filterType === 'managed' && asset.is_managed) ||
        (filterType === 'unmanaged' && !asset.is_managed);
      
      return matchesSearch && matchesFilter;
    });
    
    // Sort assets
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'ip':
          aValue = a.primary_ip || '';
          bValue = b.primary_ip || '';
          break;
        case 'manufacturer':
          aValue = a.manufacturer || '';
          bValue = b.manufacturer || '';
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
  }, [processedAssets, searchTerm, filterType, sortBy, sortOrder]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!processedAssets || !Array.isArray(processedAssets)) {
      return { total: 0, active: 0, inactive: 0, managed: 0, unmanaged: 0 };
    }
    
    const total = processedAssets.length;
    const active = processedAssets.filter(a => a.is_active).length;
    const inactive = processedAssets.filter(a => !a.is_active).length;
    const managed = processedAssets.filter(a => a.is_managed).length;
    const unmanaged = processedAssets.filter(a => !a.is_managed).length;
    
    return { total, active, inactive, managed, unmanaged };
  }, [processedAssets]);

  // Event handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAssets();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditAsset = (asset) => {
    setSelectedAssetForEdit(asset);
    setShowAssetModal(true);
  };

  const handleDeleteAsset = async (asset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      try {
        await deleteAsset(asset.id);
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('Failed to delete asset. Please try again.');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      selectAllAssets([]);
    } else {
      selectAllAssets(filteredAssets.map(a => a.id));
    }
  };

  // Additional helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Render functions
  const renderAssetCard = (asset) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50 h-full">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header with asset info and badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {asset.assetIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate">
                {asset.name || 'Unnamed Asset'}
              </h4>
              <p className="text-sm text-muted-foreground font-mono truncate">
                {asset.primary_ip || 'No IP'}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-1 flex-shrink-0">
            <Badge className={cn("text-xs", getStatusColor(asset.status))}>
              {getStatusIcon(asset.status)}
              <span className="ml-1">{asset.status === 'active' ? 'Active' : 'Inactive'}</span>
            </Badge>
            {asset.is_managed && (
              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Managed
              </Badge>
            )}
          </div>
        </div>
        
        {/* Asset details */}
        <div className="space-y-2 text-sm flex-1">
          {asset.assetType && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground font-medium truncate ml-2">{asset.assetType}</span>
            </div>
          )}
          {asset.manufacturer && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manufacturer:</span>
              <span className="text-foreground font-medium truncate ml-2">{asset.manufacturer}</span>
            </div>
          )}
          {asset.model && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="text-foreground font-medium truncate ml-2">{asset.model}</span>
            </div>
          )}
          {asset.location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="text-foreground font-medium truncate ml-2">{asset.location}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-foreground text-xs">
              {formatTimestampSafe(asset.created_at)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 mt-4 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditAsset(asset)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteAsset(asset)}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAssetRow = (asset) => (
    <tr key={asset.id} className="hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {asset.assetIcon}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {asset.name || 'Unnamed Asset'}
            </p>
            <p className="text-sm text-muted-foreground">{asset.assetType}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-foreground">
          {asset.primary_ip || 'No IP'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <span className="text-sm text-foreground">
            {asset.manufacturer || 'Unknown'}
          </span>
          {asset.model && (
            <div className="text-xs text-muted-foreground">{asset.model}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-1">
          <Badge className={cn("text-xs w-fit", getStatusColor(asset.status))}>
            {getStatusIcon(asset.status)}
            <span className="ml-1">{asset.status === 'active' ? 'Active' : 'Inactive'}</span>
          </Badge>
          {asset.is_managed && (
            <Badge className="text-xs w-fit bg-blue-100 text-blue-800 border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              Managed
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {asset.location || 'Not specified'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {formatTimestampSafe(asset.created_at)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditAsset(asset)}
            title="View asset details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteAsset(asset)}
            title="Delete asset"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        <PageHeader
          title={
            <span className="flex items-center">
              Asset Management
              <Info className="ml-2 w-4 h-4 text-muted-foreground" />
            </span>
          }
          subtitle="Manage and organize your network assets"
          metrics={[
            { value: statistics.total, label: "Total Assets", color: "primary" },
            { value: statistics.active, label: "Active", color: "green" },
            { value: statistics.managed, label: "Managed", color: "blue" },
            { value: statistics.inactive, label: "Inactive", color: "red" }
          ]}
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
                  placeholder="Search assets (e.g., name=server01, ip=192.168.1.1, status=active)..."
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
                        onClick={() => {
                          const currentQuery = searchTerm.split(' ').slice(0, -1).join(' ');
                          const newQuery = currentQuery ? `${currentQuery} ${suggestion.display}` : suggestion.display;
                          handleSearchChange(newQuery);
                          setShowSearchSuggestions(false);
                        }}
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
                <option value="all">All Assets</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="managed">Managed</option>
                <option value="unmanaged">Unmanaged</option>
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
                <option value="name-asc">Name ↑</option>
                <option value="name-desc">Name ↓</option>
                <option value="ip-asc">IP Address ↑</option>
                <option value="ip-desc">IP Address ↓</option>
                <option value="manufacturer-asc">Manufacturer ↑</option>
                <option value="manufacturer-desc">Manufacturer ↓</option>
                <option value="created_at-desc">Created ↓</option>
                <option value="created_at-asc">Created ↑</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-sm text-muted-foreground">
                Showing {filteredAssets.length} of {processedAssets.length} assets
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Active:</span>
                <span className="text-sm font-medium text-green-600">{statistics.active}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Managed:</span>
                <span className="text-sm font-medium text-blue-600">{statistics.managed}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh asset list"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
              
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
        {/* Asset List */}
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Assets Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No assets have been created yet. Create your first asset to get started.'
                }
              </p>
              <Button
                onClick={() => setShowAssetModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Asset
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="min-h-0">
                {renderAssetCard(asset)}
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
                        onClick={() => {
                          if (sortBy === 'name') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('name');
                            setSortOrder('asc');
                          }
                        }}
                        title="Click to sort by asset name"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Asset</span>
                          {sortBy === 'name' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => {
                          if (sortBy === 'ip') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('ip');
                            setSortOrder('asc');
                          }
                        }}
                        title="Click to sort by IP address"
                      >
                        <div className="flex items-center space-x-1">
                          <span>IP Address</span>
                          {sortBy === 'ip' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => {
                          if (sortBy === 'manufacturer') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('manufacturer');
                            setSortOrder('asc');
                          }
                        }}
                        title="Click to sort by manufacturer"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Manufacturer</span>
                          {sortBy === 'manufacturer' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => {
                          if (sortBy === 'created_at') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('created_at');
                            setSortOrder('desc');
                          }
                        }}
                        title="Click to sort by created date"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Created</span>
                          {sortBy === 'created_at' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAssets.map((asset) => renderAssetRow(asset))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Asset Details Modal */}
      {showAssetModal && selectedAssetForEdit && (
        <Modal
          isOpen={showAssetModal}
          onClose={() => {
            setShowAssetModal(false);
            setSelectedAssetForEdit(null);
          }}
          title={`Asset Details - ${selectedAssetForEdit.name || 'Unnamed Asset'}`}
          size="lg"
        >
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Asset Name</label>
                    <p className="text-foreground">{selectedAssetForEdit.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <p className="text-foreground font-mono">{selectedAssetForEdit.primary_ip || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Device Type</label>
                    <p className="text-foreground">{selectedAssetForEdit.assetType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={cn("text-xs", getStatusColor(selectedAssetForEdit.status))}>
                      {getStatusIcon(selectedAssetForEdit.status)}
                      <span className="ml-1">{selectedAssetForEdit.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-foreground">{selectedAssetForEdit.manufacturer || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <p className="text-foreground">{selectedAssetForEdit.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-foreground">{selectedAssetForEdit.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-foreground">{formatTimestampSafe(selectedAssetForEdit.created_at)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="network" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Primary IP</label>
                    <p className="text-foreground font-mono">{selectedAssetForEdit.primary_ip || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">MAC Address</label>
                    <p className="text-foreground font-mono">{selectedAssetForEdit.mac_address || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                    <p className="text-foreground">{selectedAssetForEdit.hostname || 'Not specified'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-foreground">{selectedAssetForEdit.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Labels</label>
                    <p className="text-foreground">{selectedAssetForEdit.labelsText}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Management Status</label>
                    <Badge className={cn("text-xs", selectedAssetForEdit.is_managed ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-800 border-gray-200")}>
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedAssetForEdit.is_managed ? 'Managed' : 'Unmanaged'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowAssetModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Handle edit functionality
                  setShowAssetModal(false);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Asset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetsInterface;