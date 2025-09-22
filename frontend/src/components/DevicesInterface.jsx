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
import PageHeader from './PageHeader';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

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
      await convertDeviceToAsset(device.id);
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
        metrics={[
          { value: totalDevices, label: "Total Devices", color: "text-primary" },
          { value: newDevices, label: "New", color: "text-blue-600" },
          { value: convertedDevices, label: "Converted", color: "text-green-600" }
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Device Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                    <p className="text-2xl font-bold text-foreground">{totalDevices}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary text-lg">📱</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Devices</p>
                    <p className="text-2xl font-bold text-blue-600">{newDevices}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🆕</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Converted to Assets</p>
                    <p className="text-2xl font-bold text-green-600">{convertedDevices}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Device Types</p>
                    <p className="text-2xl font-bold text-foreground">{deviceTypes}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🔧</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search devices by IP, hostname, MAC, OS, or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Devices</option>
                    <option value="new">New Devices</option>
                    <option value="converted">Converted to Assets</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="last_seen">Last Seen</option>
                    <option value="ip">IP Address</option>
                    <option value="hostname">Hostname</option>
                    <option value="os_name">Operating System</option>
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
                        {activeScanTask.name} • {activeScanTask.target} • {activeScanTask.progress}% complete
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {activeScanTask.status}
                  </Badge>
                </div>
                {activeScanTask.progress > 0 && (
                  <div className="mt-3">
                    <Progress value={activeScanTask.progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Device List */}
          {filteredDevices.length === 0 ? (
            <Card className="surface-elevated">
              <CardContent className="p-12 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-subheading text-foreground mb-2">No devices found</h3>
                <p className="text-body text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Start a network discovery scan to find devices.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Bulk Actions */}
              {selectedDevices.length > 0 && (
                <Card className="surface-elevated border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDevices.length === filteredDevices.length}
                          onChange={handleSelectAll}
                          className="form-checkbox h-4 w-4 text-primary rounded"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Bulk Convert to Assets
                        </Button>
                        <Button variant="outline" size="sm">
                          Export Selected
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Toggle */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">View:</span>
                  <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="text-xs font-medium transition-all duration-200 h-8 px-3"
                    >
                      ⊞
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="text-xs font-medium transition-all duration-200 h-8 px-3"
                    >
                      ☰
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Device Grid/Table */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDevices.map((device) => {
                    const status = getDeviceStatus(device);
                    return (
                      <Card key={device.id} className="surface-interactive group hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedDevices.includes(device.id)}
                                onChange={() => toggleDeviceSelection(device.id)}
                                className="form-checkbox h-4 w-4 text-primary rounded"
                              />
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
                                {new Date(device.last_seen).toLocaleString()}
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
                  })}
                </div>
              ) : (
                <Card className="surface-elevated">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr className="text-left">
                            <th className="px-6 py-4 w-12">
                              <input
                                type="checkbox"
                                checked={selectedDevices.length === filteredDevices.length}
                                onChange={handleSelectAll}
                                className="form-checkbox h-4 w-4 text-primary rounded"
                              />
                            </th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Device</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">IP Address</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">OS</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Last Seen</th>
                            <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDevices.map((device) => {
                            const status = getDeviceStatus(device);
                            return (
                              <tr key={device.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedDevices.includes(device.id)}
                                    onChange={() => toggleDeviceSelection(device.id)}
                                    className="form-checkbox h-4 w-4 text-primary rounded"
                                  />
                                </td>
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
                                    {new Date(device.last_seen).toLocaleString()}
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
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
                  {new Date(selectedDevice.last_seen).toLocaleString()}
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
