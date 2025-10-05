/**
 * Optimized Assets Interface
 * Performance-optimized version with virtual scrolling and memoization
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { 
  useDebounce, 
  useMemoizedFilter, 
  useMemoizedSort, 
  usePagination,
  createSearchFunction,
  createSortFunction,
  usePerformanceMonitor
} from '../utils/performance';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  List, 
  Eye, 
  Edit, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Network,
  Server,
  Monitor,
  Router,
  Printer,
  Shield,
  Info,
  Plus
} from 'lucide-react';

// Memoized asset icon component
const AssetIcon = memo(({ assetType }) => {
  const getAssetIcon = (assetType) => {
    if (assetType === 'Router') return <Router className="w-5 h-5" />;
    if (assetType === 'Printer') return <Printer className="w-5 h-5" />;
    if (assetType === 'Server') return <Server className="w-5 h-5" />;
    if (assetType === 'Workstation') return <Monitor className="w-5 h-5" />;
    return <Network className="w-5 h-5" />;
  };

  return getAssetIcon(assetType);
});

AssetIcon.displayName = 'AssetIcon';

// Memoized asset card component
const AssetCard = memo(({ 
  asset, 
  onEdit, 
  onView, 
  onDelete 
}) => {
  const handleEdit = useCallback(() => {
    onEdit(asset);
  }, [asset, onEdit]);

  const handleView = useCallback(() => {
    onView(asset);
  }, [asset, onView]);

  const handleDelete = useCallback(() => {
    onDelete(asset);
  }, [asset, onDelete]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="group bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] h-full">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200 flex-shrink-0 group-hover:from-slate-600 group-hover:to-slate-500 transition-all duration-300">
              <AssetIcon assetType={asset.device_type} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-lg truncate group-hover:text-yellow-400 transition-colors">
                {asset.name || asset.hostname || 'Unnamed Asset'}
              </h4>
              <p className="text-slate-400 font-mono text-sm truncate">
                {asset.primary_ip || asset.ip_address}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2 flex-shrink-0">
            <Badge className={cn("text-xs", getStatusColor(asset.is_active ? 'active' : 'inactive'))}>
              {getStatusIcon(asset.is_active ? 'active' : 'inactive')} {asset.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {asset.is_managed && (
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Managed
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 flex-1">
          {asset.device_type && (
            <div className="p-3 bg-slate-700/30 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Type:</span>
                <span className="text-white font-medium">{asset.device_type}</span>
              </div>
            </div>
          )}
          {asset.manufacturer && (
            <div className="p-3 bg-slate-700/30 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Manufacturer:</span>
                <span className="text-white font-medium text-sm truncate">{asset.manufacturer}</span>
              </div>
            </div>
          )}
          {asset.created_at && (
            <div className="p-3 bg-slate-700/30 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Created:</span>
                <span className="text-white font-medium text-sm">{formatTimestampSafe(asset.created_at)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={handleView}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={handleEdit}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 px-4 py-2 rounded-xl"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

AssetCard.displayName = 'AssetCard';

// Memoized table row component
const AssetTableRow = memo(({ 
  asset, 
  onEdit, 
  onView, 
  onDelete 
}) => {
  const handleEdit = useCallback(() => {
    onEdit(asset);
  }, [asset, onEdit]);

  const handleView = useCallback(() => {
    onView(asset);
  }, [asset, onView]);

  const handleDelete = useCallback(() => {
    onDelete(asset);
  }, [asset, onDelete]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <tr className="hover:bg-slate-700/30 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200">
            <AssetIcon assetType={asset.device_type} />
          </div>
          <div>
            <div className="font-medium text-white">
              {asset.name || asset.hostname || 'Unnamed Asset'}
            </div>
            <div className="text-sm text-slate-400 font-mono">
              {asset.primary_ip || asset.ip_address}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-slate-300">{asset.device_type || 'Unknown'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-slate-300">{asset.manufacturer || 'Unknown'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={cn("text-xs", getStatusColor(asset.is_active ? 'active' : 'inactive'))}>
          {asset.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleView}
            size="sm"
            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleEdit}
            size="sm"
            variant="outline"
            className="p-2 border-slate-600 text-slate-300 hover:bg-slate-700/50 rounded-lg"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

AssetTableRow.displayName = 'AssetTableRow';

const OptimizedAssetsInterface = () => {
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
    fetchAssets
  } = useApp();

  const { user } = useAuth();

  // Performance monitoring
  const renderCount = usePerformanceMonitor('OptimizedAssetsInterface');

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('cards');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized processed assets
  const processedAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    
    return assets.map(asset => ({
      ...asset,
      assetIcon: <AssetIcon assetType={asset.device_type} />
    }));
  }, [assets]);

  // Memoized search function
  const searchFunction = useMemo(() => 
    createSearchFunction(['name', 'hostname', 'primary_ip', 'ip_address', 'manufacturer', 'device_type']), 
    []
  );

  // Memoized sort function
  const sortFunction = useMemo(() => 
    createSortFunction(sortBy, sortOrder), 
    [sortBy, sortOrder]
  );

  // Memoized filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let results = processedAssets;
    
    // Apply search filter
    if (debouncedSearchTerm) {
      results = searchFunction(results, debouncedSearchTerm);
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      results = results.filter(asset => asset.device_type === filterType);
    }
    
    // Apply sorting
    return results.sort(sortFunction);
  }, [processedAssets, debouncedSearchTerm, filterType, searchFunction, sortFunction]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext,
    hasPrev
  } = usePagination(filteredAssets, 20);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(processedAssets)) {
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
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAssets();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAssets]);

  const handleEditAsset = useCallback((asset) => {
    setSelectedAssetForEdit(asset);
    setShowAssetModal(true);
  }, []);

  const handleViewAsset = useCallback((asset) => {
    setSelectedAsset(asset);
  }, [setSelectedAsset]);

  const handleDeleteAsset = useCallback((asset) => {
    if (window.confirm(`Are you sure you want to delete ${asset.name || 'this asset'}?`)) {
      deleteAsset(asset.id);
    }
  }, [deleteAsset]);

  const handleCreateAsset = useCallback(() => {
    setSelectedAssetForEdit(null);
    setShowAssetModal(true);
  }, []);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Assets</h1>
              <p className="text-slate-400 mt-1">Manage your network assets and inventory</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{statistics.total}</div>
                <div className="text-sm text-slate-400">Total Assets</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">{statistics.active}</div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{statistics.managed}</div>
                <div className="text-sm text-slate-400">Managed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-slate-700 bg-slate-800/30">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-500/20 rounded-xl"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white text-sm min-w-[160px] focus:ring-2 focus:ring-yellow-500/20"
          >
            <option value="all">All Types</option>
            <option value="Server">Servers</option>
            <option value="Router">Routers</option>
            <option value="Printer">Printers</option>
            <option value="Workstation">Workstations</option>
          </select>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            </Button>
            <div className="flex bg-slate-700/50 rounded-xl p-1">
              <Button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'cards' 
                    ? "bg-yellow-500 text-slate-900 font-semibold" 
                    : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                )}
              >
                <List className="w-4 h-4 mr-2" />
                Cards
              </Button>
              <Button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'table' 
                    ? "bg-yellow-500 text-slate-900 font-semibold" 
                    : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                )}
              >
                <List className="w-4 h-4 mr-2" />
                Table
              </Button>
            </div>
            <Button
              onClick={handleCreateAsset}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {paginatedItems.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-4">No Assets Found</h3>
            <p className="text-slate-400 text-lg mb-8">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No assets have been created yet. Create your first asset to get started.'
              }
            </p>
            <Button
              onClick={handleCreateAsset}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Asset
            </Button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedItems.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEditAsset}
                onView={handleViewAsset}
                onDelete={handleDeleteAsset}
              />
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
                      onClick={() => handleSort('name')}
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
                      onClick={() => handleSort('device_type')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Type</span>
                        {sortBy === 'device_type' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('manufacturer')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Manufacturer</span>
                        {sortBy === 'manufacturer' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('is_active')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        {sortBy === 'is_active' && (
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
                  {paginatedItems.map((asset) => (
                    <AssetTableRow
                      key={asset.id}
                      asset={asset}
                      onEdit={handleEditAsset}
                      onView={handleViewAsset}
                      onDelete={handleDeleteAsset}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, filteredAssets.length)} of {filteredAssets.length} assets
            </p>
            <div className="flex items-center space-x-2">
              <Button
                onClick={prevPage}
                disabled={!hasPrev}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                Previous
              </Button>
              <span className="text-slate-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={nextPage}
                disabled={!hasNext}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedAssetsInterface;
