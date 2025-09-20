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
    if (device.is_managed) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
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
    if (deviceType.includes('server') || deviceType.includes('web')) return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800';
    if (deviceType.includes('router') || deviceType.includes('switch')) return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800';
    if (deviceType.includes('printer')) return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800';
    if (deviceType.includes('phone') || deviceType.includes('mobile')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    if (deviceType.includes('camera') || deviceType.includes('security')) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800';
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800';
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
    if (!responseTime) return 'text-slate-500 dark:text-slate-400';
    if (responseTime < 0.1) return 'text-emerald-600 dark:text-emerald-400';
    if (responseTime < 0.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-y-auto">
      {/* Professional Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Network Discovery
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs font-medium">
                Professional network device discovery and management platform
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <Button
                variant="ghost"
                onClick={() => setViewMode('overview')}
                className={cn(
                  "px-4 py-2 font-medium transition-all duration-200 rounded-md",
                  viewMode === 'overview' 
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                )}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('devices')}
                className={cn(
                  "px-4 py-2 font-medium transition-all duration-200 rounded-md",
                  viewMode === 'devices' 
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                )}
              >
                Discovered Devices
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('scan')}
                className={cn(
                  "px-4 py-2 font-medium transition-all duration-200 rounded-md",
                  viewMode === 'scan' 
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                )}
              >
                Custom Scan
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('lan-discovery')}
                className={cn(
                  "px-4 py-2 font-medium transition-all duration-200 rounded-md",
                  viewMode === 'lan-discovery' 
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                )}
              >
                Network Discovery
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-4 pb-20 min-h-[calc(100vh-140px)]">
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
        size="lg"
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
