import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';

const LabNetworkView = ({ 
  devices = [], 
  labNetworks = [], 
  onNetworkSelect,
  selectedNetwork,
  onDeviceSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Group devices by network
  const devicesByNetwork = useMemo(() => {
    const grouped = {};
    labNetworks.forEach(network => {
      grouped[network] = devices.filter(device => {
        const deviceIP = device.primary_ip;
        const [networkIP, prefix] = network.split('/');
        const [deviceIPParts, networkIPParts] = [
          deviceIP.split('.').map(Number),
          networkIP.split('.').map(Number)
        ];
        
        // Simple network matching (for demo purposes)
        const prefixLength = parseInt(prefix);
        const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
        
        const deviceNetwork = (deviceIPParts[0] << 24 | deviceIPParts[1] << 16 | deviceIPParts[2] << 8 | deviceIPParts[3]) & mask;
        const targetNetwork = (networkIPParts[0] << 24 | networkIPParts[1] << 16 | networkIPParts[2] << 8 | networkIPParts[3]) & mask;
        
        return deviceNetwork === targetNetwork;
      });
    });
    return grouped;
  }, [devices, labNetworks]);

  // Filter devices based on search and filter
  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.primary_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.os_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(device => {
        switch (filterType) {
          case 'devices':
            return device.is_device;
          case 'responding':
            return device.result_type === 'responding_ip';
          case 'no_response':
            return device.result_type === 'no_response';
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [devices, searchTerm, filterType]);

  const getDeviceIcon = (device) => {
    if (device.os_name) {
      if (device.os_name.toLowerCase().includes('windows')) return '🖥️';
      if (device.os_name.toLowerCase().includes('linux')) return '🐧';
      if (device.os_name.toLowerCase().includes('mac')) return '🍎';
      if (device.os_name.toLowerCase().includes('ios')) return '📱';
      if (device.os_name.toLowerCase().includes('android')) return '🤖';
    }
    
    if (device.manufacturer) {
      if (device.manufacturer.toLowerCase().includes('cisco')) return '🔗';
      if (device.manufacturer.toLowerCase().includes('hp')) return '🖨️';
      if (device.manufacturer.toLowerCase().includes('dell')) return '💻';
    }
    
    return device.is_device ? '📱' : '🌐';
  };

  const getDeviceStatusColor = (device) => {
    if (device.is_device) return 'text-green-600 bg-green-50 border-green-200';
    if (device.result_type === 'responding_ip') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (device.result_type === 'no_response') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">🏢</span>
            <span>Lab Network Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labNetworks.map((network) => {
              const networkDevices = devicesByNetwork[network] || [];
              const activeDevices = networkDevices.filter(d => d.is_device).length;
              const respondingIPs = networkDevices.filter(d => d.result_type === 'responding_ip').length;
              
              return (
                <div
                  key={network}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedNetwork === network
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => onNetworkSelect(network)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{network}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {networkDevices.length} total
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Devices:</span>
                      <span className="font-medium text-green-600">{activeDevices}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Responding IPs:</span>
                      <span className="font-medium text-yellow-600">{respondingIPs}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">No Response:</span>
                      <span className="font-medium text-red-600">
                        {networkDevices.length - activeDevices - respondingIPs}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search devices by IP, hostname, OS, or manufacturer..."
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
                <option value="devices">Active Devices Only</option>
                <option value="responding">Responding IPs</option>
                <option value="no_response">No Response</option>
              </select>
              
              <div className="flex border border-border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors",
                    viewMode === 'grid'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-accent"
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors",
                    viewMode === 'list'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-accent"
                  )}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Display */}
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="text-2xl">📱</span>
              <span>Lab Devices</span>
            </span>
            <Badge variant="secondary">
              {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No devices found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Start a lab network discovery to find devices.'
                }
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            )}>
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                    getDeviceStatusColor(device),
                    viewMode === 'list' && "flex items-center space-x-4"
                  )}
                  onClick={() => onDeviceSelect(device)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getDeviceIcon(device)}</span>
                        <Badge
                          variant={device.is_device ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {device.is_device ? "Device" : "IP"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {device.hostname || device.primary_ip}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {device.primary_ip}
                        </p>
                        
                        {device.os_name && (
                          <p className="text-xs text-muted-foreground">
                            OS: {device.os_name}
                          </p>
                        )}
                        
                        {device.manufacturer && (
                          <p className="text-xs text-muted-foreground">
                            {device.manufacturer}
                          </p>
                        )}
                        
                        {device.scanner_name && (
                          <p className="text-xs text-muted-foreground">
                            Scanner: {device.scanner_name}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">{getDeviceIcon(device)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
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
                        <p className="text-sm text-muted-foreground">
                          {device.primary_ip}
                          {device.os_name && ` • ${device.os_name}`}
                          {device.manufacturer && ` • ${device.manufacturer}`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabNetworkView;
