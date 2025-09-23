import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
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
    }
  }, [isOpen]);

  const filteredResults = scanResults
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
    return new Date(timestamp).toLocaleString();
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

  const handleDownload = () => {
    const dataToExport = selectedDevices.length > 0 
      ? filteredResults.filter(device => selectedDevices.includes(device.id))
      : filteredResults;
    
    const csvContent = [
      ['IP', 'Hostname', 'MAC', 'OS', 'Vendor', 'Status', 'Last Seen'].join(','),
      ...dataToExport.map(device => [
        device.ip || '',
        device.hostname || '',
        device.mac || '',
        device.os || '',
        device.vendor || '',
        device.status || '',
        device.last_seen || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-results-${scanTask?.id || 'export'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className={cn("ml-2", 
                  scanTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                  scanTask.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  scanTask.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {scanTask.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Discovered:</span>
                <span className="ml-2 font-medium">{scanResults.length} devices</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2">
                  {formatTimestamp(scanTask.start_time)} - {scanTask.end_time ? formatTimestamp(scanTask.end_time) : 'Running'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <span className="ml-2">{scanTask.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
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
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
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
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
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
              <p className="text-sm">Try adjusting your search or filter criteria</p>
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
                          {device.hostname || 'Unknown Host'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {device.ip}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">MAC:</span>
                          <p className="font-mono">{device.mac || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">OS:</span>
                          <p>{device.os || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vendor:</span>
                          <p>{device.vendor || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Seen:</span>
                          <p>{device.last_seen ? formatTimestamp(device.last_seen) : 'Never'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("text-xs", getStatusColor(device.status))}>
                        {device.status}
                      </Badge>
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
                              <span>{device.device_type || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Model:</span>
                              <span>{device.model || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Serial:</span>
                              <span>{device.serial_number || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Network Information</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Scan Status:</span>
                              <span>{device.scan_status || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Discovered:</span>
                              <span>{device.discovered_at ? formatTimestamp(device.discovered_at) : 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Scan Time:</span>
                              <span>{device.scan_timestamp ? formatTimestamp(device.scan_timestamp) : 'Unknown'}</span>
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
