import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import PageHeader from './PageHeader';
import { cn } from '../utils/cn';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedScans, setSelectedScans] = useState([]);
  
  const [scanForm, setScanForm] = useState({
    name: '',
    target_range: '',
    scan_type: 'lan_discovery',
    max_depth: 3
  });

  const [isScanning, setIsScanning] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Scans', icon: '📊' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'running', label: 'Running', icon: '🔄' },
    { value: 'failed', label: 'Failed', icon: '❌' },
    { value: 'cancelled', label: 'Cancelled', icon: '⏹️' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'devices_found', label: 'Devices Found' }
  ];

  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
    fetchDiscoveredDevices();
  }, [fetchScanTasks, fetchActiveScanTask, fetchDiscoveredDevices]);

  useEffect(() => {
    setIsScanning(activeScanTask !== null);
  }, [activeScanTask]);

  // Filter and sort scans
  const filteredScans = useMemo(() => {
    return scanTasks
      .filter(scan => {
        const matchesSearch = scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             scan.target_range.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || scan.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'devices_found':
            aValue = a.devices_found || 0;
            bValue = b.devices_found || 0;
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [scanTasks, searchTerm, filterStatus, sortBy, sortOrder]);

  const allSelected = filteredScans.length > 0 && filteredScans.every(scan => selectedScans.includes(scan.id));

  const handleStartScan = async () => {
    if (!scanForm.name.trim() || !scanForm.target_range.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsScanning(true);
      await createScanTask(scanForm);
      setShowScanModal(false);
      setScanForm({
        name: '',
        target_range: '',
        scan_type: 'lan_discovery',
        max_depth: 3
      });
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
      setIsScanning(false);
    }
  };

  const handleCancelScan = async () => {
    if (!activeScanTask) return;
    
    try {
      await cancelScanTask(activeScanTask.id);
      setIsScanning(false);
    } catch (error) {
      console.error('Failed to cancel scan:', error);
      alert('Failed to cancel scan: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleQuickLanDiscovery = async () => {
    try {
      setIsScanning(true);
      const config = {
        maxDepth: 3,
        name: 'Quick LAN Discovery',
        target_range: 'auto'
      };
      await runLanDiscovery(config);
    } catch (error) {
      console.error('Failed to start LAN discovery:', error);
      alert('Failed to start LAN discovery: ' + (error.response?.data?.detail || error.message));
      setIsScanning(false);
    }
  };

  const getScanStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-info text-info-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'failed':
        return 'bg-error text-error-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-warning text-warning-foreground';
    }
  };

  const getScanStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '⏳';
    }
  };

  const getScanTypeIcon = (type) => {
    switch (type) {
      case 'lan_discovery':
        return '🌐';
      case 'port_scan':
        return '🔍';
      case 'service_scan':
        return '⚙️';
      default:
        return '📊';
    }
  };

  const getScanTypeColor = (type) => {
    switch (type) {
      case 'lan_discovery':
        return 'bg-blue-500/20 text-blue-600';
      case 'port_scan':
        return 'bg-green-500/20 text-green-600';
      case 'service_scan':
        return 'bg-purple-500/20 text-purple-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const toggleScanSelection = (scanId) => {
    setSelectedScans(prev => 
      prev.includes(scanId) 
        ? prev.filter(id => id !== scanId)
        : [...prev, scanId]
    );
  };

  const selectAllScans = (scanIds) => {
    setSelectedScans(scanIds);
  };

  const handleViewResults = () => {
    navigate('/devices');
  };

  const headerActions = [
    {
      label: isScanning ? "Scanning..." : "Start LAN Discovery",
      variant: "default",
      size: "sm",
      onClick: handleQuickLanDiscovery,
      disabled: isScanning,
    },
    {
      label: "Configure Custom Scan",
      variant: "outline",
      size: "sm",
      onClick: () => setShowScanModal(true),
      disabled: isScanning,
    }
  ];

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        title="Network Discovery & Scanning"
        subtitle={`${scanTasks.length} scans completed • ${discoveredDevices.length} devices discovered • ${isScanning ? 'Active scan in progress' : 'Ready to discover devices'}`}
        actions={headerActions}
        searchPlaceholder="Search scan history..."
        onSearch={() => {}}
        searchValue=""
      />

      {/* Active Scan Status */}
      {activeScanTask && (
        <div className="px-6 py-4 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-info border-t-transparent"></div>
                <span className="text-subheading text-foreground">Active Scan</span>
              </div>
              <Badge className="bg-info text-info-foreground">
                {activeScanTask.status}
              </Badge>
              <span className="text-body text-muted-foreground">
                {activeScanTask.name} - {activeScanTask.target_range}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelScan}
              className="text-error hover:text-error hover:bg-error/10 border-error/20"
            >
              Cancel Scan
            </Button>
          </div>
        </div>
      )}

      {/* Scan Actions */}
      <div className="px-6 py-4 bg-card border-b border-border flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="surface-elevated border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-subheading text-foreground">Quick Network Discovery</h3>
                  <p className="text-caption text-muted-foreground">Automatically discover devices on your local network</p>
                </div>
              </div>
              <Button
                className="w-full mt-3"
                onClick={handleQuickLanDiscovery}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning Network...' : 'Start Network Discovery'}
              </Button>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-warning/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-subheading text-foreground">Advanced Scan Configuration</h3>
                  <p className="text-caption text-muted-foreground">Customize scan parameters and target specific ranges</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => setShowScanModal(true)}
                disabled={isScanning}
              >
                Configure Advanced Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scan Statistics */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold text-primary">{scanTasks.length}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-primary">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Devices Discovered</p>
                  <p className="text-2xl font-bold text-success">{discoveredDevices.length}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <span className="text-success">📱</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Completed Scans</p>
                  <p className="text-2xl font-bold text-info">{scanTasks.filter(s => s.status === 'completed').length}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                  <span className="text-info">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Active Scans</p>
                  <p className="text-2xl font-bold text-warning">{scanTasks.filter(s => s.status === 'running').length}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <span className="text-warning">🔄</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Discoveries */}
      {discoveredDevices.length > 0 && (
        <div className="px-6 pb-4">
          <Card className="surface-elevated">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-subheading text-foreground flex items-center">
                  📱 Recent Discoveries ({discoveredDevices.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewResults}
                >
                  View All Devices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredDevices.slice(0, 6).map((device) => (
                  <div key={device.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                      <span className="text-sm">📱</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-foreground truncate">
                        {device.hostname || device.primary_ip || 'Unknown Device'}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {device.primary_ip} • {device.mac_address || 'No MAC'}
                      </p>
                    </div>
                    <Badge className="text-xs bg-success text-success-foreground">
                      Discovered
                    </Badge>
                  </div>
                ))}
              </div>
              {discoveredDevices.length > 6 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm" onClick={handleViewResults}>
                    View All {discoveredDevices.length} Devices
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="px-6 pb-4">
        <Card className="surface-elevated">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search scans by name or target range..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
                <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "px-3 py-1 text-sm",
                      viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    ⊞
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "px-3 py-1 text-sm",
                      viewMode === 'table' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    ☰
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedScans.length > 0 && (
        <div className="px-6 pb-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-body text-foreground">
                    {selectedScans.length} scan(s) selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedScans([])}
                    className="text-caption"
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error hover:text-error hover:bg-error/10 border-error/20"
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan List */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {loading.scanTasks ? (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-subheading text-foreground mb-2">Loading scans...</h3>
            </CardContent>
          </Card>
        ) : filteredScans.length === 0 ? (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-subheading text-foreground mb-2">No scans found</h3>
              <p className="text-body text-muted-foreground">
                Start your first network discovery scan to find devices.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScans.map((scan) => (
              <Card key={scan.id} className="surface-interactive">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedScans.includes(scan.id)}
                        onChange={() => toggleScanSelection(scan.id)}
                        className="rounded border-border text-primary focus:ring-ring"
                      />
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getScanTypeColor(scan.scan_type))}>
                        {getScanTypeIcon(scan.scan_type)}
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getScanStatusColor(scan.status))}>
                      {scan.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-subheading text-foreground truncate">
                        {scan.name}
                      </h3>
                      <p className="text-caption text-muted-foreground">
                        {scan.target_range}
                      </p>
                    </div>

                    <div className="space-y-2 text-caption text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{scan.scan_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span>{scan.status}</span>
                      </div>
                      {scan.devices_found && (
                        <div className="flex justify-between">
                          <span>Devices Found:</span>
                          <span className="text-success">{scan.devices_found}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{formatDate(scan.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewResults}
                        className="flex-1 text-xs"
                      >
                        View Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="surface-elevated">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => selectAllScans(allSelected ? [] : filteredScans.map(s => s.id))}
                          className="rounded border-border text-primary focus:ring-ring"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Scan</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Target</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Type</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Devices</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Created</th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredScans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedScans.includes(scan.id)}
                            onChange={() => toggleScanSelection(scan.id)}
                            className="rounded border-border text-primary focus:ring-ring"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getScanTypeColor(scan.scan_type))}>
                              {getScanTypeIcon(scan.scan_type)}
                            </div>
                            <div>
                              <div className="text-body font-medium text-foreground">
                                {scan.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-body text-foreground font-mono">{scan.target_range}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-body text-foreground capitalize">
                            {scan.scan_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={cn("text-xs", getScanStatusColor(scan.status))}>
                            {scan.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-body text-foreground">
                            {scan.devices_found || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-body text-muted-foreground">
                            {formatDate(scan.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleViewResults}
                              className="text-xs"
                            >
                              View Results
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom Scan Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        title="Create Custom Scan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scan Name *
            </label>
            <Input
              value={scanForm.name}
              onChange={(e) => setScanForm({...scanForm, name: e.target.value})}
              placeholder="Enter scan name"
              required
            />
          </div>
          
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Target Range *
            </label>
            <Input
              value={scanForm.target_range}
              onChange={(e) => setScanForm({...scanForm, target_range: e.target.value})}
              placeholder="192.168.1.0/24 or 192.168.1.1-192.168.1.254"
              required
            />
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scan Type
            </label>
            <select
              value={scanForm.scan_type}
              onChange={(e) => setScanForm({...scanForm, scan_type: e.target.value})}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="lan_discovery">LAN Discovery</option>
              <option value="port_scan">Port Scan</option>
              <option value="service_scan">Service Scan</option>
            </select>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Max Depth
            </label>
            <Input
              type="number"
              value={scanForm.max_depth}
              onChange={(e) => setScanForm({...scanForm, max_depth: parseInt(e.target.value)})}
              min="1"
              max="10"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowScanModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartScan}
              disabled={isScanning}
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