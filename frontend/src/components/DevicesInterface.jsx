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
    selectAllDevices,
    selectedDevices
  } = useApp();

  const { user } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
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
        indicators: categorization.indicators || [],
        // Scan information
        scanTaskId: device.scan_task_id,
        scanTaskName: device.scan_task_name,
        scanType: device.scan_type
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
        device.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.scanTaskId?.toString().includes(searchTerm) ||
        device.scanTaskName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' ||
        (filterType === 'new' && device.status === 'new') ||
        (filterType === 'converted' && device.status === 'converted') ||
        (filterType === 'high_confidence' && device.confidence >= 0.7) ||
        (filterType === 'low_confidence' && device.confidence < 0.7);
      
      return matchesSearch && matchesFilter;
    });
    
    // Sort devices
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'hostname':
          aValue = a.hostname || a.ipAddress || '';
          bValue = b.hostname || b.ipAddress || '';
          break;
        case 'ipAddress':
          aValue = a.ipAddress || '';
          bValue = b.ipAddress || '';
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'lastSeen':
          aValue = new Date(a.lastSeen || 0);
          bValue = new Date(b.lastSeen || 0);
          break;
        default:
          aValue = a.ipAddress || '';
          bValue = b.ipAddress || '';
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [processedDevices, searchTerm, filterType, sortBy, sortOrder]);

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

  // Render functions
  const renderDeviceCard = (device) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50 h-full">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Header with device info and badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                {device.deviceIcon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-foreground truncate">
                  {device.hostname || `Device ${device.ipAddress}`}
                </h4>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {device.ipAddress}
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-1 flex-shrink-0">
              <Badge className={cn("text-xs", getStatusColor(device.status))}>
                {getStatusIcon(device.status)}
                <span className="ml-1">{device.status === 'new' ? 'New' : 'Converted'}</span>
              </Badge>
              <Badge className={cn("text-xs", getConfidenceColor(device.confidence))}>
                {Math.round(device.confidence * 100)}%
              </Badge>
            </div>
          </div>
          
          {/* Device details */}
          <div className="space-y-2 text-sm flex-1">
            {device.deviceType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-medium truncate ml-2">{device.deviceType}</span>
              </div>
            )}
            {device.osName && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">OS:</span>
                <span className="text-foreground font-medium text-xs break-words leading-tight">
                  {device.osName.length > 60 ? `${device.osName.substring(0, 60)}...` : device.osName}
                </span>
              </div>
            )}
            {device.manufacturer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturer:</span>
                <span className="text-foreground font-medium truncate ml-2">{device.manufacturer}</span>
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

          {/* Action buttons */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-border">
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
    <tr key={device.id} className="hover:bg-muted/50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {device.deviceIcon}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {device.hostname || `Device ${device.ipAddress}`}
              </p>
              <p className="text-sm text-muted-foreground">{device.deviceType}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-sm text-foreground">
            {device.ipAddress}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="max-w-xs">
            <span className="text-sm text-foreground">
              {device.osName ? (
                device.osName.length > 50 ? `${device.osName.substring(0, 50)}...` : device.osName
              ) : 'Unknown'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col space-y-1">
            <Badge className={cn("text-xs w-fit", getStatusColor(device.status))}>
              {getStatusIcon(device.status)}
              <span className="ml-1">{device.status === 'new' ? 'New Device' : 'Converted'}</span>
            </Badge>
            <Badge className={cn("text-xs w-fit", getConfidenceColor(device.confidence))}>
              {Math.round(device.confidence * 100)}% confidence
            </Badge>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm">
            {device.scanTaskName && (
              <div className="text-foreground font-medium truncate max-w-[150px]" title={device.scanTaskName}>
                {device.scanTaskName}
              </div>
            )}
            {device.scanTaskId && (
              <div className="text-muted-foreground text-xs">
                Scan ID: {device.scanTaskId}
              </div>
            )}
            {device.scanType && (
              <div className="text-muted-foreground text-xs">
                Type: {device.scanType}
              </div>
            )}
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
              title="View device details"
            >
            <Eye className="w-4 h-4" />
            </Button>
          {device.status === 'new' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToAsset(device)}
                title="Convert to asset"
              >
              <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </td>
    </tr>
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
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
      </div>

      {/* Fixed Search and Filter Bar */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-border bg-background">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices by IP, hostname, OS, manufacturer, scan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]"
              >
                <option value="all">All Devices</option>
                <option value="new">New Devices</option>
                <option value="converted">Converted</option>
                <option value="high_confidence">High Confidence</option>
                <option value="low_confidence">Low Confidence</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]"
              >
                <option value="lastSeen-desc">Last Seen ↓</option>
                <option value="lastSeen-asc">Last Seen ↑</option>
                <option value="ipAddress-asc">IP Address ↑</option>
                <option value="ipAddress-desc">IP Address ↓</option>
                <option value="hostname-asc">Hostname ↑</option>
                <option value="hostname-desc">Hostname ↓</option>
                <option value="confidence-desc">Confidence ↓</option>
                <option value="confidence-asc">Confidence ↑</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-sm text-muted-foreground">
                Showing {filteredDevices.length} of {processedDevices.length} devices
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">High Confidence:</span>
                <span className="text-sm font-medium text-green-600">{statistics.highConfidence}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Device Types:</span>
                <span className="text-sm font-medium text-blue-600">{statistics.deviceTypes}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh device list"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
              
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-r-none"
                  title="Card view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Active Scan Status */}
        {activeScanTask && (
          <Card className="border-blue-200 bg-blue-50/50 mb-6">
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

        {/* Device List */}
        {filteredDevices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Devices Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No devices have been discovered yet. Start a network scan to discover devices.'
                }
              </p>
              <Button
                onClick={() => window.location.href = '/discovery'}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Discovery Scan
              </Button>
            </CardContent>
          </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDevices.map((device) => (
                <div key={device.id} className="min-h-0">
                  {renderDeviceCard(device)}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'hostname') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('hostname');
                              setSortOrder('asc');
                            }
                          }}
                          title="Click to sort by device name"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Device</span>
                            {sortBy === 'hostname' && (
                              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'ipAddress') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('ipAddress');
                              setSortOrder('asc');
                            }
                          }}
                          title="Click to sort by IP address"
                        >
                          <div className="flex items-center space-x-1">
                            <span>IP Address</span>
                            {sortBy === 'ipAddress' && (
                              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Operating System
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'confidence') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('confidence');
                              setSortOrder('desc');
                            }
                          }}
                          title="Click to sort by confidence level"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status & Confidence</span>
                            {sortBy === 'confidence' && (
                              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Scan Info
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'lastSeen') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('lastSeen');
                              setSortOrder('desc');
                            }
                          }}
                          title="Click to sort by last seen"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Last Seen</span>
                            {sortBy === 'lastSeen' && (
                              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDevices.map((device) => renderDeviceRow(device))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Device Details Modal */}
      {showDeviceModal && selectedDevice && (
        <Modal
          isOpen={showDeviceModal}
          onClose={() => {
            setShowDeviceModal(false);
            setSelectedDevice(null);
          }}
          title={`Device Details - ${selectedDevice.hostname || selectedDevice.ipAddress}`}
          size="lg"
        >
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                    <p className="text-foreground">{selectedDevice.hostname || 'Not detected'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <p className="text-foreground font-mono">{selectedDevice.ipAddress}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">MAC Address</label>
                    <p className="text-foreground font-mono">{selectedDevice.macAddress || 'Not detected'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Device Type</label>
                    <p className="text-foreground">{selectedDevice.deviceType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Operating System</label>
                    <p className="text-foreground">{selectedDevice.osName || 'Not detected'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-foreground">{selectedDevice.manufacturer || 'Not detected'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <p className="text-foreground">{selectedDevice.model || 'Not detected'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confidence Score</label>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedDevice.confidence * 100} className="flex-1" />
                      <span className="text-sm font-medium">{Math.round(selectedDevice.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="network" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Open Ports</label>
                    <div className="mt-2 space-y-2">
                      {selectedDevice.ports.length > 0 ? (
                        selectedDevice.ports.map((port, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="font-mono">{port.port}</span>
                            <span className="text-sm text-muted-foreground">{port.service || 'Unknown'}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No open ports detected</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="services" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Detected Services</label>
                    <div className="mt-2 space-y-2">
                      {selectedDevice.services.length > 0 ? (
                        selectedDevice.services.map((service, index) => (
                          <div key={index} className="p-2 bg-muted/50 rounded">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.version || 'Version unknown'}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No services detected</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Raw Scan Data</label>
                  <pre className="mt-2 p-4 bg-muted/50 rounded text-xs overflow-auto max-h-96">
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
        </Modal>
      )}
    </div>
  );
};

export default DevicesInterface;