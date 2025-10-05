/**
 * Refactored Assets Interface
 * Demonstrates efficiency improvements with custom hooks and utilities
 */

import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useForm, useAsync, useToggle, useLocalStorage } from '../hooks';
import { createCrudApi, handleApiError } from '../utils/apiUtils';
import { validateForm, FIELD_VALIDATIONS } from '../utils/validation';
import { createButton, createCard, createBadge, createFormField } from '../utils/componentUtils';
import { cn } from '../utils/cn';
import { formatTimestampSafe } from '../utils/formatters';
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

// API operations
const assetsApi = createCrudApi('/assets');

// Memoized components
const AssetIcon = React.memo(({ assetType }) => {
  const icons = {
    Router: <Router className="w-5 h-5" />,
    Printer: <Printer className="w-5 h-5" />,
    Server: <Server className="w-5 h-5" />,
    Workstation: <Monitor className="w-5 h-5" />,
  };
  return icons[assetType] || <Network className="w-5 h-5" />;
});

const AssetCard = React.memo(({ asset, onEdit, onView, onDelete }) => {
  const Button = createButton('button');
  const Card = createCard('div');
  const Badge = createBadge('span');

  const getStatusColor = (status) => 
    status === 'active' ? 'success' : 'error';

  return (
    <Card hover className="h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200 flex-shrink-0">
              <AssetIcon assetType={asset.device_type} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-lg truncate">
                {asset.name || asset.hostname || 'Unnamed Asset'}
              </h4>
              <p className="text-slate-400 font-mono text-sm truncate">
                {asset.primary_ip || asset.ip_address}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2 flex-shrink-0">
            <Badge variant={getStatusColor(asset.is_active ? 'active' : 'inactive')}>
              {asset.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {asset.is_managed && (
              <Badge variant="info">
                <Shield className="w-3 h-3 mr-1" />
                Managed
              </Badge>
            )}
          </div>
        </div>

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
        </div>

        <div className="flex space-x-2 mt-4">
          <Button variant="primary" onClick={() => onView(asset)} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" onClick={() => onEdit(asset)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

const RefactoredAssetsInterface = () => {
  const { assets, fetchAssets } = useApp();
  const { user } = useAuth();

  // Custom hooks for state management
  const [searchTerm, setSearchTerm] = useLocalStorage('assets-search', '');
  const [filterType, setFilterType] = useLocalStorage('assets-filter', 'all');
  const [sortBy, setSortBy] = useLocalStorage('assets-sort', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('assets-order', 'asc');
  const [viewMode, setViewMode] = useLocalStorage('assets-view', 'cards');
  
  const { value: showAssetModal, toggle: toggleAssetModal } = useToggle(false);
  const [selectedAsset, setSelectedAsset] = useToggle(null);

  // Form management
  const form = useForm(
    { name: '', device_type: '', manufacturer: '', primary_ip: '' },
    {
      validationSchema: {
        name: [FIELD_VALIDATIONS.name[0], FIELD_VALIDATIONS.name[1]],
        device_type: [FIELD_VALIDATIONS.required],
        primary_ip: [FIELD_VALIDATIONS.ip[0], FIELD_VALIDATIONS.ip[1]]
      }
    }
  );

  // Async operations
  const { execute: refreshAssets, loading: isRefreshing } = useAsync(fetchAssets);
  const { execute: createAsset, loading: isCreating } = useAsync(assetsApi.create);
  const { execute: updateAsset, loading: isUpdating } = useAsync(assetsApi.update);
  const { execute: deleteAsset, loading: isDeleting } = useAsync(assetsApi.delete);

  // Memoized filtered assets
  const filteredAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    
    return assets
      .filter(asset => {
        if (searchTerm && !asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !asset.primary_ip?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (filterType !== 'all' && asset.device_type !== filterType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [assets, searchTerm, filterType, sortBy, sortOrder]);

  // Statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(assets)) return { total: 0, active: 0, managed: 0 };
    
    return {
      total: assets.length,
      active: assets.filter(a => a.is_active).length,
      managed: assets.filter(a => a.is_managed).length
    };
  }, [assets]);

  // Event handlers
  const handleCreateAsset = async () => {
    const { isValid, errors } = form.validateForm();
    if (!isValid) return;

    try {
      await createAsset(form.values);
      form.resetForm();
      toggleAssetModal();
    } catch (error) {
      console.error('Failed to create asset:', error);
    }
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    form.setValues(asset);
    toggleAssetModal();
  };

  const handleUpdateAsset = async () => {
    const { isValid } = form.validateForm();
    if (!isValid) return;

    try {
      await updateAsset(selectedAsset.id, form.values);
      toggleAssetModal();
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (window.confirm(`Delete ${asset.name}?`)) {
      try {
        await deleteAsset(asset.id);
      } catch (error) {
        console.error('Failed to delete asset:', error);
      }
    }
  };

  // Component factories
  const Button = createButton('button');
  const Card = createCard('div');
  const Badge = createBadge('span');
  const FormField = createFormField('input');

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
            <input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 h-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:outline-none"
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
              onClick={refreshAssets}
              loading={isRefreshing}
              variant="outline"
              className="p-3"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <div className="flex bg-slate-700/50 rounded-xl p-1">
              <Button
                onClick={() => setViewMode('cards')}
                variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                Cards
              </Button>
              <Button
                onClick={() => setViewMode('table')}
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                Table
              </Button>
            </div>
            <Button
              onClick={toggleAssetModal}
              variant="primary"
              className="px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredAssets.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-4">No Assets Found</h3>
            <p className="text-slate-400 text-lg mb-8">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No assets have been created yet. Create your first asset to get started.'
              }
            </p>
            <Button
              onClick={toggleAssetModal}
              variant="primary"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Asset
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEditAsset}
                onView={() => setSelectedAsset(asset)}
                onDelete={handleDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {selectedAsset ? 'Edit Asset' : 'Create Asset'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <FormField
                label="Asset Name"
                name="name"
                value={form.values.name}
                onChange={form.handleChange}
                error={form.errors.name}
                required
              />
              <FormField
                label="Device Type"
                name="device_type"
                value={form.values.device_type}
                onChange={form.handleChange}
                error={form.errors.device_type}
                required
              />
              <FormField
                label="Manufacturer"
                name="manufacturer"
                value={form.values.manufacturer}
                onChange={form.handleChange}
                error={form.errors.manufacturer}
              />
              <FormField
                label="IP Address"
                name="primary_ip"
                value={form.values.primary_ip}
                onChange={form.handleChange}
                error={form.errors.primary_ip}
                required
              />
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <Button
                onClick={toggleAssetModal}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={selectedAsset ? handleUpdateAsset : handleCreateAsset}
                loading={isCreating || isUpdating}
                variant="primary"
              >
                {selectedAsset ? 'Update' : 'Create'} Asset
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RefactoredAssetsInterface;
