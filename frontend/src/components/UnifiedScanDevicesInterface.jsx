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
import { formatTimestampSafe, formatScanProgress, getCappedProgress } from '../utils/formatters';
import PageHeader from './PageHeader';
import ScanResultsModal from './discovery/ScanResultsModal';
import ScanNotifications from './discovery/ScanNotifications';
import DiscoveryWizard from './discovery/DiscoveryWizard';
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
  Plus,
  Play,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Settings,
  Activity,
  Target,
  Scan,
  Database,
  Layers,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Pause,
  StopCircle
} from 'lucide-react';

const UnifiedScanDevicesInterface = () => {
  const {
    // Scan-related data
    scanTasks,
    activeScanTask,
    
    // Device-related data
    discoveredDevices,
    assets,
    selectedDevices,
    
    // Functions
    fetchScanTasks,
    fetchActiveScanTask,
    cancelScanTask,
    fetchDiscoveredDevices,
    fetchAssets,
    convertDeviceToAsset,
    selectAllDevices,
    createAsset
  } = useApp();

  const { user } = useAuth();

  // UI State
  const [activePanel, setActivePanel] = useState('scans'); // 'scans' or 'devices'
  const [expandedScans, setExpandedScans] = useState(new Set());
  const [selectedScanTask, setSelectedScanTask] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  
  // Device interface state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Search field definitions (JQL-style)
  const searchFields = [
    { key: 'ip', label: 'IP Address', type: 'string', example: 'ip=192.168.1.1' },
    { key: 'hostname', label: 'Hostname', type: 'string', example: 'hostname=server01' },
    { key: 'os', label: 'Operating System', type: 'string', example: 'os=Linux' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'string', example: 'manufacturer=Cisco' },
    { key: 'device_type', label: 'Device Type', type: 'string', example: 'device_type=Server' },
    { key: 'scan_id', label: 'Scan ID', type: 'number', example: 'scan_id=2' },
    { key: 'scan_name', label: 'Scan Name', type: 'string', example: 'scan_name=Network Scan' },
    { key: 'status', label: 'Status', type: 'string', example: 'status=new', options: ['new', 'converted'] },
    { key: 'confidence', label: 'Confidence', type: 'number', example: 'confidence>70' },
    { key: 'ports', label: 'Open Ports', type: 'number', example: 'ports>5' },
    { key: 'last_seen', label: 'Last Seen', type: 'date', example: 'last_seen>2024-01-01' }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
    fetchDiscoveredDevices();
    fetchAssets();
  }, [fetchScanTasks, fetchActiveScanTask, fetchDiscoveredDevices, fetchAssets]);

  // Handle scan completion
  useEffect(() => {
    if (activeScanTask && (activeScanTask.status === 'completed' || activeScanTask.status === 'failed')) {
      fetchScanTasks();
      fetchDiscoveredDevices();
    }
  }, [activeScanTask, fetchScanTasks, fetchDiscoveredDevices]);

  // Scan-related functions
  const handleWizardComplete = (result) => {
    setShowWizard(false);
    fetchScanTasks();
    fetchActiveScanTask();
  };

  const handleViewResults = async (scanId) => {
    const scanTask = scanTasks.find(task => task.id === scanId);
    if (scanTask) {
      setSelectedScanTask(scanTask);
      setShowResultsModal(true);
    }
  };

  const handleDownloadResults = async (scanId) => {
    try {
      const downloadUrl = `/api/v2/scan-tasks/${scanId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `scan-results-${scanId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download scan results:', error);
      alert('Failed to download scan results. Please try again.');
    }
  };

  const toggleScanExpansion = (scanId) => {
    setExpandedScans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scanId)) {
        newSet.delete(scanId);
      } else {
        newSet.add(scanId);
      }
      return newSet;
    });
  };

  const handleViewDevices = (scanTask) => {
    const devicesUrl = `/devices?scan_task_id=${scanTask.id}&scan_name=${encodeURIComponent(scanTask.name)}`;
    window.open(devicesUrl, '_blank');
  };

  // Device-related functions
  const handleConvertToAsset = async (device) => {
    try {
      const ipAddress = device.ipAddress || device.primary_ip || 'Unknown';
      const hostname = device.hostname || null;
      const deviceName = hostname || `Device ${ipAddress}`;
      
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
        ip_addresses: [ipAddress],
        labels: []
      };
      
      await convertDeviceToAsset(device.id, assetData);
      setShowDeviceModal(false);
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
      alert(`Failed to convert device to asset: ${error.message || 'Unknown error'}`);
    }
  };

  // Search suggestion logic
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    if (value.length > 0) {
      const lastWord = value.split(' ').pop();
      const suggestions = searchFields.filter(field => 
        field.key.toLowerCase().includes(lastWord.toLowerCase()) ||
        field.label.toLowerCase().includes(lastWord.toLowerCase())
      ).map(field => ({
        ...field,
        display: `${field.key}=${field.example.split('=')[1] || 'value'}`
      }));
      
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(suggestions.length > 0);
    } else {
      setShowSearchSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  // Parse JQL-style search query
  const parseSearchQuery = (query) => {
    if (!query.trim()) return { type: 'simple', value: '' };
    
    // Check if it's a JQL-style query (contains =, >, <, etc.)
    const jqlPattern = /^(\w+)\s*(=|<|>|<=|>=|!=)\s*(.+)$/;
    const match = query.match(jqlPattern);
    
    if (match) {
      const [, field, operator, value] = match;
      return { type: 'jql', field, operator, value: value.trim() };
    }
    
    // Fallback to simple search
    return { type: 'simple', value: query };
  };

  // Get device field value for JQL queries
  const getDeviceFieldValue = (device, field) => {
    switch (field) {
      case 'ip': return device.ipAddress;
      case 'hostname': return device.hostname;
      case 'os': return device.osName;
      case 'manufacturer': return device.manufacturer;
      case 'device_type': return device.deviceType;
      case 'scan_id': return device.scanTaskId;
      case 'scan_name': return device.scanTaskName;
      case 'status': return device.status;
      case 'confidence': return Math.round(device.confidence * 100);
      case 'ports': return device.ports?.length || 0;
      case 'last_seen': return device.lastSeen;
      default: return null;
    }
  };

  // Evaluate JQL condition
  const evaluateJQLCondition = (deviceValue, operator, searchValue) => {
    if (deviceValue === null || deviceValue === undefined) return false;
    
    const deviceStr = String(deviceValue).toLowerCase();
    const searchStr = String(searchValue).toLowerCase();
    
    switch (operator) {
      case '=':
        return deviceStr === searchStr;
      case '!=':
        return deviceStr !== searchStr;
      case '>':
        return Number(deviceValue) > Number(searchValue);
      case '<':
        return Number(deviceValue) < Number(searchValue);
      case '>=':
        return Number(deviceValue) >= Number(searchValue);
      case '<=':
        return Number(deviceValue) <= Number(searchValue);
      default:
        return deviceStr.includes(searchStr);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchScanTasks(),
        fetchActiveScanTask(),
        fetchDiscoveredDevices(),
        fetchAssets()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format functions
  const formatScanDate = (startTime) => {
    if (!startTime) return 'Pending';
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Play className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Enhanced device data processing
  const processedDevices = useMemo(() => {
    if (!discoveredDevices || !Array.isArray(discoveredDevices)) {
      console.log('No discovered devices or not an array:', discoveredDevices);
      return [];
    }
    
    console.log('Processing devices:', discoveredDevices.length);
    
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
      const deviceType = determineDeviceType(osName, manufacturer, scanData.ports);
      const deviceIcon = getDeviceIcon(deviceType, osName, manufacturer);
      
      // Calculate confidence score
      const confidence = calculateConfidence(hostname, osName, manufacturer, macAddress, scanData.ports);
      
      // Determine status
      const isConverted = assets.some(asset => asset.primary_ip === ipAddress);
      const status = isConverted ? 'converted' : 'new';
      
      const processedDevice = {
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
      
      console.log('Processed device:', processedDevice);
      return processedDevice;
    });
  }, [discoveredDevices, assets]);

  // Device filtering and sorting
  const filteredDevices = useMemo(() => {
    if (!processedDevices || !Array.isArray(processedDevices)) {
      return [];
    }
    
    let filtered = processedDevices.filter(device => {
      // Parse search query
      const searchQuery = parseSearchQuery(searchTerm);
      let matchesSearch = true;
      
      if (searchQuery.type === 'jql') {
        const { field, operator, value } = searchQuery;
        const deviceValue = getDeviceFieldValue(device, field);
        
        if (deviceValue !== null && deviceValue !== undefined) {
          matchesSearch = evaluateJQLCondition(deviceValue, operator, value);
        } else {
          matchesSearch = false;
        }
      } else if (searchQuery.type === 'simple' && searchQuery.value) {
        // Simple search across multiple fields
        const searchValue = searchQuery.value.toLowerCase();
        matchesSearch = 
          device.ipAddress?.toLowerCase().includes(searchValue) ||
          device.hostname?.toLowerCase().includes(searchValue) ||
          device.macAddress?.toLowerCase().includes(searchValue) ||
          device.osName?.toLowerCase().includes(searchValue) ||
          device.manufacturer?.toLowerCase().includes(searchValue) ||
          device.deviceType?.toLowerCase().includes(searchValue) ||
          device.scanTaskId?.toString().includes(searchValue) ||
          device.scanTaskName?.toLowerCase().includes(searchValue);
      }
      
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

  // Helper functions
  const determineDeviceType = (osName, manufacturer, ports) => {
    if (manufacturer?.toLowerCase().includes('cisco')) return 'Router';
    if (manufacturer?.toLowerCase().includes('hp') && ports?.some(p => p.port === 9100)) return 'Printer';
    if (osName?.toLowerCase().includes('windows')) return 'Workstation';
    if (osName?.toLowerCase().includes('linux')) return 'Server';
    if (osName?.toLowerCase().includes('mac')) return 'Workstation';
    if (ports?.some(p => p.port === 22 || p.port === 80 || p.port === 443)) return 'Server';
    if (ports?.some(p => p.port === 3389)) return 'Workstation';
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

  // Statistics
  const scanStats = useMemo(() => {
    const total = scanTasks.length;
    const completed = scanTasks.filter(task => task.status === 'completed').length;
    const running = scanTasks.filter(task => task.status === 'running').length;
    const failed = scanTasks.filter(task => task.status === 'failed').length;
    
    return { total, completed, running, failed };
  }, [scanTasks]);

  const deviceStats = useMemo(() => {
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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        <PageHeader
          title={
            <span className="flex items-center">
              Network Discovery & Asset Management
              <Activity className="ml-2 w-5 h-5 text-primary" />
            </span>
          }
          subtitle="Comprehensive network scanning and device management"
          metrics={[
            { value: scanStats.total, label: "Total Scans", color: "primary" },
            { value: scanStats.completed, label: "Completed", color: "green" },
            { value: deviceStats.total, label: "Devices Found", color: "blue" },
            { value: deviceStats.newDevices, label: "New Devices", color: "orange" }
          ]}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scans */}
        <div className="w-1/2 border-r border-border bg-background flex flex-col">
          {/* Scans Header */}
          <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Network Scans</h2>
                  <p className="text-sm text-muted-foreground">Manage and monitor network discovery</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh data"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>

            {/* Start New Scan Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowWizard(true)}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                disabled={!!activeScanTask}
                size="lg"
              >
                <Plus className="w-5 h-5" />
                <span>Start New Scan</span>
              </Button>
            </div>
          </div>

          {/* Scans Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {/* Current Running Scan */}
              {activeScanTask && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-blue-400" />
                      <span>Current Running Scan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">🔍</div>
                        <div>
                          <h3 className="font-semibold text-foreground">{activeScanTask.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Target: {activeScanTask.target} • 
                            {activeScanTask.progress !== null ? ` Progress: ${activeScanTask.progress}%` : ''}
                          </p>
                          {activeScanTask.current_ip && (
                            <p className="text-sm text-blue-400 font-mono">
                              Currently scanning: {activeScanTask.current_ip}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activeScanTask.progress !== null && (
                          <div className="w-32">
                            <Progress value={activeScanTask.progress} className="h-2" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelScanTask(activeScanTask.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scans History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Scan History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Scans Yet</h3>
                      <p className="text-muted-foreground">
                        Use the "Start New Scan" button above to begin your first network scan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scanTasks.map((task) => {
                        const isExpanded = expandedScans.has(task.id);
                        return (
                          <div
                            key={task.id}
                            className="border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            {/* Main scan entry */}
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer"
                              onClick={() => toggleScanExpansion(task.id)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <div className={cn("flex items-center space-x-2", getStatusColor(task.status))}>
                                    {getStatusIcon(task.status)}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{task.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {task.target} • {formatScanDate(task.start_time)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewResults(task.id);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadResults(task.id);
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-border">
                                <div className="pt-4 space-y-4">
                                  {/* Scan Details */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Status:</span>
                                      <div className="mt-1">
                                        <Badge className={cn("text-xs", 
                                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                          task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        )}>
                                          {task.status || 'unknown'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Progress:</span>
                                      <p className="mt-1 font-mono">
                                        {task.progress !== null ? `${task.progress}%` : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Discovered:</span>
                                      <p className="mt-1 font-mono">
                                        {task.discovered_devices || 0} devices
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Duration:</span>
                                      <p className="mt-1 font-mono">
                                        {task.start_time && task.end_time 
                                          ? formatScanDate(task.start_time) 
                                          : 'In progress'
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center space-x-3 pt-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleViewDevices(task)}
                                      className="flex items-center space-x-2"
                                    >
                                      <Network className="w-4 h-4" />
                                      <span>View Devices</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewResults(task.id)}
                                      className="flex items-center space-x-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      <span>View Results</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadResults(task.id)}
                                      className="flex items-center space-x-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Download</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Panel - Devices */}
        <div className="w-1/2 bg-background flex flex-col">
          {/* Devices Header */}
          <div className="flex-shrink-0 p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Discovered Devices</h2>
                  <p className="text-sm text-muted-foreground">Manage and convert discovered devices</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh devices"
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
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-l-none"
                    title="Table view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search devices (e.g., scan_id=2, ip=192.168.1.1, confidence>70)..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setShowSearchSuggestions(searchSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                      className="pl-10"
                    />
                    
                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="p-2 text-xs text-muted-foreground border-b border-border">
                          Available fields (JQL-style):
                        </div>
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => {
                              const currentQuery = searchTerm.split(' ').slice(0, -1).join(' ');
                              const newQuery = currentQuery ? `${currentQuery} ${suggestion.display}` : suggestion.display;
                              handleSearchChange(newQuery);
                              setShowSearchSuggestions(false);
                            }}
                          >
                            <div className="font-medium">{suggestion.display}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <span className="text-sm font-medium text-green-600">{deviceStats.highConfidence}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Device Types:</span>
                    <span className="text-sm font-medium text-blue-600">{deviceStats.deviceTypes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Devices Content */}
          <div className="flex-1 overflow-auto p-6">
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
                    onClick={() => setShowWizard(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start Network Scan
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDevices.map((device) => {
                  const deviceIcon = getDeviceIcon(device.deviceType, device.osName, device.manufacturer);
                  
                  return (
                    <Card key={device.id} className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50 h-full">
                      <CardContent className="p-4 flex flex-col h-full">
                        {/* Header with device info and badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                              {deviceIcon}
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
                              {formatTimestampSafe(device.lastSeen)}
                            </span>
                          </div>
                          {device.scanTaskName && (
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Scan:</span>
                              <span className="text-foreground font-medium text-xs truncate" title={device.scanTaskName}>
                                {device.scanTaskName}
                              </span>
                            </div>
                          )}
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
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-[calc(100vh-400px)]">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50 sticky top-0 z-10">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Operating System
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status & Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Scan Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Seen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredDevices.map((device) => {
                          const deviceIcon = getDeviceIcon(device.deviceType, device.osName, device.manufacturer);
                          
                          return (
                            <tr key={device.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    {deviceIcon}
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
                                  {formatTimestampSafe(device.lastSeen)}
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
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScanResultsModal
        isOpen={showResultsModal}
        onClose={() => {
          setShowResultsModal(false);
          setSelectedScanTask(null);
        }}
        scanTask={selectedScanTask}
        scanResults={[]}
      />

      <ScanNotifications
        activeScanTask={activeScanTask}
        scanTasks={scanTasks}
        position="top-right"
      />

      {showWizard && (
        <DiscoveryWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* Device Details Modal */}
      {showDeviceModal && selectedDevice && (
        <Modal
          isOpen={showDeviceModal}
          onClose={() => {
            setShowDeviceModal(false);
            setSelectedDevice(null);
          }}
          title={`Device Details - ${selectedDevice.hostname || selectedDevice.primary_ip || 'Unknown Device'}`}
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

export default UnifiedScanDevicesInterface;
