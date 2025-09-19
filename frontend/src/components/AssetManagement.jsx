import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
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
    fetchAssets
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
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
        (filterStatus === 'managed' && asset.is_managed) ||
        (filterStatus === 'unmanaged' && !asset.is_managed);
      
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
  }, [fetchAssets]);

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
        asset_ids: selectedAssets.map(asset => asset.id)
      };
      
      // This would need to be implemented in the AppContext
      console.log('Creating group:', groupData);
      alert('Group creation functionality needs to be implemented in the backend');
      
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
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

  const getStatusColor = (isManaged) => {
    return isManaged 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getOSIcon = (osName) => {
    if (!osName) return '💻';
    const os = osName.toLowerCase();
    if (os.includes('windows')) return '🪟';
    if (os.includes('linux')) return '🐧';
    if (os.includes('mac')) return '🍎';
    if (os.includes('ios')) return '📱';
    if (os.includes('android')) return '🤖';
    return '💻';
  };

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Asset Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your discovered network devices and create asset groups
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => setShowGroupModal(true)}
            disabled={selectedAssets.length === 0}
          >
            Create Group ({selectedAssets.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            + Add Asset
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assets.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Assets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {assets.filter(a => a.is_managed).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Managed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {assets.filter(a => !a.is_managed).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Unmanaged</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedAssets.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Selected</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search assets by name, IP, hostname, or MAC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assets</option>
                <option value="managed">Managed Only</option>
                <option value="unmanaged">Unmanaged Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets ({filteredAssets.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading.assets ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading assets...</p>
            </div>
          ) : paginatedAssets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>No assets found. Start with network discovery!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 border rounded-lg transition-colors",
                    selectedAssets.includes(asset.id) 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset.id)}
                    onChange={() => toggleAssetSelection(asset.id)}
                    className="rounded border-slate-300"
                  />
                  
                  <div className="text-2xl">
                    {getOSIcon(asset.os_name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {asset.name || asset.hostname || asset.primary_ip}
                      </h3>
                      <Badge className={getStatusColor(asset.is_managed)}>
                        {asset.is_managed ? 'Managed' : 'Unmanaged'}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>IP: {asset.primary_ip}</span>
                        {asset.hostname && <span>Host: {asset.hostname}</span>}
                        {asset.mac_address && <span>MAC: {asset.mac_address}</span>}
                      </div>
                      <div className="flex items-center space-x-4">
                        {asset.os_name && <span>OS: {asset.os_name}</span>}
                        {asset.manufacturer && <span>Make: {asset.manufacturer}</span>}
                        {asset.model && <span>Model: {asset.model}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAsset(asset)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Asset"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="device-hostname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operating System
              </label>
              <Input
                value={assetForm.os_name}
                onChange={(e) => setAssetForm({...assetForm, os_name: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Dell, HP, Cisco, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="OptiPlex 7090, ProBook 450, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={assetForm.is_managed}
                  onChange={(e) => setAssetForm({...assetForm, is_managed: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="device-hostname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operating System
              </label>
              <Input
                value={assetForm.os_name}
                onChange={(e) => setAssetForm({...assetForm, os_name: e.target.value})}
                placeholder="Windows 10, Ubuntu 20.04, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manufacturer
              </label>
              <Input
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                placeholder="Dell, HP, Cisco, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Model
              </label>
              <Input
                value={assetForm.model}
                onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                placeholder="OptiPlex 7090, ProBook 450, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={assetForm.is_managed}
                  onChange={(e) => setAssetForm({...assetForm, is_managed: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
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
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Selected Assets ({selectedAssets.length})
            </h3>
            <div className="text-sm text-blue-700">
              {selectedAssets.length > 0 
                ? `Creating group from ${selectedAssets.length} selected assets`
                : 'No assets selected'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
