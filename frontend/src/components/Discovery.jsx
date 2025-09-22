import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';

const Discovery = () => {
  const navigate = useNavigate();
  const {
    scanTasks,
    activeScanTask,
    discoveredDevices,
    loading,
    fetchScanTasks,
    fetchActiveScanTask,
    fetchDiscoveredDevices,
    createScanTask,
    cancelScanTask,
    runLanDiscovery
  } = useApp();

  const [showScanModal, setShowScanModal] = useState(false);
  const [scanForm, setScanForm] = useState({
    name: '',
    target: '',
    scan_type: 'quick',
    description: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [networkValidation, setNetworkValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [availableScanners, setAvailableScanners] = useState([]);
  const [selectedScanners, setSelectedScanners] = useState([]);
  const [discoveryDepth, setDiscoveryDepth] = useState(2);
  const [maxDiscoveryDepth, setMaxDiscoveryDepth] = useState(3);

  // Scan action presets based on user feedback
  const scanPresets = [
    {
      id: 'local_network_discovery',
      name: 'Local Network Discovery',
      description: 'Quick device mapping of target networks with configurable depth',
      target: 'auto',
      scan_type: 'lan_discovery',
      icon: '🌐',
      color: 'text-blue-600',
      requiresSubnetSelection: true,
      allowsDepthControl: true,
      fixedType: true
    },
    {
      id: 'custom_target',
      name: 'Custom Target',
      description: 'All types of targets, methods, and intensity levels',
      target: '',
      scan_type: 'quick',
      icon: '🎯',
      color: 'text-orange-600',
      isCustom: true,
      allowsAllOptions: true,
      fixedType: false
    }
  ];

  // Common network ranges for quick selection
  const commonRanges = [
    { label: 'Local Network (Auto)', value: 'auto' },
    { label: '192.168.1.0/24', value: '192.168.1.0/24' },
    { label: '192.168.0.0/24', value: '192.168.0.0/24' },
    { label: '10.0.0.0/24', value: '10.0.0.0/24' },
    { label: '172.16.0.0/24', value: '172.16.0.0/24' },
    { label: 'Custom Range', value: 'custom' }
  ];

  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
    fetchDiscoveredDevices();
    fetchScannerConfigurations();
    fetchSystemSettings();
  }, [fetchScanTasks, fetchActiveScanTask, fetchDiscoveredDevices]);

  const fetchScannerConfigurations = async () => {
    try {
      const response = await fetch('/api/v2/scanners');
      const scanners = await response.json();
      setAvailableScanners(scanners.filter(scanner => scanner.is_active));
    } catch (error) {
      console.error('Failed to fetch scanner configurations:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/v2/settings');
      const settings = await response.json();
      setMaxDiscoveryDepth(settings.max_discovery_depth || 3);
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  };

  useEffect(() => {
    if (activeScanTask) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  }, [activeScanTask]);

  // Calculate key metrics
  const totalScans = scanTasks.length;
  const completedScans = scanTasks.filter(s => s.status === 'completed').length;
  const totalDevices = discoveredDevices.length;
  const activeScans = scanTasks.filter(s => s.status === 'running').length;

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setScanForm({
      name: preset.name,
      target: preset.target,
      scan_type: preset.scan_type,
      description: preset.description
    });
    
    // Set default scanners for local network discovery
    if (preset.requiresSubnetSelection && availableScanners.length > 0) {
      const defaultScanners = availableScanners.filter(s => s.is_default);
      if (defaultScanners.length > 0) {
        setSelectedScanners(defaultScanners);
      } else {
        // If no default scanners, select the first one
        setSelectedScanners([availableScanners[0]]);
      }
    }
    
    setShowScanModal(true);
  };

  const validateNetworkRange = async (target) => {
    if (!target || target === 'auto' || target === 'custom') {
      setNetworkValidation(null);
      return;
    }

    // Basic client-side validation first
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    const rangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
    
    if (!ipRegex.test(target) && !cidrRegex.test(target) && !rangeRegex.test(target)) {
      setNetworkValidation({ 
        valid: false, 
        error: 'Invalid format. Use CIDR (192.168.1.0/24), IP range (192.168.1.1-254), or single IP' 
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`/api/v2/validate-network-range?target=${encodeURIComponent(target)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setNetworkValidation(result);
      
      // Auto-suggest name if validation is successful
      if (result.valid && result.suggested_name && !scanForm.name) {
        setScanForm(prev => ({ ...prev, name: result.suggested_name }));
      }
    } catch (error) {
      console.error('Network validation failed:', error);
      setNetworkValidation({ valid: false, error: 'Validation failed - please check your network connection' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartScan = async () => {
    if (!scanForm.name.trim() || !scanForm.target.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Additional validation for local network discovery
    if (selectedPreset?.requiresSubnetSelection && selectedScanners.length === 0) {
      alert('Please select at least one scanner for this scan');
      return;
    }

    // Additional validation for custom targets
    if (selectedPreset?.isCustom && scanForm.target === 'custom') {
      alert('Please enter a valid network target');
      return;
    }

    if (selectedPreset?.isCustom && networkValidation && !networkValidation.valid) {
      alert('Please fix the network target validation errors before starting the scan');
      return;
    }

    try {
      setIsScanning(true);
      const scanTaskData = {
        name: scanForm.name,
        target: scanForm.target,
        scan_type: scanForm.scan_type,
        created_by: 'user'
      };

      // Add discovery depth for local network discovery
      if (selectedPreset?.allowsDepthControl) {
        scanTaskData.discovery_depth = discoveryDepth;
      }

      // Add scanner information
      if (selectedScanners.length > 0) {
        scanTaskData.scanner_ids = selectedScanners.map(s => s.id);
      }

      await createScanTask(scanTaskData);
      setShowScanModal(false);
      setScanForm({
        name: '',
        target: '',
        scan_type: 'quick',
        description: ''
      });
      setSelectedPreset(null);
      setSelectedScanners([]);
      setNetworkValidation(null);
      setDiscoveryDepth(2);
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
      setIsScanning(false);
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getScanStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Network Discovery"
        subtitle="Discover and scan devices on your network"
        metrics={[
          { value: totalScans, label: "Total Scans", color: "text-primary" },
          { value: totalDevices, label: "Devices Found", color: "text-success" },
          { value: activeScans, label: "Active", color: "text-warning" }
        ]}
      />

      {/* Active Scan Status */}
      {activeScanTask && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-body text-foreground font-medium">
                {activeScanTask.name} is running on {activeScanTask.target}
              </span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {activeScanTask.progress}% complete
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelScan}
              className="text-red-600 hover:text-red-600 hover:bg-red-50 border-red-200"
            >
              Cancel Scan
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Quick Scan Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">🚀</span>
                <span>Quick Scan Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scanPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      "p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-solid hover:shadow-md",
                      selectedPreset?.id === preset.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <h3 className="font-medium text-foreground">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground">{preset.scan_type}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                    {preset.isCustom && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Custom Target
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Discoveries */}
          {discoveredDevices.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">🔍</span>
                    <span>Recent Discoveries ({totalDevices})</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/devices')}
                    className="text-sm"
                  >
                    View All Devices →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discoveredDevices.slice(0, 6).map((device) => (
                    <div
                      key={device.id}
                      className="p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground truncate">
                          {device.hostname || device.primary_ip}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {device.os_name || 'Unknown OS'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>IP:</span>
                          <span className="font-mono">{device.primary_ip}</span>
                        </div>
                        {device.mac_address && (
                          <div className="flex justify-between">
                            <span>MAC:</span>
                            <span className="font-mono">{device.mac_address}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Found:</span>
                          <span>{formatDate(device.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {discoveredDevices.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/devices')}
                    >
                      View All {discoveredDevices.length} Devices →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          {scanTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span>Scan History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanTasks.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold">
                            {scan.scan_type === 'quick' ? '⚡' : 
                             scan.scan_type === 'comprehensive' ? '🔍' : '🎯'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{scan.name}</h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {scan.target}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {scan.discovered_devices || 0} devices
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(scan.start_time)}
                          </div>
                        </div>
                        <Badge className={cn("text-xs", getScanStatusColor(scan.status))}>
                          {scan.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/devices?scan_task_id=${scan.id}`)}
                          disabled={scan.status !== 'completed'}
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {scanTasks.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline">
                      View All {scanTasks.length} Scans →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {totalScans === 0 && totalDevices === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Start Discovering Your Network
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Run your first network scan to discover devices, services, and security insights across your infrastructure.
                </p>
                <Button
                  onClick={() => handlePresetSelect(scanPresets[0])}
                  className="px-8"
                >
                  Start Quick LAN Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scan Configuration Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setSelectedPreset(null);
        }}
        title="Configure Scan"
      >
        <div className="space-y-6">
          {/* Scan Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Scan Name *
            </label>
            <Input
              value={scanForm.name}
              onChange={(e) => setScanForm({...scanForm, name: e.target.value})}
              placeholder="Enter a descriptive name for this scan"
              required
            />
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Range *
            </label>
            {selectedPreset?.isCustom ? (
              <div className="space-y-3">
                <select
                  value={scanForm.target}
                  onChange={(e) => {
                    setScanForm({...scanForm, target: e.target.value});
                    if (e.target.value !== 'custom') {
                      validateNetworkRange(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {commonRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                {scanForm.target === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Input
                        placeholder="192.168.1.0/24, 192.168.1.1-192.168.1.254, or 192.168.1.100"
                        value={scanForm.target}
                        onChange={(e) => {
                          setScanForm({...scanForm, target: e.target.value});
                          // Debounce validation
                          clearTimeout(window.validationTimeout);
                          window.validationTimeout = setTimeout(() => {
                            validateNetworkRange(e.target.value);
                          }, 500);
                        }}
                        className={cn(
                          networkValidation && !networkValidation.valid && !isValidating && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        Enter CIDR notation (192.168.1.0/24), IP range (192.168.1.1-254), or single IP
                      </div>
                    </div>
                    
                    {/* Network Validation Feedback */}
                    {isValidating && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <span>Validating network range...</span>
                      </div>
                    )}
                    {networkValidation && !isValidating && (
                      <div className={cn(
                        "p-3 rounded-md text-sm border",
                        networkValidation.valid 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-red-50 border-red-200 text-red-800"
                      )}>
                        {networkValidation.valid ? (
                          <div>
                            <div className="font-medium flex items-center space-x-1">
                              <span>✓</span>
                              <span>{networkValidation.description}</span>
                            </div>
                            {networkValidation.ip_count && (
                              <div className="text-xs mt-1 text-green-700">
                                {networkValidation.ip_count.toLocaleString()} IP addresses to scan
                                {networkValidation.ip_count > 1000 && (
                                  <span className="ml-2 text-orange-600">
                                    (Large range - may take longer)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium flex items-center space-x-1">
                            <span>✗</span>
                            <span>{networkValidation.error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">
                  {selectedPreset?.target === 'auto' ? 'Auto-detect local network' : selectedPreset?.target}
                </span>
              </div>
            )}
          </div>

          {/* Scanner Selection for Local Network Discovery */}
          {selectedPreset?.requiresSubnetSelection && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Scanners & Networks *
              </label>
              <div className="space-y-3">
                {availableScanners.map((scanner) => (
                  <div key={scanner.id} className="flex items-center space-x-3 p-3 border border-border rounded-md">
                    <input
                      type="checkbox"
                      id={`scanner-${scanner.id}`}
                      checked={selectedScanners.some(s => s.id === scanner.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScanners([...selectedScanners, scanner]);
                        } else {
                          setSelectedScanners(selectedScanners.filter(s => s.id !== scanner.id));
                        }
                      }}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor={`scanner-${scanner.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">
                        {scanner.name} {scanner.is_default && <span className="text-xs text-primary">(Default)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scanner.subnets?.length || 0} network{scanner.subnets?.length !== 1 ? 's' : ''} available
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              
              {selectedScanners.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Select target networks from available scanners:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedScanners.flatMap(scanner => 
                      scanner.subnets?.map((subnet, index) => (
                        <button
                          key={`${scanner.id}-${index}`}
                          onClick={() => setScanForm({...scanForm, target: subnet})}
                          className={cn(
                            "px-2 py-1 text-xs rounded border transition-colors",
                            scanForm.target === subnet
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:bg-accent"
                          )}
                        >
                          {subnet}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discovery Depth for Local Network Discovery */}
          {selectedPreset?.allowsDepthControl && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Discovery Depth (Network Hops)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max={maxDiscoveryDepth}
                  value={discoveryDepth}
                  onChange={(e) => setDiscoveryDepth(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 hop (Local only)</span>
                  <span className="font-medium text-foreground">{discoveryDepth} hop{discoveryDepth > 1 ? 's' : ''}</span>
                  <span>{maxDiscoveryDepth} hops (Max)</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {discoveryDepth === 1 && "Scan only the immediate local network"}
                  {discoveryDepth === 2 && "Scan local network + one hop beyond"}
                  {discoveryDepth === 3 && "Scan local network + two hops beyond"}
                  {discoveryDepth > 3 && `Scan local network + ${discoveryDepth - 1} hops beyond`}
                </div>
              </div>
            </div>
          )}

          {/* Scan Type - Only show for Custom Target */}
          {!selectedPreset?.fixedType && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Scan Type
              </label>
              <select
                value={scanForm.scan_type}
                onChange={(e) => setScanForm({...scanForm, scan_type: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="quick">⚡ Quick Scan - Fast ping and port detection</option>
                <option value="comprehensive">🔍 Comprehensive Scan - OS detection and service enumeration</option>
                <option value="arp">📡 ARP Scan - Local network ARP discovery only</option>
                <option value="snmp">🔧 SNMP Scan - Network device SNMP discovery</option>
                <option value="lan_discovery">🌐 LAN Discovery - Multi-technique network discovery</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              value={scanForm.description}
              onChange={(e) => setScanForm({...scanForm, description: e.target.value})}
              placeholder="Add notes about this scan..."
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowScanModal(false);
                setSelectedPreset(null);
                setSelectedScanners([]);
                setNetworkValidation(null);
                setDiscoveryDepth(2);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartScan}
              disabled={
                isScanning || 
                !scanForm.name.trim() || 
                !scanForm.target.trim() ||
                (selectedPreset?.requiresSubnetSelection && selectedScanners.length === 0) ||
                (selectedPreset?.isCustom && scanForm.target === 'custom') ||
                (selectedPreset?.isCustom && networkValidation && !networkValidation.valid)
              }
              className="px-6"
            >
              {isScanning ? 'Starting...' : 'Start Scan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Discovery;