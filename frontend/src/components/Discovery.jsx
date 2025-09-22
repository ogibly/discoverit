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
    scan_type: 'lan_discovery',
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
  const [selectedLab, setSelectedLab] = useState(null);
  const [labNetworks, setLabNetworks] = useState([]);

  // Lab-focused scan presets for lab managers
  const labScanPresets = [
    {
      id: 'lab_network_discovery',
      name: 'Lab Network Discovery',
      description: 'Discover all devices in your lab network(s) - perfect for lab managers',
      target: 'auto',
      scan_type: 'lan_discovery',
      icon: '🏢',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      requiresSubnetSelection: true,
      allowsDepthControl: true,
      fixedType: true,
      isLabFocused: true
    },
    {
      id: 'vlan_scan',
      name: 'vLAN Scan',
      description: 'Scan specific vLANs within your lab infrastructure',
      target: '',
      scan_type: 'lan_discovery',
      icon: '🔗',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      requiresSubnetSelection: true,
      allowsDepthControl: true,
      fixedType: true,
      isVlanFocused: true
    },
    {
      id: 'device_inventory',
      name: 'Device Inventory',
      description: 'Comprehensive scan to catalog all lab devices and their details',
      target: '',
      scan_type: 'comprehensive',
      icon: '📋',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      requiresSubnetSelection: true,
      allowsDepthControl: false,
      fixedType: true,
      isInventoryFocused: true
    },
    {
      id: 'custom_target',
      name: 'Custom Target',
      description: 'Advanced scanning for specific devices or network ranges',
      target: '',
      scan_type: 'quick',
      icon: '🎯',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      isCustom: true,
      allowsAllOptions: true,
      fixedType: false
    }
  ];

  // Lab network templates for common lab setups
  const labNetworkTemplates = [
    {
      id: 'single_lab',
      name: 'Single Lab Room',
      description: 'One lab room with devices on a single subnet',
      icon: '🏠',
      networks: ['192.168.1.0/24'],
      color: 'text-blue-600'
    },
    {
      id: 'multi_lab',
      name: 'Multiple Lab Rooms',
      description: 'Multiple lab rooms with separate subnets',
      icon: '🏢',
      networks: ['192.168.1.0/24', '192.168.2.0/24', '192.168.3.0/24'],
      color: 'text-green-600'
    },
    {
      id: 'vlan_lab',
      name: 'vLAN-based Lab',
      description: 'Lab with vLAN segmentation for different device types',
      icon: '🔗',
      networks: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      color: 'text-purple-600'
    },
    {
      id: 'enterprise_lab',
      name: 'Enterprise Lab',
      description: 'Large lab with multiple subnets and complex networking',
      icon: '🏭',
      networks: ['172.16.0.0/16', '172.17.0.0/16', '172.18.0.0/16'],
      color: 'text-indigo-600'
    }
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
      if (settings.max_discovery_depth) {
        setMaxDiscoveryDepth(settings.max_discovery_depth);
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  };

  const validateNetworkRange = async (range) => {
    if (!range || range === 'auto') return { valid: true, message: 'Auto-detection enabled' };
    
    setIsValidating(true);
    try {
      // Client-side validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      const rangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
      
      if (!ipRegex.test(range.split('/')[0]) && !cidrRegex.test(range) && !rangeRegex.test(range)) {
        return { valid: false, message: 'Invalid IP address, CIDR, or range format' };
      }
      
      // Additional validation for CIDR
      if (range.includes('/')) {
        const [ip, prefix] = range.split('/');
        const prefixNum = parseInt(prefix);
        if (prefixNum < 8 || prefixNum > 30) {
          return { valid: false, message: 'CIDR prefix must be between /8 and /30' };
        }
      }
      
      return { valid: true, message: 'Valid network range' };
    } catch (error) {
      return { valid: false, message: 'Invalid network format' };
    } finally {
      setIsValidating(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setScanForm({
      name: preset.name,
      target: preset.target,
      scan_type: preset.scan_type,
      description: preset.description
    });
    
    // Set default scanners for lab network discovery
    if (preset.requiresSubnetSelection && availableScanners.length > 0) {
      const defaultScanners = availableScanners.filter(s => s.is_default);
      if (defaultScanners.length > 0) {
        setSelectedScanners(defaultScanners);
      } else {
        setSelectedScanners([availableScanners[0]]);
      }
    }
    
    setShowScanModal(true);
  };

  const handleLabTemplateSelect = (template) => {
    setSelectedLab(template);
    setLabNetworks(template.networks);
    setScanForm(prev => ({
      ...prev,
      target: template.networks[0] // Set first network as default
    }));
  };

  const handleStartScan = async () => {
    if (!scanForm.name.trim() || !scanForm.target.trim()) return;
    
    setIsScanning(true);
    try {
      const scanTaskData = {
        name: scanForm.name,
        target: scanForm.target,
        scan_type: scanForm.scan_type,
        created_by: 'user'
      };

      // Add discovery depth for lab network discovery
      if (selectedPreset?.allowsDepthControl) {
        scanTaskData.discovery_depth = discoveryDepth;
      }

      // Add scanner information (now a list of IDs)
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
      setSelectedLab(null);
      setLabNetworks([]);
    } catch (error) {
      console.error('Failed to start scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleNetworkChange = async (network) => {
    setScanForm({...scanForm, target: network});
    const validation = await validateNetworkRange(network);
    setNetworkValidation(validation);
  };

  // Calculate metrics for the dashboard
  const metrics = useMemo(() => {
    const totalDevices = discoveredDevices.length;
    const activeDevices = discoveredDevices.filter(d => d.is_device).length;
    const respondingIPs = discoveredDevices.filter(d => d.result_type === 'responding_ip').length;
    const recentScans = scanTasks.filter(task => {
      const scanDate = new Date(task.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return scanDate > weekAgo;
    }).length;

    return [
      { value: totalDevices, label: "Total Devices", color: "text-primary" },
      { value: activeDevices, label: "Active Devices", color: "text-success" },
      { value: respondingIPs, label: "Responding IPs", color: "text-warning" },
      { value: recentScans, label: "Recent Scans", color: "text-info" }
    ];
  }, [discoveredDevices, scanTasks]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Lab Network Discovery"
        subtitle="Discover and manage devices in your lab networks"
        metrics={metrics}
        actions={[
          {
            label: "Quick Lab Scan",
            icon: "🏢",
            onClick: () => handlePresetSelect(labScanPresets[0]),
            variant: "default"
          }
        ]}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Lab Network Overview */}
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🏢</span>
              <span>Your Lab Networks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {labNetworkTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedLab?.id === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleLabTemplateSelect(template)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {template.networks.map((network, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lab-Focused Scan Actions */}
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🔍</span>
              <span>Lab Discovery Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {labScanPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={cn(
                    "p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg",
                    preset.bgColor,
                    preset.borderColor,
                    "hover:scale-105"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={cn("text-3xl", preset.color)}>
                      {preset.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={cn("text-lg font-semibold mb-2", preset.color)}>
                        {preset.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {preset.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {preset.isLabFocused && (
                          <Badge variant="secondary" className="text-xs">Lab Manager</Badge>
                        )}
                        {preset.isVlanFocused && (
                          <Badge variant="secondary" className="text-xs">vLAN</Badge>
                        )}
                        {preset.isInventoryFocused && (
                          <Badge variant="secondary" className="text-xs">Inventory</Badge>
                        )}
                        {preset.isCustom && (
                          <Badge variant="secondary" className="text-xs">Advanced</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Scans */}
        {activeScanTask && (
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>Active Scan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{activeScanTask.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Scanning: {activeScanTask.target} • {activeScanTask.scan_type}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => cancelScanTask(activeScanTask.id)}
                  className="ml-4"
                >
                  Cancel Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Discoveries */}
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">📱</span>
              <span>Recent Discoveries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {discoveredDevices.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No devices discovered yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start a lab network discovery to find devices in your lab
                </p>
                <Button onClick={() => handlePresetSelect(labScanPresets[0])}>
                  Start Lab Discovery
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredDevices.slice(0, 6).map((device) => (
                  <div
                    key={device.id}
                    className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">
                        {device.hostname || device.primary_ip}
                      </h4>
                      <Badge
                        variant={device.is_device ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {device.is_device ? "Device" : "IP"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {device.primary_ip}
                    </p>
                    {device.os_name && (
                      <p className="text-xs text-muted-foreground">
                        OS: {device.os_name}
                      </p>
                    )}
                    {device.scanner_name && (
                      <p className="text-xs text-muted-foreground">
                        Scanner: {device.scanner_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scan Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setSelectedPreset(null);
          setSelectedScanners([]);
          setNetworkValidation(null);
          setDiscoveryDepth(2);
          setSelectedLab(null);
          setLabNetworks([]);
        }}
        title={`${selectedPreset?.name || 'Start Scan'}`}
        size="lg"
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
              className="w-full"
            />
          </div>

          {/* Lab Network Selection */}
          {selectedLab && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lab Network *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {labNetworks.map((network, index) => (
                  <button
                    key={index}
                    onClick={() => handleNetworkChange(network)}
                    className={cn(
                      "p-3 text-sm border rounded-md transition-colors",
                      scanForm.target === network
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-accent"
                    )}
                  >
                    {network}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanner Selection */}
          {selectedPreset?.requiresSubnetSelection && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lab Scanners *
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
            </div>
          )}

          {/* Discovery Depth */}
          {selectedPreset?.allowsDepthControl && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Discovery Depth: {discoveryDepth} {discoveryDepth === 1 ? 'hop' : 'hops'}
              </label>
              <input
                type="range"
                min="1"
                max={maxDiscoveryDepth}
                value={discoveryDepth}
                onChange={(e) => setDiscoveryDepth(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Quick (1 hop)</span>
                <span>Comprehensive ({maxDiscoveryDepth} hops)</span>
              </div>
            </div>
          )}

          {/* Custom Target Input */}
          {selectedPreset?.isCustom && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Network *
              </label>
              <Input
                value={scanForm.target}
                onChange={(e) => handleNetworkChange(e.target.value)}
                placeholder="Enter IP, CIDR, or range (e.g., 192.168.1.0/24)"
                className="w-full"
              />
              {networkValidation && (
                <p className={cn(
                  "text-xs mt-1",
                  networkValidation.valid ? "text-success" : "text-error"
                )}>
                  {networkValidation.message}
                </p>
              )}
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
                setSelectedLab(null);
                setLabNetworks([]);
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
              {isScanning ? 'Starting...' : 'Start Lab Discovery'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Discovery;