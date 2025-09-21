import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

const AssetsView = ({
  assets,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onViewAsset,
  onEditAsset,
  onDeleteAsset,
  onBulkDeleteAssets,
  selectedAssets,
  onToggleAssetSelection,
  onSelectAllAssets,
  getStatusColor,
  getOSIcon,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const statusOptions = [
    { value: 'all', label: 'All Assets', icon: '📱' },
    { value: 'online', label: 'Online', icon: '🟢' },
    { value: 'offline', label: 'Offline', icon: '🔴' },
    { value: 'unknown', label: 'Unknown', icon: '⚪' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'primary_ip', label: 'IP Address' },
    { value: 'hostname', label: 'Hostname' },
    { value: 'os_name', label: 'OS' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'created_at', label: 'Created Date' }
  ];

  const allSelected = assets.length > 0 && assets.every(asset => selectedAssets.includes(asset.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">Assets</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Manage and monitor your network assets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{assets.length}</div>
            <div className="text-caption text-muted-foreground">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{assets.filter(a => a.status === 'online').length}</div>
            <div className="text-caption text-muted-foreground">Online</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search assets by name, IP, hostname, or MAC address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ⊞
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-3 py-1 text-sm",
                    viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ☰
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Online Assets</p>
                <p className="text-2xl font-bold text-success">{assets.filter(a => a.status === 'online').length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-success">🟢</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Offline Assets</p>
                <p className="text-2xl font-bold text-error">{assets.filter(a => a.status === 'offline').length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <span className="text-error">🔴</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">OS Types</p>
                <p className="text-2xl font-bold text-info">{new Set(assets.map(a => a.os_name).filter(Boolean)).size}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <span className="text-info">💻</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-warning">{selectedAssets.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-warning">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedAssets.length} asset(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAllAssets([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkDeleteAssets(selectedAssets)}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset List */}
      {assets.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-subheading text-foreground mb-2">No assets found</h3>
            <p className="text-body text-muted-foreground">
              Create your first asset or run a discovery scan to find network devices.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="surface-interactive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => onToggleAssetSelection(asset.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
                      {getOSIcon(asset.os_name)}
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(asset.status))}>
                    {asset.status || 'Unknown'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-subheading text-foreground truncate">
                      {asset.name || asset.hostname || 'Unnamed Asset'}
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {asset.primary_ip}
                    </p>
                  </div>

                  <div className="space-y-2 text-caption text-muted-foreground">
                    {asset.hostname && (
                      <div className="flex justify-between">
                        <span>Hostname:</span>
                        <span className="font-mono">{asset.hostname}</span>
                      </div>
                    )}
                    {asset.mac_address && (
                      <div className="flex justify-between">
                        <span>MAC:</span>
                        <span className="font-mono">{asset.mac_address}</span>
                      </div>
                    )}
                    {asset.os_name && (
                      <div className="flex justify-between">
                        <span>OS:</span>
                        <span className="capitalize">{asset.os_name}</span>
                      </div>
                    )}
                    {asset.manufacturer && (
                      <div className="flex justify-between">
                        <span>Manufacturer:</span>
                        <span className="capitalize">{asset.manufacturer}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Managed:</span>
                      <span>{asset.is_managed ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAsset(asset)}
                      className="flex-1 text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAsset(asset)}
                      className="flex-1 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteAsset(asset.id)}
                      className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                    >
                      Delete
                    </Button>
                  </div>
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
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => onSelectAllAssets(allSelected ? [] : assets.map(a => a.id))}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Asset</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">IP Address</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">OS</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Managed</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => onToggleAssetSelection(asset.id)}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm">
                            {getOSIcon(asset.os_name)}
                          </div>
                          <div>
                            <div className="text-body font-medium text-foreground">
                              {asset.name || asset.hostname || 'Unnamed Asset'}
                            </div>
                            {asset.mac_address && (
                              <div className="text-caption text-muted-foreground font-mono">
                                {asset.mac_address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground font-mono">{asset.primary_ip}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground capitalize">{asset.os_name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", getStatusColor(asset.status))}>
                          {asset.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", asset.is_managed ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                          {asset.is_managed ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewAsset(asset)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditAsset(asset)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteAsset(asset.id)}
                            className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-caption text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssetsView;