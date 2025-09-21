import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { HelpIcon, CollapsibleGuidance } from './ui';
import { cn } from '../utils/cn';

const UnifiedScanInterface = () => {
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
  
  // Scan management state
  const [activeScan, setActiveScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  
  // Scan configuration
  const [scanConfig, setScanConfig] = useState({
    target: '',
    scanType: 'comprehensive',
    name: '',
    description: '',
    autoCreateAssets: true,
    autoAssignLabels: [],
    autoAssignGroups: []
  });

  // Asset management from scan results
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

  // UI state
  const [viewMode, setViewMode] = useState('scans'); // 'scans', 'results', 'assets'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const scanTypes = [
    { 
      value: 'quick', 
      label: 'Quick Scan', 
      description: 'Fast discovery of active devices', 
      icon: '⚡',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      value: 'comprehensive', 
      label: 'Comprehensive', 
      description: 'Detailed device information', 
      icon: '🔍',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      value: 'stealth', 
      label: 'Stealth', 
      description: 'Minimal network footprint', 
      icon: '🥷',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  useEffect(() => {
    loadScanData();
    // Set up periodic check for active scans (every 3 seconds)
    const interval = setInterval(checkActiveScan, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadScanData = async () => {
    try {
      const [activeResponse, historyResponse, statsResponse] = await Promise.all([
        fetch('/api/v2/scan-tasks/active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/v2/scan-tasks?limit=20', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/v2/scan-tasks/statistics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveScan(activeData);
      } else {
        setActiveScan(null);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setScanHistory(historyData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Process stats data if needed
      }
    } catch (error) {
      console.error('Failed to load scan data:', error);
    }
  };

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

  const handleStartScan = async () => {
    if (activeScan) {
      alert(`Another scan is already running: "${activeScan.name}". Please wait for it to complete or cancel it first.`);
      return;
    }

    try {
      const scanData = {
        name: scanConfig.name || `Discovery: ${scanConfig.target}`,
        target: scanConfig.target,
        scan_type: scanConfig.scanType,
        created_by: user?.id?.toString() || "1"
      };

      await startScan(scanData);
      setShowScanModal(false);
      resetScanConfig();
      loadScanData();
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
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
        loadScanData();
      } else {
        const error = await response.json();
        alert('Failed to cancel scan: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to cancel scan:', error);
      alert('Failed to cancel scan: ' + error.message);
    }
  };

  const handleViewResults = async (scan) => {
    setSelectedScan(scan);
    setShowResultsModal(true);
    // Load scan results
    try {
      const response = await fetch(`/api/v2/scan-tasks/${scan.id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const results = await response.json();
        setScanResults(results);
      }
    } catch (error) {
      console.error('Failed to load scan results:', error);
    }
  };

  const handleCreateAssetFromResult = (result) => {
    setAssetForm({
      name: result.hostname || result.ip,
      primary_ip: result.ip,
      hostname: result.hostname || '',
      mac_address: result.mac || '',
      os_name: result.os || '',
      manufacturer: result.vendor || '',
      model: result.device_type || '',
      description: `Discovered via scan: ${selectedScan?.name}`,
      is_managed: false
    });
    setShowAssetModal(true);
  };

  const handleCreateAsset = async () => {
    try {
      await createAsset(assetForm);
      setShowAssetModal(false);
      resetAssetForm();
    } catch (error) {
      console.error('Failed to create asset:', error);
      alert('Failed to create asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleConvertToAsset = async (device) => {
    try {
      await updateAsset(device.id, { ...device, is_managed: true });
      alert('Device converted to managed asset successfully!');
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
      alert('Failed to convert device to asset: ' + (error.response?.data?.detail || error.message));
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
        asset_ids: selectedAssets // selectedAssets already contains IDs, not objects
      };
      
      console.log('Creating group:', groupData);
      alert('Group creation functionality needs to be implemented in the backend');
      
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetScanConfig = () => {
    setScanConfig({
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

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
      'running': 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
      'completed': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
      'failed': 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
      'cancelled': 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'running': '🔄',
      'completed': '✅',
      'failed': '❌',
      'cancelled': '⏹️'
    };
    return icons[status] || '❓';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
              Network Discovery & Asset Management
              <HelpIcon 
                content="This unified interface combines network discovery and asset management. Start with scans to find devices, then convert them to managed assets for operations."
                className="ml-3"
              />
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Discover, analyze, and manage your network infrastructure
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'scans' ? 'assets' : 'scans')}
              className="min-w-[120px]"
            >
              {viewMode === 'scans' ? 'Asset View' : 'Scan View'}
            </Button>
            <Button
              onClick={() => setShowScanModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <span className="mr-2">🚀</span>
              Start New Scan
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Scans</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{scanHistory.length}</p>
                </div>
                <div className="text-3xl">🔍</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Discovered Assets</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{assets.length}</p>
                </div>
                <div className="text-3xl">💻</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Asset Groups</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{assetGroups.length}</p>
                </div>
                <div className="text-3xl">📁</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Managed Assets</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{assets.filter(a => a.is_managed).length}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compact Workflow Guidance */}
      <CollapsibleGuidance
        title="Discovery Workflow"
        icon="🔄"
        variant="primary"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold mt-0.5">1.</span>
              <div>
                <span className="font-medium">Discover:</span> Run scans to find network devices (shown as "Device" badges)
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold mt-0.5">2.</span>
              <div>
                <span className="font-medium">Convert:</span> Convert discovered devices to managed assets (click "Convert to Asset")
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold mt-0.5">3.</span>
              <div>
                <span className="font-medium">Organize:</span> Create asset groups from your managed assets for bulk operations
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold mt-0.5">4.</span>
              <div>
                <span className="font-medium">Operate:</span> Run operations on individual assets or asset groups
              </div>
            </div>
          </div>
        </div>
      </CollapsibleGuidance>

      {/* Active Scan Status */}
      {activeScan && (
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl animate-spin">🔄</div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                    {activeScan.name}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Target: {activeScan.target} • Progress: {activeScan.progress || 0}%
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Started: {new Date(activeScan.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
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
              <div className="mt-4">
                <Progress value={activeScan.progress} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'scans' ? (
        /* Scan Management View */
        <div className="space-y-6">
          {/* Scan History */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-900 dark:text-slate-100">Scan History</CardTitle>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search scans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="running">Running</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanHistory
                  .filter(scan => 
                    (!searchTerm || scan.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
                    (filterStatus === 'all' || scan.status === filterStatus)
                  )
                  .map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getStatusIcon(scan.status)}</div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {scan.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Target: {scan.target} • Type: {scan.scan_type}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {new Date(scan.start_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(scan.status)}>
                          {scan.status}
                        </Badge>
                        {scan.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(scan)}
                          >
                            View Results
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
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
                        {asset.is_managed ? "Asset" : "Device"}
                      </Badge>
                      {!asset.is_managed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToAsset(asset)}
                          className="text-xs"
                        >
                          Convert to Asset
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Start Scan Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        title="Start Network Discovery"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                Target *
                <HelpIcon 
                  content="Enter IP ranges (192.168.1.0/24), ranges (192.168.1.1-100), or individual IPs (192.168.1.1). Use CIDR notation for subnets."
                  className="ml-1"
                  size="xs"
                />
              </label>
              <Input
                value={scanConfig.target}
                onChange={(e) => setScanConfig({...scanConfig, target: e.target.value})}
                placeholder="192.168.1.0/24 or 192.168.1.1-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Scan Name
              </label>
              <Input
                value={scanConfig.name}
                onChange={(e) => setScanConfig({...scanConfig, name: e.target.value})}
                placeholder="Optional custom name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              Scan Type
              <HelpIcon 
                content="Quick: Fast discovery with minimal network impact. Comprehensive: Detailed device information and services. Stealth: Minimal network footprint for sensitive environments."
                className="ml-1"
                size="xs"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scanTypes.map((type) => (
                <div
                  key={type.value}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    scanConfig.scanType === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                  onClick={() => setScanConfig({...scanConfig, scanType: type.value})}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{type.label}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowScanModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartScan}
              disabled={!scanConfig.target.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Discovery
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scan Results Modal */}
      <Modal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        title={`Scan Results: ${selectedScan?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Discovered Devices ({scanResults.length})
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Target: {selectedScan?.target} • Completed: {new Date(selectedScan?.end_time).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={() => setShowGroupModal(true)}
              disabled={selectedAssets.length === 0}
            >
              Create Group ({selectedAssets.length})
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {scanResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">💻</div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {result.hostname || result.ip}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      IP: {result.ip} • MAC: {result.mac || 'Unknown'} • OS: {result.os || 'Unknown'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateAssetFromResult(result)}
                >
                  Create Asset
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Create Asset Modal */}
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

      {/* Create Group Modal */}
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

export default UnifiedScanInterface;
