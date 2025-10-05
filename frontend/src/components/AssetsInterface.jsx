import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import ResizableLayout from './ui/ResizableLayout';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  // Create Asset Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    primary_ip: '',
    mac_address: '',
    hostname: '',
    os_name: '',
    os_family: '',
    os_version: '',
    manufacturer: '',
    model: '',
    device_type: '',
    location: '',
    is_managed: false,
    is_active: true,
    ip_addresses: [],
    labels: []
  });

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

  const handleCreateAsset = async () => {
    try {
      // Validate required fields
      if (!createForm.name.trim()) {
        alert('Asset name is required');
        return;
      }
      if (!createForm.primary_ip.trim()) {
        alert('Primary IP address is required');
        return;
      }

      // Prepare asset data
      const assetData = {
        ...createForm,
        ip_addresses: createForm.ip_addresses.filter(ip => ip.trim() !== ''),
        labels: createForm.labels.filter(label => label.trim() !== '')
      };

      await createAsset(assetData);
      
      // Reset form and close modal
      setCreateForm({
        name: '',
        description: '',
        primary_ip: '',
        mac_address: '',
        hostname: '',
        os_name: '',
        os_family: '',
        os_version: '',
        manufacturer: '',
        model: '',
        device_type: '',
        location: '',
        is_managed: false,
        is_active: true,
        ip_addresses: [],
        labels: []
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create asset:', error);
      alert('Failed to create asset. Please try again.');
    }
  };

  const handleCreateModalOpen = () => {
    setShowCreateModal(true);
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
    <div className="group bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] h-full">
      <div className="p-6 flex flex-col h-full">
        {/* Header with asset info and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200 flex-shrink-0 group-hover:from-slate-600 group-hover:to-slate-500 transition-all duration-300">
              {asset.assetIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-lg truncate group-hover:text-yellow-400 transition-colors">
                {asset.name || 'Unnamed Asset'}
              </h4>
              <p className="text-slate-400 font-mono text-sm truncate">
                {asset.primary_ip || 'No IP'}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2 flex-shrink-0">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1",
              asset.status === 'active' 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                asset.status === 'active' ? "bg-green-400" : "bg-red-400"
              )}></div>
              <span>{asset.status === 'active' ? 'Online' : 'Offline'}</span>
            </div>
            {asset.is_managed && (
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Managed</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Asset details with modern styling */}
        <div className="space-y-3 text-sm flex-1">
          {asset.assetType && (
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-400 font-medium">Type</span>
              <span className="text-white font-semibold truncate ml-2">{asset.assetType}</span>
            </div>
          )}
          {asset.manufacturer && (
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-400 font-medium">Manufacturer</span>
              <span className="text-white font-semibold truncate ml-2">{asset.manufacturer}</span>
            </div>
          )}
          {asset.model && (
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-400 font-medium">Model</span>
              <span className="text-white font-semibold truncate ml-2">{asset.model}</span>
            </div>
          )}
          {asset.location && (
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-400 font-medium">Location</span>
              <span className="text-white font-semibold truncate ml-2">{asset.location}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl">
            <span className="text-slate-400 font-medium">Created</span>
            <span className="text-slate-300 text-xs">
              {formatTimestampSafe(asset.created_at)}
            </span>
          </div>
        </div>

        {/* Modern action buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-700">
          <Button
            onClick={() => handleEditAsset(asset)}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold rounded-xl py-3 transition-all duration-300 hover:scale-105"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => handleDeleteAsset(asset)}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssetRow = (asset) => (
    <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-slate-700/50 text-slate-200">
            {asset.assetIcon}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">
              {asset.name || 'Unnamed Asset'}
            </p>
            <p className="text-sm text-slate-400">{asset.assetType}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-slate-300 bg-slate-700/50 px-3 py-1 rounded-lg">
          {asset.primary_ip || 'No IP'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <span className="text-sm text-white font-medium">
            {asset.manufacturer || 'Unknown'}
          </span>
          {asset.model && (
            <div className="text-xs text-slate-400">{asset.model}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-2">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 w-fit",
            asset.status === 'active' 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              asset.status === 'active' ? "bg-green-400" : "bg-red-400"
            )}></div>
            <span>{asset.status === 'active' ? 'Online' : 'Offline'}</span>
          </div>
          {asset.is_managed && (
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center space-x-1 w-fit">
              <Shield className="w-3 h-3" />
              <span>Managed</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-slate-300">
          {asset.location || 'Not specified'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-slate-400">
          {formatTimestampSafe(asset.created_at)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => handleEditAsset(asset)}
            title="View asset details"
            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleDeleteAsset(asset)}
            title="Delete asset"
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Modern Header */}
      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                Asset Management
                <Info className="ml-3 w-6 h-6 text-slate-400" />
              </h1>
              <p className="text-slate-400 text-lg mt-1">Manage and organize your network assets</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{statistics.total}</div>
                <div className="text-sm text-slate-400">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{statistics.active}</div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{statistics.managed}</div>
                <div className="text-sm text-slate-400">Managed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{statistics.inactive}</div>
                <div className="text-sm text-slate-400">Inactive</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search and Filter Bar */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-slate-700 bg-slate-800/30">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="asset-search"
                  placeholder="Search for device..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="pl-12 h-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-500/20 rounded-xl"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                    <div className="p-3 text-sm text-slate-400 border-b border-slate-600">
                      Available fields (JQL-style):
                    </div>
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-sm transition-colors"
                        onClick={() => {
                          const currentQuery = searchTerm.split(' ').slice(0, -1).join(' ');
                          const newQuery = currentQuery ? `${currentQuery} ${suggestion.display}` : suggestion.display;
                          handleSearchChange(newQuery);
                          setShowSearchSuggestions(false);
                        }}
                      >
                        <div className="font-semibold text-white">{suggestion.display}</div>
                        <div className="text-xs text-slate-400">{suggestion.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white text-sm min-w-[160px] focus:ring-2 focus:ring-yellow-500/20"
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
                className="px-4 py-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white text-sm min-w-[160px] focus:ring-2 focus:ring-yellow-500/20"
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
            <div className="flex items-center space-x-8">
              <span className="text-slate-400 font-medium">
                Showing {filteredAssets.length} of {processedAssets.length} assets
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Active:</span>
                <span className="text-green-400 font-semibold">{statistics.active}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Managed:</span>
                <span className="text-blue-400 font-semibold">{statistics.managed}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh asset list"
                className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-all duration-300"
              >
                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              </Button>
              
              <div className="flex border border-slate-600 rounded-xl overflow-hidden">
                <Button
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "px-4 py-3 transition-all duration-300",
                    viewMode === 'cards' 
                      ? "bg-yellow-500 text-slate-900 font-semibold" 
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                  )}
                  title="Card view"
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-4 py-3 transition-all duration-300",
                    viewMode === 'table' 
                      ? "bg-yellow-500 text-slate-900 font-semibold" 
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                  )}
                  title="Table view"
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Asset List */}
        {filteredAssets.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
            <div className="text-6xl mb-6">📋</div>
            <h3 className="text-2xl font-bold text-white mb-4">No Assets Found</h3>
            <p className="text-slate-400 text-lg mb-8">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No assets have been created yet. Create your first asset to get started.'
              }
            </p>
            <Button
              onClick={handleCreateModalOpen}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Asset
            </Button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="min-h-0">
                {renderAssetCard(asset)}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
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
                        <div className="flex items-center space-x-2">
                          <span>Asset</span>
                          {sortBy === 'name' && (
                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
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
                        <div className="flex items-center space-x-2">
                          <span>IP Address</span>
                          {sortBy === 'ip' && (
                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
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
                        <div className="flex items-center space-x-2">
                          <span>Manufacturer</span>
                          {sortBy === 'manufacturer' && (
                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
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
                        <div className="flex items-center space-x-2">
                          <span>Created</span>
                          {sortBy === 'created_at' && (
                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredAssets.map((asset) => renderAssetRow(asset))}
                  </tbody>
                </table>
              </div>
            </div>
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

      {/* Create Asset Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Asset"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Asset Name *
                  </label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="Enter asset name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    placeholder="Enter asset description"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Primary IP Address *
                  </label>
                  <Input
                    value={createForm.primary_ip}
                    onChange={(e) => setCreateForm({...createForm, primary_ip: e.target.value})}
                    placeholder="192.168.1.100"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    MAC Address
                  </label>
                  <Input
                    value={createForm.mac_address}
                    onChange={(e) => setCreateForm({...createForm, mac_address: e.target.value})}
                    placeholder="00:11:22:33:44:55"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Hostname
                  </label>
                  <Input
                    value={createForm.hostname}
                    onChange={(e) => setCreateForm({...createForm, hostname: e.target.value})}
                    placeholder="server01"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Device Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Device Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Manufacturer
                  </label>
                  <Input
                    value={createForm.manufacturer}
                    onChange={(e) => setCreateForm({...createForm, manufacturer: e.target.value})}
                    placeholder="Dell, HP, Cisco, etc."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Model
                  </label>
                  <Input
                    value={createForm.model}
                    onChange={(e) => setCreateForm({...createForm, model: e.target.value})}
                    placeholder="PowerEdge R740"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Device Type
                  </label>
                  <select
                    value={createForm.device_type}
                    onChange={(e) => setCreateForm({...createForm, device_type: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select device type</option>
                    <option value="Server">Server</option>
                    <option value="Workstation">Workstation</option>
                    <option value="Router">Router</option>
                    <option value="Switch">Switch</option>
                    <option value="Printer">Printer</option>
                    <option value="Network Device">Network Device</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Operating System
                  </label>
                  <Input
                    value={createForm.os_name}
                    onChange={(e) => setCreateForm({...createForm, os_name: e.target.value})}
                    placeholder="Windows Server 2019, Ubuntu 20.04, etc."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Location
                  </label>
                  <Input
                    value={createForm.location}
                    onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                    placeholder="Data Center A, Office Building, etc."
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Status Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Status Settings</h3>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.is_active}
                    onChange={(e) => setCreateForm({...createForm, is_active: e.target.checked})}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.is_managed}
                    onChange={(e) => setCreateForm({...createForm, is_managed: e.target.checked})}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Managed</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAsset}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                Create Asset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetsInterface;