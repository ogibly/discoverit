import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';

const AssetList = () => {
  const {
    assets,
    selectedAssets,
    selectedAsset,
    loading,
    toggleAssetSelection,
    selectAllAssets,
    setSelectedAsset,
    deleteAsset,
    bulkDeleteAssets
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.primary_ip?.includes(searchTerm) ||
        asset.mac_address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [assets, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allSelected = paginatedAssets.length > 0 && 
    paginatedAssets.every(asset => selectedAssets.includes(asset.id));

  const handleSelectAll = () => {
    const assetIds = paginatedAssets.map(asset => asset.id);
    selectAllAssets(assetIds);
  };

  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await deleteAsset(assetId);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select assets to delete');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedAssets.length} selected asset(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      await bulkDeleteAssets(selectedAssets);
      // Clear selection after successful deletion
      selectAllAssets([]);
    } catch (error) {
      console.error('Failed to delete assets:', error);
      alert('Failed to delete assets: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusBadge = (asset) => {
    if (!asset.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (asset.is_managed) {
      return <Badge variant="default">Managed</Badge>;
    }
    return <Badge variant="outline">Discovered</Badge>;
  };

  const getLastSeenText = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading.assets) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            {selectedAssets.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  {selectedAssets.length} selected
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? 'No assets match your search' : 'No assets found'}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-slate-600">Name</th>
                    <th className="text-left p-3 font-medium text-slate-600">IP Address</th>
                    <th className="text-left p-3 font-medium text-slate-600">Hostname</th>
                    <th className="text-left p-3 font-medium text-slate-600">OS</th>
                    <th className="text-left p-3 font-medium text-slate-600">Status</th>
                    <th className="text-left p-3 font-medium text-slate-600">Last Seen</th>
                    <th className="text-left p-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className={cn(
                        'border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors',
                        selectedAsset?.id === asset.id && 'bg-blue-50'
                      )}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                          className="rounded border-slate-300 dark:border-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{asset.name}</div>
                        {asset.description && (
                          <div className="text-sm text-slate-500">{asset.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-sm">{asset.primary_ip || 'N/A'}</div>
                        {asset.mac_address && (
                          <div className="text-xs text-slate-500">{asset.mac_address}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{asset.hostname || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {asset.os_name ? (
                            <div>
                              <div className="font-medium">{asset.os_name}</div>
                              {asset.os_version && (
                                <div className="text-xs text-slate-500">{asset.os_version}</div>
                              )}
                            </div>
                          ) : (
                            'Unknown'
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(asset)}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-slate-500">
                          {getLastSeenText(asset.last_seen)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of{' '}
                  {filteredAssets.length} assets
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetList;