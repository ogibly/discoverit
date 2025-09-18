import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';

const Operations = () => {
  const {
    operations,
    jobs,
    selectedAssets,
    selectedAssetGroups,
    runOperation,
    loading,
    statusMessage,
    clearStatusMessage
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationData, setOperationData] = useState({
    name: '',
    description: '',
    operation_type: 'awx_playbook',
    awx_playbook_name: '',
    awx_extra_vars: {},
    api_url: '',
    api_method: 'POST',
    script_path: '',
    script_args: {}
  });

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
        script_path: '',
        script_args: {}
      });
    } catch (error) {
      console.error('Failed to create operation:', error);
    }
  };

  const handleRunOperation = async (operation) => {
    try {
      const runData = {
        operation_id: operation.id,
        asset_ids: selectedAssets,
        asset_group_ids: selectedAssetGroups,
        params: {}
      };
      
      await runOperation(runData);
      setShowRunModal(false);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Failed to run operation:', error);
    }
  };

  const getOperationTypeColor = (type) => {
    switch (type) {
      case 'awx_playbook': return 'bg-blue-100 text-blue-800';
      case 'api_call': return 'bg-green-100 text-green-800';
      case 'script': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading.operations) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowRunModal(true)}
            disabled={selectedAssets.length === 0 && selectedAssetGroups.length === 0}
          >
            Run Operation ({selectedAssets.length + selectedAssetGroups.length} selected)
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Operation
          </Button>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operations.map((operation) => (
          <Card key={operation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{operation.name}</CardTitle>
                <Badge className={getOperationTypeColor(operation.operation_type)}>
                  {operation.operation_type}
                </Badge>
              </div>
              {operation.description && (
                <p className="text-sm text-slate-600">{operation.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {operation.operation_type === 'awx_playbook' && (
                  <div className="text-sm">
                    <span className="font-medium">Playbook:</span> {operation.awx_playbook_name}
                  </div>
                )}
                {operation.operation_type === 'api_call' && (
                  <div className="text-sm">
                    <span className="font-medium">API:</span> {operation.api_method} {operation.api_url}
                  </div>
                )}
                {operation.operation_type === 'script' && (
                  <div className="text-sm">
                    <span className="font-medium">Script:</span> {operation.script_path}
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  Created: {new Date(operation.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
					onClick={() => {
                    setSelectedOperation(operation);
                    setShowRunModal(true);
                  }}
                >
                  Run
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
											onClick={() => {
                    // Edit operation
                    console.log('Edit operation:', operation.id);
											}}
										>
											Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{job.operation?.name || 'Unknown Operation'}</span>
                      <Badge className={getJobStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Started: {new Date(job.start_time).toLocaleString()}
                      {job.progress !== undefined && (
                        <span className="ml-4">Progress: {job.progress}%</span>
                      )}
                    </div>
                    {job.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                  {job.awx_job_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(job.awx_job_url, '_blank')}
                    >
                      View in AWX
                    </Button>
                  )}
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
        title="Create Operation"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <Input
              value={operationData.name}
              onChange={(e) => setOperationData({...operationData, name: e.target.value})}
              placeholder="Operation name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <Input
              value={operationData.description}
              onChange={(e) => setOperationData({...operationData, description: e.target.value})}
              placeholder="Operation description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Operation Type
            </label>
            <select
              value={operationData.operation_type}
              onChange={(e) => setOperationData({...operationData, operation_type: e.target.value})}
              className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <option value="awx_playbook">AWX Playbook</option>
              <option value="api_call">API Call</option>
              <option value="script">Script</option>
            </select>
          </div>
          
          {operationData.operation_type === 'awx_playbook' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Playbook Name
              </label>
              <Input
                value={operationData.awx_playbook_name}
                onChange={(e) => setOperationData({...operationData, awx_playbook_name: e.target.value})}
                placeholder="playbook.yml"
              />
            </div>
          )}
          
          {operationData.operation_type === 'api_call' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API URL
                </label>
                <Input
                  value={operationData.api_url}
                  onChange={(e) => setOperationData({...operationData, api_url: e.target.value})}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Method
                </label>
                <select
                  value={operationData.api_method}
                  onChange={(e) => setOperationData({...operationData, api_method: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </>
          )}
          
          {operationData.operation_type === 'script' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Script Path
              </label>
              <Input
                value={operationData.script_path}
                onChange={(e) => setOperationData({...operationData, script_path: e.target.value})}
                placeholder="/path/to/script.sh"
              />
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
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

      {/* Run Operation Modal */}
      <Modal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        title="Run Operation"
        size="lg"
      >
        <div className="space-y-4">
          {selectedOperation && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium">{selectedOperation.name}</h3>
              <p className="text-sm text-slate-600">{selectedOperation.description}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Selected Targets
            </label>
            <div className="text-sm text-slate-600">
              {selectedAssets.length} assets, {selectedAssetGroups.length} asset groups
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRunModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRunOperation(selectedOperation)}
              disabled={!selectedOperation}
            >
              Run Operation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Message */}
      {statusMessage && (
        <div className={cn(
          'p-4 rounded-md border',
          statusMessage.includes('success') || statusMessage.includes('completed')
            ? 'bg-green-50 border-green-200 text-green-800'
            : statusMessage.includes('error') || statusMessage.includes('failed')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}>
          <div className="flex items-center justify-between">
            <span>{statusMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearStatusMessage}
              className="h-6 w-6 p-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
				</div>
			</div>
			)}
		</div>
	);
};

export default Operations;