import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import PageHeader from './PageHeader';
import { cn } from '../utils/cn';

const AssetManagement = () => {
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
    createAssetGroup,
    fetchAssets
  } = useApp();

  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [assetForm, setAssetForm] = useState({
    name: '',
    primary_ip: '',
    hostname: '',
    mac_address: '',
    os_name: '',
    manufacturer: '',
    model: '',
    description: '',
    is_managed: false
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.primary_ip?.includes(searchTerm) ||
        asset.mac_address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'managed' && asset && asset.is_managed) ||
        (filterStatus === 'unmanaged' && asset && !asset.is_managed);
      
      return matchesSearch && matchesFilter;
    });
  }, [assets, searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allSelected = paginatedAssets.length > 0 && 
    paginatedAssets.every(asset => selectedAssets.includes(asset.id));

  useEffect(() => {
    fetchAssets();
    fetchAssetGroups();
    fetchOperations();
  }, [fetchAssets, fetchAssetGroups, fetchOperations]);

  const handleSelectAll = () => {
    const assetIds = paginatedAssets.map(asset => asset.id);
    selectAllAssets(assetIds);
  };

  const handleCreateAsset = async () => {
    try {
      await createAsset(assetForm);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create asset:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset');
      return;
    }

    try {
      const groupData = {
        name: groupForm.name,
        description: groupForm.description,
        asset_ids: selectedAssets // selectedAssets already contains IDs, not objects
      };
      
      await createAssetGroup(groupData);
      
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
      selectAllAssets([]);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateAsset = async () => {
    try {
      await updateAsset(editingAsset.id, assetForm);
      setShowEditModal(false);
      setEditingAsset(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await deleteAsset(assetId);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const handleBulkDeleteAssets = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select assets to delete');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedAssets.length} selected asset(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      await bulkDeleteAssets(selectedAssets);
      selectAllAssets([]);
    } catch (error) {
      console.error('Failed to delete assets:', error);
      alert('Failed to delete assets: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name || '',
      primary_ip: asset.primary_ip || '',
      hostname: asset.hostname || '',
      mac_address: asset.mac_address || '',
      os_name: asset.os_name || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      description: asset.description || '',
      is_managed: asset.is_managed || false
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setAssetForm({
      name: '',
      primary_ip: '',
      hostname: '',
      mac_address: '',
      os_name: '',
      manufacturer: '',
      model: '',
      description: '',
      is_managed: false
    });
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || '',
      description: group.description || ''
    });
    setShowEditGroupModal(true);
  };

  const handleUpdateGroup = async () => {
    try {
      await updateAssetGroup(editingGroup.id, groupForm);
      setShowEditGroupModal(false);
      setEditingGroup(null);
      setGroupForm({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this asset group?')) return;
    
    try {
      await deleteAssetGroup(groupId);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleRunOperation = async () => {
    if (!operationForm.operation_id) {
      alert('Please select an operation');
      return;
    }

    const targetIds = operationForm.target_type === 'assets' ? selectedAssets : selectedAssetGroups;
    if (targetIds.length === 0) {
      alert(`Please select ${operationForm.target_type} to run the operation on`);
      return;
    }

    try {
      const executionData = {
        operation_id: parseInt(operationForm.operation_id),
        target_type: operationForm.target_type,
        target_ids: targetIds,
        credential_id: operationForm.credential_id
      };
      
      await runOperation(executionData);
      setShowOperationModal(false);
      setOperationForm({
        operation_id: '',
        target_type: 'assets',
        target_ids: [],
        credential_id: null
      });
      alert('Operation started successfully!');
    } catch (error) {
      console.error('Failed to run operation:', error);
      alert('Failed to run operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusColor = (isManaged) => {
    return isManaged 
      ? 'bg-success text-success-foreground' 
      : 'bg-warning text-warning-foreground';
  };

  const getOSIcon = (osName) => {
    if (!osName) return (
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
    const os = osName.toLowerCase();
    if (os.includes('windows')) return (
      <div className="w-8 h-8 rounded-md bg-info/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
    if (os.includes('linux')) return (
      <div className="w-8 h-8 rounded-md bg-warning/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
    if (os.includes('mac')) return (
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
    if (os.includes('ios') || os.includes('android')) return (
      <div className="w-8 h-8 rounded-md bg-success/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
    return (
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  const headerActions = [
    {
      label: `Group (${selectedAssets.length})`,
      variant: "outline",
      size: "sm",
      onClick: () => setShowGroupModal(true),
      disabled: selectedAssets.length === 0,
    },
    ...(selectedAssets.length > 0 ? [{
      label: `Delete (${selectedAssets.length})`,
      variant: "outline",
      size: "sm",
      onClick: handleBulkDeleteAssets,
      className: "text-error hover:text-error hover:bg-error/10 border-error/20"
    }] : []),
    {
      label: "Add Asset",
      size: "sm",
      onClick: () => setShowCreateModal(true),
    }
  ];

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Asset Management"
        subtitle={`${assets.length} assets • ${selectedAssets.length} selected`}
        actions={headerActions}
        searchPlaceholder="Search assets..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
      />

      {/* Sophisticated Stats and Filters */}
      <div className="px-6 py-4 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-bold text-primary">{assets.length}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-muted-foreground font-medium">Managed:</span>
              <span className="font-bold text-success">{assets.filter(a => a && a.is_managed).length}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-muted-foreground font-medium">Unmanaged:</span>
              <span className="font-bold text-warning">{assets.filter(a => a && !a.is_managed).length}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="all">All Assets</option>
              <option value="managed">Managed Only</option>
              <option value="unmanaged">Unmanaged Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 bg-muted/30 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-subheading text-foreground">
                  Assets ({filteredAssets.length})
                </span>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-border text-primary focus:ring-ring bg-background"
                  />
                  <span className="text-body text-muted-foreground font-medium">Select All</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading.assets ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-body text-muted-foreground mt-2">Loading assets...</p>
                </div>
              </div>
            ) : paginatedAssets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-subheading text-foreground mb-1">No assets found</h3>
                  <p className="text-body text-muted-foreground">Start with network discovery to find devices!</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      "group relative bg-background transition-all duration-200 hover:bg-muted/30",
                      selectedAssets.includes(asset.id) 
                        ? "bg-primary/5 ring-1 ring-primary/20" 
                        : ""
                    )}
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                          className="rounded border-border text-primary focus:ring-ring bg-background"
                        />
                        
                        <div className="flex-shrink-0">
                          {getOSIcon(asset.os_name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                              <h3 className="text-subheading text-foreground truncate">
                                {asset.name || asset.hostname || asset.primary_ip}
                              </h3>
                              <Badge className={cn(
                                "text-xs",
                                getStatusColor(asset.is_managed)
                              )}>
                                {asset.is_managed ? 'Managed' : 'Unmanaged'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAsset(asset)}
                                className="text-xs"
                              >
                                Edit
                              </Button>
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
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="text-info bg-info/10 px-2 py-1 rounded font-mono">{asset.primary_ip}</span>
                            {asset.hostname && (
                              <span className="text-foreground bg-muted px-2 py-1 rounded">{asset.hostname}</span>
                            )}
                            {asset.mac_address && (
                              <span className="text-primary bg-primary/10 px-2 py-1 rounded font-mono">{asset.mac_address}</span>
                            )}
                            {asset.os_name && (
                              <span className="text-success bg-success/10 px-2 py-1 rounded">{asset.os_name}</span>
                            )}
                            {asset.manufacturer && (
                              <span className="text-warning bg-warning/10 px-2 py-1 rounded">{asset.manufacturer}</span>
                            )}
                            {asset.model && (
                              <span className="text-error bg-error/10 px-2 py-1 rounded">{asset.model}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2 bg-card border-t border-border flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-xs h-6 px-2"
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-xs h-6 px-2"
              >
                Next
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Asset"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Asset Name *
              </label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                placeholder="Enter asset name"
                required
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Primary IP *
              </label>
              <Input
                value={assetForm.primary_ip}
                onChange={(e) => setAssetForm({...assetForm, primary_ip: e.target.value})}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="device-hostname"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Operating System
              </label>
              <Input
                value={assetForm.os_name}
                onChange={(e) => setAssetForm({...assetForm, os_name: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Dell, HP, Cisco, etc."
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="OptiPlex 7090, ProBook 450, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-body font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={assetForm.is_managed}
                  onChange={(e) => setAssetForm({...assetForm, is_managed: e.target.checked})}
                  className="rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-body font-medium text-foreground">
                  Mark as managed asset
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
            >
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
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Asset Name *
              </label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                placeholder="Enter asset name"
                required
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Primary IP *
              </label>
              <Input
                value={assetForm.primary_ip}
                onChange={(e) => setAssetForm({...assetForm, primary_ip: e.target.value})}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="device-hostname"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Operating System
              </label>
              <Input
                value={assetForm.os_name}
                onChange={(e) => setAssetForm({...assetForm, os_name: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Dell, HP, Cisco, etc."
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="OptiPlex 7090, ProBook 450, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-body font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={assetForm.is_managed}
                  onChange={(e) => setAssetForm({...assetForm, is_managed: e.target.checked})}
                  className="rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-body font-medium text-foreground">
                  Mark as managed asset
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAsset}>
              Update Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Create Asset Group"
      >
        <div className="space-y-4">
          <div className="p-4 bg-info/10 rounded-md border border-info/20">
            <h3 className="text-subheading text-foreground mb-2">
              Selected Assets ({selectedAssets.length})
            </h3>
            <div className="text-body text-muted-foreground">
              {selectedAssets.length > 0 
                ? `Creating group from ${selectedAssets.length} selected assets`
                : 'No assets selected'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Group Name *
            </label>
            <Input
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              placeholder="Enter group name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={selectedAssets.length === 0}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetManagement;