import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';

const OperationsEnhanced = () => {
  const {
    operations,
    jobs,
    selectedAssets,
    selectedAssetGroups,
    runOperation,
    loading,
    statusMessage,
    clearStatusMessage,
    api
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [availableCredentials, setAvailableCredentials] = useState([]);
  const [inventoryPreview, setInventoryPreview] = useState(null);
  const [credentialValidation, setCredentialValidation] = useState(null);
  
  const [operationData, setOperationData] = useState({
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
    script_args: {}
  });

  const [runData, setRunData] = useState({
    operation_id: null,
    asset_ids: [],
    asset_group_ids: [],
    target_labels: [],
    params: {},
    credential_id: null,
    override_credentials: {}
  });

  useEffect(() => {
    if (selectedOperation) {
      loadCredentialsForOperation(selectedOperation.id);
    }
  }, [selectedOperation]);

  const loadCredentialsForOperation = async (operationId) => {
    try {
      const response = await api.get(`/operations/${operationId}/credentials`);
      setAvailableCredentials(response.data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setAvailableCredentials([]);
    }
  };

  const handleCreateOperation = async () => {
    try {
      // This would call the API to create an operation
      console.log('Creating operation:', operationData);
      setShowCreateModal(false);
      setOperationData({
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
        script_args: {}
      });
    } catch (error) {
      console.error('Failed to create operation:', error);
    }
  };

  const handleRunOperation = async () => {
    try {
      // Validate credentials first
      const validationResponse = await api.post('/operations/validate-credentials', runData);
      setCredentialValidation(validationResponse.data);
      
      if (!validationResponse.data.valid) {
        alert('Credential validation failed: ' + validationResponse.data.errors.join(', '));
        return;
      }

      // Run the operation
      await runOperation(runData);
      setShowRunModal(false);
      setRunData({
        operation_id: null,
        asset_ids: [],
        asset_group_ids: [],
        target_labels: [],
        params: {},
        credential_id: null,
        override_credentials: {}
      });
    } catch (error) {
      console.error('Failed to run operation:', error);
      alert('Failed to run operation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePreviewInventory = async () => {
    try {
      const response = await api.post(`/operations/${runData.operation_id}/preview-inventory`, runData);
      setInventoryPreview(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to preview inventory:', error);
      alert('Failed to preview inventory: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getOperationTypeIcon = (type) => {
    const icons = {
      'awx_playbook': '🎭',
      'api_call': '🌐',
      'script': '📜',
      'ssh': '🔐',
      'ansible': '⚙️'
    };
    return icons[type] || '❓';
  };

  const getJobStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'running': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCredentialTypeIcon = (type) => {
    const icons = {
      'username_password': '🔑',
      'ssh_key': '🔐',
      'api_key': '🔌',
      'certificate': '📜'
    };
    return icons[type] || '❓';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
          <p className="text-slate-600">Manage and execute remote operations on your assets</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Operation
        </Button>
      </div>

      {/* Operations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {operations.map(operation => (
          <Card key={operation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-xl">{getOperationTypeIcon(operation.operation_type)}</span>
                    <span>{operation.name}</span>
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{operation.description}</p>
                </div>
                <Badge variant={operation.is_active ? 'success' : 'secondary'}>
                  {operation.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-500">Type:</span>
                  <Badge variant="outline">{operation.operation_type}</Badge>
                </div>
                
                {operation.operation_type === 'awx_playbook' && (
                  <div className="text-sm">
                    <span className="text-slate-500">Playbook:</span> {operation.awx_playbook_name}
                  </div>
                )}
                
                {operation.operation_type === 'api_call' && (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-slate-500">URL:</span> {operation.api_url}
                    </div>
                    <div>
                      <span className="text-slate-500">Method:</span> {operation.api_method}
                    </div>
                    {operation.api_headers && Object.keys(operation.api_headers).length > 0 && (
                      <div>
                        <span className="text-slate-500">Headers:</span> {Object.keys(operation.api_headers).length} configured
                      </div>
                    )}
                  </div>
                )}
                
                {operation.operation_type === 'script' && (
                  <div className="text-sm">
                    <span className="text-slate-500">Script:</span> {operation.script_path}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3">
                  <div className="text-xs text-slate-500">
                    Created: {new Date(operation.created_at).toLocaleDateString()}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOperation(operation);
                      setRunData({
                        ...runData,
                        operation_id: operation.id,
                        asset_ids: selectedAssets.map(a => a.id),
                        asset_group_ids: selectedAssetGroups.map(g => g.id)
                      });
                      setShowRunModal(true);
                    }}
                    disabled={!operation.is_active}
                  >
                    Run Operation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs List */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{job.operation?.name || 'Unknown Operation'}</div>
                      <div className="text-sm text-slate-600">
                        {job.asset_ids?.length || 0} assets • {job.created_at ? new Date(job.created_at).toLocaleString() : 'Unknown time'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status === 'running' && (
                      <div className="w-24">
                        <Progress value={job.progress || 0} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Operation"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <Input
                value={operationData.name}
                onChange={(e) => setOperationData({...operationData, name: e.target.value})}
                placeholder="Enter operation name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                value={operationData.operation_type}
                onChange={(e) => setOperationData({...operationData, operation_type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="awx_playbook">AWX Playbook</option>
                <option value="api_call">API Call</option>
                <option value="script">Script</option>
                <option value="ssh">SSH Command</option>
                <option value="ansible">Ansible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={operationData.description}
              onChange={(e) => setOperationData({...operationData, description: e.target.value})}
              placeholder="Enter operation description"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {operationData.operation_type === 'awx_playbook' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Playbook Name</label>
              <Input
                value={operationData.awx_playbook_name}
                onChange={(e) => setOperationData({...operationData, awx_playbook_name: e.target.value})}
                placeholder="Enter playbook name"
              />
            </div>
          )}

          {operationData.operation_type === 'api_call' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API URL</label>
                  <Input
                    value={operationData.api_url || ''}
                    onChange={(e) => setOperationData({...operationData, api_url: e.target.value})}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                  <select
                    value={operationData.api_method || 'POST'}
                    onChange={(e) => setOperationData({...operationData, api_method: e.target.value})}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Headers (JSON)</label>
                <textarea
                  value={operationData.api_headers ? JSON.stringify(operationData.api_headers, null, 2) : '{}'}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setOperationData({...operationData, api_headers: headers});
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Request Body (JSON)</label>
                <textarea
                  value={operationData.api_body ? JSON.stringify(operationData.api_body, null, 2) : '{}'}
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value);
                      setOperationData({...operationData, api_body: body});
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

          {operationData.operation_type === 'script' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Script Path</label>
              <Input
                value={operationData.script_path}
                onChange={(e) => setOperationData({...operationData, script_path: e.target.value})}
                placeholder="/path/to/script.sh"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateOperation}>
            Create Operation
          </Button>
        </div>
      </Modal>

      {/* Run Operation Modal */}
      <Modal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        title={`Run Operation: ${selectedOperation?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Target Selection */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-3">Target Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Selected Assets ({selectedAssets.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2">
                  {selectedAssets.map(asset => (
                    <div key={asset.id} className="text-sm py-1">
                      {asset.name} ({asset.primary_ip})
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Selected Groups ({selectedAssetGroups.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2">
                  {selectedAssetGroups.map(group => (
                    <div key={group.id} className="text-sm py-1">
                      {group.name} ({group.assets?.length || 0} assets)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Credential Selection */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-3">Credentials</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Credential
                </label>
                <select
                  value={runData.credential_id || ''}
                  onChange={(e) => setRunData({...runData, credential_id: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use asset's own credentials</option>
                  {availableCredentials.map(credential => (
                    <option key={credential.id} value={credential.id}>
                      {getCredentialTypeIcon(credential.credential_type)} {credential.name} ({credential.credential_type})
                    </option>
                  ))}
                </select>
              </div>
              
              {runData.credential_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Selected Credential:</strong> {availableCredentials.find(c => c.id === runData.credential_id)?.name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    This credential will be used for all target assets unless overridden.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operation Parameters */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-3">Parameters</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Extra Variables (JSON)
              </label>
              <textarea
                value={JSON.stringify(runData.params, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setRunData({...runData, params: parsed});
                  } catch (error) {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"key": "value"}'
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
              />
            </div>
          </div>

          {/* Validation Results */}
          {credentialValidation && (
            <div className={`p-3 rounded-md ${credentialValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`text-sm ${credentialValidation.valid ? 'text-green-800' : 'text-red-800'}`}>
                {credentialValidation.valid ? (
                  <div>✅ {credentialValidation.message}</div>
                ) : (
                  <div>
                    <div className="font-medium">❌ Credential validation failed:</div>
                    <ul className="list-disc list-inside mt-1">
                      {credentialValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            onClick={handlePreviewInventory}
            disabled={!runData.operation_id}
          >
            Preview Inventory
          </Button>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => setShowRunModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRunOperation}>
              Run Operation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inventory Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Ansible Inventory Preview"
        size="xl"
      >
        {inventoryPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-md">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inventoryPreview.asset_count}</div>
                <div className="text-sm text-slate-600">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{inventoryPreview.credential_summary.assets_with_credentials}</div>
                <div className="text-sm text-slate-600">With Credentials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{inventoryPreview.credential_summary.assets_without_credentials}</div>
                <div className="text-sm text-slate-600">Without Credentials</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2">Generated Inventory:</h4>
              <pre className="bg-slate-100 p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(inventoryPreview.inventory, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OperationsEnhanced;
