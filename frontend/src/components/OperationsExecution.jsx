import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';

const OperationsExecution = () => {
  const { 
    api, 
    operations, 
    assets, 
    assetGroups, 
    selectedAssets, 
    selectedAssetGroups,
    loading 
  } = useApp();
  const { user } = useAuth();
  
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [availableCredentials, setAvailableCredentials] = useState([]);
  const [executionForm, setExecutionForm] = useState({
    operation_id: null,
    asset_ids: [],
    asset_group_ids: [],
    credential_id: null,
    custom_username: '',
    custom_password: '',
    use_custom_credentials: false,
    extra_vars: {}
  });

  useEffect(() => {
    if (selectedOperation) {
      loadCredentials();
    }
  }, [selectedOperation]);

  const loadCredentials = async () => {
    try {
      const response = await api.get('/credentials');
      setAvailableCredentials(response.data || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setAvailableCredentials([]);
    }
  };

  const handleExecuteOperation = async () => {
    try {
      const executionData = {
        operation_id: executionForm.operation_id,
        asset_ids: executionForm.asset_ids,
        asset_group_ids: executionForm.asset_group_ids,
        credential_id: executionForm.use_custom_credentials ? null : executionForm.credential_id,
        custom_username: executionForm.use_custom_credentials ? executionForm.custom_username : null,
        custom_password: executionForm.use_custom_credentials ? executionForm.custom_password : null,
        extra_vars: executionForm.extra_vars
      };

      await api.post('/operations/execute', executionData);
      setShowExecutionModal(false);
      resetForm();
      alert('Operation started successfully!');
    } catch (error) {
      console.error('Failed to execute operation:', error);
      alert('Failed to execute operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setExecutionForm({
      operation_id: null,
      asset_ids: [],
      asset_group_ids: [],
      credential_id: null,
      custom_username: '',
      custom_password: '',
      use_custom_credentials: false,
      extra_vars: {}
    });
    setSelectedOperation(null);
  };

  const getOperationTypeInfo = (type) => {
    const types = {
      'awx_playbook': { label: 'AWX Playbook', icon: '🎭', color: 'bg-purple-100 text-purple-800' },
      'api_call': { label: 'API Call', icon: '🌐', color: 'bg-blue-100 text-blue-800' },
      'script': { label: 'Script', icon: '📜', color: 'bg-green-100 text-green-800' }
    };
    return types[type] || { label: type, icon: '❓', color: 'bg-gray-100 text-gray-800' };
  };

  const activeOperations = operations.filter(op => op.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Execute Operations</h1>
          <p className="text-slate-600">
            Run automation operations on your assets and asset groups
          </p>
        </div>
        <Button 
          onClick={() => setShowExecutionModal(true)}
          disabled={activeOperations.length === 0}
        >
          Execute Operation
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{activeOperations.length}</div>
          <div className="text-sm text-slate-600">Available Operations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{assets.length}</div>
          <div className="text-sm text-slate-600">Total Assets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{assetGroups.length}</div>
          <div className="text-sm text-slate-600">Asset Groups</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{selectedAssets.length + selectedAssetGroups.length}</div>
          <div className="text-sm text-slate-600">Selected Targets</div>
        </Card>
      </div>

      {/* Available Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading.operations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading operations...</p>
            </div>
          ) : activeOperations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">⚙️</div>
              <p>No operations available. Contact your administrator to configure operations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOperations.map((operation) => {
                const typeInfo = getOperationTypeInfo(operation.operation_type);
                return (
                  <Card 
                    key={operation.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedOperation(operation);
                      setExecutionForm(prev => ({ ...prev, operation_id: operation.id }));
                      setShowExecutionModal(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl">{typeInfo.icon}</div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{operation.name}</h3>
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {operation.description || 'No description provided'}
                      </p>
                      <div className="text-xs text-slate-500">
                        {operation.operation_type === 'awx_playbook' && operation.awx_playbook_name && (
                          <div>Playbook: {operation.awx_playbook_name}</div>
                        )}
                        {operation.operation_type === 'api_call' && operation.api_url && (
                          <div>URL: {operation.api_url}</div>
                        )}
                        {operation.operation_type === 'script' && operation.script_path && (
                          <div>Script: {operation.script_path}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Targets */}
      {(selectedAssets.length > 0 || selectedAssetGroups.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedAssets.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Assets ({selectedAssets.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssets.slice(0, 5).map(assetId => {
                      const asset = assets.find(a => a.id === assetId);
                      return asset ? (
                        <Badge key={assetId} variant="outline">
                          {asset.name || asset.primary_ip}
                        </Badge>
                      ) : null;
                    })}
                    {selectedAssets.length > 5 && (
                      <Badge variant="outline">
                        +{selectedAssets.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {selectedAssetGroups.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Asset Groups ({selectedAssetGroups.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssetGroups.slice(0, 5).map(groupId => {
                      const group = assetGroups.find(g => g.id === groupId);
                      return group ? (
                        <Badge key={groupId} variant="outline">
                          {group.name}
                        </Badge>
                      ) : null;
                    })}
                    {selectedAssetGroups.length > 5 && (
                      <Badge variant="outline">
                        +{selectedAssetGroups.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Modal */}
      <Modal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        title="Execute Operation"
      >
        <div className="space-y-4">
          {selectedOperation && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">{selectedOperation.name}</h3>
              <p className="text-sm text-blue-700">{selectedOperation.description}</p>
              <Badge className="mt-2">
                {getOperationTypeInfo(selectedOperation.operation_type).label}
              </Badge>
            </div>
          )}

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Execution Targets
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={executionForm.asset_ids.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExecutionForm(prev => ({ ...prev, asset_ids: selectedAssets }));
                    } else {
                      setExecutionForm(prev => ({ ...prev, asset_ids: [] }));
                    }
                  }}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">Use selected assets ({selectedAssets.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={executionForm.asset_group_ids.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExecutionForm(prev => ({ ...prev, asset_group_ids: selectedAssetGroups }));
                    } else {
                      setExecutionForm(prev => ({ ...prev, asset_group_ids: [] }));
                    }
                  }}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">Use selected asset groups ({selectedAssetGroups.length})</span>
              </div>
            </div>
          </div>

          {/* Credential Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Authentication Credentials
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="credential_type"
                  checked={!executionForm.use_custom_credentials}
                  onChange={() => setExecutionForm(prev => ({ ...prev, use_custom_credentials: false }))}
                  className="border-slate-300"
                />
                <span className="text-sm">Use stored credentials</span>
              </div>
              
              {!executionForm.use_custom_credentials && (
                <select
                  value={executionForm.credential_id || ''}
                  onChange={(e) => setExecutionForm(prev => ({ ...prev, credential_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stored credentials</option>
                  {availableCredentials.map(cred => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name} ({cred.credential_type})
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="credential_type"
                  checked={executionForm.use_custom_credentials}
                  onChange={() => setExecutionForm(prev => ({ ...prev, use_custom_credentials: true }))}
                  className="border-slate-300"
                />
                <span className="text-sm">Enter custom credentials</span>
              </div>
              
              {executionForm.use_custom_credentials && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Username
                    </label>
                    <Input
                      value={executionForm.custom_username}
                      onChange={(e) => setExecutionForm(prev => ({ ...prev, custom_username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={executionForm.custom_password}
                      onChange={(e) => setExecutionForm(prev => ({ ...prev, custom_password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extra Variables */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Extra Variables (JSON)
            </label>
            <textarea
              value={executionForm.extra_vars ? JSON.stringify(executionForm.extra_vars, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const vars = JSON.parse(e.target.value);
                  setExecutionForm(prev => ({ ...prev, extra_vars: vars }));
                } catch (error) {
                  // Keep the text as is for editing
                }
              }}
              placeholder='{"key": "value", "param": "example"}'
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowExecutionModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteOperation}
              disabled={!executionForm.operation_id || (executionForm.asset_ids.length === 0 && executionForm.asset_group_ids.length === 0)}
            >
              Execute Operation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OperationsExecution;
