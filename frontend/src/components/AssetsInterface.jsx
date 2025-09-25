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
    if (asset.device_type === 'router') return 'ðŸŒ';
    if (asset.device_type === 'switch') return 'ðŸ”€';
    if (asset.device_type === 'server') return 'ðŸ–¥ï¸';
    if (asset.device_type === 'workstation') return 'ðŸ’»';
    if (asset.device_type === 'printer') return 'ðŸ–¨ï¸';
    return 'ðŸ“±';
  };

  const getStatusColor = (isActive) => {
    return isActive !== false ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600';
  };

  const getAssetTypeIcon = (deviceType) => {
    switch (deviceType) {
      case 'router': return 'ðŸŒ';
      case 'switch': return 'ðŸ”€';
      case 'server': return 'ðŸ–¥ï¸';
      case 'workstation': return 'ðŸ’»';
      case 'printer': return 'ðŸ–¨ï¸';
      default: return 'ðŸ“±';
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
            ðŸ“
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
            ðŸ“
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
    { value: "active", label: "Active", icon: "âœ…" },
    { value: "inactive", label: "Inactive", icon: "âŒ" },
  ];

  const assetSortOptions = [
    { value: "name", label: "Name" },
    { value: "ip_address", label: "IP Address" },
    { value: "device_type", label: "Device Type" },
    { value: "created_at", label: "Created Date" },
  ];

  // Filter and sort options for asset groups
  const groupFilterOptions = [
    { value: "all", label: "All Groups", icon: "ðŸ“" },
    { value: "active", label: "Active", icon: "âœ…" },
    { value: "inactive", label: "Inactive", icon: "âŒ" },
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
      icon: "ðŸ“±",
      bgColor: "bg-primary/20",
      iconColor: "text-primary"
    },
    {
      value: assets.filter(a => a.is_active !== false).length,
      label: "Active",
      color: "text-success",
      icon: "âœ…",
      bgColor: "bg-success/20",
      iconColor: "text-success"
    },
    {
      value: assets.filter(a => a.is_active === false).length,
      label: "Inactive",
      color: "text-error",
      icon: "âŒ",
      bgColor: "bg-error/20",
      iconColor: "text-error"
    },
    {
      value: selectedAssets.length,
      label: "Selected",
      color: "text-warning",
      icon: "âœ“",
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
      icon: "ðŸ“",
      bgColor: "bg-primary/20",
      iconColor: "text-primary"
    },
    {
      value: assetGroups.filter(ag => ag.is_active !== false).length,
      label: "Active",
      color: "text-success",
      icon: "âœ…",
      bgColor: "bg-success/20",
      iconColor: "text-success"
    },
    {
      value: assetGroups.filter(ag => ag.is_active === false).length,
      label: "Inactive",
      color: "text-error",
      icon: "âŒ",
      bgColor: "bg-error/20",
      iconColor: "text-error"
    },
    {
      value: selectedAssetGroups.length,
      label: "Selected",
      color: "text-warning",
      icon: "âœ“",
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
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Tabs with Statistics */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="groups">Asset Groups</TabsTrigger>
              </TabsList>
              
              {/* Statistics */}
              <div className="flex items-center space-x-6">
                {activeTab === 'assets' ? (
                  assetStatistics.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))
                ) : (
                  groupStatistics.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <TabsContent value="assets" className="space-y-6">
              <StandardList
                items={filteredAssets}
                loading={loading.assets}
                showHeader={false}
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
                emptyStateIcon="ðŸ“±"
                emptyStateTitle="No assets found"
                emptyStateDescription="Create your first asset to get started."
              />
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <StandardList
                items={filteredGroups}
                loading={loading.assetGroups}
                showHeader={false}
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
                emptyStateIcon="ðŸ“"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="hostname"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Operating System
              </label>
              <Input
                value={assetForm.os}
                onChange={(e) => setAssetForm({...assetForm, os: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Device Type
              </label>
              <Input
                value={assetForm.device_type}
                onChange={(e) => setAssetForm({...assetForm, device_type: e.target.value})}
                placeholder="Server, Workstation, Router, etc."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Location
            </label>
            <Input
              value={assetForm.location}
              onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
              placeholder="Building, Room, Rack, etc."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={assetForm.notes}
              onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
              placeholder="Additional notes about this asset"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={assetForm.is_active}
              onChange={(e) => setAssetForm({...assetForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateAsset}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="hostname"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Operating System
              </label>
              <Input
                value={assetForm.os}
                onChange={(e) => setAssetForm({...assetForm, os: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Device Type
              </label>
              <Input
                value={assetForm.device_type}
                onChange={(e) => setAssetForm({...assetForm, device_type: e.target.value})}
                placeholder="Server, Workstation, Router, etc."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Location
            </label>
            <Input
              value={assetForm.location}
              onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
              placeholder="Building, Room, Rack, etc."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={assetForm.notes}
              onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})}
              placeholder="Additional notes about this asset"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={assetForm.is_active}
              onChange={(e) => setAssetForm({...assetForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdateAsset}>
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
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Enter group description"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Assets
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={groupForm.asset_ids.includes(asset.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupForm({...groupForm, asset_ids: [...groupForm.asset_ids, asset.id]});
                      } else {
                        setGroupForm({...groupForm, asset_ids: groupForm.asset_ids.filter(id => id !== asset.id)});
                      }
                    }}
                    className="rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{asset.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={groupForm.is_active}
              onChange={(e) => setGroupForm({...groupForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateGroup}>
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
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Enter group description"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Assets
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={groupForm.asset_ids.includes(asset.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupForm({...groupForm, asset_ids: [...groupForm.asset_ids, asset.id]});
                      } else {
                        setGroupForm({...groupForm, asset_ids: groupForm.asset_ids.filter(id => id !== asset.id)});
                      }
                    }}
                    className="rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{asset.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={groupForm.is_active}
              onChange={(e) => setGroupForm({...groupForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Active</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditGroupModal(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdateGroup}>
              Update Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetsInterface;
