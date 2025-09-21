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
    return 'bg-info text-info-foreground';
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

  const getDeviceTypeIcon = (device) => {
    if (device.os_name?.toLowerCase().includes('windows')) return '🖥️';
    if (device.os_name?.toLowerCase().includes('linux')) return '🐧';
    if (device.os_name?.toLowerCase().includes('mac')) return '🍎';
    if (device.manufacturer?.toLowerCase().includes('cisco')) return '🌐';
    if (device.manufacturer?.toLowerCase().includes('hp')) return '🖨️';
    return '📱';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Compact Header */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-heading font-semibold text-foreground flex items-center">
                Network Discovery
                <HelpIcon 
                  content="Use this interface to discover network devices and convert them to managed assets. Start with a scan, then review and organize your findings."
                  className="ml-2"
                  size="sm"
                />
              </h1>
              <p className="text-caption text-muted-foreground mt-1">
                Discover and manage network devices and assets
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'devices' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('devices')}
                className="text-xs font-medium transition-all duration-200 h-8 px-3"
              >
                📱 Devices
              </Button>
              <Button
                variant={viewMode === 'scan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('scan')}
                className="text-xs font-medium transition-all duration-200 h-8 px-3"
              >
                🔍 Scan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-info"></div>
              <span className="text-muted-foreground">Devices:</span>
              <span className="font-semibold text-info">{discoveredDevices?.length || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-muted-foreground">Scans:</span>
              <span className="font-semibold text-success">{activeScanTask ? 1 : 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Selected:</span>
              <span className="font-semibold text-primary">{selectedDevices.length}</span>
            </div>
          </div>
          <CollapsibleGuidance
            title="Workflow"
            icon="🔄"
            variant="primary"
            defaultOpen={false}
            compact={true}
          >
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-primary font-bold">1. Run scan</span>
              <span className="text-primary font-bold">2. Review devices</span>
              <span className="text-primary font-bold">3. Convert to assets</span>
              <span className="text-primary font-bold">4. Organize groups</span>
            </div>
          </CollapsibleGuidance>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'devices' ? (
              /* Devices View */
              <div className="space-y-4">
                {/* Compact Controls */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search devices by IP, hostname, MAC, or OS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-2 py-1 border border-input bg-background text-foreground rounded text-xs h-8 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="all">All Types</option>
                        <option value="devices">Discovered Devices</option>
                        <option value="assets">Managed Assets</option>
                      </select>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2 py-1 border border-input bg-background text-foreground rounded text-xs h-8 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="last_seen">Last Seen</option>
                        <option value="ip">IP Address</option>
                        <option value="hostname">Hostname</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-8 px-2 text-xs"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Compact Devices Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-input text-primary focus:ring-ring bg-background"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Device
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            MAC Address
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            OS / Vendor
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Last Seen
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card/50 divide-y divide-border">
                        {filteredDevices.map((device) => (
                          <tr key={device.id} className="hover:bg-muted/30 transition-all duration-200 group">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedDevices.includes(device.id)}
                                onChange={() => toggleDeviceSelection(device.id)}
                                className="rounded border-input text-primary focus:ring-ring bg-background"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
                                  <span className="text-xs">{getDeviceTypeIcon(device)}</span>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-foreground">
                                    {device.hostname || 'Unknown Device'}
                                  </div>
                                  {device.model && (
                                    <div className="text-xs text-muted-foreground">
                                      {device.model}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-mono text-accent bg-muted/50 px-2 py-1 rounded">
                                {device.primary_ip}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-mono text-muted-foreground">
                                {device.mac_address || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-xs">
                                {device.os_name && (
                                  <div className="text-foreground font-medium">
                                    {device.os_name}
                                  </div>
                                )}
                                {device.manufacturer && (
                                  <div className="text-muted-foreground">
                                    {device.manufacturer}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge className="bg-info text-info-foreground text-xs font-medium">
                                {getStatusText(device)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs text-muted-foreground">
                                {formatLastSeen(device.last_seen)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDevice(device)}
                                  className="text-xs h-6 px-2"
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleConvertToAsset(device)}
                                  className="text-xs h-6 px-2"
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
                </div>

                {filteredDevices.length === 0 && (
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      No devices found
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Start by running a network scan to discover devices'
                      }
                    </p>
                    <Button onClick={() => setViewMode('scan')} size="sm" className="h-8 px-3 text-xs">
                      Start Network Scan
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Scan View */
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1 flex items-center">
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
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1 flex items-center">
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
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded text-sm h-8 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="quick">Quick Scan (Ping + Port Scan)</option>
                      <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
                      <option value="deep">Deep Scan (Full Service Enumeration)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Scan Name
                    </label>
                    <Input
                      placeholder="Optional: Give this scan a name"
                      value={scanConfig.name}
                      onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Optional: Describe this scan"
                      value={scanConfig.description}
                      onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartScan}
                      disabled={!scanConfig.target.trim() || activeScanTask}
                      className="flex-1 h-8 text-sm"
                    >
                      {activeScanTask ? 'Scan in Progress...' : 'Start Network Scan'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('devices')}
                      className="h-8 px-3 text-sm"
                    >
                      View Devices
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Scan Status */}
            {activeScanTask && (
              <div className="bg-info/10 border border-info/20 rounded-lg p-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl animate-spin">🔄</div>
                    <div>
                      <h3 className="text-sm font-semibold text-info">
                        {activeScanTask.name}
                      </h3>
                      <p className="text-xs text-info/80">
                        Target: {activeScanTask.target} • Status: {activeScanTask.status}
                      </p>
                      <p className="text-xs text-info/60">
                        Started: {new Date(activeScanTask.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelScan}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel Scan
                  </Button>
                </div>
                {activeScanTask.progress > 0 && (
                  <div className="mt-3">
                    <Progress value={activeScanTask.progress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title="Device Details"
        size="lg"
      >
        {selectedDevice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hostname
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.hostname || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  IP Address
                </label>
                <p className="text-sm text-foreground font-mono">
                  {selectedDevice.primary_ip}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  MAC Address
                </label>
                <p className="text-sm text-foreground font-mono">
                  {selectedDevice.mac_address || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Operating System
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.os_name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Manufacturer
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.manufacturer || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Model
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.model || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Status
                </label>
                <Badge className={getStatusColor(selectedDevice)}>
                  {getStatusText(selectedDevice)}
                </Badge>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Last Seen
                </label>
                <p className="text-sm text-foreground">
                  {formatLastSeen(selectedDevice.last_seen)}
                </p>
              </div>
            </div>

            {selectedDevice.description && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.description}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-border">
              {!selectedDevice.is_managed && (
                <Button
                  onClick={() => {
                    handleConvertToAsset(selectedDevice);
                    setShowDeviceModal(false);
                  }}
                  className="flex-1 h-8 text-sm"
                >
                  Convert to Managed Asset
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDeviceModal(false)}
                className="flex-1 h-8 text-sm"
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