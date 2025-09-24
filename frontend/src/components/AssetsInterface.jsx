import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { HelpIcon } from './ui';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';
import LabelManager from './LabelManager';
import LabelFilter from './LabelFilter';
import StandardList from './common/StandardList';

const AssetsInterface = () => {
  const {
    assets,
    selectedAssets,
    selectedAsset,
    assetGroups,
    selectedAssetGroups,
    loading,
    toggleAssetSelection,
    selectAllAssets,
    setSelectedAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    bulkDeleteAssets,
    createAssetGroup,
    updateAssetGroup,
    deleteAssetGroup,
    toggleAssetGroupSelection,
    selectAllAssetGroups,
    fetchAssets,
    fetchAssetGroups,
    api
  } = useApp();

  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  
  // Labels state
  const [allLabels, setAllLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Form states
  const [assetForm, setAssetForm] = useState({
    name: '',
    description: '',
    primary_ip: '',
    device_type: '',
    manufacturer: '',
    model: '',
    location: '',
    tags: []
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    asset_ids: [],
    tags: []
  });

  useEffect(() => {
    fetchAssets();
    fetchAssetGroups();
  }, [fetchAssets, fetchAssetGroups]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.primary_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      let matchesFilter = true;
      if (filterStatus === 'active') {
        matchesFilter = asset.is_active !== false;
      } else if (filterStatus === 'inactive') {
        matchesFilter = asset.is_active === false;
      }
      
      return matchesSearch && matchesFilter;
    });

    // Sort assets
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'ip':
          aValue = a.primary_ip || '';
          bValue = b.primary_ip || '';
          break;
        case 'type':
          aValue = a.device_type || '';
          bValue = b.device_type || '';
          break;
        case 'manufacturer':
          aValue = a.manufacturer || '';
          bValue = b.manufacturer || '';
          break;
        case 'name':
        default:
          aValue = a.name || '';
          bValue = b.name || '';
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [assets, searchTerm, filterStatus, sortBy, sortOrder]);

  // Filter and sort asset groups
  const filteredGroups = useMemo(() => {
    let filtered = assetGroups.filter(group => {
      const matchesSearch = !searchTerm || 
        group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.tags && group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return matchesSearch;
    });

    // Sort groups
    filtered.sort((a, b) => {
      const aValue = a.name || '';
      const bValue = b.name || '';
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [assetGroups, searchTerm, sortOrder]);

  const handleCreateAsset = async () => {
    try {
      await createAsset(assetForm);
      setShowCreateModal(false);
      setAssetForm({
        name: '',
        description: '',
        primary_ip: '',
        device_type: '',
        manufacturer: '',
        model: '',
        location: '',
        tags: []
      });
    } catch (error) {
      console.error('Failed to create asset:', error);
      alert('Failed to create asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateAsset = async () => {
    try {
      await updateAsset(selectedAsset.id, assetForm);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
      alert('Failed to update asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(assetId);
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('Failed to delete asset: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleCreateGroup = async () => {
    try {
      await createAssetGroup(groupForm);
      setShowGroupModal(false);
      setGroupForm({
        name: '',
        description: '',
        asset_ids: []
      });
    } catch (error) {
      console.error('Failed to create asset group:', error);
      alert('Failed to create asset group: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateGroup = async () => {
    try {
      await updateAssetGroup(selectedAssetGroups[0], groupForm);
      setShowEditGroupModal(false);
    } catch (error) {
      console.error('Failed to update asset group:', error);
      alert('Failed to update asset group: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this asset group?')) {
      try {
        await deleteAssetGroup(groupId);
      } catch (error) {
        console.error('Failed to delete asset group:', error);
        alert('Failed to delete asset group: ' + (error.response?.data?.detail || error.message));
      }
    }
  };


  const handleSelectAll = () => {
    if (activeTab === 'assets') {
      if (selectedAssets.length === filteredAssets.length) {
        selectAllAssets([]);
      } else {
        selectAllAssets(filteredAssets.map(a => a.id));
      }
    } else {
      if (selectedAssetGroups.length === filteredGroups.length) {
        selectAllAssetGroups([]);
      } else {
        selectAllAssetGroups(filteredGroups.map(g => g.id));
      }
    }
  };

  const getAssetIcon = (asset) => {
    if (asset.device_type === 'router') return '🌐';
    if (asset.device_type === 'switch') return '🔀';
    if (asset.device_type === 'server') return '🖥️';
    if (asset.device_type === 'workstation') return '💻';
    if (asset.device_type === 'printer') return '🖨️';
    return '📱';
  };

  const getStatusColor = (isActive) => {
    return isActive !== false ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600';
  };

  const getAssetTypeIcon = (deviceType) => {
    switch (deviceType) {
      case 'router': return '🌐';
      case 'switch': return '🔀';
      case 'server': return '🖥️';
      case 'workstation': return '💻';
      case 'printer': return '🖨️';
      default: return '📱';
    }
  };

  const getAssetTypeColor = (deviceType) => {
    switch (deviceType) {
      case 'router': return 'bg-blue-500/20 text-blue-600';
      case 'switch': return 'bg-green-500/20 text-green-600';
      case 'server': return 'bg-purple-500/20 text-purple-600';
      case 'workstation': return 'bg-orange-500/20 text-orange-600';
      case 'printer': return 'bg-pink-500/20 text-pink-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  const renderAssetCard = (asset) => (
    <div className="surface-interactive p-6 rounded-lg border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getAssetTypeColor(asset.device_type))}>
            {getAssetTypeIcon(asset.device_type)}
          </div>
        </div>
        <Badge className={cn("text-xs", asset.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
          {asset.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-subheading text-foreground truncate">
            {asset.name}
          </h3>
          <p className="text-caption text-muted-foreground">
            {asset.description || 'No description'}
          </p>
        </div>

        <div className="space-y-2 text-caption text-muted-foreground">
          {asset.ip_address && (
            <div className="flex justify-between">
              <span>IP:</span>
              <span className="font-mono">{asset.ip_address}</span>
            </div>
          )}
          {asset.mac_address && (
            <div className="flex justify-between">
              <span>MAC:</span>
              <span className="font-mono">{asset.mac_address}</span>
            </div>
          )}
          {asset.device_type && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="capitalize">{asset.device_type}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Labels:</span>
            <span>{asset.labels?.length || 0}</span>
          </div>
          {asset.created_at && (
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(asset.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {asset.labels && asset.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.labels.map(label => (
              <Badge key={label.id} variant="secondary" className="text-xs">
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAsset(asset)}
            className="flex-1 text-xs"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssetForm({
                name: asset.name || '',
                description: asset.description || '',
                ip_address: asset.ip_address || '',
                mac_address: asset.mac_address || '',
                device_type: asset.device_type || '',
                manufacturer: asset.manufacturer || '',
                model: asset.model || '',
                serial_number: asset.serial_number || '',
                location: asset.location || '',
                is_active: asset.is_active !== false
              });
              setShowEditModal(true);
            }}
            className="flex-1 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteAsset(asset.id)}
            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssetRow = (asset) => (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getAssetTypeColor(asset.device_type))}>
            {getAssetTypeIcon(asset.device_type)}
          </div>
          <div>
            <div className="text-body font-medium text-foreground">
              {asset.name}
            </div>
            <div className="text-caption text-muted-foreground">
              {asset.description || 'No description'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-body text-foreground font-mono">
          {asset.ip_address || '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-body text-foreground font-mono">
          {asset.mac_address || '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {asset.labels && asset.labels.map(label => (
            <Badge key={label.id} variant="secondary" className="text-xs">
              {label.name}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge className={cn("text-xs", asset.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
          {asset.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <span className="text-body text-muted-foreground">
          {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAsset(asset)}
            className="text-xs"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssetForm({
                name: asset.name || '',
                description: asset.description || '',
                ip_address: asset.ip_address || '',
                mac_address: asset.mac_address || '',
                device_type: asset.device_type || '',
                manufacturer: asset.manufacturer || '',
                model: asset.model || '',
                serial_number: asset.serial_number || '',
                location: asset.location || '',
                is_active: asset.is_active !== false
              });
              setShowEditModal(true);
            }}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteAsset(asset.id)}
            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  );

  const renderAssetGroupCard = (group) => (
    <div className="surface-interactive p-6 rounded-lg border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
            📁
          </div>
        </div>
        <Badge className={cn("text-xs", group.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
          {group.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-subheading text-foreground truncate">
            {group.name}
          </h3>
          <p className="text-caption text-muted-foreground">
            {group.description || 'No description'}
          </p>
        </div>

        <div className="space-y-2 text-caption text-muted-foreground">
          <div className="flex justify-between">
            <span>Assets:</span>
            <span>{group.assets?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Labels:</span>
            <span>{group.labels?.length || 0}</span>
          </div>
          {group.created_at && (
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {group.labels && group.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.labels.map(label => (
              <Badge key={label.id} variant="secondary" className="text-xs">
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAssetGroups([group.id])}
            className="flex-1 text-xs"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGroupForm({
                name: group.name || '',
                description: group.description || '',
                asset_ids: group.assets?.map(a => a.id) || []
              });
              setShowEditGroupModal(true);
            }}
            className="flex-1 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteGroup(group.id)}
            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssetGroupRow = (group) => (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm">
            📁
          </div>
          <div>
            <div className="text-body font-medium text-foreground">
              {group.name}
            </div>
            <div className="text-caption text-muted-foreground">
              {group.description || 'No description'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-body text-foreground">
          {group.assets?.length || 0} assets
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {group.labels && group.labels.map(label => (
            <Badge key={label.id} variant="secondary" className="text-xs">
              {label.name}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge className={cn("text-xs", group.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
          {group.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <span className="text-body text-muted-foreground">
          {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAssetGroups([group.id])}
            className="text-xs"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGroupForm({
                name: group.name || '',
                description: group.description || '',
                asset_ids: group.assets?.map(a => a.id) || []
              });
              setShowEditGroupModal(true);
            }}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteGroup(group.id)}
            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  );

  // Filter and sort options for assets
  const assetFilterOptions = [
    { value: "all", label: "All Assets", icon: "📱" },
    { value: "active", label: "Active", icon: "✅" },
    { value: "inactive", label: "Inactive", icon: "❌" },
  ];

  const assetSortOptions = [
    { value: "name", label: "Name" },
    { value: "ip_address", label: "IP Address" },
    { value: "device_type", label: "Device Type" },
    { value: "created_at", label: "Created Date" },
  ];

  // Filter and sort options for asset groups
  const groupFilterOptions = [
    { value: "all", label: "All Groups", icon: "📁" },
    { value: "active", label: "Active", icon: "✅" },
    { value: "inactive", label: "Inactive", icon: "❌" },
  ];

  const groupSortOptions = [
    { value: "name", label: "Name" },
    { value: "created_at", label: "Created Date" },
    { value: "asset_count", label: "Asset Count" },
  ];

  // Statistics for assets
  const assetStatistics = [
    {
      value: assets.length,
      label: "Total Assets",
      color: "text-primary",
      icon: "📱",
      bgColor: "bg-primary/20",
      iconColor: "text-primary"
    },
    {
      value: assets.filter(a => a.is_active !== false).length,
      label: "Active",
      color: "text-success",
      icon: "✅",
      bgColor: "bg-success/20",
      iconColor: "text-success"
    },
    {
      value: assets.filter(a => a.is_active === false).length,
      label: "Inactive",
      color: "text-error",
      icon: "❌",
      bgColor: "bg-error/20",
      iconColor: "text-error"
    },
    {
      value: selectedAssets.length,
      label: "Selected",
      color: "text-warning",
      icon: "✓",
      bgColor: "bg-warning/20",
      iconColor: "text-warning"
    }
  ];

  // Statistics for asset groups
  const groupStatistics = [
    {
      value: assetGroups.length,
      label: "Total Groups",
      color: "text-primary",
      icon: "📁",
      bgColor: "bg-primary/20",
      iconColor: "text-primary"
    },
    {
      value: assetGroups.filter(ag => ag.is_active !== false).length,
      label: "Active",
      color: "text-success",
      icon: "✅",
      bgColor: "bg-success/20",
      iconColor: "text-success"
    },
    {
      value: assetGroups.filter(ag => ag.is_active === false).length,
      label: "Inactive",
      color: "text-error",
      icon: "❌",
      bgColor: "bg-error/20",
      iconColor: "text-error"
    },
    {
      value: selectedAssetGroups.length,
      label: "Selected",
      color: "text-warning",
      icon: "✓",
      bgColor: "bg-warning/20",
      iconColor: "text-warning"
    }
  ];

  // Calculate statistics
  const totalAssets = assets.length;
  const activeAssets = assets.filter(asset => asset.is_active !== false).length;
  const inactiveAssets = totalAssets - activeAssets;
  const totalGroups = assetGroups.length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={
          <span className="flex items-center">
            Asset Inventory
            <HelpIcon 
              content="Manage your asset inventory and organize them into groups for better categorization and management."
              className="ml-2"
              size="sm"
            />
          </span>
        }
        subtitle="Manage your asset inventory and organize them into groups"
        metrics={[
          { value: totalAssets, label: "Total Assets", color: "text-primary" },
          { value: activeAssets, label: "Active", color: "text-green-600" },
          { value: totalGroups, label: "Asset Groups", color: "text-blue-600" }
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="groups">Asset Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="space-y-6">
              <StandardList
                items={filteredAssets}
                loading={loading.assets}
                title="Assets"
                subtitle="Manage your network assets"
                itemName="asset"
                itemNamePlural="assets"
                searchPlaceholder="Search assets by name, IP, description, manufacturer, model, or labels..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filterOptions={assetFilterOptions}
                filterValue={filterStatus}
                onFilterChange={setFilterStatus}
                sortOptions={assetSortOptions}
                sortValue={sortBy}
                onSortChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedItems={selectedAssets}
                onItemSelect={toggleAssetSelection}
                onSelectAll={selectAllAssets}
                onCreateClick={() => setShowCreateModal(true)}
                createButtonText="Create Asset"
                onBulkDelete={bulkDeleteAssets}
                statistics={assetStatistics}
                renderItemCard={renderAssetCard}
                renderItemRow={renderAssetRow}
                emptyStateIcon="📱"
                emptyStateTitle="No assets found"
                emptyStateDescription="Create your first asset to get started."
              />
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <StandardList
                items={filteredGroups}
                loading={loading.assetGroups}
                title="Asset Groups"
                subtitle="Organize your assets into groups"
                itemName="group"
                itemNamePlural="groups"
                searchPlaceholder="Search asset groups by name, description, or labels..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filterOptions={groupFilterOptions}
                filterValue={filterStatus}
                onFilterChange={setFilterStatus}
                sortOptions={groupSortOptions}
                sortValue={sortBy}
                onSortChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedItems={selectedAssetGroups}
                onItemSelect={toggleAssetGroupSelection}
                onSelectAll={selectAllAssetGroups}
                onCreateClick={() => setShowGroupModal(true)}
                createButtonText="Create Asset Group"
                onBulkDelete={(groupIds) => {
                  if (window.confirm(`Are you sure you want to delete ${groupIds.length} asset groups?`)) {
                    groupIds.forEach(id => deleteAssetGroup(id));
                  }
                }}
                statistics={groupStatistics}
                renderItemCard={renderAssetGroupCard}
                renderItemRow={renderAssetGroupRow}
                emptyStateIcon="📁"
                emptyStateTitle="No asset groups found"
                emptyStateDescription="Create your first asset group to organize your assets."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Asset"
        size="lg"
      >
        <div className="space-y-4">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="text-xs font-medium transition-all duration-200 h-8 px-3"
                    >
                      ⊞
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="text-xs font-medium transition-all duration-200 h-8 px-3"
                    >
                      ☰
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Asset List */}
              {filteredAssets.length === 0 ? (
                <Card className="surface-elevated">
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-subheading text-foreground mb-2">No assets found</h3>
                    <p className="text-body text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first asset to get started.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Bulk Actions */}
                  {selectedAssets.length > 0 && (
                    <Card className="surface-elevated border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedAssets.length === filteredAssets.length}
                              onChange={handleSelectAll}
                              className="form-checkbox h-4 w-4 text-primary rounded"
                            />
                            <span className="text-sm font-medium text-foreground">
                              {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Bulk Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Export Selected
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} assets?`)) {
                                  bulkDeleteAssets(selectedAssets);
                                }
                              }}
                            >
                              Delete Selected
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Asset Grid/Table */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAssets.map((asset) => (
                        <Card key={asset.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedAssets.includes(asset.id)}
                                  onChange={() => toggleAssetSelection(asset.id)}
                                  className="form-checkbox h-4 w-4 text-primary rounded"
                                />
                                <span className="text-3xl">{getAssetIcon(asset)}</span>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {asset.name || 'Unnamed Asset'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {asset.primary_ip}
                                  </p>
                                </div>
                              </div>
                              <Badge className={cn("text-xs", getStatusColor(asset.is_active))}>
                                {asset.is_active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              {asset.device_type && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="text-foreground font-medium capitalize">{asset.device_type}</span>
                                </div>
                              )}
                              {asset.manufacturer && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Manufacturer:</span>
                                  <span className="text-foreground font-medium">{asset.manufacturer}</span>
                                </div>
                              )}
                              {asset.model && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Model:</span>
                                  <span className="text-foreground font-medium">{asset.model}</span>
                                </div>
                              )}
                              {asset.location && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Location:</span>
                                  <span className="text-foreground font-medium">{asset.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Labels Display */}
                            {asset.tags && asset.tags.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {asset.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex space-x-2 mt-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('Edit button clicked for asset:', asset);
                                  setSelectedAsset(asset);
                                  setAssetForm(asset);
                                  setShowEditModal(true);
                                }}
                                className="flex-1"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="flex-1"
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="surface-elevated">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-border">
                              <tr className="text-left">
                                <th className="px-6 py-4 w-12">
                                  <input
                                    type="checkbox"
                                    checked={selectedAssets.length === filteredAssets.length}
                                    onChange={handleSelectAll}
                                    className="form-checkbox h-4 w-4 text-primary rounded"
                                  />
                                </th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Asset</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">IP Address</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Type</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Manufacturer</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAssets.map((asset) => (
                                <tr key={asset.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedAssets.includes(asset.id)}
                                      onChange={() => toggleAssetSelection(asset.id)}
                                      className="form-checkbox h-4 w-4 text-primary rounded"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-lg">{getAssetIcon(asset)}</span>
                                      <div>
                                        <div className="font-medium text-foreground">
                                          {asset.name || 'Unnamed Asset'}
                                        </div>
                                        {asset.description && (
                                          <div className="text-sm text-muted-foreground">
                                            {asset.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-foreground">{asset.primary_ip}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-foreground capitalize">{asset.device_type || 'Unknown'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-foreground">{asset.manufacturer || 'Unknown'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className={cn("text-xs", getStatusColor(asset.is_active))}>
                                      {asset.is_active !== false ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          console.log('Edit button clicked for asset (table):', asset);
                                          setSelectedAsset(asset);
                                          setAssetForm(asset);
                                          setShowEditModal(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteAsset(asset.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              {/* Search and Filter Controls */}
              <Card className="surface-elevated">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search asset groups by name, description, or labels..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                      <Button onClick={() => setShowGroupModal(true)}>
                        Create Asset Group
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Groups List */}
              {filteredGroups.length === 0 ? (
                <Card className="surface-elevated">
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-subheading text-foreground mb-2">No asset groups found</h3>
                    <p className="text-body text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first asset group to organize your assets.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Bulk Actions */}
                  {selectedAssetGroups.length > 0 && (
                    <Card className="surface-elevated border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedAssetGroups.length === filteredGroups.length}
                              onChange={handleSelectAll}
                              className="form-checkbox h-4 w-4 text-primary rounded"
                            />
                            <span className="text-sm font-medium text-foreground">
                              {selectedAssetGroups.length} group{selectedAssetGroups.length !== 1 ? 's' : ''} selected
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Bulk Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Export Selected
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Asset Groups Grid/Table */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredGroups.map((group) => (
                        <Card key={group.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedAssetGroups.includes(group.id)}
                                  onChange={() => toggleAssetGroupSelection(group.id)}
                                  className="form-checkbox h-4 w-4 text-primary rounded"
                                />
                                <span className="text-3xl">📁</span>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {group.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {group.asset_count || 0} assets
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {group.description && (
                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                  {group.description}
                                </p>
                              </div>
                            )}

                            <div className="flex space-x-2 mt-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssetGroups([group.id]);
                                  setGroupForm(group);
                                  setShowEditGroupModal(true);
                                }}
                                className="flex-1"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="flex-1"
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="surface-elevated">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-border">
                              <tr className="text-left">
                                <th className="px-6 py-4 w-12">
                                  <input
                                    type="checkbox"
                                    checked={selectedAssetGroups.length === filteredGroups.length}
                                    onChange={handleSelectAll}
                                    className="form-checkbox h-4 w-4 text-primary rounded"
                                  />
                                </th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Group Name</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Description</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Asset Count</th>
                                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredGroups.map((group) => (
                                <tr key={group.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedAssetGroups.includes(group.id)}
                                      onChange={() => toggleAssetGroupSelection(group.id)}
                                      className="form-checkbox h-4 w-4 text-primary rounded"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-lg">📁</span>
                                      <div className="font-medium text-foreground">
                                        {group.name}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-foreground">{group.description || 'No description'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-foreground">{group.asset_count || 0}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedAssetGroups([group.id]);
                                          setGroupForm(group);
                                          setShowEditGroupModal(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteGroup(group.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Asset"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                placeholder="Asset name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                IP Address *
              </label>
              <Input
                value={assetForm.primary_ip}
                onChange={(e) => setAssetForm({...assetForm, primary_ip: e.target.value})}
                placeholder="192.168.1.100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Device Type
              </label>
              <select
                value={assetForm.device_type}
                onChange={(e) => setAssetForm({...assetForm, device_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="printer">Printer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Manufacturer"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="Model"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <Input
                value={assetForm.location}
                onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
                placeholder="Location"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={assetForm.description}
              onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
              placeholder="Asset description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          
          {/* Jira-style Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Labels
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Type a label and press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newLabel = e.target.value.trim();
                    if (newLabel && !assetForm.tags.includes(newLabel)) {
                      setAssetForm({
                        ...assetForm,
                        tags: [...assetForm.tags, newLabel]
                      });
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full"
              />
              {assetForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assetForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setAssetForm({
                            ...assetForm,
                            tags: assetForm.tags.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAsset}>
              Create Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Asset"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                placeholder="Asset name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                IP Address *
              </label>
              <Input
                value={assetForm.primary_ip}
                onChange={(e) => setAssetForm({...assetForm, primary_ip: e.target.value})}
                placeholder="192.168.1.100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Device Type
              </label>
              <select
                value={assetForm.device_type}
                onChange={(e) => setAssetForm({...assetForm, device_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="printer">Printer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Manufacturer"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="Model"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <Input
                value={assetForm.location}
                onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
                placeholder="Location"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={assetForm.description}
              onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
              placeholder="Asset description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          
          {/* Jira-style Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Labels
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Type a label and press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newLabel = e.target.value.trim();
                    if (newLabel && !assetForm.tags.includes(newLabel)) {
                      setAssetForm({
                        ...assetForm,
                        tags: [...assetForm.tags, newLabel]
                      });
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full"
              />
              {assetForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assetForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setAssetForm({
                            ...assetForm,
                            tags: assetForm.tags.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAsset}>
              Update Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Asset Group Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Create Asset Group"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Group Name *
            </label>
            <Input
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              placeholder="Asset group name"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Group description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          
          {/* Jira-style Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Labels
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Type a label and press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newLabel = e.target.value.trim();
                    if (newLabel && !groupForm.tags?.includes(newLabel)) {
                      setGroupForm({
                        ...groupForm,
                        tags: [...(groupForm.tags || []), newLabel]
                      });
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full"
              />
              {groupForm.tags && groupForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groupForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setGroupForm({
                            ...groupForm,
                            tags: groupForm.tags.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>
              Create Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Asset Group Modal */}
      <Modal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="Edit Asset Group"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Group Name *
            </label>
            <Input
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              placeholder="Asset group name"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Group description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          
          {/* Jira-style Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Labels
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Type a label and press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newLabel = e.target.value.trim();
                    if (newLabel && !groupForm.tags?.includes(newLabel)) {
                      setGroupForm({
                        ...groupForm,
                        tags: [...(groupForm.tags || []), newLabel]
                      });
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full"
              />
              {groupForm.tags && groupForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groupForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setGroupForm({
                            ...groupForm,
                            tags: groupForm.tags.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditGroupModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>
              Update Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetsInterface;
