import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';

const OperationsManagement = () => {
  const { api, operations, loading } = useApp();
  const { user, hasPermission } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  
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
    { value: 'awx_playbook', label: 'AWX Playbook', description: 'Execute Ansible playbooks via AWX Tower', icon: '🎭' },
    { value: 'api_call', label: 'API Call', description: 'Make HTTP API calls to external services', icon: '🌐' },
    { value: 'script', label: 'Script', description: 'Execute custom scripts on target systems', icon: '📜' }
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

  const handleEditOperation = (operation) => {
    setEditingOperation(operation);
    setShowEditModal(true);
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

  const filteredOperations = operations.filter(operation => {
    const matchesSearch = !searchTerm || 
      operation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || operation.operation_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getOperationTypeInfo = (type) => {
    return operationTypes.find(t => t.value === type) || { label: type, description: '', icon: '❓' };
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Check if user has admin permissions
  const isAdmin = hasPermission('admin') || user?.is_superuser;

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-xl font-semibold mb-2">Access Denied</div>
        <p className="text-slate-600">Only administrators can manage operations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Management</h1>
          <p className="text-slate-600">
            Manage automation integrations and operation templates
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Operation
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{operations.length}</div>
          <div className="text-sm text-slate-600">Total Operations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {operations.filter(o => o.is_active).length}
          </div>
          <div className="text-sm text-slate-600">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {operations.filter(o => o.operation_type === 'awx_playbook').length}
          </div>
          <div className="text-sm text-slate-600">AWX Playbooks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {operations.filter(o => o.operation_type === 'api_call').length}
          </div>
          <div className="text-sm text-slate-600">API Calls</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search operations by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="awx_playbook">AWX Playbooks</option>
                <option value="api_call">API Calls</option>
                <option value="script">Scripts</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations List */}
      <Card>
        <CardHeader>
          <CardTitle>Operations ({filteredOperations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading.operations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading operations...</p>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">⚙️</div>
              <p>No operations found. Create your first automation integration!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOperations.map((operation) => {
                const typeInfo = getOperationTypeInfo(operation.operation_type);
                return (
                  <div
                    key={operation.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="text-2xl">{typeInfo.icon}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {operation.name}
                        </h3>
                        <Badge className={getStatusColor(operation.is_active)}>
                          {operation.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {operation.description || 'No description provided'}
                      </p>
                      <div className="text-xs text-slate-500 mt-1">
                        {operation.operation_type === 'awx_playbook' && operation.awx_playbook_name && (
                          <span>Playbook: {operation.awx_playbook_name}</span>
                        )}
                        {operation.operation_type === 'api_call' && operation.api_url && (
                          <span>URL: {operation.api_url}</span>
                        )}
                        {operation.operation_type === 'script' && operation.script_path && (
                          <span>Script: {operation.script_path}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOperation(operation)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOperation(operation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Operation"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operation Name *
              </label>
              <Input
                value={operationForm.name}
                onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                placeholder="Enter operation name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operation Type *
              </label>
              <select
                value={operationForm.operation_type}
                onChange={(e) => setOperationForm({...operationForm, operation_type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={operationForm.description}
              onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
              placeholder="Describe what this operation does"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* AWX Playbook Configuration */}
          {operationForm.operation_type === 'awx_playbook' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Playbook Name *
              </label>
              <Input
                value={operationForm.awx_playbook_name}
                onChange={(e) => setOperationForm({...operationForm, awx_playbook_name: e.target.value})}
                placeholder="Enter playbook name"
              />
            </div>
          )}

          {/* API Call Configuration */}
          {operationForm.operation_type === 'api_call' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    API URL *
                  </label>
                  <Input
                    value={operationForm.api_url}
                    onChange={(e) => setOperationForm({...operationForm, api_url: e.target.value})}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Method
                  </label>
                  <select
                    value={operationForm.api_method}
                    onChange={(e) => setOperationForm({...operationForm, api_method: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Headers (JSON)
                </label>
                <textarea
                  value={operationForm.api_headers ? JSON.stringify(operationForm.api_headers, null, 2) : '{}'}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setOperationForm({...operationForm, api_headers: headers});
                    } catch (error) {
                      // Keep the text as is for editing
                    }
                  }}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Request Body (JSON)
                </label>
                <textarea
                  value={operationForm.api_body ? JSON.stringify(operationForm.api_body, null, 2) : '{}'}
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value);
                      setOperationForm({...operationForm, api_body: body});
                    } catch (error) {
                      // Keep the text as is for editing
                    }
                  }}
                  placeholder='{"key": "value", "data": "example"}'
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Script Configuration */}
          {operationForm.operation_type === 'script' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Script Path *
              </label>
              <Input
                value={operationForm.script_path}
                onChange={(e) => setOperationForm({...operationForm, script_path: e.target.value})}
                placeholder="/path/to/script.sh"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={operationForm.is_active}
              onChange={(e) => setOperationForm({...operationForm, is_active: e.target.checked})}
              className="rounded border-slate-300"
            />
            <label className="text-sm font-medium text-slate-700">
              Active (available for execution)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
            >
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
          {/* Same form as create modal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operation Name *
              </label>
              <Input
                value={operationForm.name}
                onChange={(e) => setOperationForm({...operationForm, name: e.target.value})}
                placeholder="Enter operation name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Operation Type *
              </label>
              <select
                value={operationForm.operation_type}
                onChange={(e) => setOperationForm({...operationForm, operation_type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={operationForm.description}
              onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
              placeholder="Describe what this operation does"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Include all the same configuration sections as create modal */}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={operationForm.is_active}
              onChange={(e) => setOperationForm({...operationForm, is_active: e.target.checked})}
              className="rounded border-slate-300"
            />
            <label className="text-sm font-medium text-slate-700">
              Active (available for execution)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateOperation}>
              Update Operation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OperationsManagement;
