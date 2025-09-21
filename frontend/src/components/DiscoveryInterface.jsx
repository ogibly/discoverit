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

const DiscoveryInterface = () => {
  const {
    discoveredDevices,
    assets,
    activeScanTask,
    fetchDiscoveredDevices,
    fetchAssets,
    createScanTask,
    cancelScanTask,
    convertDeviceToAsset,
    selectedDevices,
    toggleDeviceSelection,
    selectAllDevices
  } = useApp();
  
  const { user } = useAuth();
  
  // State management
  const [viewMode, setViewMode] = useState('devices'); // 'devices' or 'scan'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'devices', 'assets'
  const [sortBy, setSortBy] = useState('last_seen'); // 'last_seen', 'ip', 'hostname'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  
  // Scan configuration
  const [scanConfig, setScanConfig] = useState({
    target: '',
    scanType: 'comprehensive',
    name: '',
    description: ''
  });

  // Load data on component mount
  useEffect(() => {
    fetchDiscoveredDevices();
    fetchAssets();
  }, [fetchDiscoveredDevices, fetchAssets]);

  // Filter and sort devices
  const filteredDevices = React.useMemo(() => {
    let filtered = discoveredDevices || [];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.primary_ip?.includes(searchTerm) ||
        device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
  }, [discoveredDevices, searchTerm, sortBy, sortOrder]);

  const handleSelectAll = () => {
    const deviceIds = filteredDevices.map(device => device.id);
    selectAllDevices(deviceIds);
  };

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
      setScanConfig({ target: '', scanType: 'comprehensive', name: '', description: '' });
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
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
      // Create asset data from device
      const assetData = {
        name: device.hostname || device.primary_ip,
        primary_ip: device.primary_ip,
        mac_address: device.mac_address,
        hostname: device.hostname,
        os_name: device.os_name,
        os_family: device.os_family,
        os_version: device.os_version,
        manufacturer: device.manufacturer,
        model: device.model,
        is_managed: true
      };
      
      await convertDeviceToAsset(device.id, assetData);
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
    // All discovered devices are unmanaged until converted
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusText = (device) => {
    return 'Discovered Device';
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

  return (
    <div className="h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Sophisticated Header */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/60 border-b border-red-900/50 flex-shrink-0 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-200 via-red-300 to-red-400 bg-clip-text text-transparent flex items-center">
                Network Discovery
                <HelpIcon 
                  content="Use this interface to discover network devices and convert them to managed assets. Start with a scan, then review and organize your findings."
                  className="ml-3"
                  size="sm"
                />
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Discover and manage network devices and assets
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant={viewMode === 'devices' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('devices')}
                className={cn(
                  "text-sm font-medium transition-all duration-200",
                  viewMode === 'devices' 
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-violet-500/50"
                )}
              >
                <span className="mr-2">📱</span>
                Devices
              </Button>
              <Button
                variant={viewMode === 'scan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('scan')}
                className={cn(
                  "text-sm font-medium transition-all duration-200",
                  viewMode === 'scan' 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-blue-500/50"
                )}
              >
                <span className="mr-2">🔍</span>
                Scan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Sophisticated Stats and Guidance */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-800/40 to-gray-700/30 border-b border-red-900/50 flex-shrink-0 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50"></div>
                  <span className="text-gray-300 font-medium">Total Devices:</span>
                  <span className="font-bold text-red-300">{discoveredDevices?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/50"></div>
                  <span className="text-gray-300 font-medium">Active Scans:</span>
                  <span className="font-bold text-orange-300">{activeScanTask ? 1 : 0}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50"></div>
                  <span className="text-gray-300 font-medium">Selected:</span>
                  <span className="font-bold text-blue-300">{selectedDevices.length}</span>
                </div>
              </div>
              <CollapsibleGuidance
                title="Discovery Workflow"
                icon="🔄"
                variant="primary"
                defaultOpen={false}
                compact={true}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>Run scan</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>Review devices</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>Convert to assets</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500 font-bold">4.</span>
                    <span>Organize groups</span>
                  </div>
                </div>
              </CollapsibleGuidance>
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

      {viewMode === 'devices' ? (
        /* Devices View */
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search devices by IP, hostname, MAC, or OS..."
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
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sophisticated Devices Table */}
          <Card className="overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-b border-slate-700/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-700/50"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      MAC Address
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      OS / Vendor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700/50">
                  {filteredDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/20 transition-all duration-200 group">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.id)}
                          onChange={() => toggleDeviceSelection(device.id)}
                          className="rounded border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-700/50"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-violet-500/30">
                            <span className="text-sm">{getDeviceTypeIcon(device)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-100">
                              {device.hostname || 'Unknown Device'}
                            </div>
                            {device.model && (
                              <div className="text-xs text-slate-400 font-medium">
                                {device.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-cyan-300 bg-slate-700/50 px-2 py-1 rounded">
                          {device.primary_ip}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-slate-300">
                          {device.mac_address || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          {device.os_name && (
                            <div className="text-slate-100 font-medium">
                              {device.os_name}
                            </div>
                          )}
                          {device.manufacturer && (
                            <div className="text-xs text-slate-400">
                              {device.manufacturer}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                          {getStatusText(device)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-300">
                          {formatLastSeen(device.last_seen)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDevice(device)}
                            className="text-xs h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-violet-500/50 hover:text-violet-300 transition-all duration-200"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConvertToAsset(device)}
                            className="text-xs h-8 px-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-200"
                          >
                            Convert
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredDevices.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No devices found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by running a network scan to discover devices'
                  }
                </p>
                <Button onClick={() => setViewMode('scan')} size="sm">
                  Start Network Scan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Scan View */
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Network Scan Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  Target IP Range or Subnet *
                  <HelpIcon 
                    content="Enter IP ranges (192.168.1.0/24), ranges (10.0.0.1-10.0.0.100), or individual IPs (192.168.1.1). Use CIDR notation for subnets."
                    className="ml-1"
                    size="xs"
                  />
                </label>
                <Input
                  placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
                  value={scanConfig.target}
                  onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  Scan Type
                  <HelpIcon 
                    content="Quick: Fast ping and port scan. Comprehensive: Includes OS detection and service identification. Deep: Full service enumeration and vulnerability scanning."
                    className="ml-1"
                    size="xs"
                  />
                </label>
                <select
                  value={scanConfig.scanType}
                  onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quick">Quick Scan (Ping + Port Scan)</option>
                  <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
                  <option value="deep">Deep Scan (Full Service Enumeration)</option>
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
      )}

      {/* Device Details Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title="Device Details"
        size="lg"
      >
        {selectedDevice && (
          <div className="space-y-6">
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
                  Model
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
                  className="flex-1"
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

export default DiscoveryInterface;

