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

const EnhancedDiscoveryInterface = () => {
  const {
    assets,
    activeScanTask,
    fetchAssets,
    createScanTask,
    cancelScanTask,
    updateAsset,
    selectedAssets,
    toggleAssetSelection,
    selectAllAssets
  } = useApp();
  
  const { user } = useAuth();
  
  // State management
  const [viewMode, setViewMode] = useState('devices'); // 'devices', 'scan', 'lan-discovery'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'devices', 'assets'
  const [sortBy, setSortBy] = useState('last_seen'); // 'last_seen', 'ip', 'hostname', 'device_type'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showLanDiscoveryModal, setShowLanDiscoveryModal] = useState(false);
  
  // Scan configuration
  const [scanConfig, setScanConfig] = useState({
    target: '',
    scanType: 'quick',
    name: '',
    description: ''
  });

  // LAN Discovery configuration
  const [lanConfig, setLanConfig] = useState({
    maxDepth: 2,
    name: '',
    description: ''
  });

  // LAN Discovery state
  const [lanDiscoveryResults, setLanDiscoveryResults] = useState(null);
  const [isLanDiscoveryRunning, setIsLanDiscoveryRunning] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Filter and sort devices
  const filteredDevices = React.useMemo(() => {
    let filtered = assets || [];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.primary_ip?.includes(searchTerm) ||
        device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType === 'devices') {
      filtered = filtered.filter(device => !device.is_managed);
    } else if (filterType === 'assets') {
      filtered = filtered.filter(device => device.is_managed);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'ip':
          aValue = a.primary_ip || '';
          bValue = b.primary_ip || '';
          break;
        case 'hostname':
          aValue = a.hostname || '';
          bValue = b.hostname || '';
          break;
        case 'device_type':
          aValue = a.model || '';
          bValue = b.model || '';
          break;
        case 'last_seen':
        default:
          aValue = new Date(a.last_seen || a.created_at);
          bValue = new Date(b.last_seen || b.created_at);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [assets, searchTerm, filterType, sortBy, sortOrder]);

  const handleStartScan = async () => {
    if (!scanConfig.target.trim()) {
      alert('Please enter a target IP range or subnet');
      return;
    }

    try {
      const scanData = {
        name: scanConfig.name || `Scan ${new Date().toLocaleString()}`,
        description: scanConfig.description || `Network scan of ${scanConfig.target}`,
        target: scanConfig.target,
        scan_type: scanConfig.scanType,
        auto_create_assets: true
      };

      await createScanTask(scanData);
      setShowScanModal(false);
      setScanConfig({ target: '', scanType: 'quick', name: '', description: '' });
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLanDiscovery = async () => {
    setIsLanDiscoveryRunning(true);
    try {
      const response = await fetch(`/api/v2/discovery/lan?max_depth=${lanConfig.maxDepth}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const results = await response.json();
        setLanDiscoveryResults(results);
        setShowLanDiscoveryModal(false);
        // Refresh assets to show newly discovered devices
        fetchAssets();
      } else {
        const error = await response.json();
        alert('LAN Discovery failed: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('LAN Discovery failed:', error);
      alert('LAN Discovery failed: ' + error.message);
    } finally {
      setIsLanDiscoveryRunning(false);
    }
  };

  const handleCancelScan = async () => {
    if (!activeScanTask) return;
    
    if (!confirm(`Are you sure you want to cancel the scan "${activeScanTask.name}"?`)) {
      return;
    }

    try {
      await cancelScanTask(activeScanTask.id);
    } catch (error) {
      console.error('Failed to cancel scan:', error);
      alert('Failed to cancel scan: ' + error.message);
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

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const getStatusColor = (device) => {
    if (device.is_managed) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusText = (device) => {
    return device.is_managed ? 'Managed Asset' : 'Discovered Device';
  };

  const getDeviceTypeIcon = (device) => {
    const deviceType = device.model?.toLowerCase() || '';
    if (deviceType.includes('server') || deviceType.includes('web')) return '🖥️';
    if (deviceType.includes('router') || deviceType.includes('switch')) return '🌐';
    if (deviceType.includes('printer')) return '🖨️';
    if (deviceType.includes('phone') || deviceType.includes('mobile')) return '📱';
    if (deviceType.includes('camera') || deviceType.includes('security')) return '📹';
    return '💻';
  };

  const getDeviceTypeColor = (device) => {
    const deviceType = device.model?.toLowerCase() || '';
    if (deviceType.includes('server') || deviceType.includes('web')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (deviceType.includes('router') || deviceType.includes('switch')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (deviceType.includes('printer')) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    if (deviceType.includes('phone') || deviceType.includes('mobile')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (deviceType.includes('camera') || deviceType.includes('security')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getResponseTimeColor = (responseTime) => {
    if (!responseTime) return 'text-slate-500';
    if (responseTime < 0.1) return 'text-green-600 dark:text-green-400';
    if (responseTime < 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Network Discovery</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Discover and manage network devices with advanced scanning capabilities
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'devices' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('devices')}
                className="text-sm"
              >
                <span className="mr-1">📱</span>
                Devices
              </Button>
              <Button
                variant={viewMode === 'scan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('scan')}
                className="text-sm"
              >
                <span className="mr-1">🔍</span>
                Custom Scan
              </Button>
              <Button
                variant={viewMode === 'lan-discovery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('lan-discovery')}
                className="text-sm"
              >
                <span className="mr-1">🌐</span>
                LAN Discovery
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Compact Stats */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Total Devices:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{assets?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Active:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{assets?.filter(a => a.is_active !== false).length || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Scans:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{activeScanTask ? 1 : 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Devices</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{assets?.length || 0}</p>
              </div>
              <div className="text-3xl">📱</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Managed Assets</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {assets?.filter(a => a.is_managed).length || 0}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Discovered Devices</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {assets?.filter(a => !a.is_managed).length || 0}
                </p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Scans</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {activeScanTask ? 1 : 0}
                </p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Device Types</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                  {new Set(assets?.map(a => a.model).filter(Boolean)).size || 0}
                </p>
              </div>
              <div className="text-3xl">🏷️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl animate-spin">🔄</div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                    {activeScanTask.name}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Target: {activeScanTask.target} • Status: {activeScanTask.status}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Started: {new Date(activeScanTask.start_time).toLocaleString()}
                  </p>
                </div>
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
            {activeScanTask.progress > 0 && (
              <div className="mt-4">
                <Progress value={activeScanTask.progress} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LAN Discovery Results */}
      {lanDiscoveryResults && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                  LAN Discovery Results
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Network: {lanDiscoveryResults.network} • Found {lanDiscoveryResults.live_devices} live devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanDiscoveryResults(null)}
                className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {lanDiscoveryResults.total_ips_scanned}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">IPs Scanned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {lanDiscoveryResults.live_devices}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Live Devices</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {lanDiscoveryResults.max_depth}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Scan Depth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'devices' ? (
        /* Enhanced Devices View */
        <div className="space-y-6">
          {/* Enhanced Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search devices by IP, hostname, MAC, OS, vendor, or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="devices">Discovered Devices</option>
                    <option value="assets">Managed Assets</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="last_seen">Last Seen</option>
                    <option value="ip">IP Address</option>
                    <option value="hostname">Hostname</option>
                    <option value="device_type">Device Type</option>
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

          {/* Enhanced Devices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <Card key={device.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getDeviceTypeIcon(device)}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {device.hostname || device.primary_ip || 'Unknown Device'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {device.primary_ip}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getStatusColor(device)}>
                        {getStatusText(device)}
                      </Badge>
                      {device.model && (
                        <Badge className={getDeviceTypeColor(device)}>
                          {device.model}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {device.mac_address && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">MAC:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-mono text-xs">
                          {device.mac_address}
                        </span>
                      </div>
                    )}
                    {device.manufacturer && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Vendor:</span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {device.manufacturer}
                        </span>
                      </div>
                    )}
                    {device.os_name && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">OS:</span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {device.os_name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Last Seen:</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {formatLastSeen(device.last_seen)}
                      </span>
                    </div>
                    {device.scan_data?.response_time && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Response:</span>
                        <span className={getResponseTimeColor(device.scan_data.response_time)}>
                          {device.scan_data.response_time}s
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDevice(device)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {!device.is_managed && (
                      <Button
                        size="sm"
                        onClick={() => handleConvertToAsset(device)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Convert to Asset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDevices.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No devices found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by running a network scan or LAN discovery to find devices'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setViewMode('scan')}>
                    Custom Scan
                  </Button>
                  <Button onClick={() => setViewMode('lan-discovery')} variant="outline">
                    LAN Discovery
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : viewMode === 'scan' ? (
        /* Enhanced Scan View */
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Custom Network Scan</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target IP Range or Subnet *
                </label>
                <Input
                  placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
                  value={scanConfig.target}
                  onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter IP ranges, subnets, or individual IP addresses to scan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Scan Type
                </label>
                <select
                  value={scanConfig.scanType}
                  onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quick">Quick Scan (Enhanced ping + port detection)</option>
                  <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
                  <option value="deep">Deep Scan (Full Service Enumeration)</option>
                  <option value="snmp">SNMP Discovery</option>
                  <option value="arp">ARP Discovery</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Scan Name
                </label>
                <Input
                  placeholder="Optional: Give this scan a name"
                  value={scanConfig.name}
                  onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Optional: Describe this scan"
                  value={scanConfig.description}
                  onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartScan}
                  disabled={!scanConfig.target.trim() || activeScanTask}
                  className="flex-1"
                >
                  {activeScanTask ? 'Scan in Progress...' : 'Start Network Scan'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('devices')}
                >
                  View Devices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* LAN Discovery View */
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Quick LAN Discovery</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🌐</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Automatic Network Discovery
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Automatically discover devices on your local network and adjacent subnets. 
                      This feature intelligently detects your network topology and scans for live devices.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Discovery Depth
                </label>
                <select
                  value={lanConfig.maxDepth}
                  onChange={(e) => setLanConfig({ ...lanConfig, maxDepth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Level 1: Local subnet only (fastest)</option>
                  <option value={2}>Level 2: Local + adjacent subnets (recommended)</option>
                  <option value={3}>Level 3: Extended network scan (slower)</option>
                  <option value={4}>Level 4: Deep network scan (slowest)</option>
                  <option value={5}>Level 5: Maximum depth (very slow)</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Higher levels scan more network segments but take longer to complete
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Discovery Name
                </label>
                <Input
                  placeholder="Optional: Give this discovery a name"
                  value={lanConfig.name}
                  onChange={(e) => setLanConfig({ ...lanConfig, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Optional: Describe this discovery"
                  value={lanConfig.description}
                  onChange={(e) => setLanConfig({ ...lanConfig, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleLanDiscovery}
                  disabled={isLanDiscoveryRunning}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLanDiscoveryRunning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Discovering...</span>
                    </div>
                  ) : (
                    'Start LAN Discovery'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('devices')}
                >
                  View Devices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Device Details Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title="Device Details"
        size="lg"
      >
        {selectedDevice && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-4xl">{getDeviceTypeIcon(selectedDevice)}</div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDevice.hostname || selectedDevice.primary_ip || 'Unknown Device'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedDevice.primary_ip}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hostname
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedDevice.hostname || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  IP Address
                </label>
                <p className="text-slate-900 dark:text-slate-100 font-mono">
                  {selectedDevice.primary_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  MAC Address
                </label>
                <p className="text-slate-900 dark:text-slate-100 font-mono">
                  {selectedDevice.mac_address || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operating System
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedDevice.os_name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedDevice.manufacturer || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Type
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedDevice.model || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <Badge className={getStatusColor(selectedDevice)}>
                  {getStatusText(selectedDevice)}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Seen
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {formatLastSeen(selectedDevice.last_seen)}
                </p>
              </div>
            </div>

            {selectedDevice.description && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <p className="text-slate-900 dark:text-slate-100">
                  {selectedDevice.description}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {!selectedDevice.is_managed && (
                <Button
                  onClick={() => {
                    handleConvertToAsset(selectedDevice);
                    setShowDeviceModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Convert to Managed Asset
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDeviceModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedDiscoveryInterface;

