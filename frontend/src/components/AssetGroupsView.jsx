import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';

const AssetGroupsView = ({
  assetGroups,
  assets,
  selectedAssetGroups,
  onToggleAssetGroupSelection,
  onSelectAllAssetGroups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onCreateGroup,
  onMoveAssetsToGroup,
  onRemoveAssetsFromGroup,
  onRunOperationOnGroup,
  operations
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'asset_count', label: 'Asset Count' }
  ];

  const allSelected = assetGroups.length > 0 && assetGroups.every(group => selectedAssetGroups.includes(group.id));

  // Filter and sort groups
  const filteredGroups = assetGroups
    .filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'asset_count':
          aValue = a.assets?.length || 0;
          bValue = b.assets?.length || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">Asset Groups</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Organize and manage your assets in groups
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{assetGroups.length}</div>
            <div className="text-caption text-muted-foreground">Total Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info">{assets.length}</div>
            <div className="text-caption text-muted-foreground">Total Assets</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search groups by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
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
              <Button onClick={onCreateGroup} className="ml-2">
                Create Group
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-bold text-primary">{assetGroups.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary">📁</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Assets in Groups</p>
                <p className="text-2xl font-bold text-info">{assetGroups.reduce((sum, group) => sum + (group.assets?.length || 0), 0)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <span className="text-info">📱</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Ungrouped Assets</p>
                <p className="text-2xl font-bold text-warning">{assets.filter(asset => !assetGroups.some(group => group.assets?.some(gAsset => gAsset.id === asset.id))).length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-warning">🔓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-success">{selectedAssetGroups.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-success">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedAssetGroups.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedAssetGroups.length} group(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAllAssetGroups([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedAssetGroups.forEach(id => onDeleteGroup(id))}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group List */}
      {filteredGroups.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-subheading text-foreground mb-2">No groups found</h3>
            <p className="text-body text-muted-foreground">
              Create your first asset group to organize your assets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">View:</span>
              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
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
                    "text-xs font-medium transition-all duration-200 h-8 px-3",
                    viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ☰
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
            </div>
          </div>

          {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="surface-interactive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAssetGroups.includes(group.id)}
                      onChange={() => onToggleAssetGroupSelection(group.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
                      📁
                    </div>
                  </div>
                  <Badge className="text-xs bg-primary text-primary-foreground">
                    {group.assets?.length || 0} assets
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
                      <span>Created:</span>
                      <span>{new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                    {group.updated_at && (
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{new Date(group.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewGroup(group)}
                      className="flex-1 text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditGroup(group)}
                      className="flex-1 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteGroup(group.id)}
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
                        onChange={() => onSelectAllAssetGroups(allSelected ? [] : assetGroups.map(g => g.id))}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Group</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Description</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Assets</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Created</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGroups.map((group) => (
                    <tr key={group.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssetGroups.includes(group.id)}
                          onChange={() => onToggleAssetGroupSelection(group.id)}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm">
                            📁
                          </div>
                          <div>
                            <div className="text-body font-medium text-foreground">
                              {group.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-muted-foreground">
                          {group.description || 'No description'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="text-xs bg-primary text-primary-foreground">
                          {group.assets?.length || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-muted-foreground">
                          {new Date(group.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewGroup(group)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditGroup(group)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteGroup(group.id)}
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
        </>
      )}
    </div>
  );
};

export default AssetGroupsView;