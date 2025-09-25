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
import { formatTimestamp as formatTimestampUtil } from '../utils/formatters';
import { formatScanProgress, getCappedProgress } from '../utils/formatters';
import PageHeader from './PageHeader';
import StandardList from './common/StandardList';

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
  const [filterType, setFilterType] = useState('all'); // 'all', 'new', 'converted'
  const [sortBy, setSortBy] = useState('last_seen'); // 'last_seen', 'ip', 'hostname', 'os_name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'

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
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Check if device is already converted to asset
      const isConverted = assets.some(asset => asset.primary_ip === device.primary_ip);
      
      let matchesFilter = true;
      if (filterType === 'new') {
        matchesFilter = !isConverted;
      } else if (filterType === 'converted') {
        matchesFilter = isConverted;
      }
      
      return matchesSearch && matchesFilter;
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
        case 'os_name':
          aValue = a.os_name || '';
          bValue = b.os_name || '';
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
  }, [discoveredDevices, assets, searchTerm, filterType, sortBy, sortOrder]);

  const handleConvertToAsset = async (device) => {
    try {
      // Prepare asset data from device information
      const assetData = {
        name: device.hostname || device.primary_ip || `Device ${device.primary_ip}`,
        description: `Converted from discovered device`,
        primary_ip: device.primary_ip,
        mac_address: device.mac_address,
        hostname: device.hostname,
        os_name: device.os_name,
        os_family: device.os_family,
        os_version: device.os_version,
        manufacturer: device.manufacturer,
        model: device.model,
        is_managed: false,
        is_active: true
      };
      
      await convertDeviceToAsset(device.id, assetData);
      alert('Device converted to asset successfully!');
    } catch (error) {
      console.error('Failed to convert device to asset:', error);
      alert('Failed to convert device to asset: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      selectAllDevices([]);
    } else {
      selectAllDevices(filteredDevices.filter(d => d && d.id).map(d => d.id));
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

  const getDeviceStatus = (device) => {
    const isConverted = assets.some(asset => asset.primary_ip === device.primary_ip);
    return isConverted ? 'converted' : 'new';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-600';
      case 'converted': return 'bg-green-500/20 text-green-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  // Calculate statistics
  const totalDevices = discoveredDevices.length;
  const newDevices = discoveredDevices.filter(device => 
    !assets.some(asset => asset.primary_ip === device.primary_ip)
  ).length;
  const convertedDevices = totalDevices - newDevices;
  const deviceTypes = [...new Set(discoveredDevices.map(device => device.os_name).filter(Boolean))].length;

  // Filter options for StandardList
  const deviceFilterOptions = [
    { value: 'all', label: 'All Devices', icon: '📱' },
    { value: 'new', label: 'New Devices', icon: '🆕' },
    { value: 'converted', label: 'Converted to Assets', icon: '✅' }
  ];

  // Sort options for StandardList
  const deviceSortOptions = [
    { value: 'last_seen', label: 'Last Seen' },
    { value: 'primary_ip', label: 'IP Address' },
    { value: 'hostname', label: 'Hostname' },
    { value: 'os_name', label: 'Operating System' }
  ];

  // Statistics for StandardList
  const deviceStatistics = [
    {
      value: totalDevices,
      label: "Total Devices",
      color: "text-primary",
      icon: "📱",
      bgColor: "bg-primary/20",
      iconColor: "text-primary"
    },
    {
      value: newDevices,
      label: "New Devices",
      color: "text-blue-600",
      icon: "🆕",
      bgColor: "bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    {
      value: convertedDevices,
      label: "Converted",
      color: "text-green-600",
      icon: "✅",
      bgColor: "bg-green-500/20",
      iconColor: "text-green-600"
    },
    {
      value: deviceTypes,
      label: "Device Types",
      color: "text-purple-600",
      icon: "🔧",
      bgColor: "bg-purple-500/20",
      iconColor: "text-purple-600"
    }
  ];

  // Render functions for StandardList
  const renderDeviceCard = (device) => {
    const status = getDeviceStatus(device);
    return (
      <Card className="surface-interactive group hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getDeviceIcon(device)}</span>
              <div>
                <h4 className="font-semibold text-foreground">
                  {device.hostname || 'Unknown Device'}
                </h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {device.primary_ip}
                </p>
              </div>
            </div>
            <Badge className={cn("text-xs", getStatusColor(status))}>
              {status === 'new' ? 'New' : 'Converted'}
            </Badge>
          </div>
          
          <div className="space-y-3 text-sm">
            {device.os_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS:</span>
                <span className="text-foreground font-medium">{device.os_name}</span>
              </div>
            )}
            {device.manufacturer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturer:</span>
                <span className="text-foreground font-medium">{device.manufacturer}</span>
              </div>
            )}
            {device.mac_address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC:</span>
                <span className="text-foreground font-mono text-xs">{device.mac_address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Seen:</span>
              <span className="text-foreground text-xs">
                {formatTimestampUtil(device.last_seen)}
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
              Explore
            </Button>
            {status === 'new' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToAsset(device)}
                className="flex-1"
              >
                Convert to Asset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDeviceRow = (device) => {
    const status = getDeviceStatus(device);
    return (
      <>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getDeviceIcon(device)}</span>
            <div>
              <div className="font-medium text-foreground">
                {device.hostname || 'Unknown Device'}
              </div>
              {device.manufacturer && (
                <div className="text-sm text-muted-foreground">
                  {device.manufacturer}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-sm text-foreground">{device.primary_ip}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-foreground">{device.os_name || 'Unknown'}</span>
        </td>
        <td className="px-6 py-4">
          <Badge className={cn("text-xs", getStatusColor(status))}>
            {status === 'new' ? 'New' : 'Converted'}
          </Badge>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {formatTimestampUtil(device.last_seen)}
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
              Explore
            </Button>
            {status === 'new' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToAsset(device)}
              >
                Convert
              </Button>
            )}
          </div>
        </td>
      </>
    );
  };

  // Custom table headers for devices
  const deviceTableHeaders = (
    <>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        Device
      </th>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        IP Address
      </th>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        OS
      </th>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        Status
      </th>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        Last Seen
      </th>
      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">
        Actions
      </th>
    </>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={
          <span className="flex items-center">
            Network Devices
            <HelpIcon 
              content="Discover, explore, and manage network devices. Convert devices to assets to add them to your inventory."
              className="ml-2"
              size="sm"
            />
          </span>
        }
        subtitle="Discover, explore, and manage network devices"
        metrics={deviceStatistics.map(stat => ({
          value: stat.value,
          label: stat.label,
          color: stat.color.replace('text-', '')
        }))}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Active Scan Status */}
          {activeScanTask && (
            <Card className="surface-elevated border-blue-200 bg-blue-50/50">
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

          {/* StandardList Component */}
          <StandardList
            items={filteredDevices}
            loading={false}
            itemName="device"
            itemNamePlural="devices"
            searchPlaceholder="Search devices by IP, hostname, MAC, OS, or manufacturer..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterOptions={deviceFilterOptions}
            filterValue={filterType}
            onFilterChange={setFilterType}
            sortOptions={deviceSortOptions}
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedItems={selectedDevices}
            onItemSelect={toggleDeviceSelection}
            onSelectAll={selectAllDevices}
            onCreateClick={() => {/* No create action for devices */}}
            createButtonText=""
            onBulkDelete={() => {/* No bulk delete for devices */}}
            renderItemCard={renderDeviceCard}
            renderItemRow={renderDeviceRow}
            tableHeaders={deviceTableHeaders}
            emptyStateIcon="📱"
            emptyStateTitle="No devices found"
            emptyStateDescription={searchTerm ? 'Try adjusting your search criteria.' : 'Start a network discovery scan to find devices.'}
          />
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hostname
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {selectedDevice.hostname || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  IP Address
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md font-mono">
                  {selectedDevice.primary_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  MAC Address
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md font-mono">
                  {selectedDevice.mac_address || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Operating System
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {selectedDevice.os_name || 'Unknown'}
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
                  Model
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {selectedDevice.model || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Seen
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {formatTimestampUtil(selectedDevice.last_seen)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <div className="bg-muted p-3 rounded-md">
                  <Badge className={cn("text-xs", getStatusColor(getDeviceStatus(selectedDevice)))}>
                    {getDeviceStatus(selectedDevice) === 'new' ? 'New Device' : 'Converted to Asset'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {selectedDevice.scan_data && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Scan Data
                </label>
                <pre className="text-xs text-foreground bg-muted p-4 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(selectedDevice.scan_data, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowDeviceModal(false)}
              >
                Close
              </Button>
              {getDeviceStatus(selectedDevice) === 'new' && (
                <Button
                  onClick={() => {
                    handleConvertToAsset(selectedDevice);
                    setShowDeviceModal(false);
                  }}
                >
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
