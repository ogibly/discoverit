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
    let filtered = discoveredDevices.filter(device => {
      const matchesSearch = !searchTerm || 
        device.primary_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Sort devices
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
          aValue = new Date(a.last_seen || 0);
          bValue = new Date(b.last_seen || 0);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [discoveredDevices, searchTerm, sortBy, sortOrder]);

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
        created_by: user?.username || 'user'
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
    if (activeScanTask) {
      try {
        await cancelScanTask(activeScanTask.id);
      } catch (error) {
        console.error('Failed to cancel scan:', error);
        alert('Failed to cancel scan: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleConvertToAsset = async (device) => {
    try {
      await convertDeviceToAsset(device.id);
      alert('Device converted to managed asset successfully!');
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
      alert('Failed to convert device to asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      selectAllDevices([]);
    } else {
      selectAllDevices(filteredDevices.map(d => d.id));
    }
  };

  const getDeviceIcon = (device) => {
    if (device.os_name?.toLowerCase().includes('windows')) return '🖥️';
    if (device.os_name?.toLowerCase().includes('linux')) return '🐧';
    if (device.os_name?.toLowerCase().includes('mac')) return '🍎';
    if (device.manufacturer?.toLowerCase().includes('cisco')) return '🌐';
    if (device.manufacturer?.toLowerCase().includes('hp')) return '🖨️';
    return '📱';
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              Network Discovery
              <HelpIcon 
                content="Use this interface to discover network devices and convert them to managed assets. Start with a scan, then review and organize your findings."
                className="ml-2"
                size="sm"
              />
            </h1>
            <p className="text-body text-muted-foreground mt-1">
              Discover and manage network devices and assets
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{discoveredDevices.length}</div>
              <div className="text-caption text-muted-foreground">Discovered Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{assets.length}</div>
              <div className="text-caption text-muted-foreground">Managed Assets</div>
            </div>
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'devices' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('devices')}
                className="text-xs font-medium transition-all duration-200 h-8 px-3"
              >
                📱 Devices
              </Button>
              <Button
                variant={viewMode === 'scan' ? 'default' : 'ghost'}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {viewMode === 'devices' ? (
            /* Devices View */
            <div className="space-y-4">
              {/* Controls */}
              <Card className="surface-elevated">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search devices by IP, hostname, MAC, or OS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="last_seen">Last Seen</option>
                        <option value="ip">IP Address</option>
                        <option value="hostname">Hostname</option>
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

              {/* Device List */}
              {filteredDevices.length === 0 ? (
                <Card className="surface-elevated">
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="text-subheading text-foreground mb-2">No devices found</h3>
                    <p className="text-body text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Start a network scan to discover devices.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDevices.map((device) => (
                    <Card key={device.id} className="surface-interactive">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getDeviceIcon(device)}</span>
                            <div>
                              <h4 className="font-medium text-foreground">
                                {device.hostname || device.primary_ip}
                              </h4>
                              <p className="text-sm text-muted-foreground font-mono">
                                {device.primary_ip}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {device.os_name || 'Unknown OS'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {device.mac_address && (
                            <div className="flex justify-between">
                              <span>MAC:</span>
                              <span className="font-mono">{device.mac_address}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Last Seen:</span>
                            <span>{new Date(device.last_seen).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDevice(device);
                              setShowDeviceModal(true);
                            }}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConvertToAsset(device)}
                            className="flex-1"
                          >
                            Convert to Asset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Scan View */
            <Card className="surface-elevated">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-subheading text-foreground mb-4">Start Network Scan</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Target IP Range or Subnet *
                        </label>
                        <Input
                          placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
                          value={scanConfig.target}
                          onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Scan Type
                        </label>
                        <select
                          value={scanConfig.scanType}
                          onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                          <option value="quick">Quick Scan (Ping + Port Scan)</option>
                          <option value="comprehensive">Comprehensive (OS Detection)</option>
                          <option value="deep">Deep Scan (Full Enumeration)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Scan Name (Optional)
                        </label>
                        <Input
                          placeholder="Optional: Give this scan a name"
                          value={scanConfig.name}
                          onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          placeholder="Optional: Describe this scan"
                          value={scanConfig.description}
                          onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleStartScan}
                        disabled={!scanConfig.target.trim()}
                        className="w-full"
                      >
                        Start Scan
                      </Button>
                    </div>
                  </div>

                  {/* Active Scan Status */}
                  {activeScanTask && (
                    <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-body font-semibold text-info">Active Scan</h4>
                        <Badge className="bg-info text-info-foreground">
                          {activeScanTask.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-info/80 mb-2">
                        {activeScanTask.name} • Target: {activeScanTask.target}
                      </p>
                      {activeScanTask.progress > 0 && (
                        <div className="mb-3">
                          <Progress value={activeScanTask.progress} className="h-2" />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancelScan}
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Hostname
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.hostname || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  IP Address
                </label>
                <p className="text-sm text-foreground font-mono">
                  {selectedDevice.primary_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  MAC Address
                </label>
                <p className="text-sm text-foreground font-mono">
                  {selectedDevice.mac_address || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Operating System
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.os_name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Manufacturer
                </label>
                <p className="text-sm text-foreground">
                  {selectedDevice.manufacturer || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Last Seen
                </label>
                <p className="text-sm text-foreground">
                  {new Date(selectedDevice.last_seen).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowDeviceModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleConvertToAsset(selectedDevice);
                  setShowDeviceModal(false);
                }}
              >
                Convert to Asset
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiscoveryInterface;