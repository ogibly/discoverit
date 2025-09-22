import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';

const ScanResultsView = ({ scanTaskId, onClose }) => {
  const { discoveredDevices, fetchDiscoveredDevices } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'devices', 'orphaned'
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Load scan results
  useEffect(() => {
    if (scanTaskId) {
      fetchDiscoveredDevices({ scan_task_id: scanTaskId });
    }
  }, [scanTaskId, fetchDiscoveredDevices]);

  // Filter and sort devices
  const filteredDevices = React.useMemo(() => {
    let filtered = discoveredDevices.filter(device => {
      const matchesSearch = device.primary_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (device.hostname && device.hostname.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'devices' && device.is_device) ||
                           (filterType === 'orphaned' && !device.is_device);
      
      return matchesSearch && matchesFilter;
    });

    // Sort devices
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'last_seen':
          aValue = new Date(a.last_seen);
          bValue = new Date(b.last_seen);
          break;
        case 'ip':
          aValue = a.primary_ip;
          bValue = b.primary_ip;
          break;
        case 'hostname':
          aValue = a.hostname || '';
          bValue = b.hostname || '';
          break;
        case 'confidence':
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
          aValue = confidenceOrder[a.confidence] || 0;
          bValue = confidenceOrder[b.confidence] || 0;
          break;
        default:
          aValue = a.primary_ip;
          bValue = b.primary_ip;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [discoveredDevices, searchTerm, filterType, sortBy, sortOrder]);

  const getResultTypeIcon = (resultType) => {
    switch (resultType) {
      case 'active_device': return '🖥️';
      case 'physical_device': return '🔌';
      case 'named_device': return '🏷️';
      case 'identified_device': return '🔍';
      case 'service_device': return '⚙️';
      case 'responding_host': return '📡';
      case 'network_device': return '🌐';
      case 'responding_ip': return '📍';
      case 'failed': return '❌';
      case 'no_response': return '💤';
      default: return '❓';
    }
  };

  const getResultTypeColor = (resultType, isDevice) => {
    if (!isDevice) {
      return 'bg-muted text-muted-foreground';
    }
    
    switch (resultType) {
      case 'active_device':
      case 'physical_device':
        return 'bg-success text-success-foreground';
      case 'named_device':
      case 'identified_device':
        return 'bg-info text-info-foreground';
      case 'service_device':
      case 'responding_host':
        return 'bg-warning text-warning-foreground';
      case 'network_device':
      case 'responding_ip':
        return 'bg-muted text-muted-foreground';
      case 'failed':
      case 'no_response':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      case 'none': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getResultTypeLabel = (resultType) => {
    switch (resultType) {
      case 'active_device': return 'Active Device';
      case 'physical_device': return 'Physical Device';
      case 'named_device': return 'Named Device';
      case 'identified_device': return 'Identified Device';
      case 'service_device': return 'Service Device';
      case 'responding_host': return 'Responding Host';
      case 'network_device': return 'Network Device';
      case 'responding_ip': return 'Responding IP';
      case 'failed': return 'Failed';
      case 'no_response': return 'No Response';
      default: return 'Unknown';
    }
  };

  const deviceCount = discoveredDevices.filter(d => d.is_device).length;
  const orphanedCount = discoveredDevices.filter(d => !d.is_device).length;
  const totalCount = discoveredDevices.length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Scan Results"
        subtitle={`Scan task results - ${totalCount} total responses`}
        metrics={[
          { value: deviceCount, label: "Connected Devices", color: "text-success" },
          { value: orphanedCount, label: "Orphaned IPs", color: "text-warning" },
          { value: totalCount, label: "Total Responses", color: "text-primary" }
        ]}
        actions={[
          {
            label: "Close",
            icon: "✕",
            onClick: onClose,
            variant: "outline"
          }
        ]}
      />

      {/* Search and Filter Controls */}
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by IP address or hostname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Results</option>
                <option value="devices">Connected Devices</option>
                <option value="orphaned">Orphaned IPs</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="last_seen">Last Seen</option>
                <option value="ip">IP Address</option>
                <option value="hostname">Hostname</option>
                <option value="confidence">Confidence</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredDevices.length === 0 ? (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-subheading text-foreground mb-2">No results found</h3>
              <p className="text-body text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDevices.map((device) => (
              <Card 
                key={device.id} 
                className={cn(
                  "surface-interactive group hover:shadow-lg transition-all duration-200 cursor-pointer",
                  device.is_device ? "border-l-4 border-l-success" : "border-l-4 border-l-warning"
                )}
                onClick={() => {
                  setSelectedDevice(device);
                  setShowDeviceModal(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{getResultTypeIcon(device.result_type)}</span>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">
                            {device.hostname || 'Unknown Device'}
                          </h4>
                          <Badge className={cn("text-xs", getResultTypeColor(device.result_type, device.is_device))}>
                            {getResultTypeLabel(device.result_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {device.primary_ip}
                        </p>
                        {device.mac_address && (
                          <p className="text-xs text-muted-foreground font-mono">
                            MAC: {device.mac_address}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cn("text-sm font-medium", getConfidenceColor(device.confidence))}>
                        {device.confidence.toUpperCase()} Confidence
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(device.last_seen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicators */}
                  {device.indicators && device.indicators.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {device.indicators.map((indicator, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Additional Info */}
                  {(device.os_name || device.manufacturer) && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      {device.os_name && <span>{device.os_name}</span>}
                      {device.os_name && device.manufacturer && <span> • </span>}
                      {device.manufacturer && <span>{device.manufacturer}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      {showDeviceModal && selectedDevice && (
        <Modal
          isOpen={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          title="Device Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <p className="text-foreground font-mono">{selectedDevice.primary_ip}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                <p className="text-foreground">{selectedDevice.hostname || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">MAC Address</label>
                <p className="text-foreground font-mono">{selectedDevice.mac_address || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Result Type</label>
                <p className="text-foreground">{getResultTypeLabel(selectedDevice.result_type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                <p className={cn("font-medium", getConfidenceColor(selectedDevice.confidence))}>
                  {selectedDevice.confidence.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Is Device</label>
                <p className="text-foreground">{selectedDevice.is_device ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            {selectedDevice.indicators && selectedDevice.indicators.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Detection Indicators</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDevice.indicators.map((indicator, index) => (
                    <Badge key={index} variant="outline">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDevice.os_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Operating System</label>
                <p className="text-foreground">{selectedDevice.os_name} {selectedDevice.os_version}</p>
              </div>
            )}
            
            {selectedDevice.manufacturer && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hardware</label>
                <p className="text-foreground">{selectedDevice.manufacturer} {selectedDevice.model}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ScanResultsView;
