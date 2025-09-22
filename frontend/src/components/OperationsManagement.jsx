import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';

const OperationsManagement = () => {
  const { api, operations, loading } = useApp();
  const { user, hasPermission } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedOperations, setSelectedOperations] = useState([]);
  
  const [operationForm, setOperationForm] = useState({
    name: '',
    description: '',
    operation_type: 'awx_playbook',
    awx_playbook_name: '',
    awx_extra_vars: {},
    api_url: '',
    api_method: 'POST',
    api_headers: {},
    api_body: {},
    script_path: '',
    script_args: {},
    is_active: true
  });

  const operationTypes = [
    { value: 'all', label: 'All Operations', icon: '⚙️' },
    { value: 'awx_playbook', label: 'AWX Playbook', icon: '🎭' },
    { value: 'api_call', label: 'API Call', icon: '🌐' },
    { value: 'script', label: 'Script', icon: '📜' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'operation_type', label: 'Type' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'is_active', label: 'Status' }
  ];

  useEffect(() => {
    if (editingOperation) {
      setOperationForm({
        name: editingOperation.name || '',
        description: editingOperation.description || '',
        operation_type: editingOperation.operation_type || 'awx_playbook',
        awx_playbook_name: editingOperation.awx_playbook_name || '',
        awx_extra_vars: editingOperation.awx_extra_vars || {},
        api_url: editingOperation.api_url || '',
        api_method: editingOperation.api_method || 'POST',
        api_headers: editingOperation.api_headers || {},
        api_body: editingOperation.api_body || {},
        script_path: editingOperation.script_path || '',
        script_args: editingOperation.script_args || {},
        is_active: editingOperation.is_active !== false
      });
    }
  }, [editingOperation]);

  // Filter and sort operations
  const filteredOperations = operations
    .filter(operation => {
      const matchesSearch = operation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (operation.description && operation.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'all' || operation.operation_type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'operation_type':
          aValue = a.operation_type;
          bValue = b.operation_type;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
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

  const allSelected = filteredOperations.length > 0 && filteredOperations.every(operation => selectedOperations.includes(operation.id));

  const handleCreateOperation = async () => {
    try {
      await api.post('/operations', operationForm);
      setShowCreateModal(false);
      resetForm();
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to create operation:', error);
      alert('Failed to create operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateOperation = async () => {
    try {
      await api.put(`/operations/${editingOperation.id}`, operationForm);
      setShowEditModal(false);
      setEditingOperation(null);
      resetForm();
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to update operation:', error);
      alert('Failed to update operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteOperation = async (operationId) => {
    if (!confirm('Are you sure you want to delete this operation?')) return;
    
    try {
      await api.delete(`/operations/${operationId}`);
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to delete operation:', error);
      alert('Failed to delete operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDeleteOperations = async (operationIds) => {
    if (!confirm(`Are you sure you want to delete ${operationIds.length} operations?`)) return;
    
    try {
      await Promise.all(operationIds.map(id => api.delete(`/operations/${id}`)));
      setSelectedOperations([]);
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to delete operations:', error);
      alert('Failed to delete operations: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setOperationForm({
      name: '',
      description: '',
      operation_type: 'awx_playbook',
      awx_playbook_name: '',
      awx_extra_vars: {},
      api_url: '',
      api_method: 'POST',
      api_headers: {},
      api_body: {},
      script_path: '',
      script_args: {},
      is_active: true
    });
  };

  const toggleOperationSelection = (operationId) => {
    setSelectedOperations(prev => 
      prev.includes(operationId) 
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    );
  };

  const selectAllOperations = (operationIds) => {
    setSelectedOperations(operationIds);
  };

  const getOperationTypeIcon = (type) => {
    switch (type) {
      case 'awx_playbook': return '🎭';
      case 'api_call': return '🌐';
      case 'script': return '📜';
      default: return '⚙️';
    }
  };

  const getOperationTypeColor = (type) => {
    switch (type) {
      case 'awx_playbook': return 'bg-blue-500/20 text-blue-600';
      case 'api_call': return 'bg-green-500/20 text-green-600';
      case 'script': return 'bg-purple-500/20 text-purple-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground';
  };

  if (!hasPermission('admin')) {
    return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-subheading text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-body text-muted-foreground">
              You need administrator privileges to access operations management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-foreground">Operations</h1>
            <p className="text-body text-muted-foreground mt-1">
              Manage automation operations and scripts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{operations.length}</div>
              <div className="text-caption text-muted-foreground">Total Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{operations.filter(o => o.is_active).length}</div>
              <div className="text-caption text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{operations.filter(o => !o.is_active).length}</div>
              <div className="text-caption text-muted-foreground">Inactive</div>
            </div>
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
            <Button onClick={() => setShowCreateModal(true)} className="ml-2">
              Create Operation
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search operations by name or description..."
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
                {operationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Operation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Active Operations</p>
                <p className="text-2xl font-bold text-success">{operations.filter(o => o.is_active).length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-success">✅</span>
              </div>
            </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Inactive Operations</p>
                <p className="text-2xl font-bold text-error">{operations.filter(o => !o.is_active).length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                <span className="text-error">❌</span>
              </div>
            </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Operation Types</p>
                <p className="text-2xl font-bold text-info">{new Set(operations.map(o => o.operation_type)).size}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                <span className="text-info">⚙️</span>
              </div>
            </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-warning">{selectedOperations.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-warning">✓</span>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

      {/* Bulk Actions */}
      {selectedOperations.length > 0 && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-body text-foreground">
                  {selectedOperations.length} operation(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOperations([])}
                  className="text-caption"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkDeleteOperations(selectedOperations)}
                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation List */}
      {filteredOperations.length === 0 ? (
        <Card className="surface-elevated">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-subheading text-foreground mb-2">No operations found</h3>
            <p className="text-body text-muted-foreground">
              Create your first operation to automate tasks on your assets.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperations.map((operation) => (
            <Card key={operation.id} className="surface-interactive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedOperations.includes(operation.id)}
                      onChange={() => toggleOperationSelection(operation.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getOperationTypeColor(operation.operation_type))}>
                      {getOperationTypeIcon(operation.operation_type)}
                    </div>
              </div>
                  <Badge className={cn("text-xs", getStatusColor(operation.is_active))}>
                    {operation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
              </div>

              <div className="space-y-3">
                  <div>
                          <h3 className="text-subheading text-foreground truncate">
                            {operation.name}
                          </h3>
                    <p className="text-caption text-muted-foreground">
                      {operation.description || 'No description'}
                    </p>
                  </div>

                  <div className="space-y-2 text-caption text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{operation.operation_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{operation.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(operation.created_at).toLocaleDateString()}</span>
                        </div>
                    {operation.updated_at && (
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{new Date(operation.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                      </div>
                      
                  <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                      onClick={() => setEditingOperation(operation)}
                      className="flex-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOperation(operation.id)}
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
                        onChange={() => selectAllOperations(allSelected ? [] : filteredOperations.map(o => o.id))}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Operation</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Type</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Created</th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOperations.map((operation) => (
                    <tr key={operation.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOperations.includes(operation.id)}
                          onChange={() => toggleOperationSelection(operation.id)}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getOperationTypeColor(operation.operation_type))}>
                            {getOperationTypeIcon(operation.operation_type)}
                          </div>
                          <div>
                            <div className="text-body font-medium text-foreground">
                              {operation.name}
                            </div>
                            <div className="text-caption text-muted-foreground">
                              {operation.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-foreground capitalize">
                          {operation.operation_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", getStatusColor(operation.is_active))}>
                          {operation.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body text-muted-foreground">
                          {new Date(operation.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingOperation(operation)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOperation(operation.id)}
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

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Operation"
      >
        <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
              Name *
              </label>
              <Input
                value={operationForm.name}
                onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                placeholder="Enter operation name"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              value={operationForm.description}
              onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
              placeholder="Enter operation description"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Operation Type *
              </label>
              <select
                value={operationForm.operation_type}
                onChange={(e) => setOperationForm({...operationForm, operation_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
              {operationTypes.filter(t => t.value !== 'all').map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={operationForm.is_active}
              onChange={(e) => setOperationForm({...operationForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-body text-foreground">Active</span>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOperation}>
              Create Operation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Operation Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Operation"
      >
        <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
              Name *
              </label>
              <Input
                value={operationForm.name}
                onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                placeholder="Enter operation name"
            />
          </div>
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <Input
              value={operationForm.description}
              onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
              placeholder="Enter operation description"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Operation Type *
              </label>
              <select
                value={operationForm.operation_type}
                onChange={(e) => setOperationForm({...operationForm, operation_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
              {operationTypes.filter(t => t.value !== 'all').map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={operationForm.is_active}
              onChange={(e) => setOperationForm({...operationForm, is_active: e.target.checked})}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-body text-foreground">Active</span>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOperation}>
              Update Operation
            </Button>
          </div>
        </div>
      </Modal>
        </div>
      </div>
    </div>
  );
};

export default OperationsManagement;