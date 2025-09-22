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
import DiscoveryView from './discovery/DiscoveryView';
import DevicesView from './discovery/DevicesView';
import DeviceDetailsModal from './discovery/DeviceDetailsModal';

const DiscoveryDashboard = () => {
  const {
    assets,
    activeScanTask,
    fetchAssets,
    createScanTask,
    cancelScanTask,
    updateAsset,
    selectedAssets,
    toggleAssetSelection,
    selectAllAssets,
    deleteDevice,
    bulkDeleteDevices
  } = useApp();
  
  const { user } = useAuth();
  
  // State management
  const [activeSection, setActiveSection] = useState('discovery'); // 'discovery', 'devices'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  
  // Scan configuration
  const [scanConfig, setScanConfig] = useState({
    target: '',
    scanType: 'quick',
    name: '',
    description: ''
  });

  // LAN Discovery configuration
  const [lanConfig, setLanConfig] = useState({
    subnet: '',
    name: 'LAN Discovery'
  });

  // LAN Discovery state
  const [isLanDiscoveryRunning, setIsLanDiscoveryRunning] = useState(false);
  const [lanDiscoveryResults, setLanDiscoveryResults] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Combine assets and discovered devices for unified view
  const allDevices = [...assets];
  
  // Filter and search devices
  const filteredDevices = allDevices.filter(device => {
    if (!device) return false;
    
    if (filterType === 'devices') {
      return !device.is_managed;
    } else if (filterType === 'assets') {
      return device.is_managed;
    }
    
    if (searchTerm) {
      return (
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.primary_ip?.includes(searchTerm) ||
        device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device?.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });

  // Sort devices
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'ip_address':
        aValue = a.primary_ip || '';
        bValue = b.primary_ip || '';
        break;
      case 'hostname':
        aValue = a.hostname || '';
        bValue = b.hostname || '';
        break;
      case 'device_type':
        aValue = a?.model || '';
        bValue = b?.model || '';
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

  const handleStartScan = async (config) => {
    try {
      await createScanTask({
        target: config.target,
        scan_type: config.scanType,
        name: config.name || `Scan ${config.target}`,
        description: config.description || `Network scan of ${config.target}`
      });
    } catch (error) {
      console.error('Failed to start scan:', error);
    }
  };

  const handleCancelScan = async () => {
    if (activeScanTask) {
      try {
        await cancelScanTask(activeScanTask.id);
      } catch (error) {
        console.error('Failed to cancel scan:', error);
      }
    }
  };

  const handleStartLanDiscovery = async (config) => {
    setIsLanDiscoveryRunning(true);
    // Simulate LAN discovery - in real implementation, this would call the backend
    setTimeout(() => {
      setIsLanDiscoveryRunning(false);
      // Mock results for demonstration
      const mockResults = [
        {
          id: Date.now() + 1,
          ip_address: '192.168.1.100',
          hostname: 'router.local',
          mac_address: '00:11:22:33:44:55',
          device_type: 'router',
          status: 'online',
          last_seen: new Date().toISOString()
        },
        {
          id: Date.now() + 2,
          ip_address: '192.168.1.101',
          hostname: 'server.local',
          mac_address: '00:11:22:33:44:56',
          device_type: 'server',
          status: 'online',
          last_seen: new Date().toISOString()
        }
      ];
      setLanDiscoveryResults(mockResults);
    }, 3000);
  };

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const handleConvertToAsset = async (device) => {
    try {
      await updateAsset(device.id, {
        ...device,
        is_managed: true
      });
      setShowDeviceModal(false);
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    try {
      await deleteDevice(deviceId);
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const handleBulkDeleteDevices = async (deviceIds) => {
    try {
      await bulkDeleteDevices(deviceIds);
      setSelectedDevices([]);
    } catch (error) {
      console.error('Failed to delete devices:', error);
    }
  };

  const handleToggleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSelectAllDevices = (deviceIds) => {
    setSelectedDevices(deviceIds);
  };

  const getStatusColor = (device) => {
    if (!device) return 'badge-error';
    if (device.is_managed) return 'badge-success';
    return device.status === 'online' ? 'badge-success' : 'badge-error';
  };

  const getStatusText = (device) => {
    if (!device) return 'Unknown';
    return device.is_managed ? 'Managed Asset' : 'Discovered Device';
  };

  const getDeviceTypeIcon = (device) => {
    const deviceType = device?.model?.toLowerCase() || '';
    if (deviceType.includes('server') || deviceType.includes('web')) return '🖥️';
    if (deviceType.includes('router') || deviceType.includes('switch')) return '🌐';
    if (deviceType.includes('printer')) return '🖨️';
    if (deviceType.includes('phone') || deviceType.includes('mobile')) return '📱';
    if (deviceType.includes('camera') || deviceType.includes('security')) return '📹';
    return '💻';
  };

  const getDeviceTypeColor = (device) => {
    const deviceType = device?.model?.toLowerCase() || '';
    if (deviceType.includes('server') || deviceType.includes('web')) return 'bg-primary text-primary-foreground';
    if (deviceType.includes('router') || deviceType.includes('switch')) return 'bg-info text-info-foreground';
    if (deviceType.includes('printer')) return 'bg-muted text-muted-foreground';
    if (deviceType.includes('phone') || deviceType.includes('mobile')) return 'bg-success text-success-foreground';
    if (deviceType.includes('camera') || deviceType.includes('security')) return 'bg-error text-error-foreground';
    return 'bg-muted text-muted-foreground';
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
    if (responseTime < 50) return 'text-success';
    if (responseTime < 100) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Network Discovery</h1>
              <p className="text-body text-muted-foreground mt-1">
                Discover and manage network devices
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('discovery')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                  activeSection === 'discovery'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                🔍 Discovery
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('devices')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                  activeSection === 'devices'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                📱 Devices
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'discovery' && (
          <DiscoveryView
            assets={assets}
            activeScanTask={activeScanTask}
            lanDiscoveryResults={lanDiscoveryResults}
            onStartScan={handleStartScan}
            onCancelScan={handleCancelScan}
            onStartLanDiscovery={handleStartLanDiscovery}
            onCancelLanDiscovery={() => setIsLanDiscoveryRunning(false)}
            isLanDiscoveryRunning={isLanDiscoveryRunning}
            scanConfig={scanConfig}
            setScanConfig={setScanConfig}
            lanConfig={lanConfig}
            setLanConfig={setLanConfig}
            onSetLanDiscoveryResults={setLanDiscoveryResults}
          />
        )}
        {activeSection === 'devices' && (
          <DevicesView
            devices={sortedDevices}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onViewDevice={handleViewDevice}
            onConvertToAsset={handleConvertToAsset}
            onDeleteDevice={handleDeleteDevice}
            onBulkDeleteDevices={handleBulkDeleteDevices}
            selectedDevices={selectedDevices}
            onToggleDeviceSelection={handleToggleDeviceSelection}
            onSelectAllDevices={handleSelectAllDevices}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getDeviceTypeIcon={getDeviceTypeIcon}
            getDeviceTypeColor={getDeviceTypeColor}
            formatLastSeen={formatLastSeen}
            getResponseTimeColor={getResponseTimeColor}
          />
        )}
      </div>

      {/* Enhanced Device Details Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title="Device Details"
      >
        {selectedDevice && (
          <DeviceDetailsModal
            device={selectedDevice}
            onConvertToAsset={handleConvertToAsset}
            onClose={() => setShowDeviceModal(false)}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getDeviceTypeIcon={getDeviceTypeIcon}
            getDeviceTypeColor={getDeviceTypeColor}
            formatLastSeen={formatLastSeen}
            getResponseTimeColor={getResponseTimeColor}
          />
        )}
      </Modal>
    </div>
  );
};

export default DiscoveryDashboard;