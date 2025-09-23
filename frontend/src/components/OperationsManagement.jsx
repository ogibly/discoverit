import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';
import { useFormState, useListState, useModalState } from '../hooks/useFormState';
import { createCrudOperations, handleApiError, validationRules } from '../utils/apiHelpers';
import DataTable from './common/DataTable';
import FormModal, { FormInput, FormTextarea, FormSelect, FormCheckbox } from './common/FormModal';
import StatusIndicator from './common/StatusIndicator';
import PageHeader from './PageHeader';

const OperationsManagement = () => {
  const { api, operations, loading } = useApp();
  const { user, hasPermission } = useAuth();
  
  // Use custom hooks for state management
  const listState = useListState(operations);
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    selectedItems,
    setSelectedItems,
    clearSelection
  } = listState;
  
  // Alias for consistency with component usage
  const selectedOperations = selectedItems;
  
  // Selection handlers
  const toggleOperationSelection = (operationId) => {
    if (selectedItems.includes(operationId)) {
      setSelectedItems(selectedItems.filter(id => id !== operationId));
    } else {
      setSelectedItems([...selectedItems, operationId]);
    }
  };
  
  const selectAllOperations = (operationIds) => {
    setSelectedItems(operationIds);
  };
  
  const createModal = useModalState();
  const editModal = useModalState();
  
  const initialForm = {
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
  };
  
  const formState = useFormState(initialForm, () => {
    createModal.closeModal();
    editModal.closeModal();
  });
  
  // Create CRUD operations
  const crudOps = createCrudOperations(api, 'operations');

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

  // Update form when editing operation changes
  useEffect(() => {
    if (editModal.data) {
      formState.updateForm({
        name: editModal.data.name || '',
        description: editModal.data.description || '',
        operation_type: editModal.data.operation_type || 'awx_playbook',
        awx_playbook_name: editModal.data.awx_playbook_name || '',
        awx_extra_vars: editModal.data.awx_extra_vars || {},
        api_url: editModal.data.api_url || '',
        api_method: editModal.data.api_method || 'POST',
        api_headers: editModal.data.api_headers || {},
        api_body: editModal.data.api_body || {},
        script_path: editModal.data.script_path || '',
        script_args: editModal.data.script_args || {},
        is_active: editModal.data.is_active !== false
      });
    }
  }, [editModal.data, formState]);

  // Define table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true
    },
    {
      key: 'operation_type',
      header: 'Type',
      accessor: 'operation_type',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {operationTypes.find(t => t.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (value) => <StatusIndicator status={value ? 'active' : 'inactive'} />
    },
    {
      key: 'created_at',
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  const handleCreateOperation = async () => {
    const isValid = formState.validateForm({
      name: validationRules.required('Operation name is required'),
      operation_type: validationRules.required('Operation type is required')
    });

    if (!isValid) return;

    formState.setIsSubmitting(true);
    try {
      await crudOps.create(formState.form);
      formState.resetForm();
      createModal.closeModal();
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      const errorMessage = handleApiError(error, 'create operation');
      alert(errorMessage);
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  const handleUpdateOperation = async () => {
    const isValid = formState.validateForm({
      name: validationRules.required('Operation name is required'),
      operation_type: validationRules.required('Operation type is required')
    });

    if (!isValid) return;

    formState.setIsSubmitting(true);
    try {
      await crudOps.update(editModal.data.id, formState.form);
      formState.resetForm();
      editModal.closeModal();
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      const errorMessage = handleApiError(error, 'update operation');
      alert(errorMessage);
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  const handleDeleteOperation = async (operationId) => {
    if (!confirm('Are you sure you want to delete this operation?')) return;
    
    try {
      await crudOps.delete(operationId);
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      const errorMessage = handleApiError(error, 'delete operation');
      alert(errorMessage);
    }
  };

  const handleBulkDeleteOperations = async (operationIds) => {
    if (!confirm(`Are you sure you want to delete ${operationIds.length} operations?`)) return;
    
    try {
      await crudOps.bulkDelete(operationIds);
      clearSelection();
      // Refresh operations list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      const errorMessage = handleApiError(error, 'delete operations');
      alert(errorMessage);
    }
  };

  // Action handlers
  const handleEditOperation = (operation) => {
    editModal.openModal(operation);
  };

  const handleCreateNew = () => {
    formState.resetForm();
    createModal.openModal();
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
      <PageHeader
        title="Operations"
        subtitle="Manage automation operations and scripts"
        metrics={[
          { value: operations.length, label: "Total Operations", color: "text-primary" },
          { value: operations.filter(o => o.is_active).length, label: "Active", color: "text-success" },
          { value: operations.filter(o => !o.is_active).length, label: "Inactive", color: "text-warning" }
        ]}
        actions={[
          {
            label: "Create Operation",
            icon: "➕",
            onClick: handleCreateNew,
            variant: "default"
          }
        ]}
      />

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
              {filteredOperations.length} operation{filteredOperations.length !== 1 ? 's' : ''}
            </div>
          </div>

          {viewMode === 'grid' ? (
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
        </>
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