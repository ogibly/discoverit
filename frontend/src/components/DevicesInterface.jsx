import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';
import { formatTimestamp as formatTimestampUtil } from '../utils/formatters';
import { formatScanProgress, getCappedProgress } from '../utils/formatters';
import PageHeader from './PageHeader';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  Eye, 
  ArrowRight, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Network,
  Server,
  Smartphone,
  Monitor,
  Router,
  Printer,
  Shield,
  Zap,
  Info,
  MoreHorizontal,
  Download,
  Trash2,
  Plus
} from 'lucide-react';

const DevicesInterface = () => {
  const {
    discoveredDevices,
    assets,
    activeScanTask,
    fetchDiscoveredDevices,
    fetchAssets,
    convertDeviceToAsset,
    selectedDevices,
    toggleDeviceSelection,
    selectAllDevices
  } = useApp();
  
  const { user } = useAuth();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchDiscoveredDevices();
    fetchAssets();
  }, [fetchDiscoveredDevices, fetchAssets]);

  // Helper functions - defined before useMemo to avoid initialization errors
  const determineDeviceType = (osName, manufacturer, ports) => {
    if (manufacturer?.toLowerCase().includes('cisco')) return 'Router';
    if (manufacturer?.toLowerCase().includes('hp') && ports.some(p => p.port === 9100)) return 'Printer';
    if (osName?.toLowerCase().includes('windows')) return 'Workstation';
    if (osName?.toLowerCase().includes('linux')) return 'Server';
    if (osName?.toLowerCase().includes('mac')) return 'Workstation';
    if (ports.some(p => p.port === 22 || p.port === 80 || p.port === 443)) return 'Server';
    if (ports.some(p => p.port === 3389)) return 'Workstation';
    return 'Network Device';
  };

  const getDeviceIcon = (deviceType, osName, manufacturer) => {
    if (deviceType === 'Router') return <Router className="w-5 h-5" />;
    if (deviceType === 'Printer') return <Printer className="w-5 h-5" />;
    if (deviceType === 'Server') return <Server className="w-5 h-5" />;
    if (deviceType === 'Workstation') return <Monitor className="w-5 h-5" />;
    if (osName?.toLowerCase().includes('android') || osName?.toLowerCase().includes('ios')) return <Smartphone className="w-5 h-5" />;
    return <Network className="w-5 h-5" />;
  };

  const calculateConfidence = (hostname, osName, manufacturer, macAddress, ports) => {
    let score = 0;
    if (hostname) score += 0.3;
    if (osName) score += 0.3;
    if (manufacturer) score += 0.2;
    if (macAddress) score += 0.1;
    if (ports && ports.length > 0) score += 0.1;
    return Math.min(score, 1);
  };

  // Enhanced device data processing
  const processedDevices = useMemo(() => {
    if (!discoveredDevices || !Array.isArray(discoveredDevices)) {
      return [];
    }
    
    return discoveredDevices.map(device => {
      const scanData = device.scan_data || {};
      const osInfo = scanData.os_info || {};
      const deviceInfo = scanData.device_info || {};
      const addresses = scanData.addresses || {};
      const categorization = scanData.categorization || {};
      
      // Extract meaningful data with fallbacks
      const hostname = device.hostname || scanData.hostname || null;
      const ipAddress = device.primary_ip || scanData.ip || scanData.ip_address || 'Unknown';
      const macAddress = device.mac_address || addresses.mac || null;
      const osName = device.os_name || osInfo.os_name || osInfo.os_details || null;
      const manufacturer = device.manufacturer || deviceInfo.manufacturer || scanData.vendor || null;
      const model = device.model || deviceInfo.model || null;
      const lastSeen = device.last_seen || scanData.timestamp || null;
      
      // Determine device type and icon
      const deviceType = determineDeviceType(osName, manufacturer, scanData.ports || []);
      const deviceIcon = getDeviceIcon(deviceType, osName, manufacturer);
      
      // Calculate confidence score
      const confidence = calculateConfidence(hostname, osName, manufacturer, macAddress, scanData.ports);
      
      // Determine status
      const isConverted = assets.some(asset => asset.primary_ip === ipAddress);
      const status = isConverted ? 'converted' : 'new';
      
      return {
        ...device,
        // Enhanced fields
        hostname,
        ipAddress,
        macAddress,
        osName,
        manufacturer,
        model,
        lastSeen,
        deviceType,
        deviceIcon,
        confidence,
        status,
        // Raw data for details
        rawScanData: scanData,
        ports: scanData.ports || [],
        services: scanData.services || [],
        indicators: categorization.indicators || []
      };
    });
  }, [discoveredDevices, assets]);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    if (!processedDevices || !Array.isArray(processedDevices)) {
      return [];
    }
    
    let filtered = processedDevices.filter(device => {
      const matchesSearch = !searchTerm || 
        device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.macAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.osName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceType?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === 'new') {
        matchesFilter = device.status === 'new';
      } else if (filterType === 'converted') {
        matchesFilter = device.status === 'converted';
      } else if (filterType === 'high_confidence') {
        matchesFilter = device.confidence >= 0.7;
      } else if (filterType === 'low_confidence') {
        matchesFilter = device.confidence < 0.7;
      }
      
      return matchesSearch && matchesFilter;
    });

    // Sort devices
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'ip':
          aValue = a.ipAddress || '';
          bValue = b.ipAddress || '';
          break;
        case 'hostname':
          aValue = a.hostname || '';
          bValue = b.hostname || '';
          break;
        case 'os':
          aValue = a.osName || '';
          bValue = b.osName || '';
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'last_seen':
        default:
          aValue = new Date(a.lastSeen || 0);
          bValue = new Date(b.lastSeen || 0);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [processedDevices, searchTerm, filterType, sortBy, sortOrder]);

  // Additional helper functions

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'converted': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!processedDevices || !Array.isArray(processedDevices)) {
      return { total: 0, newDevices: 0, converted: 0, highConfidence: 0, deviceTypes: 0 };
    }
    
    const total = processedDevices.length;
    const newDevices = processedDevices.filter(d => d.status === 'new').length;
    const converted = processedDevices.filter(d => d.status === 'converted').length;
    const highConfidence = processedDevices.filter(d => d.confidence >= 0.7).length;
    const deviceTypes = [...new Set(processedDevices.map(d => d.deviceType))].length;
    
    return { total, newDevices, converted, highConfidence, deviceTypes };
  }, [processedDevices]);

  // Event handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDiscoveredDevices(), fetchAssets()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConvertToAsset = async (device) => {
    try {
      // Ensure we have valid data for asset creation
      const ipAddress = device.ipAddress || device.primary_ip || 'Unknown';
      const hostname = device.hostname || null;
      const deviceName = hostname || `Device ${ipAddress}`;
      
      // Validate required fields
      if (!ipAddress || ipAddress === 'Unknown') {
        throw new Error('Cannot convert device: Invalid IP address');
      }
      
      const assetData = {
        name: deviceName,
        description: `Converted from discovered device (${device.deviceType || 'Unknown Type'})`,
        primary_ip: ipAddress,
        mac_address: device.macAddress || null,
        hostname: hostname,
        os_name: device.osName || null,
        manufacturer: device.manufacturer || null,
        model: device.model || null,
        is_managed: false,
        is_active: true,
        ip_addresses: [ipAddress], // Add to ip_addresses array as required by schema
        labels: [] // Add empty labels array as required by schema
      };
      
      await convertDeviceToAsset(device.id, assetData);
      setShowDeviceModal(false);
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
      alert(`Failed to convert device to asset: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      selectAllDevices([]);
    } else {
      selectAllDevices(filteredDevices.map(d => d.id));
    }
  };

  // Render functions
  const renderDeviceCard = (device) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {device.deviceIcon}
            </div>
              <div>
                <h4 className="font-semibold text-foreground">
                {device.hostname || `Device ${device.ipAddress}`}
                </h4>
                <p className="text-sm text-muted-foreground font-mono">
                {device.ipAddress}
                </p>
              </div>
            </div>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", getStatusColor(device.status))}>
              {getStatusIcon(device.status)}
              <span className="ml-1">{device.status === 'new' ? 'New' : 'Converted'}</span>
            </Badge>
            <Badge className={cn("text-xs", getConfidenceColor(device.confidence))}>
              {Math.round(device.confidence * 100)}% confidence
            </Badge>
          </div>
          </div>
          
        <div className="space-y-2 text-sm">
          {device.deviceType && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground font-medium">{device.deviceType}</span>
            </div>
          )}
          {device.osName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS:</span>
              <span className="text-foreground font-medium">{device.osName}</span>
              </div>
            )}
            {device.manufacturer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturer:</span>
                <span className="text-foreground font-medium">{device.manufacturer}</span>
              </div>
            )}
          {device.ports.length > 0 && (
              <div className="flex justify-between">
              <span className="text-muted-foreground">Open Ports:</span>
              <span className="text-foreground font-medium">{device.ports.length}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Seen:</span>
              <span className="text-foreground text-xs">
              {formatTimestampUtil(device.lastSeen)}
              </span>
            </div>
          </div>

          <div className="flex space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDevice(device);
                setShowDeviceModal(true);
              }}
              className="flex-1"
            >
            <Eye className="w-4 h-4 mr-2" />
              Explore
            </Button>
          {device.status === 'new' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToAsset(device)}
                className="flex-1"
              >
              <ArrowRight className="w-4 h-4 mr-2" />
              Convert
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

  const renderDeviceRow = (device) => (
    <tr className="hover:bg-muted/50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {device.deviceIcon}
          </div>
            <div>
              <div className="font-medium text-foreground">
              {device.hostname || `Device ${device.ipAddress}`}
              </div>
                <div className="text-sm text-muted-foreground">
              {device.deviceType}
                </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
        <span className="font-mono text-sm text-foreground">{device.ipAddress}</span>
        </td>
        <td className="px-6 py-4">
        <span className="text-sm text-foreground">{device.osName || 'Unknown'}</span>
        </td>
        <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Badge className={cn("text-xs", getStatusColor(device.status))}>
            {getStatusIcon(device.status)}
            <span className="ml-1">{device.status === 'new' ? 'New' : 'Converted'}</span>
          </Badge>
          <Badge className={cn("text-xs", getConfidenceColor(device.confidence))}>
            {Math.round(device.confidence * 100)}%
          </Badge>
        </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
          {formatTimestampUtil(device.lastSeen)}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDevice(device);
                setShowDeviceModal(true);
              }}
            >
            <Eye className="w-4 h-4" />
            </Button>
          {device.status === 'new' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToAsset(device)}
              >
              <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </td>
    </tr>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={
          <span className="flex items-center">
            Network Devices
            <Info className="ml-2 w-4 h-4 text-muted-foreground" />
          </span>
        }
        subtitle="Discover, explore, and manage network devices"
        metrics={[
          { value: statistics.total, label: "Total Devices", color: "primary" },
          { value: statistics.newDevices, label: "New Devices", color: "blue" },
          { value: statistics.converted, label: "Converted", color: "green" },
          { value: statistics.deviceTypes, label: "Device Types", color: "purple" }
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Active Scan Status */}
          {activeScanTask && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Active Discovery</h4>
                      <p className="text-xs text-blue-700">
                          {activeScanTask.name} • {activeScanTask.target} • {formatScanProgress(activeScanTask.progress)} complete
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {activeScanTask.status || 'running'}
                  </Badge>
                </div>
                  {activeScanTask.progress > 0 && (
                    <div className="mt-3">
                      <Progress value={getCappedProgress(activeScanTask.progress)} className="h-2" />
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Enhanced Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search devices by IP, hostname, OS, manufacturer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">All Devices</option>
                    <option value="new">New Devices</option>
                    <option value="converted">Converted</option>
                    <option value="high_confidence">High Confidence</option>
                    <option value="low_confidence">Low Confidence</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="last_seen">Last Seen</option>
                    <option value="ip">IP Address</option>
                    <option value="hostname">Hostname</option>
                    <option value="os">Operating System</option>
                    <option value="confidence">Confidence</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  </Button>
                  
                  <div className="flex items-center space-x-1 border border-border rounded-md">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {filteredDevices.length} of {processedDevices.length} devices
                </span>
                <div className="flex items-center space-x-4">
                  <span>High Confidence: {statistics.highConfidence}</span>
                  <span>Device Types: {statistics.deviceTypes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device List */}
          {filteredDevices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No devices found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Start a network discovery scan to find devices.'}
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Discovery Scan
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <div key={device.id}>
                  {renderDeviceCard(device)}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          OS
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Last Seen
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map((device) => (
                        <div key={device.id}>
                          {renderDeviceRow(device)}
                        </div>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Device Details Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title="Device Details"
        size="xl"
      >
        {selectedDevice && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                      Device Name
                    </label>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                      {selectedDevice.hostname || `Device ${selectedDevice.ipAddress}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Device Type
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                      {selectedDevice.deviceType}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  IP Address
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md font-mono">
                      {selectedDevice.ipAddress}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  MAC Address
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md font-mono">
                      {selectedDevice.macAddress || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Operating System
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                      {selectedDevice.osName || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Manufacturer
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {selectedDevice.manufacturer || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                      Confidence Score
                </label>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedDevice.confidence * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(selectedDevice.confidence * 100)}%
                      </span>
              </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                    <Badge className={cn("text-xs", getStatusColor(selectedDevice.status))}>
                      {getStatusIcon(selectedDevice.status)}
                      <span className="ml-1">{selectedDevice.status === 'new' ? 'New Device' : 'Converted to Asset'}</span>
                  </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Network Information</h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address:</span>
                        <span className="font-mono">{selectedDevice.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MAC Address:</span>
                        <span className="font-mono">{selectedDevice.macAddress || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen:</span>
                        <span>{formatTimestampUtil(selectedDevice.lastSeen)}</span>
                      </div>
                </div>
              </div>
            </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Open Ports & Services ({selectedDevice.ports.length})
                  </h4>
                  {selectedDevice.ports.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDevice.ports.map((port, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{port.port}/{port.protocol}</Badge>
                            <span className="font-medium">{port.service}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{port.state}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No open ports detected</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="raw" className="space-y-4">
              <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Raw Scan Data</h4>
                  <pre className="text-xs text-foreground bg-muted p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(selectedDevice.rawScanData, null, 2)}
                </pre>
              </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowDeviceModal(false)}
              >
                Close
              </Button>
              {selectedDevice.status === 'new' && (
                <Button
                  onClick={() => handleConvertToAsset(selectedDevice)}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert to Asset
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DevicesInterface;