import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';

const UnifiedWorkflow = () => {
  const {
    assets,
    assetGroups,
    operations,
    activeScanTask,
    scanStatistics,
    fetchAssets,
    fetchAssetGroups,
    fetchOperations,
    createScanTask,
    cancelScanTask,
    startScan,
    toggleAssetSelection,
    selectAllAssets,
    selectedAssets,
    createAsset,
    updateAsset,
    deleteAsset
  } = useApp();
  
  const { user } = useAuth();
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowProgress, setWorkflowProgress] = useState({
    discovery: false,
    assets: false,
    groups: false,
    operations: false
  });

  // Discovery state
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryData, setDiscoveryData] = useState({
    target: '',
    scanType: 'comprehensive',
    name: '',
    description: '',
    autoCreateAssets: true,
    autoAssignLabels: [],
    autoAssignGroups: []
  });
  const [activeScan, setActiveScan] = useState(null);

  // Asset management state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: '',
    primary_ip: '',
    hostname: '',
    mac_address: '',
    os_name: '',
    manufacturer: '',
    model: '',
    description: '',
    is_managed: false
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });

  // Operations state
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('workflow'); // 'workflow', 'assets', 'groups', 'operations'

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan', description: 'Fast discovery of active devices', icon: '⚡' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Detailed device information', icon: '🔍' },
    { value: 'stealth', label: 'Stealth', description: 'Minimal network footprint', icon: '🥷' }
  ];

  useEffect(() => {
    // Update workflow progress based on current state
    const progress = {
      discovery: scanStatistics?.total_scans > 0 || activeScanTask,
      assets: assets.length > 0,
      groups: assetGroups.length > 0,
      operations: operations.length > 0
    };
    setWorkflowProgress(progress);
    
    // Check for active scans
    checkActiveScan();
    
    // Set up periodic check for active scans (every 5 seconds)
    const interval = setInterval(checkActiveScan, 5000);
    
    return () => clearInterval(interval);
  }, [assets, assetGroups, operations, scanStatistics, activeScanTask]);

  const checkActiveScan = async () => {
    try {
      const response = await fetch('/api/v2/scan-tasks/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const scanData = await response.json();
        setActiveScan(scanData);
      } else {
        setActiveScan(null);
      }
    } catch (error) {
      console.error('Failed to check active scan:', error);
      setActiveScan(null);
    }
  };

  const handleStartDiscovery = async () => {
    // Check if there's already an active scan
    if (activeScan) {
      alert(`Another scan is already running: "${activeScan.name}". Please wait for it to complete or cancel it first.`);
      return;
    }

    try {
      const scanData = {
        name: discoveryData.name || `Discovery: ${discoveryData.target}`,
        target: discoveryData.target,
        scan_type: discoveryData.scanType,
        created_by: user?.id?.toString() || "1"
      };

      await startScan(scanData);
      setShowDiscoveryModal(false);
      resetDiscoveryData();
      setCurrentStep(2); // Move to assets step
      checkActiveScan(); // Refresh active scan status
    } catch (error) {
      console.error('Failed to start discovery:', error);
      alert('Failed to start discovery: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancelScan = async () => {
    if (!activeScan) return;
    
    if (!confirm(`Are you sure you want to cancel the scan "${activeScan.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v2/scan-tasks/${activeScan.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setActiveScan(null);
        alert('Scan cancelled successfully');
      } else {
        const error = await response.json();
        alert('Failed to cancel scan: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to cancel scan:', error);
      alert('Failed to cancel scan: ' + error.message);
    }
  };

  const handleCreateAsset = async () => {
    try {
      await createAsset(assetForm);
      setShowAssetModal(false);
      resetAssetForm();
      setCurrentStep(3); // Move to groups step
    } catch (error) {
      console.error('Failed to create asset:', error);
      alert('Failed to create asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset');
      return;
    }

    try {
      const groupData = {
        name: groupForm.name,
        description: groupForm.description,
        asset_ids: selectedAssets.map(asset => asset.id)
      };
      
      console.log('Creating group:', groupData);
      alert('Group creation functionality needs to be implemented in the backend');
      
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
      setCurrentStep(4); // Move to operations step
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetDiscoveryData = () => {
    setDiscoveryData({
      target: '',
      scanType: 'comprehensive',
      name: '',
      description: '',
      autoCreateAssets: true,
      autoAssignLabels: [],
      autoAssignGroups: []
    });
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: '',
      primary_ip: '',
      hostname: '',
      mac_address: '',
      os_name: '',
      manufacturer: '',
      model: '',
      description: '',
      is_managed: false
    });
  };

  const getStepStatus = (step) => {
    if (workflowProgress[step.key]) return "completed";
    if (step.id === currentStep) return "current";
    if (step.id < currentStep) return "completed";
    return "pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "current": return "bg-blue-500";
      case "pending": return "bg-gray-300 dark:bg-gray-600";
      default: return "bg-gray-300 dark:bg-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "✓";
      case "current": return "→";
      case "pending": return "○";
      default: return "○";
    }
  };

  const calculateOverallProgress = () => {
    const completedSteps = Object.values(workflowProgress).filter(Boolean).length;
    return (completedSteps / 4) * 100;
  };

  const workflowSteps = [
    {
      id: 1,
      key: 'discovery',
      title: 'Discover Devices',
      description: 'Scan network to find devices',
      icon: '🔍',
      action: () => setShowDiscoveryModal(true),
      stats: scanStatistics?.total_scans || 0
    },
    {
      id: 2,
      key: 'assets',
      title: 'Create Assets',
      description: 'Build your asset inventory',
      icon: '💻',
      action: () => setShowAssetModal(true),
      stats: assets.length
    },
    {
      id: 3,
      key: 'groups',
      title: 'Organize Groups',
      description: 'Group assets for operations',
      icon: '📁',
      action: () => setShowGroupModal(true),
      stats: assetGroups.length
    },
    {
      id: 4,
      key: 'operations',
      title: 'Run Operations',
      description: 'Execute tasks on assets',
      icon: '⚙️',
      action: () => setShowOperationsModal(true),
      stats: operations.length
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Network Asset Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Discover, organize, and manage your network infrastructure
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'workflow' ? 'assets' : 'workflow')}
            >
              {viewMode === 'workflow' ? 'Asset View' : 'Workflow View'}
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="max-w-2xl">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Workflow Progress</span>
            <span>{Math.round(calculateOverallProgress())}%</span>
          </div>
          <Progress value={calculateOverallProgress()} className="h-3" />
        </div>
      </div>

      {/* Active Scan Status */}
      {activeScan && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">🔍</div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {activeScan.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Target: {activeScan.target} • Progress: {activeScan.progress || 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {activeScan.status === 'running' ? 'Running...' : activeScan.status}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelScan}
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  Cancel Scan
                </Button>
              </div>
            </div>
            {activeScan.progress > 0 && (
              <div className="mt-3">
                <Progress value={activeScan.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'workflow' ? (
        /* Workflow Steps */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {workflowSteps.map((step) => {
            const status = getStepStatus(step);
            const isClickable = status === "current" || status === "completed";
            
            return (
              <Card 
                key={step.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg",
                  isClickable ? "hover:-translate-y-1" : "opacity-60",
                  status === "current" && "ring-2 ring-blue-500"
                )}
                onClick={isClickable ? step.action : undefined}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {step.description}
                  </p>
                  
                  {/* Status indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getStatusColor(status)
                    )} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {status}
                    </span>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {step.stats}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {step.key === 'discovery' ? 'Scans' : 
                     step.key === 'assets' ? 'Assets' :
                     step.key === 'groups' ? 'Groups' : 'Operations'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Asset Management View */
        <div className="space-y-6">
          {/* Asset Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assets.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Assets</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {assets.filter(a => a.is_managed).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Managed</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {assets.filter(a => !a.is_managed).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Unmanaged</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedAssets.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Selected</div>
            </Card>
          </div>

          {/* Asset List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-900 dark:text-slate-100">Assets</CardTitle>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => setShowAssetModal(true)}>
                    + Add Asset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assets.slice(0, 10).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedAssets.some(sa => sa.id === asset.id)}
                        onChange={() => toggleAssetSelection(asset.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {asset.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {asset.primary_ip} • {asset.hostname}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={asset.is_managed ? "default" : "secondary"}>
                        {asset.is_managed ? "Managed" : "Unmanaged"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discovery Modal */}
      <Modal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        title="Start Network Discovery"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target *
              </label>
              <Input
                value={discoveryData.target}
                onChange={(e) => setDiscoveryData({...discoveryData, target: e.target.value})}
                placeholder="192.168.1.0/24 or 192.168.1.1-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Scan Type
              </label>
              <select
                value={discoveryData.scanType}
                onChange={(e) => setDiscoveryData({...discoveryData, scanType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {scanTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scan Name
            </label>
            <Input
              value={discoveryData.name}
              onChange={(e) => setDiscoveryData({...discoveryData, name: e.target.value})}
              placeholder="Optional custom name"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowDiscoveryModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartDiscovery}
              disabled={!discoveryData.target.trim()}
            >
              Start Discovery
            </Button>
          </div>
        </div>
      </Modal>

      {/* Asset Creation Modal */}
      <Modal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        title="Create New Asset"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Asset Name *
              </label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                placeholder="Enter asset name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Primary IP *
              </label>
              <Input
                value={assetForm.primary_ip}
                onChange={(e) => setAssetForm({...assetForm, primary_ip: e.target.value})}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hostname
              </label>
              <Input
                value={assetForm.hostname}
                onChange={(e) => setAssetForm({...assetForm, hostname: e.target.value})}
                placeholder="device-hostname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                MAC Address
              </label>
              <Input
                value={assetForm.mac_address}
                onChange={(e) => setAssetForm({...assetForm, mac_address: e.target.value})}
                placeholder="00:11:22:33:44:55"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowAssetModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAsset}
              disabled={!assetForm.name.trim() || !assetForm.primary_ip.trim()}
            >
              Create Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Group Creation Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Create Asset Group"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Selected Assets ({selectedAssets.length})
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {selectedAssets.length > 0 
                ? `Creating group from ${selectedAssets.length} selected assets`
                : 'No assets selected'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Group Name *
            </label>
            <Input
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              placeholder="Enter group name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={selectedAssets.length === 0}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnifiedWorkflow;
