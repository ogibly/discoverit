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
import OverviewView from './discovery/OverviewView';
import DevicesView from './discovery/DevicesView';
import ScanView from './discovery/ScanView';
import LanDiscoveryView from './discovery/LanDiscoveryView';
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
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'devices', 'scan', 'lan-discovery'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
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
    
    if (filterType === 'devices') {
      filtered = filtered.filter(device => !device.is_managed);
    } else if (filterType === 'assets') {
      filtered = filtered.filter(device => device.is_managed);
    }
    
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

  const handleDeleteDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      await deleteDevice(deviceId);
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDeleteDevices = async () => {
    if (selectedDevices.length === 0) {
      alert('Please select devices to delete');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedDevices.length} selected device(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      await bulkDeleteDevices(selectedDevices);
      setSelectedDevices([]);
    } catch (error) {
      console.error('Failed to delete devices:', error);
      alert('Failed to delete devices: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusColor = (device) => {
    if (device.is_managed) return 'bg-success text-success-foreground';
    return 'bg-info text-info-foreground';
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
    if (!responseTime) return 'text-muted-foreground';
    if (responseTime < 0.1) return 'text-success';
    if (responseTime < 0.5) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Sophisticated Header */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading text-foreground">
                Network Discovery
              </h1>
              <p className="text-caption text-muted-foreground mt-1">
                Professional network device discovery and management platform
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('overview')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm",
                  viewMode === 'overview' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('devices')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm",
                  viewMode === 'devices' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Devices
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('scan')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm",
                  viewMode === 'scan' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Custom Scan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('lan-discovery')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm",
                  viewMode === 'lan-discovery' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                LAN Discovery
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'overview' && (
          <OverviewView 
            assets={assets}
            activeScanTask={activeScanTask}
            lanDiscoveryResults={lanDiscoveryResults}
            onStartScan={() => setViewMode('scan')}
            onStartLanDiscovery={() => setViewMode('lan-discovery')}
            onViewDevices={() => setViewMode('devices')}
          />
        )}

        {viewMode === 'devices' && (
          <DevicesView
            devices={filteredDevices}
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

        {viewMode === 'scan' && (
          <ScanView
            scanConfig={scanConfig}
            setScanConfig={setScanConfig}
            activeScanTask={activeScanTask}
            onStartScan={handleStartScan}
            onCancelScan={handleCancelScan}
          />
        )}

        {viewMode === 'lan-discovery' && (
          <LanDiscoveryView
            lanConfig={lanConfig}
            setLanConfig={setLanConfig}
            isLanDiscoveryRunning={isLanDiscoveryRunning}
            lanDiscoveryResults={lanDiscoveryResults}
            onStartLanDiscovery={handleLanDiscovery}
            onSetLanDiscoveryResults={setLanDiscoveryResults}
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