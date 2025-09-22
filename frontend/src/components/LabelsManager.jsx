import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { HelpIcon } from './ui';
import { cn } from '../utils/cn';

const LabelsManager = () => {
  const {
    labels,
    loading,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🏷️',
    category: 'general',
    is_active: true
  });

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Filter and sort labels
  const filteredLabels = labels.filter(label => {
    const matchesSearch = !searchTerm || 
      label.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      label.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      label.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === 'active') {
      matchesFilter = label.is_active !== false;
    } else if (filterType === 'inactive') {
      matchesFilter = label.is_active === false;
    }
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'usage':
        aValue = a.usage_count || 0;
        bValue = b.usage_count || 0;
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

  const handleCreate = async () => {
    try {
      await createLabel(formData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create label:', error);
      alert('Failed to create label: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await updateLabel(editingLabel.id, formData);
      setShowEditModal(false);
      setEditingLabel(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update label:', error);
      alert('Failed to update label: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this label?')) return;
    
    try {
      await deleteLabel(id);
    } catch (error) {
      console.error('Failed to delete label:', error);
      alert('Failed to delete label: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '🏷️',
      category: 'general',
      is_active: true
    });
  };

  const handleEdit = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name || '',
      description: label.description || '',
      color: label.color || '#3B82F6',
      icon: label.icon || '🏷️',
      category: label.category || 'general',
      is_active: label.is_active !== false
    });
    setShowEditModal(true);
  };

  // Calculate statistics
  const totalLabels = labels.length;
  const activeLabels = labels.filter(label => label.is_active !== false).length;
  const inactiveLabels = totalLabels - activeLabels;
  const categories = [...new Set(labels.map(label => label.category).filter(Boolean))].length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              Labels Management
              <HelpIcon 
                content="Create and manage labels to categorize and organize your assets and devices for better filtering and organization."
                className="ml-2"
                size="sm"
              />
            </h1>
            <p className="text-body text-muted-foreground mt-1">
              Create and manage labels for better organization and filtering
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalLabels}</div>
              <div className="text-caption text-muted-foreground">Total Labels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeLabels}</div>
              <div className="text-caption text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categories}</div>
              <div className="text-caption text-muted-foreground">Categories</div>
            </div>
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
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
            <Button onClick={() => setShowCreateModal(true)}>
              Create Label
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Label Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Labels</p>
                    <p className="text-2xl font-bold text-foreground">{totalLabels}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary text-lg">🏷️</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Labels</p>
                    <p className="text-2xl font-bold text-green-600">{activeLabels}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive Labels</p>
                    <p className="text-2xl font-bold text-red-600">{inactiveLabels}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">❌</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-blue-600">{categories}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📁</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search labels by name, description, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Labels</option>
                    <option value="active">Active Labels</option>
                    <option value="inactive">Inactive Labels</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="usage">Usage Count</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Labels List */}
          {filteredLabels.length === 0 ? (
            <Card className="surface-elevated">
              <CardContent className="p-12 text-center">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="text-subheading text-foreground mb-2">No labels found</h3>
                <p className="text-body text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first label to organize your assets and devices.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Labels Grid/Table */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLabels.map((label) => (
                    <Card key={label.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                              style={{ backgroundColor: label.color + '20', color: label.color }}
                            >
                              {label.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {label.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {label.category}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            label.is_active !== false ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                          )}>
                            {label.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        {label.description && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                              {label.description}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Usage Count:</span>
                            <span className="text-foreground font-medium">{label.usage_count || 0}</span>
                          </div>
                          {label.last_used && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Used:</span>
                              <span className="text-foreground text-xs">
                                {new Date(label.last_used).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(label)}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(label.id)}
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
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Label</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Category</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Usage</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLabels.map((label) => (
                            <tr key={label.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                    style={{ backgroundColor: label.color + '20', color: label.color }}
                                  >
                                    {label.icon}
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {label.name}
                                    </div>
                                    {label.description && (
                                      <div className="text-sm text-muted-foreground">
                                        {label.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-foreground capitalize">{label.category || 'general'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-foreground">{label.usage_count || 0}</span>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn(
                                  "text-xs",
                                  label.is_active !== false ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                                )}>
                                  {label.is_active !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(label)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(label.id)}
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
      </div>

      {/* Create Label Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Label"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Label name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="environment">Environment</option>
                <option value="department">Department</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="location">Location</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-12 h-8 border border-border rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Icon
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="🏷️"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Label description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="form-checkbox h-4 w-4 text-primary rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-foreground">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Label
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Label Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Label"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Label name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="environment">Environment</option>
                <option value="department">Department</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="location">Location</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-12 h-8 border border-border rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Icon
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="🏷️"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Label description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="form-checkbox h-4 w-4 text-primary rounded"
            />
            <label htmlFor="is_active_edit" className="text-sm font-medium text-foreground">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update Label
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LabelsManager;
