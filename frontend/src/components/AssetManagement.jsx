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
    fetchAssets,
    fetchAssetGroups,
    fetchOperations
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

  const getHeaderActions = () => {
    switch (activeTab) {
      case 'assets':
        return [
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
      case 'groups':
        return [
          {
            label: "Add Group",
            size: "sm",
            onClick: () => setShowGroupModal(true),
          }
        ];
      case 'operations':
        return [
          {
            label: `Run Operation (${selectedAssets.length + selectedAssetGroups.length})`,
            variant: "outline",
            size: "sm",
            onClick: () => setShowOperationModal(true),
            disabled: selectedAssets.length === 0 && selectedAssetGroups.length === 0,
          }
        ];
      default:
        return [];
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'assets':
        return `${assets.length} assets • ${selectedAssets.length} selected`;
      case 'groups':
        return `${assetGroups.length} groups • ${selectedAssetGroups.length} selected`;
      case 'operations':
        return `${operations.length} operations • ${selectedAssets.length + selectedAssetGroups.length} targets selected`;
      default:
        return '';
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Asset Management"
        subtitle={getSubtitle()}
        actions={getHeaderActions()}
        searchPlaceholder={`Search ${activeTab}...`}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
      />

      {/* Tabs Navigation */}
      <div className="px-6 py-4 bg-card border-b border-border flex-shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assets" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>Assets ({assets.length})</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Groups ({assetGroups.length})</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Operations ({operations.length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Assets Tab */}
          <TabsContent value="assets" className="flex-1 flex flex-col m-0">
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
          </TabsContent>

          {/* Asset Groups Tab */}
          <TabsContent value="groups" className="flex-1 flex flex-col m-0">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 bg-muted/30 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-subheading text-foreground">
                      Asset Groups ({assetGroups.length})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading.assetGroups ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-body text-muted-foreground mt-2">Loading groups...</p>
                    </div>
                  </div>
                ) : assetGroups.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-subheading text-foreground mb-1">No asset groups found</h3>
                      <p className="text-body text-muted-foreground">Create your first asset group to organize your assets!</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {assetGroups.map((group) => (
                      <div
                        key={group.id}
                        className="group relative bg-background transition-all duration-200 hover:bg-muted/30"
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <h3 className="text-subheading text-foreground truncate">
                                    {group.name}
                                  </h3>
                                  <Badge className="bg-info text-info-foreground">
                                    {group.assets?.length || 0} assets
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditGroup(group)}
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
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              
                              {group.description && (
                                <p className="text-body text-muted-foreground mt-2">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="flex-1 flex flex-col m-0">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 bg-muted/30 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-subheading text-foreground">
                      Available Operations ({operations.length})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading.operations ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-body text-muted-foreground mt-2">Loading operations...</p>
                    </div>
                  </div>
                ) : operations.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-subheading text-foreground mb-1">No operations available</h3>
                      <p className="text-body text-muted-foreground">Contact your administrator to set up operations!</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {operations.map((operation) => (
                      <div
                        key={operation.id}
                        className="group relative bg-background transition-all duration-200 hover:bg-muted/30"
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-md bg-warning/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <h3 className="text-subheading text-foreground truncate">
                                    {operation.name}
                                  </h3>
                                  <Badge className={cn(
                                    "text-xs",
                                    operation.is_active 
                                      ? "bg-success text-success-foreground" 
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {operation.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {operation.operation_type}
                                  </Badge>
                                </div>
                              </div>
                              
                              {operation.description && (
                                <p className="text-body text-muted-foreground mt-2">
                                  {operation.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
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

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="Edit Asset Group"
      >
        <div className="space-y-4">
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
              onClick={() => setShowEditGroupModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>
              Update Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Run Operation Modal */}
      <Modal
        isOpen={showOperationModal}
        onClose={() => setShowOperationModal(false)}
        title="Run Operation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Select Operation *
            </label>
            <select
              value={operationForm.operation_id}
              onChange={(e) => setOperationForm({...operationForm, operation_id: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Choose an operation...</option>
              {operations.filter(op => op.is_active).map(operation => (
                <option key={operation.id} value={operation.id}>
                  {operation.name} ({operation.operation_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Target Type
            </label>
            <select
              value={operationForm.target_type}
              onChange={(e) => setOperationForm({...operationForm, target_type: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="assets">Assets ({selectedAssets.length} selected)</option>
              <option value="groups">Asset Groups ({selectedAssetGroups.length} selected)</option>
            </select>
          </div>

          <div className="p-4 bg-info/10 rounded-md border border-info/20">
            <h3 className="text-subheading text-foreground mb-2">
              Selected Targets
            </h3>
            <div className="text-body text-muted-foreground">
              {operationForm.target_type === 'assets' 
                ? `${selectedAssets.length} assets selected`
                : `${selectedAssetGroups.length} groups selected`
              }
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowOperationModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRunOperation}
              disabled={!operationForm.operation_id || (selectedAssets.length === 0 && selectedAssetGroups.length === 0)}
            >
              Run Operation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetManagement;