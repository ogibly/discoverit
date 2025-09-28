import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { formatTimestamp as formatTimestampUtil } from '../../utils/formatters';
import { 
  X, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Network,
  Clock,
  CheckCircle,
  AlertCircle,
  Server,
  Wifi,
  HardDrive,
  Cpu,
  Monitor
} from 'lucide-react';

const ScanResultsModal = ({ 
  isOpen, 
  onClose, 
  scanTask, 
  scanResults = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('ip');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilterStatus('all');
      setSelectedDevices([]);
      setShowDetails({});
      // Debug: Log the scan results data
      console.log('ScanResultsModal - scanTask:', scanTask);
      console.log('ScanResultsModal - scanResults:', scanResults);
    }
  }, [isOpen, scanTask, scanResults]);

  // Clean and deduplicate scan results
  let processedResults = scanResults;
  
  // Don't generate mock data - show real results only
  // If no results, the UI will show appropriate empty state

  const cleanResults = (processedResults || [])
    .filter(device => device && device.ip) // Remove null/undefined devices
    .map(device => ({
      ...device,
      id: device.id || `${device.ip}-${device.mac || 'unknown'}`,
      hostname: device.hostname || device.hostname_scan || null,
      mac: device.mac || device.mac_address || null,
      os: device.os || device.os_name || device.operating_system || null,
      vendor: device.vendor || device.manufacturer || null,
      status: device.status || device.scan_status || 'up',
      last_seen: device.last_seen || device.discovered_at || device.scan_timestamp || new Date().toISOString()
    }))
    .reduce((acc, device) => {
      // Deduplicate by IP address, keeping the most recent entry
      const existing = acc.find(d => d.ip === device.ip);
      if (!existing) {
        acc.push(device);
      } else if (new Date(device.last_seen) > new Date(existing.last_seen)) {
        const index = acc.indexOf(existing);
        acc[index] = device;
      }
      return acc;
    }, []);

  const filteredResults = cleanResults
    .filter(device => {
      const matchesSearch = !searchTerm || 
        device.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.mac?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || device.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      if (sortBy === 'ip') {
        // Sort IPs numerically
        aVal = aVal.split('.').map(Number);
        bVal = bVal.split('.').map(Number);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const getDeviceIcon = (device) => {
    if (device.os_name?.toLowerCase().includes('windows')) {
      return <Monitor className="w-4 h-4 text-blue-500" />;
    } else if (device.os_name?.toLowerCase().includes('linux')) {
      return <Server className="w-4 h-4 text-green-500" />;
    } else if (device.device_type?.toLowerCase().includes('router') || 
               device.device_type?.toLowerCase().includes('switch')) {
      return <Network className="w-4 h-4 text-purple-500" />;
    } else if (device.device_type?.toLowerCase().includes('printer')) {
      return <HardDrive className="w-4 h-4 text-orange-500" />;
    } else {
      return <Cpu className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    return formatTimestampUtil(timestamp);
  };

  const formatDuration = (startTime, endTime = null) => {
    if (!startTime) return '0s';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    
    // Handle negative durations (shouldn't happen but just in case)
    if (diffMs < 0) return '0s';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === filteredResults.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredResults.map(device => device.id));
    }
  };

  const handleDownload = async () => {
    try {
      const dataToExport = selectedDevices.length > 0 
        ? filteredResults.filter(device => selectedDevices.includes(device.id))
        : filteredResults;
      
      // Create comprehensive export data
      const exportData = {
        scan_info: {
          scan_id: scanTask?.id,
          scan_name: scanTask?.name,
          target: scanTask?.target,
          status: scanTask?.status,
          start_time: scanTask?.start_time,
          end_time: scanTask?.end_time,
          progress: scanTask?.progress,
          duration: formatDuration(scanTask?.start_time, scanTask?.end_time)
        },
        devices: dataToExport,
        export_info: {
          exported_at: new Date().toISOString(),
          total_devices: dataToExport.length,
          selected_devices: selectedDevices.length
        }
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-results-${scanTask?.id || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download scan results:', error);
      alert('Failed to download scan results. Please try again.');
    }
  };

  if (!isOpen || !scanTask) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Scan Results</h2>
            <p className="text-muted-foreground">
              {scanTask.name || `Scan ${scanTask.id}`} • {scanTask.target}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scan Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">Status</span>
                <Badge className={cn("w-fit", 
                  scanTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                  scanTask.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  scanTask.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {scanTask.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">Discovered</span>
                <span className="font-medium text-lg">{cleanResults.length} devices</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">Duration</span>
                <span className="font-mono text-lg">
                  {formatDuration(scanTask.start_time, scanTask.end_time)}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-xs">Progress</span>
                <span className="font-mono text-lg">
                  {scanTask.progress !== null ? `${scanTask.progress}%` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices by IP, hostname, or MAC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="up">Online</option>
                <option value="down">Offline</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[100px]"
              >
                <option value="ip-asc">IP ↑</option>
                <option value="ip-desc">IP ↓</option>
                <option value="hostname-asc">Hostname ↑</option>
                <option value="hostname-desc">Hostname ↓</option>
                <option value="status-asc">Status ↑</option>
                <option value="status-desc">Status ↓</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedDevices.length === filteredResults.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedDevices.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedDevices.length} selected
              </span>
            )}
          </div>
          
          <Button
            onClick={handleDownload}
            disabled={filteredResults.length === 0}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {selectedDevices.length > 0 ? `${selectedDevices.length} ` : ''}Results
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No devices found</p>
              <p className="text-sm">
                {cleanResults.length === 0 
                  ? 'This scan did not discover any devices on the target network'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          ) : (
            filteredResults.map((device) => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => handleSelectDevice(device.id)}
                      className="rounded border-border"
                    />
                    
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(device)}
                      <div>
                        <p className="font-medium text-sm">
                          {device.hostname || `Device ${device.ip}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {device.ip}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground font-medium">MAC:</span>
                            <span className="font-mono text-foreground">
                              {device.mac || 'Not detected'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground font-medium">OS:</span>
                            <span className="text-foreground">
                              {device.os || 'Not detected'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground font-medium">Vendor:</span>
                            <span className="text-foreground">
                              {device.vendor || 'Not detected'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground font-medium">Status:</span>
                            <Badge className={cn("text-xs", getStatusColor(device.status))}>
                              {device.status || 'unknown'}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground font-medium">Last Seen:</span>
                            <span className="text-foreground">{formatTimestamp(device.last_seen)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(prev => ({
                          ...prev,
                          [device.id]: !prev[device.id]
                        }))}
                        className="h-8 w-8 p-0"
                      >
                        {showDetails[device.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {showDetails[device.id] && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="font-medium mb-2">Device Information</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Device Type:</span>
                              <span>{device.device_type || 'Not detected'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Model:</span>
                              <span>{device.model || 'Not detected'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Serial:</span>
                              <span>{device.serial_number || 'Not detected'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Network Information</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Scan Status:</span>
                              <span>{device.scan_status || 'Not available'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Discovered:</span>
                              <span>{device.discovered_at ? formatTimestamp(device.discovered_at) : 'Not available'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Scan Time:</span>
                              <span>{device.scan_timestamp ? formatTimestamp(device.scan_timestamp) : 'Not available'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ScanResultsModal;
